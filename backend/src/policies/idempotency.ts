import type { DecisionResponse } from "../domain/types.js";

/** Almacén de idempotencia en memoria con TTL. Evita cobros duplicados por event_id. */
export class IdempotencyStore {
  private map = new Map<string, { value: DecisionResponse; expiresAt: number }>();
  constructor(private readonly ttlMs = 10 * 60 * 1000, private readonly now: () => number = () => Date.now()) {}

  get(eventId: string): DecisionResponse | undefined {
    const hit = this.map.get(eventId);
    if (!hit) return undefined;
    if (hit.expiresAt <= this.now()) { this.map.delete(eventId); return undefined; }
    return hit.value;
  }

  set(eventId: string, value: DecisionResponse): void {
    this.map.set(eventId, { value, expiresAt: this.now() + this.ttlMs });
  }
}
