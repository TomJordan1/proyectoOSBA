using Laminar.Domain;

namespace Laminar.Interventions;

/// <summary>Una intervención ejecutable localmente. Siempre cancelable por el usuario.</summary>
public interface IIntervention
{
    LaminarAction Action { get; }
    Task ExecuteAsync(DecisionResponse decision, CancellationToken ct = default);
}

public sealed class DoNothingIntervention : IIntervention
{
    public LaminarAction Action => LaminarAction.do_nothing;
    public Task ExecuteAsync(DecisionResponse d, CancellationToken ct = default) => Task.CompletedTask;
}

public sealed class SubtleNotificationIntervention(Action<string> show) : IIntervention
{
    public LaminarAction Action => LaminarAction.show_subtle_notification;
    public Task ExecuteAsync(DecisionResponse d, CancellationToken ct = default)
    {
        show(d.Explanation);
        return Task.CompletedTask;
    }
}

public sealed class PostponeIntervention : IIntervention
{
    public LaminarAction Action => LaminarAction.postpone_intervention;
    public Task ExecuteAsync(DecisionResponse d, CancellationToken ct = default) => Task.CompletedTask;
}

/// <summary>Selector de intervención a partir de la acción validada. Bubble recovery: PENDIENTE (Bloque posterior).</summary>
public sealed class InterventionRouter(Action<string> showNotification)
{
    public IIntervention Resolve(LaminarAction action) => action switch
    {
        LaminarAction.show_subtle_notification => new SubtleNotificationIntervention(showNotification),
        LaminarAction.postpone_intervention => new PostponeIntervention(),
        // launch_bubble_recovery y enable_quiet_mode se implementan en fases posteriores;
        // por ahora se degradan de forma segura para no simular lo que no existe.
        _ => new DoNothingIntervention()
    };
}
