using System.Collections.Concurrent;

namespace Laminar.TeamMetrics;

/// <summary>
/// Arma y publica paquetes agregados de 15 minutos hacia Laminar Cloud (/v1/team-metrics).
/// - Sin identidad humana: solo installation_token rotativo, organization_id y team_id.
/// - Cola offline con reintentos limitados; si no hay red, encola y reintenta luego.
/// - No publica el canal de decisiones (canales separados).
/// Esqueleto: no realiza red real en el MVP local (delegate inyectable).
/// </summary>
public sealed class TeamMetricsPublisher
{
    private readonly string _org;
    private readonly string _team;
    private readonly Func<string> _tokenProvider;     // token rotativo
    private readonly Func<TeamMetricsPacket, CancellationToken, Task<bool>> _send;
    private readonly ConcurrentQueue<TeamMetricsPacket> _offline = new();
    private readonly int _maxRetries;

    public TeamMetricsPublisher(
        string organizationId,
        string teamId,
        Func<string> rotatingTokenProvider,
        Func<TeamMetricsPacket, CancellationToken, Task<bool>> send,
        int maxRetries = 1)
    {
        _org = organizationId;
        _team = teamId;
        _tokenProvider = rotatingTokenProvider;
        _send = send;
        _maxRetries = maxRetries;
    }

    public int PendingCount => _offline.Count;

    /// <summary>Construye un paquete de 15 minutos a partir de métricas agregadas locales.</summary>
    public TeamMetricsPacket BuildPacket(DateTime windowStartUtc, string frictionBand,
        double avgFriction, double peakFriction, int interventions, int helpfulFeedback,
        bool activeContributor, string scenario = "demo") =>
        new("1.0", _org, _team, _tokenProvider(), windowStartUtc.ToString("o"), 15,
            frictionBand, avgFriction, peakFriction, interventions, helpfulFeedback,
            activeContributor, scenario);

    /// <summary>Publica con reintentos limitados; si falla, encola para más tarde.</summary>
    public async Task<bool> PublishAsync(TeamMetricsPacket packet, CancellationToken ct = default)
    {
        for (var attempt = 0; attempt <= _maxRetries; attempt++)
        {
            try
            {
                if (await _send(packet, ct)) return true;
            }
            catch { /* red no disponible: se encola abajo */ }
        }
        _offline.Enqueue(packet);
        return false;
    }

    /// <summary>Reintenta la cola offline (llamar al recuperar conectividad).</summary>
    public async Task<int> FlushAsync(CancellationToken ct = default)
    {
        var sent = 0;
        var pending = _offline.Count;
        for (var i = 0; i < pending; i++)
        {
            if (!_offline.TryDequeue(out var p)) break;
            if (await PublishAsync(p, ct)) sent++;
        }
        return sent;
    }
}
