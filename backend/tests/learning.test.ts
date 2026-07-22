import { describe, it, expect, vi } from "vitest";
import { HistoryPolicy } from "../src/learning/history-policy.js";
import { DecisionCache } from "../src/policies/decision-cache.js";
import { DecisionEngine } from "../src/agent/decide.js";
import { ServerBudgetGate } from "../src/policies/budget-gate.js";
import { IdempotencyStore } from "../src/policies/idempotency.js";
import { CircuitBreaker } from "../src/policies/circuit-breaker.js";
import { Metrics } from "../src/observability/metrics.js";
import { loadFixture, testConfig } from "./helpers.js";
import type { ModelProvider } from "../src/providers/model-provider.js";

describe("HistoryPolicy (bandit local)", () => {
  it("no recomienda con muestras insuficientes", () => {
    const h = new HistoryPolicy(5);
    h.record("k", "launch_bubble_recovery", "helpful");
    expect(h.recommend("k")).toBeNull();
  });

  it("recomienda la acción con mejor tasa de éxito", () => {
    const h = new HistoryPolicy(5, 0.6);
    for (let i = 0; i < 4; i++) h.record("k", "launch_bubble_recovery", "helpful");
    h.record("k", "launch_bubble_recovery", "not_now");
    for (let i = 0; i < 3; i++) h.record("k", "show_subtle_notification", "false_positive");
    const rec = h.recommend("k");
    expect(rec?.action).toBe("launch_bubble_recovery");
    expect(rec!.successRate).toBeGreaterThanOrEqual(0.6);
  });

  it("no recomienda si ninguna acción supera el umbral", () => {
    const h = new HistoryPolicy(3, 0.6);
    for (let i = 0; i < 5; i++) h.record("k", "launch_bubble_recovery", "false_positive");
    expect(h.recommend("k")).toBeNull();
  });
});

describe("Motor con aprendizaje activo aprende del feedback y evita el LLM", () => {
  function makeLearningEngine(provider: ModelProvider, learning: HistoryPolicy) {
    const config = testConfig({ learningEnabled: true, learningMinSamples: 3 });
    const metrics = new Metrics();
    const engine = new DecisionEngine({
      config, provider, metrics, learning,
      budget: new ServerBudgetGate(config),
      idempotency: new IdempotencyStore(),
      cache: new DecisionCache(1),  // TTL corto: evitar que la caché tape el efecto del aprendizaje
      breaker: new CircuitBreaker(),
    });
    return { engine, metrics, config };
  }

  it("tras feedback 'helpful' repetido, decide local sin invocar al proveedor", async () => {
    const propose = vi.fn(async () => ({ action: "launch_bubble_recovery", arguments: { duration_seconds: 45 }, reason_code: "SUSTAINED_FRICTION_CONTEXT_AVAILABLE" }));
    const provider: ModelProvider = { name: "mock", propose };
    const learning = new HistoryPolicy(3, 0.6);
    const { engine, metrics } = makeLearningEngine(provider, learning);
    const base = loadFixture("scenario-B-friction-available.json");

    // 3 decisiones nuevas (distinto event_id) + feedback helpful cada una.
    for (let i = 0; i < 3; i++) {
      const r = await engine.decide({ ...base, event_id: `cccccccc-0000-0000-0000-00000000000${i}` });
      engine.recordFeedback(r.decision_id, "helpful");
      await new Promise((res) => setTimeout(res, 2)); // deja expirar la caché (TTL=1ms)
    }
    const callsAfterLearning = propose.mock.calls.length;

    // Nueva decisión equivalente: ahora debe resolverse por aprendizaje, sin proveedor.
    await new Promise((res) => setTimeout(res, 2));
    const r = await engine.decide({ ...base, event_id: "cccccccc-0000-0000-0000-000000000099" });
    expect(r.action).toBe("launch_bubble_recovery");
    expect(r.decision_source).toBe("local_policy");
    expect(propose.mock.calls.length).toBe(callsAfterLearning); // no hubo nueva llamada
  });
});
