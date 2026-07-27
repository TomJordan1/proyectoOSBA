using System;

namespace Laminar.Friction;

/// <summary>
/// Política de retroceso ("back-off") de intervenciones. Traduce la reacción del
/// usuario a una intervención en un periodo de silencio, y ROMPE el bucle
/// "intervención → molestia → más intervenciones".
///
/// Reglas:
///  - Tras MOSTRAR una intervención se aplica una ventana de gracia base (anti-bucle).
///  - Cerrar la pausa MUY rápido (quick dismiss) = señal negativa fuerte → el silencio
///    crece exponencialmente con cada cierre rápido consecutivo, hasta un tope.
///  - Declinar/ignorar el aviso = silencio moderado (no escala).
///  - Completar la pausa = buena señal → resetea la escalada y aplica el cooldown normal.
///
/// Es PURA (reloj inyectable) para poder probarla sin WPF ni tiempo real.
/// </summary>
public sealed class InterventionBackoff
{
    private readonly Func<DateTime> _now;
    private int _consecutiveQuickDismiss;
    private DateTime _snoozedUntil = DateTime.MinValue;

    public InterventionBackoff(Func<DateTime>? now = null) => _now = now ?? (() => DateTime.UtcNow);

    // Parámetros configurables (gracia en segundos; el resto en minutos).
    public int GraceSeconds { get; init; } = 90;
    public int DeclinedMinutes { get; init; } = 15;
    public int CompletedMinutes { get; init; } = 30;
    public int QuickDismissBaseMinutes { get; init; } = 5;
    public int QuickDismissCapMinutes { get; init; } = 60;

    public DateTime SnoozedUntil => _snoozedUntil;
    public bool IsSnoozed => _now() < _snoozedUntil;
    public int ConsecutiveQuickDismiss => _consecutiveQuickDismiss;

    /// <summary>Se va a mostrar una intervención: gracia base anti-bucle.</summary>
    public void RegisterShown() => Extend(TimeSpan.FromSeconds(GraceSeconds));

    /// <summary>El usuario cerró la pausa demasiado rápido: retroceso creciente (5,10,20,40,60…).</summary>
    public void RegisterQuickDismiss()
    {
        _consecutiveQuickDismiss++;
        double minutes = QuickDismissBaseMinutes * Math.Pow(2, _consecutiveQuickDismiss - 1);
        minutes = Math.Min(minutes, QuickDismissCapMinutes);
        Extend(TimeSpan.FromMinutes(minutes));
    }

    /// <summary>El usuario declinó el aviso ("ahora no"): silencio moderado, sin escalar.</summary>
    public void RegisterDeclined() => Extend(TimeSpan.FromMinutes(DeclinedMinutes));

    /// <summary>El usuario ignoró el aviso (se cerró solo): silencio moderado.</summary>
    public void RegisterIgnored() => Extend(TimeSpan.FromMinutes(DeclinedMinutes));

    /// <summary>Cierre parcial (ni tan rápido ni completo): silencio suave, sin escalar.</summary>
    public void RegisterPartial() => Extend(TimeSpan.FromMinutes(DeclinedMinutes));

    /// <summary>El usuario completó la pausa: buena señal → resetea la escalada.</summary>
    public void RegisterCompleted()
    {
        _consecutiveQuickDismiss = 0;
        Extend(TimeSpan.FromMinutes(CompletedMinutes));
    }

    private void Extend(TimeSpan span)
    {
        var candidate = _now() + span;
        if (candidate > _snoozedUntil) _snoozedUntil = candidate;
    }
}
