import { randomUUID } from "node:crypto";
import type { AppConfig } from "../config.js";
import type { Action, DecisionRequest, DecisionResponse, DecisionSource } from "../domain/types.js";
import type { ModelProvider } from "../providers/model-provider.js";
import { ServerBudgetGate } from "../policies/budget-gate.js";
import { IdempotencyStore } from "../policies/idempotency.js";
import { DecisionCache } from "../policies/decision-cache.js";
import { CircuitBreaker } from "../policies/circuit-breaker.js";
import { preLlmGate, enforcePostLlm, type LocalDecision } from "../policies/safety-guards.js";
import { localFallback } from "../policies/fallback.js";
import { EXPLANATIONS } from "./explanations.js";
import { Metrics } from "../observability/metrics.js";
import { validateDecisionResponse } from "../validation/schemas.js";
import { HistoryPolicy, isFeedbackResult } from "../learning/history-policy.js";

export interface EngineDeps {
  config: AppConfig;
  provider: ModelProvider;
  budget: ServerBudgetGate;
  idempotency: IdempotencyStore;
  cache: DecisionCache;
  breaker: CircuitBreaker;
  metrics: Metrics;
  learning?: HistoryPolicy; // capa de aprendizaje local opcional (ADR-017)
  now?: () => Date;
  newId?: () => string;
}

export class DecisionEngine {
  private readonly now: () => Date;
  private readonly newId: () => string;
  /** decision_id -> {situationKey, action} para atribuir feedback a la capa de aprendizaje. */
  private readonly decisionIndex = new Map<string, { key: string; action: Action }>();

  constructor(private readonly deps: EngineDeps) {
    this.now = deps.now ?? (() => new Date());
    this.newId = deps.newId ?? (() => randomUUID());
  }

  async decide(req: DecisionRequest): Promise<DecisionResponse> {
    const { config, metrics } = this.deps;

    const prior = this.deps.idempotency.get(req.event_id);
    if (prior) return prior;

    metrics.inc("AnomaliesDetected");
    const key = DecisionCache.key(req, config);

    // Guardas deterministas previas al LLM (ahorro de llamadas).
    const pre = preLlmGate(req, config);
    if (pre) {
      if (pre.reason_code === "PROTECTED_CONTEXT" || pre.reason_code === "QUIET_MODE") metrics.inc("CallsPreventedByContext");
      if (pre.reason_code === "COOLDOWN_ACTIVE") metrics.inc("CallsPreventedByCooldown");
      return this.finalize(req, pre, "local_policy", false, key);
    }

    // Cache-aside por banda abstracta.
    const cached = this.deps.cache.get(key);
    if (cached) {
      metrics.inc("DecisionCacheHits");
      return this.finalize(req, cached, "cache", false, key);
    }

    // Capa de aprendizaje local (opt-in): si conoce la situación, decide sin LLM.
    if (this.deps.learning && config.learningEnabled) {
      const rec = this.deps.learning.recommend(key);
      if (rec) {
        metrics.inc("CallsPreventedByContext");
        const reason = rec.action === "do_nothing" ? "STABLE_PATTERN" : "SUSTAINED_FRICTION_CONTEXT_AVAILABLE";
        const learned: LocalDecision = { action: rec.action, arguments: {}, reason_code: reason };
        return this.finalize(req, learned, "local_policy", false, key);
      }
    }

    // Presupuesto del servidor / kill switch.
    const budget = this.deps.budget.check();
    if (!budget.allowed) {
      metrics.inc("CallsPreventedByBudget");
      const fb = localFallback(req, config);
      return this.finalize(req, { ...fb, reason_code: "SERVER_BUDGET_LIMIT" }, "local_policy", true, key);
    }

    // Circuit breaker.
    if (!this.deps.breaker.canRequest()) {
      metrics.inc("FallbackCount");
      const fb = localFallback(req, config);
      return this.finalize(req, { ...fb, reason_code: "PROVIDER_ERROR_FALLBACK" }, "local_policy", true, key);
    }

    // Invocación al proveedor (mock o bedrock).
    try {
      this.deps.budget.consume();
      const proposal = await this.deps.provider.propose(req);
      const decision = enforcePostLlm(proposal, req, config);
      if (decision.reason_code === "INVALID_MODEL_RESPONSE_FALLBACK" || decision.reason_code === "UNKNOWN_ACTION_DOWNGRADED") {
        metrics.inc("InvalidModelResponses");
      }
      this.deps.breaker.onSuccess();
      this.deps.cache.set(key, decision);
      metrics.inc(this.deps.provider.name === "bedrock" ? "BedrockInvocations" : "MockInvocations");
      return this.finalize(req, decision, this.deps.provider.name, false, key);
    } catch {
      this.deps.breaker.onFailure();
      metrics.inc("FallbackCount");
      const fb = localFallback(req, config);
      return this.finalize(req, { ...fb, reason_code: "PROVIDER_ERROR_FALLBACK" }, "local_policy", true, key);
    }
  }

  /**
   * Atribuye el feedback del usuario a la situación/acción de una decisión previa
   * para que la capa de aprendizaje mejore. Se llama desde el endpoint /v1/feedback.
   */
  recordFeedback(decisionId: string, result: string): void {
    if (!this.deps.learning) return;
    const entry = this.decisionIndex.get(decisionId);
    if (!entry) return;
    if (!isFeedbackResult(result)) return;
    this.deps.learning.record(entry.key, entry.action, result);
  }

  private finalize(req: DecisionRequest, d: LocalDecision, source: DecisionSource, fallback: boolean, key: string): DecisionResponse {
    const expires = new Date(this.now().getTime() + this.deps.config.decisionTtlSeconds * 1000);
    const response: DecisionResponse = {
      schema_version: "1.0",
      decision_id: this.newId(),
      event_id: req.event_id,
      action: d.action,
      arguments: d.arguments ?? {},
      reason_code: d.reason_code,
      explanation: EXPLANATIONS[d.reason_code],
      expires_at: expires.toISOString(),
      decision_source: source,
      fallback,
    };

    const responseValid: boolean = validateDecisionResponse(response) === true;
    if (!responseValid) {
      const safe: DecisionResponse = {
        ...response,
        action: "do_nothing",
        arguments: {},
        reason_code: "INVALID_MODEL_RESPONSE_FALLBACK",
        explanation: EXPLANATIONS.INVALID_MODEL_RESPONSE_FALLBACK,
        decision_source: "local_policy",
        fallback: true,
      };
      this.deps.idempotency.set(req.event_id, safe);
      return safe;
    }

    this.decisionIndex.set(response.decision_id, { key, action: response.action });
    this.deps.idempotency.set(req.event_id, response);
    return response;
  }
}

/** Fábrica de conveniencia con dependencias por defecto (en memoria). */
export function createDefaultEngine(config: AppConfig, provider: ModelProvider): DecisionEngine {
  return new DecisionEngine({
    config,
    provider,
    budget: new ServerBudgetGate(config),
    idempotency: new IdempotencyStore(),
    cache: new DecisionCache(),
    breaker: new CircuitBreaker(),
    metrics: new Metrics(),
    learning: new HistoryPolicy(config.learningMinSamples),
  });
}
