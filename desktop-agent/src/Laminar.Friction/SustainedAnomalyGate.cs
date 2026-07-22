using Laminar.Domain;

namespace Laminar.Friction;

/// <summary>G2: solo hay anomalía si el score supera el umbral durante N ventanas sostenidas.</summary>
public sealed class SustainedAnomalyGate(FrictionOptions options)
{
    public bool IsSustainedAnomaly(Laminar.Domain.Friction f) =>
        f.Score >= options.FrictionThreshold && f.SustainedMinutes >= options.SustainedWindows;
}
