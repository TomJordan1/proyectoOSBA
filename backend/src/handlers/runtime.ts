import { loadConfig } from "../config.js";
import { selectProvider } from "../providers/index.js";
import { ServerBudgetGate } from "../policies/budget-gate.js";
import { IdempotencyStore } from "../policies/idempotency.js";
import { DecisionCache } from "../policies/decision-cache.js";
import { CircuitBreaker } from "../policies/circuit-breaker.js";
import { Metrics } from "../observability/metrics.js";
import { DecisionEngine } from "../agent/decide.js";
import { Aggregator } from "../aggregation/aggregator.js";
import { InMemoryAggregateStore, DynamoAggregateStore } from "../aggregation/store.js";
import { makeDynamoDocClient } from "../aggregation/dynamo-client.js";
import { HistoryPolicy } from "../learning/history-policy.js";
import { TrialGate, makeDynamoTrialStore } from "../policies/trial-gate.js";

// Estado por contenedor (se reutiliza entre invocaciones Lambda calientes).
const config = loadConfig();
const provider = selectProvider(config);
export const metrics = new Metrics();
// Gate de código de prueba: activo solo si TRIAL_CODES_TABLE está configurada.
const trialGate = config.trialCodesTable
  ? new TrialGate(makeDynamoTrialStore(config.trialCodesTable), config.trialMaxCalls)
  : undefined;
export const engine = new DecisionEngine({
  config,
  provider,
  budget: new ServerBudgetGate(config),
  idempotency: new IdempotencyStore(),
  cache: new DecisionCache(),
  breaker: new CircuitBreaker(),
  metrics,
  learning: new HistoryPolicy(config.learningMinSamples),
  trialGate,
});
// Canal de agregación (separado del canal de decisiones).
// Persistencia real: si AGGREGATES_TABLE está definido (deploy) usa DynamoDB; si no, memoria (dev).
const aggregateStore = config.aggregatesTable
  ? new DynamoAggregateStore(makeDynamoDocClient(config.aggregatesTable))
  : new InMemoryAggregateStore();
export const aggregator = new Aggregator(aggregateStore);
export { config };
