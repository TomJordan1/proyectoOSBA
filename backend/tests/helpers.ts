import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { loadConfig, type AppConfig } from "../src/config.js";
import { MockModelProvider } from "../src/providers/mock-model-provider.js";
import { ServerBudgetGate } from "../src/policies/budget-gate.js";
import { IdempotencyStore } from "../src/policies/idempotency.js";
import { DecisionCache } from "../src/policies/decision-cache.js";
import { CircuitBreaker } from "../src/policies/circuit-breaker.js";
import { Metrics } from "../src/observability/metrics.js";
import { DecisionEngine } from "../src/agent/decide.js";
import type { DecisionRequest } from "../src/domain/types.js";
import type { ModelProvider } from "../src/providers/model-provider.js";

const here = dirname(fileURLToPath(import.meta.url));
export const contractsDir = resolve(here, "../../contracts");

export function loadFixture(name: string): DecisionRequest {
  const p = resolve(contractsDir, "fixtures", name);
  return JSON.parse(readFileSync(p, "utf8")) as DecisionRequest;
}
export function loadSchema(name: string): unknown {
  const p = resolve(contractsDir, "schemas", name);
  return JSON.parse(readFileSync(p, "utf8"));
}

export function testConfig(overrides: Partial<AppConfig> = {}): AppConfig {
  return { ...loadConfig({}), ...overrides };
}

export function makeEngine(opts: { config?: AppConfig; provider?: ModelProvider; metrics?: Metrics; budget?: ServerBudgetGate; breaker?: CircuitBreaker } = {}) {
  const config = opts.config ?? testConfig();
  const provider = opts.provider ?? new MockModelProvider(config);
  const metrics = opts.metrics ?? new Metrics();
  const engine = new DecisionEngine({
    config,
    provider,
    budget: opts.budget ?? new ServerBudgetGate(config),
    idempotency: new IdempotencyStore(),
    cache: new DecisionCache(),
    breaker: opts.breaker ?? new CircuitBreaker(),
    metrics,
  });
  return { engine, config, provider, metrics };
}
