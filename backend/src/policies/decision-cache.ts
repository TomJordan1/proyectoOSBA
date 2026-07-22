import type { AppConfig } from "../config.js";
import type { DecisionRequest, LocalDecisionLike } from "./types-internal.js";

/** Cache-aside por banda abstracta (G6). TTL corto. Evita llamadas para decisiones equivalentes. */
export class DecisionCache {
  private map = new Map<string, { value: LocalDecisionLike; expiresAt: number }>();
  constructor(private readonly ttlMs = 10 * 60 * 1000, private readonly now: () => number = () => Date.now()) {}

  static key(req: DecisionRequest, config: AppConfig): string {
    const band = req.friction.score >= config.frictionThreshold ? "high" : "low";
    const protectedCtx = req.context.meeting_active || req.context.screen_sharing || req.context.fullscreen_active;
    const cooldownBand = req.context.last_intervention_minutes < config.decisionCooldownMinutes ? "cooling" : "ready";
    const fb = req.recent_feedback ?? "none";
    return [band, protectedCtx ? "protected" : "free", req.context.quiet_mode ? "quiet" : "active", cooldownBand, req.preferences.preferred_recovery, fb].join("|");
  }

  get(key: string): LocalDecisionLike | undefined {
    const hit = this.map.get(key);
    if (!hit) return undefined;
    if (hit.expiresAt <= this.now()) { this.map.delete(key); return undefined; }
    return hit.value;
  }
  set(key: string, value: LocalDecisionLike): void {
    this.map.set(key, { value, expiresAt: this.now() + this.ttlMs });
  }
}
