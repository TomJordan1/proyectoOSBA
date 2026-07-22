namespace Laminar.TeamMetrics;

/// <summary>Paquete agregado (canal de agregación). Nivel C: nunca identidad humana.</summary>
public sealed record TeamMetricsPacket(
    string SchemaVersion,
    string OrganizationId,
    string TeamId,
    string InstallationToken,   // token rotativo NO humano
    string WindowStart,
    int WindowMinutes,
    string FrictionBand,
    double AvgFriction,
    double PeakFriction,
    int Interventions,
    int HelpfulFeedback,
    bool ActiveContributor,
    string Scenario);
