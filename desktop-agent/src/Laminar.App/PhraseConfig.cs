using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;

namespace Laminar.App;

/// <summary>
/// Carga las frases del acompañante desde "kanny.frases.json" junto al .exe, para poder
/// personalizarlas SIN recompilar. Estructura del archivo (todas las claves opcionales):
/// {
///   "intro": ["..."], "Inhala": ["..."], "Mantén": ["..."], "Exhala": ["..."],
///   "click": ["..."], "closing": ["..."], "tips": ["..."]
/// }
/// Si el archivo no existe o está mal formado, se usan los valores por defecto del código.
/// Content-blind: solo texto de frases, ningún dato del usuario.
/// </summary>
internal static class PhraseConfig
{
    private static readonly Lazy<Dictionary<string, string[]>> _data = new(Load);

    /// <summary>Devuelve las frases de una categoría, o el fallback del código si no hay override válido.</summary>
    public static string[] Get(string key, string[] fallback)
        => _data.Value.TryGetValue(key, out var v) && v is { Length: > 0 } ? v : fallback;

    private static Dictionary<string, string[]> Load()
    {
        var result = new Dictionary<string, string[]>();
        try
        {
            var path = Path.Combine(AppContext.BaseDirectory, "kanny.frases.json");
            if (!File.Exists(path)) return result;

            using var doc = JsonDocument.Parse(File.ReadAllText(path));
            if (doc.RootElement.ValueKind != JsonValueKind.Object) return result;

            // Tolerante: solo toma claves cuyo valor sea una lista de strings.
            // Ignora comentarios u otras claves (p. ej. "_comment") sin fallar.
            foreach (var prop in doc.RootElement.EnumerateObject())
            {
                if (prop.Value.ValueKind != JsonValueKind.Array) continue;
                var list = new List<string>();
                foreach (var item in prop.Value.EnumerateArray())
                    if (item.ValueKind == JsonValueKind.String)
                        list.Add(item.GetString() ?? "");
                if (list.Count > 0) result[prop.Name] = list.ToArray();
            }
        }
        catch { /* JSON inválido: se ignora y se usan los valores por defecto del código */ }
        return result;
    }
}
