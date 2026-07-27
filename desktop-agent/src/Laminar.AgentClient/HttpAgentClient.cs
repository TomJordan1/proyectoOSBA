using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Laminar.Domain;

namespace Laminar.AgentClient;

/// <summary>
/// Cliente HTTP real: POST {baseUrl}/decisions con API key. Serializa en snake_case
/// para coincidir con los contratos del backend, y trata las acciones como strings.
/// </summary>
public sealed class HttpAgentClient : IAgentClient
{
    // Los contratos del backend usan snake_case y acciones como cadenas.
    private static readonly JsonSerializerOptions Json = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        Converters = { new JsonStringEnumConverter() },
    };

    private readonly HttpClient _http;
    private readonly string _url;
    private readonly string _apiKey;
    private readonly string _trialCode;

    /// <param name="baseUrl">Base de la API con stage, p. ej. https://xxxx.execute-api.us-east-1.amazonaws.com/v1</param>
    /// <param name="trialCode">Código de prueba opcional; viaja en el header x-trial-code (tope de gasto por usuario).</param>
    public HttpAgentClient(HttpClient http, string baseUrl, string apiKey, string trialCode = "")
    {
        _http = http;
        _url = baseUrl.TrimEnd('/') + "/decisions";
        _apiKey = apiKey;
        _trialCode = trialCode ?? "";
    }

    public async Task<DecisionResponse> DecideAsync(DecisionRequest request, CancellationToken ct = default)
    {
        using var msg = new HttpRequestMessage(HttpMethod.Post, _url)
        {
            Content = JsonContent.Create(request, options: Json)
        };
        msg.Headers.Add("x-api-key", _apiKey);
        if (!string.IsNullOrWhiteSpace(_trialCode)) msg.Headers.Add("x-trial-code", _trialCode);
        var res = await _http.SendAsync(msg, ct);
        res.EnsureSuccessStatusCode();
        return await res.Content.ReadFromJsonAsync<DecisionResponse>(Json, ct)
               ?? throw new InvalidOperationException("Respuesta vacía del backend.");
    }
}
