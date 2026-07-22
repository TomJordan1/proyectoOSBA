using Laminar.Domain;
using Laminar.Friction;

namespace Laminar.Context;

public static class ContextGate
{
    public static bool IsProtected(DecisionContext c) =>
        c.MeetingActive || c.ScreenSharing || c.FullscreenActive;
}

/// <summary>G4: respeta el cooldown de decisión.</summary>
public sealed class CooldownGate(FrictionOptions options)
{
    public bool InCooldown(DecisionContext c) => c.LastInterventionMinutes < options.DecisionCooldownMinutes;
}

/// <summary>G5: token bucket local (capacidad 6, recarga 1/20 min, tope diario 30).</summary>
public sealed class LocalBudgetGate(int capacity = 6, int dailyHardLimit = 30, Func<DateTime>? now = null)
{
    private readonly Func<DateTime> _now = now ?? (() => DateTime.UtcNow);
    private double _tokens = capacity;
    private DateTime _last = DateTime.MinValue;
    private int _dayCount;
    private int _dayKey = -1;

    public bool TryConsume()
    {
        var n = _now();
        if (_last != DateTime.MinValue)
            _tokens = Math.Min(capacity, _tokens + (n - _last).TotalMinutes / 20.0);
        _last = n;
        if (n.DayOfYear != _dayKey) { _dayKey = n.DayOfYear; _dayCount = 0; }
        if (_dayCount >= dailyHardLimit || _tokens < 1) return false;
        _tokens -= 1; _dayCount++;
        return true;
    }
}

/// <summary>G7: circuit breaker cliente.</summary>
public sealed class CircuitBreaker(int failureThreshold = 3, int openMinutes = 10, Func<DateTime>? now = null)
{
    private readonly Func<DateTime> _now = now ?? (() => DateTime.UtcNow);
    private int _failures;
    private DateTime? _openedAt;

    public bool CanRequest()
    {
        if (_openedAt is null) return true;
        return (_now() - _openedAt.Value).TotalMinutes >= openMinutes; // half-open
    }
    public void OnSuccess() { _failures = 0; _openedAt = null; }
    public void OnFailure() { if (++_failures >= failureThreshold) _openedAt = _now(); }
}
