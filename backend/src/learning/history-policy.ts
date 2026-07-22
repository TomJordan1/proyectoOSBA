import type { Action, RecentFeedback } from "../domain/types.js";

type FeedbackResult = "helpful" | "not_now" | "false_positive" | "dismissed";

interface Outcome { helpful: number; total: number }

export interface Recommendation {
  action: Action;
  successRate: number;
  samples: number;
}

/**
 * Capa de aprendizaje local (bandit contextual simple). NO usa tokens ni nube.
 * Mantiene, por "firma de situación", la tasa de éxito de cada acción según el
 * feedback del usuario. Con suficientes muestras recomienda la acción con mejor
 * tasa, permitiendo resolver situaciones conocidas SIN llamar al LLM.
 * En memoria para el MVP; persistencia (DynamoDB) es posterior (ADR-017).
 */
export class HistoryPolicy {
  private table = new Map<string, Map<Action, Outcome>>();

  constructor(
    private readonly minSamples = 5,
    private readonly minSuccessRate = 0.6,
  ) {}

  /** Registra el resultado (feedback) de una acción para una situación. */
  record(key: string, action: Action, result: FeedbackResult): void {
    let byAction = this.table.get(key);
    if (!byAction) { byAction = new Map(); this.table.set(key, byAction); }
    const o = byAction.get(action) ?? { helpful: 0, total: 0 };
    o.total += 1;
    if (result === "helpful") o.helpful += 1;
    byAction.set(action, o);
  }

  /** Total de muestras acumuladas para una situación. */
  samples(key: string): number {
    const byAction = this.table.get(key);
    if (!byAction) return 0;
    let n = 0;
    for (const o of byAction.values()) n += o.total;
    return n;
  }

  /**
   * Recomienda la mejor acción aprendida para la situación, o null si no hay
   * datos suficientes o ninguna supera el umbral de éxito.
   */
  recommend(key: string): Recommendation | null {
    const byAction = this.table.get(key);
    if (!byAction) return null;
    if (this.samples(key) < this.minSamples) return null;

    let best: Recommendation | null = null;
    for (const [action, o] of byAction.entries()) {
      if (o.total === 0) continue;
      const rate = o.helpful / o.total;
      if (rate < this.minSuccessRate) continue;
      if (!best || rate > best.successRate) best = { action, successRate: rate, samples: o.total };
    }
    return best;
  }
}

export type { FeedbackResult };
export function isFeedbackResult(x: RecentFeedback | string): x is FeedbackResult {
  return x === "helpful" || x === "not_now" || x === "false_positive" || x === "dismissed";
}
