import type { PrivacyOptions } from "../privacy/group-privacy.js";
import { DEFAULT_PRIVACY, resolvePrivacyStatus } from "../privacy/group-privacy.js";
import type {
  Recommendation, TeamMetricsPacket, TeamSummary, Trend, Confidence,
} from "../domain/team-types.js";

interface SummarizeOptions {
  periodStart: string;
  periodEnd: string;
  now?: Date;
  applyDelay?: boolean;   // en demo: false
  privacy?: PrivacyOptions;
}

/**
 * Agregador en memoria (canal de agregación). Agrupa por organización/equipo y
 * ventana. Cuenta contribuyentes técnicos por installation_token, sin identidad
 * humana. Suprime grupos pequeños. Almacenamiento local para el MVP; DynamoDB posterior.
 */
export class Aggregator {
  private store = new Map<string, TeamMetricsPacket[]>();

  private key(org: string, team: string): string {
    return `${org}::${team}`;
  }

  ingest(packet: TeamMetricsPacket): void {
    const k = this.key(packet.organization_id, packet.team_id);
    const list = this.store.get(k) ?? [];
    list.push(packet);
    this.store.set(k, list);
  }

  ingestMany(packets: TeamMetricsPacket[]): void {
    for (const p of packets) this.ingest(p);
  }

  private inPeriod(p: TeamMetricsPacket, start: number, end: number): boolean {
    const t = Date.parse(p.window_start);
    return t >= start && t <= end;
  }

  summarize(organizationId: string, teamId: string, opts: SummarizeOptions): TeamSummary {
    const privacy = opts.privacy ?? DEFAULT_PRIVACY;
    const start = Date.parse(opts.periodStart);
    const end = Date.parse(opts.periodEnd);
    const packets = (this.store.get(this.key(organizationId, teamId)) ?? [])
      .filter((p) => this.inPeriod(p, start, end));

    // Contribuyentes técnicos: distintos installation_token (o paquetes activos si no hay token).
    const tokens = new Set<string>();
    let activeWithoutToken = 0;
    for (const p of packets) {
      if (p.active_contributor) {
        if (p.installation_token) tokens.add(p.installation_token);
        else activeWithoutToken += 1;
      }
    }
    const contributorCount = tokens.size + activeWithoutToken;

    // Retraso lógico del dashboard.
    const now = opts.now ?? new Date();
    const isDelayed = opts.applyDelay === true && (now.getTime() - end) < privacy.dashboardDelayMinutes * 60_000;

    const privacyStatus = resolvePrivacyStatus(contributorCount, privacy, isDelayed);
    const confidence: Confidence =
      packets.some((p) => p.scenario === "real") && contributorCount >= privacy.recommendedProductionGroupSize
        ? "indicative"
        : "exploratory";

    const base: TeamSummary = {
      team_id: teamId,
      period_start: opts.periodStart,
      period_end: opts.periodEnd,
      contributor_count: contributorCount,
      privacy_status: privacyStatus,
      confidence,
    };

    // Con grupo insuficiente / retraso / no disponible: NO devolver métricas.
    if (privacyStatus !== "visible") return base;

    const avgFriction = mean(packets.map((p) => p.avg_friction));
    const totalInterventions = sum(packets.map((p) => p.interventions));
    const totalHelpful = sum(packets.map((p) => p.helpful_feedback));

    const summary: TeamSummary = {
      ...base,
      avg_friction: round(avgFriction),
      trend: computeTrend(packets),
      recommendations: buildRecommendations(avgFriction, packets),
    };
    if (totalInterventions > 0) summary.helpful_rate = round(totalHelpful / totalInterventions);
    return summary;
  }
}

function mean(xs: number[]): number { return xs.length ? sum(xs) / xs.length : 0; }
function sum(xs: number[]): number { return xs.reduce((a, b) => a + b, 0); }
function round(x: number): number { return Math.round(x * 100) / 100; }

/** Tendencia comparando la primera y última ventana temporal del periodo. */
function computeTrend(packets: TeamMetricsPacket[]): Trend {
  const byWindow = new Map<number, number[]>();
  for (const p of packets) {
    const t = Date.parse(p.window_start);
    const bucket = byWindow.get(t);
    if (bucket) bucket.push(p.avg_friction);
    else byWindow.set(t, [p.avg_friction]);
  }
  const windows = [...byWindow.entries()].sort((a, b) => a[0] - b[0]);
  if (windows.length < 2) return "stable";
  const first = mean(windows[0]![1]);
  const last = mean(windows[windows.length - 1]![1]);
  const delta = last - first;
  if (delta > 0.05) return "increasing";
  if (delta < -0.05) return "decreasing";
  return "stable";
}

/** Recomendaciones de PROCESO (no de personas), transparentes y no clínicas. */
function buildRecommendations(avgFriction: number, packets: TeamMetricsPacket[]): Recommendation[] {
  const anyHigh = packets.some((p) => p.friction_band === "high");
  if (avgFriction >= 0.7 || anyHigh) {
    return [{
      code: "REVIEW_MEETING_DENSITY",
      message: "La fricción digital agregada está elevada; revisar la concentración de reuniones y validar con el equipo.",
    }];
  }
  if (avgFriction >= 0.55) {
    return [{
      code: "REVIEW_FOCUS_TIME",
      message: "Fricción moderada; considerar bloques de foco sin interrupciones.",
    }];
  }
  return [{ code: "NO_ACTION_NEEDED", message: "Patrón agregado estable respecto a la línea base." }];
}
