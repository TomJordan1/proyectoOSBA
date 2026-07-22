import { describe, it, expect } from "vitest";
import { makeEngine, loadFixture, testConfig } from "./helpers.js";
import { CircuitBreaker } from "../src/policies/circuit-breaker.js";
import { ProviderError, type ModelProvider } from "../src/providers/model-provider.js";
import { BedrockModelProvider } from "../src/providers/bedrock-model-provider.js";

const failing: ModelProvider = { name: "mock", async propose() { throw new ProviderError("boom"); } };

describe("fallback local, circuit breaker y Bedrock deshabilitado", () => {
  it("un fallo del proveedor produce fallback local PROVIDER_ERROR_FALLBACK", async () => {
    const { engine } = makeEngine({ provider: failing });
    const r = await engine.decide(loadFixture("scenario-B-friction-available.json"));
    expect(r.reason_code).toBe("PROVIDER_ERROR_FALLBACK");
    expect(r.fallback).toBe(true);
  });

  it("el circuit breaker se abre tras 3 fallos", async () => {
    const breaker = new CircuitBreaker(3, 60_000);
    const { engine } = makeEngine({ provider: failing, breaker });
    const base = loadFixture("scenario-B-friction-available.json");
    for (let i = 1; i <= 3; i++) {
      await engine.decide({ ...base, event_id: `bbbbbbbb-0000-0000-0000-00000000000${i}` });
    }
    expect(breaker.state).toBe("open");
    // Con el breaker abierto, no se intenta el proveedor.
    const r = await engine.decide({ ...base, event_id: "bbbbbbbb-0000-0000-0000-000000000009" });
    expect(r.reason_code).toBe("PROVIDER_ERROR_FALLBACK");
  });

  it("BedrockModelProvider deshabilitado lanza error controlado", async () => {
    const cfg = testConfig({ bedrockEnabled: false });
    const p = new BedrockModelProvider(cfg);
    await expect(p.propose(loadFixture("scenario-B-friction-available.json"))).rejects.toThrow(/deshabilitado/i);
  });

  it("BedrockModelProvider habilitado sin modelId falla la validación de configuración", () => {
    const cfg = testConfig({ bedrockEnabled: true, bedrockModelId: undefined });
    const p = new BedrockModelProvider(cfg);
    expect(() => p.ensureConfigured()).toThrow(/BEDROCK_MODEL_ID/);
  });
});
