using Laminar.Domain;
using Laminar.Context;
using Laminar.Friction;

namespace Laminar.AgentClient;

/// <summary>
/// Doble validación en el desktop: rechaza respuestas inseguras aunque el backend/LLM las emita.
/// Ante cualquier fallo, degrada a do_nothing (contrato: "en cualquier fallo, ejecutar do_nothing").
/// </summary>
public sealed class ResponseValidator(FrictionOptions options)
{
    public DecisionResponse Revalidate(DecisionResponse r, DecisionContext ctx, DateTime now)
    {
        // Expiración.
        if (DateTime.TryParse(r.ExpiresAt, out var exp) && exp.ToUniversalTime() < now)
            return Downgrade(r, "INVALID_MODEL_RESPONSE_FALLBACK");

        // Duración máxima 60 s.
        if (r.Arguments.DurationSeconds is int d && d > options.MaxRecoveryDurationSeconds)
            return Downgrade(r, "INVALID_MODEL_RESPONSE_FALLBACK");

        // Quiet mode: solo do_nothing.
        if (ctx.QuietMode && r.Action != LaminarAction.do_nothing)
            return Downgrade(r, "QUIET_MODE");

        // Contexto protegido: no overlay.
        var overlay = r.Action is LaminarAction.show_subtle_notification or LaminarAction.launch_bubble_recovery;
        if (ContextGate.IsProtected(ctx) && overlay)
            return r with { Action = LaminarAction.postpone_intervention, ReasonCode = "PROTECTED_CONTEXT", Arguments = new DecisionArguments() };

        return r;
    }

    private static DecisionResponse Downgrade(DecisionResponse r, string reason) =>
        r with { Action = LaminarAction.do_nothing, Arguments = new DecisionArguments(), ReasonCode = reason, Fallback = true, DecisionSource = "local_policy" };
}
