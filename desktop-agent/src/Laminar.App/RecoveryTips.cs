using System;

namespace Laminar.App;

/// <summary>
/// Sugerencias breves de pausa activa / ergonomía (salud y seguridad en el trabajo).
/// Tono amable y opcional, nunca prescripción médica.
/// </summary>
public static class RecoveryTips
{
    private static readonly Random _rng = new();

    // Valores por defecto (fallback). DEBE declararse antes de _tips (orden de init estático).
    private static readonly string[] DefaultTips =
    {
        "Estira las manos y las muñecas unos segundos.",
        "Relaja los hombros y respira hondo tres veces.",
        "Mira algo lejano ~20 segundos para descansar la vista.",
        "Ponte de pie y estira la espalda.",
        "Pausa activa: estira brazos y cuello suavemente.",
        "Toma agua y suelta la tensión de la mandíbula.",
        "Afloja los dedos y rota las muñecas despacio.",
    };

    // Efectivos = por defecto, sobreescritos por la clave "tips" de kanny.frases.json.
    private static readonly string[] _tips = PhraseConfig.Get("tips", DefaultTips);

    public static string Random() => _tips[_rng.Next(_tips.Length)];
}
