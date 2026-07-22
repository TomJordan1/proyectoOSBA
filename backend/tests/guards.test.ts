import { describe, it, expect } from "vitest";
import { enforcePostLlm } from "../src/policies/safety-guards.js";
import { makeEngine, loadFixture, testConfig } from "./helpers.js";
import type { ModelProvider } from "../src/providers/model-provider.js";

const cfg = testConfig();

describe("guardas deterministas (defense in depth)", () => {
  it("acción desconocida -> do_nothing / UNKNOWN_ACTION_DOWNGRADED", () => {
    const req = loadFixture("scenario-B-friction-available.json");
    const d = enforcePostLlm({ action: "rm_-rf", reason_code: "X" }, req, cfg);
    expect(d.action).toBe("do_nothing");
    expect(d.reason_code).toBe("UNKNOWN_ACTION_DOWNGRADED");
  });

  it("duración > 60 -> do_nothing / INVALID_MODEL_RESPONSE_FALLBACK", () => {
    const req = loadFixture("scenario-B-friction-available.json");
    const d = enforcePostLlm({ action: "launch_bubble_recovery", arguments: { duration_seconds: 999 } }, req, cfg);
    expect(d.action).toBe("do_nothing");
    expect(d.reason_code).toBe("INVALID_MODEL_RESPONSE_FALLBACK");
  });

  it("contexto protegido degrada un overlay a postpone", () => {
    const req = loadFixture("scenario-C-protected.json");
    const d = enforcePostLlm({ action: "launch_bubble_recovery", arguments: { duration_seconds: 45 } }, req, cfg);
    expect(d.action).toBe("postpone_intervention");
    expect(d.reason_code).toBe("PROTECTED_CONTEXT");
  });

  it("quiet mode fuerza do_nothing aunque el proveedor sugiera intervenir", async () => {
    const provider: ModelProvider = { name: "mock", async propose() { return { action: "launch_bubble_recovery", arguments: { duration_seconds: 45 } }; } };
    const base = loadFixture("scenario-B-friction-available.json");
    const req = { ...base, context: { ...base.context, quiet_mode: true } };
    const { engine } = makeEngine({ provider });
    const r = await engine.decide(req);
    expect(r.action).toBe("do_nothing");
    expect(r.reason_code).toBe("QUIET_MODE");
  });

  it("expires_at es ~TTL en el futuro", async () => {
    const { engine, config } = makeEngine();
    const r = await engine.decide(loadFixture("scenario-B-friction-available.json"));
    const delta = new Date(r.expires_at).getTime() - Date.now();
    expect(delta).toBeGreaterThan(0);
    expect(delta).toBeLessThanOrEqual((config.decisionTtlSeconds + 1) * 1000);
  });
});
