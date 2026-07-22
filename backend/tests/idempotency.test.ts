import { describe, it, expect, vi } from "vitest";
import { makeEngine, loadFixture } from "./helpers.js";
import type { ModelProvider } from "../src/providers/model-provider.js";

describe("idempotencia por event_id", () => {
  it("una repetición devuelve la misma decisión sin volver a invocar al proveedor", async () => {
    const propose = vi.fn(async () => ({ action: "launch_bubble_recovery", arguments: { duration_seconds: 45 }, reason_code: "SUSTAINED_FRICTION_CONTEXT_AVAILABLE" }));
    const provider: ModelProvider = { name: "mock", propose };
    const { engine } = makeEngine({ provider });
    const req = loadFixture("scenario-B-friction-available.json");
    const r1 = await engine.decide(req);
    const r2 = await engine.decide(req);
    expect(r2.decision_id).toBe(r1.decision_id);
    expect(propose).toHaveBeenCalledTimes(1);
  });
});
