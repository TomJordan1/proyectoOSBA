namespace Laminar.Domain;

/// <summary>Enum canónico de las cinco acciones de decisión.</summary>
public enum LaminarAction
{
    do_nothing,
    show_subtle_notification,
    postpone_intervention,
    launch_bubble_recovery,
    enable_quiet_mode
}

public sealed record Friction(double Score, int SustainedMinutes, double DeleteZ, double SwitchZ, double CursorZ);

public sealed record DecisionContext(
    bool MeetingActive, bool ScreenSharing, bool FullscreenActive, bool QuietMode,
    int SessionMinutes, int LastInterventionMinutes);

public sealed record Preferences(string PreferredRecovery, bool ReducedMotion, int MaxDurationSeconds);

public sealed record DecisionRequest(
    string SchemaVersion, string EventId, string Timestamp,
    Friction Friction, DecisionContext Context, Preferences Preferences,
    string? RecentFeedback = "none");

public sealed record DecisionArguments(int? DurationSeconds = null, string? Intensity = null);

public sealed record DecisionResponse(
    string SchemaVersion, string DecisionId, string EventId,
    LaminarAction Action, DecisionArguments Arguments,
    string ReasonCode, string Explanation, string ExpiresAt,
    string DecisionSource, bool Fallback);
