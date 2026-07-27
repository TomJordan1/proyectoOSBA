namespace Laminar.Friction;

/// <summary>Parámetros provisionales y configurables (ver LAMINAR_FINOPS_ARCHITECTURE.md).</summary>
public sealed class FrictionOptions
{
    public int MinimumObservationMinutes { get; init; } = 3;
    public int SustainedWindows { get; init; } = 4;
    public double FrictionThreshold { get; init; } = 0.78;
    public int DecisionCooldownMinutes { get; init; } = 15;
    public int RecoveryCooldownMinutes { get; init; } = 30;
    public int MaxRecoveryDurationSeconds { get; init; } = 60;
}
