// Métricas FinOps. Solo contadores agregados; nunca payloads ni contenido.
export const METRIC_NAMES = [
  "LocalEventsProcessed",
  "AnomaliesDetected",
  "CallsPreventedByContext",
  "CallsPreventedByCooldown",
  "CallsPreventedByBudget",
  "DecisionCacheHits",
  "BedrockInvocations",
  "MockInvocations",
  "InputTokens",
  "OutputTokens",
  "EstimatedModelCost",
  "DecisionLatencyMs",
  "InvalidModelResponses",
  "FallbackCount",
] as const;
export type MetricName = (typeof METRIC_NAMES)[number];

export class Metrics {
  private counters = new Map<MetricName, number>();
  inc(name: MetricName, by = 1): void {
    this.counters.set(name, (this.counters.get(name) ?? 0) + by);
  }
  get(name: MetricName): number {
    return this.counters.get(name) ?? 0;
  }
  snapshot(): Record<string, number> {
    const out: Record<string, number> = {};
    for (const n of METRIC_NAMES) out[n] = this.counters.get(n) ?? 0;
    return out;
  }
}
