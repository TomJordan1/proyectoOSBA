// Tipos del canal de agregación B2B2E. Nivel C/D de gobierno de datos: sin identidad humana.

export type FrictionBand = "low" | "moderate" | "elevated" | "high";
export type Scenario = "demo" | "real";
export type PrivacyStatus = "visible" | "insufficient_group" | "delayed" | "unavailable";
export type Trend = "increasing" | "stable" | "decreasing";
export type Confidence = "exploratory" | "indicative";

export const RECOMMENDATION_CODES = [
  "REVIEW_MEETING_DENSITY",
  "REVIEW_DELIVERY_LOAD",
  "REVIEW_FOCUS_TIME",
  "NO_ACTION_NEEDED",
] as const;
export type RecommendationCode = (typeof RECOMMENDATION_CODES)[number];

export interface TeamMetricsPacket {
  schema_version: "1.0";
  organization_id: string;
  team_id: string;
  installation_token?: string;
  window_start: string;
  window_minutes: 15;
  friction_band: FrictionBand;
  avg_friction: number;
  peak_friction: number;
  interventions: number;
  helpful_feedback: number;
  active_contributor: boolean;
  scenario: Scenario;
}

export interface Recommendation {
  code: RecommendationCode;
  message: string;
}

export interface TeamSummary {
  team_id: string;
  period_start: string;
  period_end: string;
  contributor_count: number;
  privacy_status: PrivacyStatus;
  avg_friction?: number;
  trend?: Trend;
  helpful_rate?: number;
  confidence: Confidence;
  recommendations?: Recommendation[];
}
