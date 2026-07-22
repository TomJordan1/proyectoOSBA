using System;

namespace Laminar.App;

/// <summary>
/// Sugerencias breves de pausa activa / ergonomía (salud y seguridad en el trabajo).
/// Tono amable y opcional, nunca prescripción médica.
/// </summary>
public static class RecoveryTips
{
    private static readonly Random _rng = new();
    private static readonly string[] _tips =
    {
        "Estira las manos y las muñecas unos segundos.",
        "Relaja los hombros y respira hondo tres veces.",
        "Mira algo lejano ~20 segundos para descansar la vista.",
        "Ponte de pie y estira la espalda.",
        "Pausa activa: estira brazos y cuello suavemente.",
        "Toma agua y suelta la tensión de la mandíbula.",
        "Afloja los dedos y rota las muñecas despacio.",
    };

    public static string Random() => _tips[_rng.Next(_tips.Length)];
}
