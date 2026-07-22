import { describe, it, expect } from "vitest";
import { validateDecisionResponse } from "../src/validation/schemas.js";
import { makeEngine, loadFixture } from "./helpers.js";

describe("cuatro escenarios end-to-end con MockModelProvider", () => {
  it("A — trabajo estable -> do_nothing / STABLE_PATTERN (sin llamar al proveedor)", async () => {
    const { engine, metrics } = makeEngine();
    const r = await engine.decide(loadFixture("scenario-A-stable.json"));
    expect(r.action).toBe("do_nothing");
    expect(r.reason_code).toBe("STABLE_PATTERN");
    expect(r.decision_source).toBe("local_policy");
    expect(metrics.get("MockInvocations")).toBe(0);
    expect(validateDecisionResponse(r)).toBe(true);
  });

  it("B — fricción alta y disponible -> launch_bubble_recovery (decide el proveedor)", async () => {
    const { engine, metrics } = makeEngine();
    const r = await engine.decide(loadFixture("scenario-B-friction-available.json"));
    expect(r.action).toBe("launch_bubble_recovery");
    expect(r.decision_source).toBe("mock");
    expect(r.arguments.duration_seconds).toBeLessThanOrEqual(60);
    expect(metrics.get("MockInvocations")).toBe(1);
    expect(validateDecisionResponse(r)).toBe(true);
  });

  it("C — contexto protegido -> postpone_intervention / PROTECTED_CONTEXT (sin proveedor, sin overlay)", async () => {
    const { engine, metrics } = makeEngine();
    const r = await engine.decide(loadFixture("scenario-C-protected.json"));
    expect(r.action).toBe("postpone_intervention");
    expect(r.reason_code).toBe("PROTECTED_CONTEXT");
    expect(r.decision_source).toBe("local_policy");
    expect(metrics.get("MockInvocations")).toBe(0);
    expect(metrics.get("CallsPreventedByContext")).toBe(1);
  });

  it("D — fin de contexto protegido -> show_subtle_notification", async () => {
    const { engine } = makeEngine();
    const r = await engine.decide(loadFixture("scenario-D-protected-ended.json"));
    expect(r.action).toBe("show_subtle_notification");
    expect(["mock"]).toContain(r.decision_source);
    expect(validateDecisionResponse(r)).toBe(true);
  });
});
