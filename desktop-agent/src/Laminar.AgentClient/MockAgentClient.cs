using Laminar.Domain;
using Laminar.Context;
using Laminar.Friction;

namespace Laminar.AgentClient;

/// <summary>
/// Cliente de decisión local para el MODO DEMO (sin AWS). Reproduce la misma lógica
/// del backend: guardas previas, decisión y guardas posteriores. decision_source = "mock".
/// </summary>
public sealed class MockAgentClient(FrictionOptions options) : IAgentClient
{
    private readonly SustainedAnomalyGate _anomaly = new(options);
    private readonly CooldownGate _cooldown = new(options);

    public Task<DecisionResponse> DecideAsync(DecisionRequest req, CancellationToken ct = default)
    {
        var (action, reason, source, fallback, args) = Decide(req);
        var resp = new DecisionResponse(
            "1.0", Guid.NewGuid().ToString(), req.EventId, action, args,
            reason, Explain(reason), DateTime.UtcNow.AddSeconds(20).ToString("o"),
            source, fallback);
        return Task.FromResult(resp);
    }

    private (LaminarAction, string, string, bool, DecisionArguments) Decide(DecisionRequest req)
    {
        var c = req.Context;
        if (c.QuietMode) return (LaminarAction.do_nothing, "QUIET_MODE", "local_policy", false, new());
        if (ContextGate.IsProtected(c)) return (LaminarAction.postpone_intervention, "PROTECTED_CONTEXT", "local_policy", false, new());
        if (!_anomaly.IsSustainedAnomaly(req.Friction)) return (LaminarAction.do_nothing, "STABLE_PATTERN", "local_policy", false, new());
        if (_cooldown.InCooldown(c)) return (LaminarAction.do_nothing, "COOLDOWN_ACTIVE", "local_policy", false, new());

        var wantsBubbles = req.Preferences.PreferredRecovery == "bubbles" && !req.Preferences.ReducedMotion;
        if (wantsBubbles)
        {
            var dur = Math.Min(req.Preferences.MaxDurationSeconds, options.MaxRecoveryDurationSeconds);
            return (LaminarAction.launch_bubble_recovery, "SUSTAINED_FRICTION_CONTEXT_AVAILABLE", "mock", false, new(dur, "low"));
        }
        return (LaminarAction.show_subtle_notification, "SUSTAINED_FRICTION_CONTEXT_AVAILABLE", "mock", false, new(Intensity: "low"));
    }

    private static string Explain(string reason) => reason switch
    {
        "STABLE_PATTERN" => "Patrón estable. No es necesario intervenir.",
        "SUSTAINED_FRICTION_CONTEXT_AVAILABLE" => "Fricción sostenida y contexto disponible.",
        "PROTECTED_CONTEXT" => "Contexto protegido activo. Se pospone.",
        "QUIET_MODE" => "Modo No molestar activo.",
        "COOLDOWN_ACTIVE" => "Intervención reciente. Se respeta la espera.",
        _ => "Decisión local."
    };
}
