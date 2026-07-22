import { describe, it, expect } from "vitest";
import { ServerBudgetGate } from "../src/policies/budget-gate.js";
import { makeEngine, loadFixture, testConfig } from "./helpers.js";

describe("presupuesto del servidor y kill switch", () => {
  it("kill switch impide llamar al proveedor y responde con fallback local", async () => {
    const config = testConfig({ killSwitch: true });
    const budget = new ServerBudgetGate(config);
    const { engine, metrics } = makeEngine({ config, budget });
    const r = await engine.decide(loadFixture("scenario-B-friction-available.json"));
    expect(r.reason_code).toBe("SERVER_BUDGET_LIMIT");
    expect(r.fallback).toBe(true);
    expect(r.decision_source).toBe("local_policy");
    expect(metrics.get("MockInvocations")).toBe(0);
    expect(metrics.get("CallsPreventedByBudget")).toBe(1);
  });

  it("límite diario corta las llamadas", async () => {
    const config = testConfig({ maxCallsPerDay: 1, maxCallsPerHour: 100 });
    const budget = new ServerBudgetGate(config);
    // Consumir el único permitido.
    budget.consume();
    const { engine } = makeEngine({ config, budget });
    const r = await engine.decide(loadFixture("scenario-B-friction-available.json"));
    expect(r.reason_code).toBe("SERVER_BUDGET_LIMIT");
  });

  it("gate horario cuenta y bloquea", () => {
    const config = testConfig({ maxCallsPerHour: 2 });
    const g = new ServerBudgetGate(config);
    expect(g.check().allowed).toBe(true);
    g.consume(); g.consume();
    expect(g.check()).toEqual({ allowed: false, reason: "HOUR_LIMIT" });
  });
});
