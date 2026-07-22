import type { AppConfig } from "../config.js";

export type BudgetResult = { allowed: true } | { allowed: false; reason: "KILL_SWITCH" | "HOUR_LIMIT" | "DAY_LIMIT" };

/**
 * ServerBudgetGate: corte real de coste en la aplicación (AWS Budgets solo alerta).
 * Cuenta invocaciones al proveedor por hora y por día. En memoria para el MVP;
 * en producción se respaldará con DynamoDB (posterior).
 */
export class ServerBudgetGate {
  private hourKey = "";
  private dayKey = "";
  private hourCount = 0;
  private dayCount = 0;

  constructor(private readonly config: AppConfig, private readonly now: () => Date = () => new Date()) {}

  private roll(): void {
    const d = this.now();
    const hk = `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}-${d.getUTCHours()}`;
    const dk = `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
    if (hk !== this.hourKey) { this.hourKey = hk; this.hourCount = 0; }
    if (dk !== this.dayKey) { this.dayKey = dk; this.dayCount = 0; }
  }

  /** Comprueba sin consumir. */
  check(): BudgetResult {
    if (this.config.killSwitch) return { allowed: false, reason: "KILL_SWITCH" };
    this.roll();
    if (this.hourCount >= this.config.maxCallsPerHour) return { allowed: false, reason: "HOUR_LIMIT" };
    if (this.dayCount >= this.config.maxCallsPerDay) return { allowed: false, reason: "DAY_LIMIT" };
    return { allowed: true };
  }

  /** Registra una invocación real al proveedor. */
  consume(): void {
    this.roll();
    this.hourCount += 1;
    this.dayCount += 1;
  }

  snapshot(): { hourCount: number; dayCount: number } {
    this.roll();
    return { hourCount: this.hourCount, dayCount: this.dayCount };
  }
}
