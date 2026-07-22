using System.Net.Http.Json;
using Laminar.Domain;

namespace Laminar.AgentClient;

/// <summary>
/// ESQUELETO del cliente HTTP real (POST /v1/decisions con API key).
/// No se usa en el modo demo. Requiere endpoint desplegado (Fase G).
/// </summary>
public sealed class HttpAgentClient(HttpClient http, string apiKey) : IAgentClient
{
    public async Task<DecisionResponse> DecideAsync(DecisionRequest request, CancellationToken ct = default)
    {
        using var msg = new HttpRequestMessage(HttpMethod.Post, "/v1/decisions")
        {
            Content = JsonContent.Create(request)
        };
        msg.Headers.Add("x-api-key", apiKey);
        var res = await http.SendAsync(msg, ct);
        res.EnsureSuccessStatusCode();
        return await res.Content.ReadFromJsonAsync<DecisionResponse>(cancellationToken: ct)
               ?? throw new InvalidOperationException("Respuesta vacía del backend.");
    }
}
