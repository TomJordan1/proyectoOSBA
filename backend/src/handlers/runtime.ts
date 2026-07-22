import { loadConfig } from "../config.js";
import { selectProvider } from "../providers/index.js";
import { ServerBudgetGate } from "../policies/budget-gate.js";
import { IdempotencyStore } from "../policies/idempotency.js";
import { DecisionCache } from "../policies/decision-cache.js";
import { CircuitBreaker } from "../policies/circuit-breaker.js";
import { Metrics } from "../observability/metrics.js";
import { DecisionEngine } from "../agent/decide.js";
import { Aggregator } from "../aggregation/aggregator.js";
import { HistoryPolicy } from "../learning/history-policy.js";

// Estado por contenedor (se reutiliza entre invocaciones Lambda calientes).
const config = loadConfig();
const provider = selectProvider(config);
export const metrics = new Metrics();
export const engine = new DecisionEngine({
  config,
  provider,
  budget: new ServerBudgetGate(config),
  idempotency: new IdempotencyStore(),
  cache: new DecisionCache(),
  breaker: new CircuitBreaker(),
  metrics,
  learning: new HistoryPolicy(config.learningMinSamples),
});
// Canal de agregación (separado del canal de decisiones).
export const aggregator = new Aggregator();
export { config };
