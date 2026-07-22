namespace Laminar.Domain;

/// <summary>Cliente intercambiable de decisión (Mock o Http).</summary>
public interface IAgentClient
{
    Task<DecisionResponse> DecideAsync(DecisionRequest request, CancellationToken ct = default);
}
