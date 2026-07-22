// Tipos compartidos del dominio LAMINAR. Content-blind: solo métricas y booleanos.

export const ACTIONS = [
  "do_nothing",
  "show_subtle_notification",
  "postpone_intervention",
  "launch_bubble_recovery",
  "enable_quiet_mode",
] as const;
export type Action = (typeof ACTIONS)[number];

export const REASON_CODES = [
  "STABLE_PATTERN",
  "SUSTAINED_FRICTION_CONTEXT_AVAILABLE",
  "PROTECTED_CONTEXT",
  "QUIET_MODE",
  "COOLDOWN_ACTIVE",
  "PENDING_RECOVERY_RESUMED",
  "SERVER_BUDGET_LIMIT",
  "PROVIDER_ERROR_FALLBACK",
  "INVALID_MODEL_RESPONSE_FALLBACK",
  "UNKNOWN_ACTION_DOWNGRADED",
] as const;
export type ReasonCode = (typeof REASON_CODES)[number];

export type DecisionSource = "bedrock" | "cache" | "local_policy" | "mock";

export interface Friction {
  score: number;
  sustained_minutes: number;
  delete_z: number;
  switch_z: number;
  cursor_z: number;
}

export interface DecisionContext {
  meeting_active: boolean;
  screen_sharing: boolean;
  fullscreen_active: boolean;
  quiet_mode: boolean;
  session_minutes: number;
  last_intervention_minutes: number;
}

export interface Preferences {
  preferred_recovery: "bubbles" | "breathing" | "none";
  reduced_motion: boolean;
  max_duration_seconds: number;
}

export type RecentFeedback =
  | "helpful"
  | "not_now"
  | "false_positive"
  | "dismissed"
  | "none";

export interface DecisionRequest {
  schema_version: "1.0";
  event_id: string;
  timestamp: string;
  friction: Friction;
  context: DecisionContext;
  preferences: Preferences;
  recent_feedback?: RecentFeedback;
}

export interface DecisionArguments {
  duration_seconds?: number;
  intensity?: "low" | "medium";
}

export interface DecisionResponse {
  schema_version: "1.0";
  decision_id: string;
  event_id: string;
  action: Action;
  arguments: DecisionArguments;
  reason_code: ReasonCode;
  explanation: string;
  expires_at: string;
  decision_source: DecisionSource;
  fallback: boolean;
}

/** Propuesta cruda de un ModelProvider, antes de guardas y validación de esquema. */
export interface ModelProposal {
  action: string; // string a propósito: puede ser desconocida y se degrada
  arguments?: DecisionArguments;
  reason_code?: string;
}
