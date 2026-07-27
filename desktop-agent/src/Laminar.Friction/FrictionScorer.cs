using System;

namespace Laminar.Friction;

/// <summary>
/// Cálculo PURO del score de fricción a partir de z-scores content-blind
/// (correcciones de teclado, cambios de ventana, erraticidad del cursor).
///
/// Diseño de calibración (recalibrado 2026-07-25):
///  - Exige CORROBORACIÓN: el score lo manda la SEGUNDA señal más alta, así una
///    sola señal disparada (p. ej. cursor a tirones por CPU saturado) NO alcanza
///    el umbral.
///  - El cursor va DOWN-WEIGHTED (es la señal más ruidosa bajo carga del sistema).
///  - Cada z se ACOTA (ZCap) para que un pico extremo no domine.
///
/// Se extrajo de RealMetricsSource para poder probarlo sin dependencias de WPF.
/// </summary>
public static class FrictionScorer
{
    // Pesos: teclado y cambios de ventana son proxies fuertes de fricción real;
    // el cursor es ruidoso (se amontona el muestreo cuando el CPU está al límite).
    public const double WeightDelete = 1.0;
    public const double WeightSwitch = 0.9;
    public const double WeightCursor = 0.35;

    public const double ZCap = 2.0;              // acota cada señal ponderada
    public const double Base = 0.33;             // línea base tranquila (subida leve: menos duro)
    public const double PrimaryGain = 0.10;      // la señal más alta aporta poco por sí sola
    public const double CorroborationGain = 0.30; // la 2ª señal (corroboración) manda; sube un poco
    public const double MaxScore = 0.97;

    /// <summary>
    /// Devuelve el score de fricción en [0, 0.97]. Necesita que al menos DOS señales
    /// estén elevadas para acercarse al umbral típico (0.78).
    /// </summary>
    public static double Score(double zDelete, double zSwitch, double zCursor)
    {
        double a = Cap(Math.Max(0, zDelete) * WeightDelete);
        double b = Cap(Math.Max(0, zSwitch) * WeightSwitch);
        double c = Cap(Math.Max(0, zCursor) * WeightCursor);

        // top-1 (hi) y top-2 (mid) de las tres señales ponderadas.
        double hi = Math.Max(a, Math.Max(b, c));
        double lo = Math.Min(a, Math.Min(b, c));
        double mid = a + b + c - hi - lo; // la del medio

        double score = Base + PrimaryGain * hi + CorroborationGain * mid;
        return Math.Clamp(score, 0.0, MaxScore);
    }

    private static double Cap(double x) => Math.Min(ZCap, x);
}
