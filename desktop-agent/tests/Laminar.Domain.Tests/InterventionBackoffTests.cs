using System;
using Laminar.Friction;
using Xunit;

namespace Laminar.Domain.Tests;

/// <summary>
/// Verifica el back-off de intervenciones: gracia base, escalada por cierre rápido
/// (rompe el bucle molestia→más intervenciones) y reset al completar.
/// </summary>
public class InterventionBackoffTests
{
    private DateTime _now = new(2026, 1, 1, 12, 0, 0, DateTimeKind.Utc);

    private InterventionBackoff New() => new(() => _now)
    {
        GraceSeconds = 90,
        DeclinedMinutes = 15,
        CompletedMinutes = 30,
        QuickDismissBaseMinutes = 5,
        QuickDismissCapMinutes = 60,
    };

    [Fact]
    public void Starts_not_snoozed()
    {
        Assert.False(New().IsSnoozed);
    }

    [Fact]
    public void Shown_applies_base_grace()
    {
        var b = New();
        b.RegisterShown();
        Assert.True(b.IsSnoozed);
        _now = _now.AddSeconds(89);
        Assert.True(b.IsSnoozed);
        _now = _now.AddSeconds(2);
        Assert.False(b.IsSnoozed); // pasó la gracia de 90s
    }

    [Fact]
    public void Quick_dismiss_escalates_and_caps()
    {
        var b = New();
        b.RegisterQuickDismiss(); // 5 min
        Assert.Equal(1, b.ConsecutiveQuickDismiss);
        Assert.True((b.SnoozedUntil - _now).TotalMinutes >= 5 - 0.01);

        var after1 = b.SnoozedUntil;
        b.RegisterQuickDismiss(); // 10 min desde ahora (> 5) → extiende
        Assert.Equal(2, b.ConsecutiveQuickDismiss);
        Assert.True(b.SnoozedUntil > after1);

        for (int i = 0; i < 6; i++) b.RegisterQuickDismiss();
        Assert.True((b.SnoozedUntil - _now).TotalMinutes <= 60 + 0.01); // tope 60 min
    }

    [Fact]
    public void Completed_resets_escalation()
    {
        var b = New();
        b.RegisterQuickDismiss();
        b.RegisterQuickDismiss();
        Assert.Equal(2, b.ConsecutiveQuickDismiss);
        b.RegisterCompleted();
        Assert.Equal(0, b.ConsecutiveQuickDismiss);
    }

    [Fact]
    public void Declined_snoozes_without_escalating()
    {
        var b = New();
        b.RegisterDeclined();
        Assert.Equal(0, b.ConsecutiveQuickDismiss);
        Assert.True((b.SnoozedUntil - _now).TotalMinutes >= 15 - 0.01);
    }
}
