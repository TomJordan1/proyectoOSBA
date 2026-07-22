import { describe, it, expect, vi } from "vitest";
import { makeEngine, loadFixture } from "./helpers.js";
import type { ModelProvider } from "../src/providers/model-provider.js";

describe("cache-aside por banda abstracta", () => {
  it("dos eventos equivalentes (distinto event_id) reutilizan la decisión cacheada", async () => {
    const propose = vi.fn(async () => ({ action: "launch_bubble_recovery", arguments: { duration_seconds: 45 }, reason_code: "SUSTAINED_FRICTION_CONTEXT_AVAILABLE" }));
    const provider: ModelProvider = { name: "mock", propose };
    const { engine, metrics } = makeEngine({ provider });
    const base = loadFixture("scenario-B-friction-available.json");
    await engine.decide({ ...base, event_id: "aaaaaaaa-0000-0000-0000-000000000001" });
    const r2 = await engine.decide({ ...base, event_id: "aaaaaaaa-0000-0000-0000-000000000002" });
    expect(propose).toHaveBeenCalledTimes(1);
    expect(r2.decision_source).toBe("cache");
    expect(metrics.get("DecisionCacheHits")).toBe(1);
  });
});
