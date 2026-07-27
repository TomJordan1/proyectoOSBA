import type { PrivacyOptions } from "../privacy/group-privacy.js";
import { DEFAULT_PRIVACY, resolvePrivacyStatus } from "../privacy/group-privacy.js";
import type { Recommendation, TeamMetricsPacket, TeamSummary, Trend, Confidence } from "../domain/team-types.js";
import { InMemoryAggregateStore, type AggregateStore } from "./store.js";

interface SummarizeOptions {
  periodStart: string;
  periodEnd: string;
  now?: Date;
  applyDelay?: boolean;
  privacy?: PrivacyOptions;
}

/**
 * Agrega métricas de equipo con privacidad. Persiste vía AggregateStore
 * (en memoria para dev/tests, DynamoDB en producción). Nunca identidad humana.
 */
export class Aggregator {
  constructor(private readonly store: AggregateStore = new InMemoryAggregateStore()) {}

  async ingest(packet: TeamMetricsPacket): Promise<void> {
    await this.store.put(packet);
  }

  async ingestMany(packets: TeamMetricsPacket[]): Promise<void> {
    for (const p of packets) await this.store.put(p);
  }

  async summarize(organizationId: string, teamId: string, opts: SummarizeOptions): Promise<TeamSummary> {
    const privacy = opts.privacy ?? DEFAULT_PRIVACY;
    const packets = await this.store.query(organizationId, teamId, opts.periodStart, opts.periodEnd);

    // Contribuyentes técnicos: distintos installation_token (sin identidad humana).
    const tokens = new Set<string>();
    let activeWithoutToken = 0;
    for (const p of packets) {
      if (p.active_contributor) {
        if (p.installation_token) tokens.add(p.installation_token);
        else activeWithoutToken += 1;
      }
    }
    const contributorCount = tokens.size + activeWithoutToken;

    const now = opts.now ?? new Date();
    const end = Date.parse(opts.periodEnd);
    const isDelayed = opts.applyDelay === true && now.getTime() - end < privacy.dashboardDelayMinutes * 60_000;

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

function buildRecommendations(avgFriction: number, packets: TeamMetricsPacket[]): Recommendation[] {
  const anyHigh = packets.some((p) => p.friction_band === "high");
  if (avgFriction >= 0.7 || anyHigh) {
    return [{ code: "REVIEW_MEETING_DENSITY", message: "La fricción digital agregada está elevada; revisar la concentración de reuniones y validar con el equipo." }];
  }
  if (avgFriction >= 0.55) {
    return [{ code: "REVIEW_FOCUS_TIME", message: "Fricción moderada; considerar bloques de foco sin interrupciones." }];
  }
  return [{ code: "NO_ACTION_NEEDED", message: "Patrón agregado estable respecto a la línea base." }];
}
