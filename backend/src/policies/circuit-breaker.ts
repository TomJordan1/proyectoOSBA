/** Circuit breaker (G7): abre tras N fallos; reintenta tras open_duration. */
export class CircuitBreaker {
  private failures = 0;
  private openedAt: number | null = null;
  constructor(
    private readonly failureThreshold = 3,
    private readonly openDurationMs = 10 * 60 * 1000,
    private readonly now: () => number = () => Date.now(),
  ) {}

  get state(): "closed" | "open" | "half_open" {
    if (this.openedAt === null) return "closed";
    if (this.now() - this.openedAt >= this.openDurationMs) return "half_open";
    return "open";
  }

  canRequest(): boolean {
    return this.state !== "open";
  }

  onSuccess(): void {
    this.failures = 0;
    this.openedAt = null;
  }

  onFailure(): void {
    this.failures += 1;
    if (this.failures >= this.failureThreshold) this.openedAt = this.now();
  }
}
