import type { AppConfig } from "../config.js";
import { ACTIONS, type Action, type DecisionRequest, type ModelProposal, type ReasonCode } from "../domain/types.js";

export interface LocalDecision {
  action: Action;
  arguments: { duration_seconds?: number; intensity?: "low" | "medium" };
  reason_code: ReasonCode;
}

function isProtected(req: DecisionRequest): boolean {
  const c = req.context;
  return c.meeting_active || c.screen_sharing || c.fullscreen_active;
}

/**
 * G3/G4 deterministas: resuelve localmente los casos inequívocos ANTES del LLM
 * para no gastar llamadas. Devuelve null si la decisión es ambigua (usar LLM).
 */
export function preLlmGate(req: DecisionRequest, config: AppConfig): LocalDecision | null {
  if (req.context.quiet_mode) {
    return { action: "do_nothing", arguments: {}, reason_code: "QUIET_MODE" };
  }
  if (isProtected(req)) {
    return { action: "postpone_intervention", arguments: {}, reason_code: "PROTECTED_CONTEXT" };
  }
  const stable =
    req.friction.score < config.frictionThreshold ||
    req.friction.sustained_minutes < config.sustainedWindows;
  if (stable) {
    return { action: "do_nothing", arguments: {}, reason_code: "STABLE_PATTERN" };
  }
  if (req.context.last_intervention_minutes < config.decisionCooldownMinutes) {
    return { action: "do_nothing", arguments: {}, reason_code: "COOLDOWN_ACTIVE" };
  }
  return null; // ambiguo -> decide el LLM
}

const OVERLAY_ACTIONS: ReadonlySet<Action> = new Set<Action>([
  "show_subtle_notification",
  "launch_bubble_recovery",
]);

function isKnownAction(a: string): a is Action {
  return (ACTIONS as readonly string[]).includes(a);
}

/**
 * Defense in depth: valida la propuesta del proveedor y la degrada si viola
 * las guardas. El LLM nunca puede superar estas reglas.
 */
export function enforcePostLlm(proposal: ModelProposal, req: DecisionRequest, config: AppConfig): LocalDecision {
  if (!isKnownAction(proposal.action)) {
    return { action: "do_nothing", arguments: {}, reason_code: "UNKNOWN_ACTION_DOWNGRADED" };
  }
  const action = proposal.action;
  const args = proposal.arguments ?? {};

  if (req.context.quiet_mode && action !== "do_nothing") {
    return { action: "do_nothing", arguments: {}, reason_code: "QUIET_MODE" };
  }
  if (isProtected(req) && OVERLAY_ACTIONS.has(action)) {
    return { action: "postpone_intervention", arguments: {}, reason_code: "PROTECTED_CONTEXT" };
  }
  if (args.duration_seconds !== undefined && args.duration_seconds > config.maxRecoveryDurationSeconds) {
    return { action: "do_nothing", arguments: {}, reason_code: "INVALID_MODEL_RESPONSE_FALLBACK" };
  }

  const reason = (proposal.reason_code as ReasonCode) ?? "SUSTAINED_FRICTION_CONTEXT_AVAILABLE";
  return { action, arguments: args, reason_code: reason };
}
