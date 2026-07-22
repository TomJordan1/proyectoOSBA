import { describe, it, expect } from "vitest";
import { BedrockModelProvider, parseProposal, buildToolConfig, buildMessages, type ConverseClient, type ConverseOutput } from "../src/providers/bedrock-model-provider.js";
import { makeEngine, loadFixture, testConfig } from "./helpers.js";
import { DecisionEngine } from "../src/agent/decide.js";
import { ServerBudgetGate } from "../src/policies/budget-gate.js";
import { IdempotencyStore } from "../src/policies/idempotency.js";
import { DecisionCache } from "../src/policies/decision-cache.js";
import { CircuitBreaker } from "../src/policies/circuit-breaker.js";
import { Metrics } from "../src/observability/metrics.js";

function fakeOutput(name: string, input: Record<string, unknown> = {}): ConverseOutput {
  return { stopReason: "tool_use", output: { message: { content: [{ toolUse: { name, input } }] } }, usage: { inputTokens: 40, outputTokens: 12 } };
}

describe("BedrockModelProvider (Converse + tool use, cliente inyectado)", () => {
  it("deshabilitado por defecto -> propose rechaza", async () => {
    const p = new BedrockModelProvider(testConfig({ bedrockEnabled: false }));
    await expect(p.propose(loadFixture("scenario-B-friction-available.json"))).rejects.toThrow(/deshabilitado/i);
  });

  it("habilitado sin modelId -> ensureConfigured falla", () => {
    const p = new BedrockModelProvider(testConfig({ bedrockEnabled: true, bedrockModelId: undefined }));
    expect(() => p.ensureConfigured()).toThrow(/BEDROCK_MODEL_ID/);
  });

  it("habilitado sin cliente -> propose pide el ConverseClient", async () => {
    const p = new BedrockModelProvider(testConfig({ bedrockEnabled: true, bedrockModelId: "modelo-x" }));
    await expect(p.propose(loadFixture("scenario-B-friction-available.json"))).rejects.toThrow(/ConverseClient/);
  });

  it("con cliente falso -> parsea la herramienta elegida", async () => {
    const client: ConverseClient = { async converse() { return fakeOutput("launch_bubble_recovery", { duration_seconds: 45, intensity: "low" }); } };
    const p = new BedrockModelProvider(testConfig({ bedrockEnabled: true, bedrockModelId: "modelo-x" }), client);
    const prop = await p.propose(loadFixture("scenario-B-friction-available.json"));
    expect(prop.action).toBe("launch_bubble_recovery");
    expect(prop.arguments?.duration_seconds).toBe(45);
  });

  it("declara las 5 herramientas y un prompt content-blind", () => {
    const tools = buildToolConfig(60).tools.map((t) => t.toolSpec.name);
    expect(tools).toEqual(["do_nothing", "show_subtle_notification", "postpone_intervention", "launch_bubble_recovery", "enable_quiet_mode"]);
    const msg = JSON.stringify(buildMessages(loadFixture("scenario-A-stable.json")));
    // content-blind: nunca texto, títulos, urls
    expect(msg).not.toMatch(/window_title|url|typed_text/i);
  });

  it("respuesta sin tool_use -> acción desconocida (se degradará)", () => {
    const prop = parseProposal({ stopReason: "end_turn", output: { message: { content: [{}] } } });
    expect(prop.action).toBe("__no_tool_use__");
  });
});

describe("Motor usando Bedrock (cliente falso) -> decision_source=bedrock", () => {
  it("una situación ambigua invoca el proveedor bedrock", async () => {
    const client: ConverseClient = { async converse() { return fakeOutput("launch_bubble_recovery", { duration_seconds: 45, intensity: "low" }); } };
    const config = testConfig({ bedrockEnabled: true, bedrockModelId: "modelo-x" });
    const provider = new BedrockModelProvider(config, client);
    const metrics = new Metrics();
    const engine = new DecisionEngine({
      config, provider, metrics,
      budget: new ServerBudgetGate(config),
      idempotency: new IdempotencyStore(),
      cache: new DecisionCache(),
      breaker: new CircuitBreaker(),
    });
    const r = await engine.decide(loadFixture("scenario-B-friction-available.json"));
    expect(r.action).toBe("launch_bubble_recovery");
    expect(r.decision_source).toBe("bedrock");
    expect(metrics.get("BedrockInvocations")).toBe(1);
  });
});
