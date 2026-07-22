using System;
using System.Threading.Tasks;
using System.Windows.Threading;
using Laminar.Domain;
using Laminar.Friction;
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
    private readonly MockAgentClient _client;
    private readonly ResponseValidator _validator;
    private readonly FrictionOptions _options = new();
    private readonly IMetricsSource _source;
    private readonly Action<DecisionResponse, DecisionRequest> _onDecision;

    public bool Paused { get; set; }
    public bool Presenting { get; set; }
    public bool QuietMode { get; set; }

    public AgentLoop(IMetricsSource source, Action<DecisionResponse, DecisionRequest> onDecision)
    {
        _source = source;
        _onDecision = onDecision;
        _client = new MockAgentClient(_options);
        _validator = new ResponseValidator(_options);
        _timer.Tick += async (_, _) => await TickAsync();
    }

    public void Start() => _timer.Start();
    public void Stop() => _timer.Stop();

    private async Task TickAsync()
    {
        if (Paused) return;
        var m = _source.Sample();
        var ctx = new DecisionContext(Presenting, Presenting, false, QuietMode, m.SessionMinutes, m.LastInterventionMinutes);
        var req = new DecisionRequest(
            "1.0", Guid.NewGuid().ToString(), DateTime.UtcNow.ToString("o"),
            new Laminar.Domain.Friction(m.Score, m.SustainedMinutes, m.DeleteZ, m.SwitchZ, m.CursorZ),
            ctx, new Preferences("bubbles", false, 45));

        var raw = await _client.DecideAsync(req);
        var d = _validator.Revalidate(raw, ctx, DateTime.UtcNow); // doble validación
        _onDecision(d, req);
        if (d.Action != LaminarAction.do_nothing && d.Action != LaminarAction.postpone_intervention)
            _source.NotifyIntervened();
    }
}
