using System;
using System.IO;
using System.Text.Json;

namespace Laminar.App;

/// <summary>
/// Configuración del agente para que el .exe distribuido funcione SIN variables de
/// entorno. Prioridad: (1) variable de entorno (para desarrollo), (2) archivo
/// "kandace.settings.json" junto al ejecutable, (3) valores por defecto.
///
/// La API key es un secreto compartido del canal máquina: NO se hornea en el código
/// (queda fuera del repo). Se distribuye en el kandace.settings.json junto al .exe.
/// Ejemplo de kandace.settings.json:
/// {
///   "apiBaseUrl": "https://80mu8trlrl.execute-api.us-east-1.amazonaws.com/v1",
///   "apiKey": "TU_API_KEY",
///   "sensors": "real",
///   "ui": "v1"
/// }
/// </summary>
public sealed class AgentSettings
{
    // URL pública del despliegue (no es secreto): sirve como valor por defecto.
    private const string DefaultApiBaseUrl = "https://80mu8trlrl.execute-api.us-east-1.amazonaws.com/v1";

    public string ApiBaseUrl { get; init; } = DefaultApiBaseUrl;
    public string ApiKey { get; init; } = "";
    public string TrialCode { get; init; } = ""; // código de prueba (tope de gasto de IA)
    public string Sensors { get; init; } = "real"; // el agente distribuido usa sensores reales por defecto
    public string Ui { get; init; } = "v2"; // conversacional (diálogo) por defecto

    private sealed class FileModel
    {
        public string? apiBaseUrl { get; set; }
        public string? apiKey { get; set; }
        public string? trialCode { get; set; }
        public string? sensors { get; set; }
        public string? ui { get; set; }
    }

    public static AgentSettings Load()
    {
        FileModel file = ReadFile();
        return new AgentSettings
        {
            ApiBaseUrl = FirstNonEmpty(Env("LAMINAR_API_BASE_URL"), file.apiBaseUrl, DefaultApiBaseUrl),
            ApiKey = FirstNonEmpty(Env("LAMINAR_API_KEY"), file.apiKey, ""),
            TrialCode = FirstNonEmpty(Env("LAMINAR_TRIAL_CODE"), file.trialCode, ""),
            Sensors = FirstNonEmpty(Env("LAMINAR_SENSORS"), file.sensors, "real"),
            Ui = FirstNonEmpty(Env("LAMINAR_UI"), file.ui, "v2"),
        };
    }

    private static FileModel ReadFile()
    {
        try
        {
            var path = Path.Combine(AppContext.BaseDirectory, "kandace.settings.json");
            if (File.Exists(path))
                return JsonSerializer.Deserialize<FileModel>(File.ReadAllText(path)) ?? new FileModel();
        }
        catch { /* config inválida: se ignora y se usan defaults */ }
        return new FileModel();
    }

    private static string? Env(string name) => Environment.GetEnvironmentVariable(name);

    private static string FirstNonEmpty(params string?[] values)
    {
        foreach (var v in values)
            if (!string.IsNullOrWhiteSpace(v)) return v!;
        return "";
    }

    /// <summary>True si hay API en vivo configurada (URL + key).</summary>
    public bool HasCloud => !string.IsNullOrWhiteSpace(ApiBaseUrl) && !string.IsNullOrWhiteSpace(ApiKey);

    /// <summary>True si se deben usar sensores reales.</summary>
    public bool UseRealSensors => string.Equals(Sensors, "real", StringComparison.OrdinalIgnoreCase);

    /// <summary>True si se debe usar la interfaz de diálogo (V2).</summary>
    public bool UseV2 => string.Equals(Ui, "v2", StringComparison.OrdinalIgnoreCase);
}
