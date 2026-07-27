using System;
using System.Threading.Tasks;
using System.Windows.Threading;
using Laminar.Domain;
using Laminar.Friction;
using Laminar.Context;
using Laminar.AgentClient;

namespace Laminar.App;

/// <summary>Muestra de métricas abstractas (lo que producirán los sensores reales).</summary>
public sealed record MetricSample(
    double Score, int SustainedMinutes, double DeleteZ, double SwitchZ, double CursorZ,
    int SessionMinutes, int LastInterventionMinutes);

public interface IMetricsSource
{
    MetricSample Sample();
    void NotifyIntervened();
}

/// <summary>
/// Fuente SIMULADA para la demo automática: la fricción sube sola con el tiempo
/// hasta disparar una intervención, y se reinicia tras intervenir (con cooldown).
/// En producción se reemplaza por los sensores reales (Backspace/Delete, cambios
/// de ventana, cursor) sin cambiar el bucle.
/// </summary>
public sealed class SimulatedMetricsSource : IMetricsSource
{
    private readonly Random _rng = new();
    private double _score = 0.40;      // base tipo oficinista
    private int _sustained;
    private int _session = 10;
    private int _lastIntervention = 90;
    private int _busy;                  // ticks restantes de una racha de fricción

    public MetricSample Sample()
    {
        // Mayormente calmado, con rachas ocasionales de fricción (correcciones, cambios de ventana).
        if (_busy <= 0 && _rng.NextDouble() < 0.30) _busy = _rng.Next(3, 6);
        if (_busy > 0)
        {
            _score = Math.Min(0.95, _score + 0.12 + _rng.NextDouble() * 0.06);
            _busy--;
        }
        else
        {
            _score = Math.Max(0.30, _score - 0.10 + (_rng.NextDouble() - 0.5) * 0.08);
        }
        _sustained = _score >= 0.78 ? _sustained + 1 : 0;
        _session++;
        _lastIntervention++;
        var z = 0.8 + _rng.NextDouble() * 1.6;
        return new MetricSample(_score, _sustained, z, z, z * 0.7, _session, _lastIntervention);
    }

    public void NotifyIntervened()
    {
        _score = 0.40;
        _sustained = 0;
        _busy = 0;
        _lastIntervention = 0;
    }
}

public sealed class AgentLoop
{
    private readonly DispatcherTimer _timer = new() { Interval = TimeSpan.FromSeconds(3) };
    private readonly IAgentClient _client;
    private readonly ResponseValidator _validator;
    private readonly FrictionOptions _options = new();
    private readonly IMetricsSource _source;
    private readonly Action<DecisionResponse, DecisionRequest> _onDecision;
    private readonly Action<double>? _onStress;
    private readonly Action<bool>? _onProtected;
    // Guardas locales: filtran antes de llamar a la nube (FinOps).
    private readonly SustainedAnomalyGate _anomaly;
    private readonly CooldownGate _cooldown;
    private readonly LocalBudgetGate _localBudget = new();
    private readonly ContextSensor? _context;
    // Silencio dinámico (back-off / ventana de gracia anti-bucle). Lo fija App según la reacción del usuario.
    private DateTime _snoozeUntil = DateTime.MinValue;

    public bool Paused { get; set; }
    public bool Presenting { get; set; }
    public bool QuietMode { get; set; }

    /// <summary>Silencia la detección hasta el instante indicado (back-off / gracia).</summary>
    public void Snooze(DateTime until) { if (until > _snoozeUntil) _snoozeUntil = until; }

    /// <param name="client">Cliente de decisión. Si es null usa el mock local (modo demo).</param>
    /// <param name="context">Detector de contexto real (reunión/pantalla completa). Opcional.</param>
    /// <param name="onStress">Callback por tick con el score de fricción [0..1] (para el acompañante).</param>
    /// <param name="onProtected">Callback por tick: true si el contexto es protegido (reunión/pantalla completa).</param>
    public AgentLoop(IMetricsSource source, Action<DecisionResponse, DecisionRequest> onDecision, IAgentClient? client = null, ContextSensor? context = null, Action<double>? onStress = null, Action<bool>? onProtected = null)
    {
        _source = source;
        _onDecision = onDecision;
        _context = context;
        _onStress = onStress;
        _onProtected = onProtected;
        _client = client ?? new MockAgentClient(_options);
        _anomaly = new SustainedAnomalyGate(_options);
        _cooldown = new CooldownGate(_options);
        _validator = new ResponseValidator(_options);
        _timer.Tick += async (_, _) => await TickAsync();
    }

    public void Start() => _timer.Start();
    public void Stop() => _timer.Stop();

    private async Task TickAsync()
    {
        if (Paused) return;
        var m = _source.Sample();
        _onStress?.Invoke(m.Score); // alimenta la animación del acompañante cada tick
        // Contexto real (si hay sensor): reunión = cámara/micrófono en uso o "presentando";
        // pantalla completa detectada. Sin sensor, cae al toggle manual "Presentando".
        bool meeting = Presenting || (_context?.MeetingActive() ?? false);
        bool fullscreen = _context?.FullscreenActive() ?? false;
        _onProtected?.Invoke(meeting || fullscreen); // App oculta a Kanny en reunión/pantalla completa
        var ctx = new DecisionContext(meeting, Presenting, fullscreen, QuietMode, m.SessionMinutes, m.LastInterventionMinutes);
        var req = new DecisionRequest(
            "1.0", Guid.NewGuid().ToString(), DateTime.UtcNow.ToString("o"),
            new Laminar.Domain.Friction(m.Score, m.SustainedMinutes, m.DeleteZ, m.SwitchZ, m.CursorZ),
            ctx, new Preferences("bubbles", false, 45));

        // Pre-filtro local (FinOps): resuelve los casos claros SIN llamar a la nube;
        // solo consulta al backend cuando hay fricción sostenida y contexto disponible.
        if (QuietMode || ContextGate.IsProtected(ctx)) return;
        if (DateTime.UtcNow < _snoozeUntil) return; // back-off / ventana de gracia (anti-bucle)
        if (!_anomaly.IsSustainedAnomaly(req.Friction)) return;
        if (_cooldown.InCooldown(ctx)) return;
        if (!_localBudget.TryConsume()) return;

        DecisionResponse raw;
        try
        {
            raw = await _client.DecideAsync(req);
        }
        catch
        {
            // Fallo de red/backend: omite este tick sin molestar (degradación segura).
            return;
        }
        var d = _validator.Revalidate(raw, ctx, DateTime.UtcNow); // doble validación
        _onDecision(d, req);
        if (d.Action != LaminarAction.do_nothing && d.Action != LaminarAction.postpone_intervention)
            _source.NotifyIntervened();
    }
}
