import type { AppConfig } from "../config.js";
import type { DecisionRequest } from "../domain/types.js";
import type { LocalDecision } from "./safety-guards.js";

/** Política local determinista (§11 FinOps). Se usa cuando no hay LLM disponible. */
export function localFallback(req: DecisionRequest, config: AppConfig): LocalDecision {
  const c = req.context;
  if (c.meeting_active || c.screen_sharing || c.fullscreen_active) {
    return { action: "postpone_intervention", arguments: {}, reason_code: "PROTECTED_CONTEXT" };
  }
  if (c.quiet_mode) {
    return { action: "do_nothing", arguments: {}, reason_code: "QUIET_MODE" };
  }
  const highAndAvailable =
    req.friction.score >= config.frictionThreshold &&
    req.friction.sustained_minutes >= config.sustainedWindows &&
    c.last_intervention_minutes >= config.decisionCooldownMinutes;
  if (highAndAvailable) {
    return { action: "show_subtle_notification", arguments: { intensity: "low" }, reason_code: "SUSTAINED_FRICTION_CONTEXT_AVAILABLE" };
  }
  return { action: "do_nothing", arguments: {}, reason_code: "STABLE_PATTERN" };
}
