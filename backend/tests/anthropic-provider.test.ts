import { describe, it, expect, afterEach } from "vitest";
import { AnthropicModelProvider, parseAnthropicProposal } from "../src/providers/anthropic-model-provider.js";
import { loadFixture, testConfig } from "./helpers.js";

const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; });

describe("AnthropicModelProvider (Messages API + tool use)", () => {
  it("sin API key -> ensureConfigured falla", () => {
    const p = new AnthropicModelProvider(testConfig({ anthropicApiKey: undefined, anthropicModel: "m" }));
    expect(() => p.ensureConfigured()).toThrow(/ANTHROPIC_API_KEY/);
  });

  it("parsea la herramienta elegida de la respuesta", () => {
    const prop = parseAnthropicProposal({
      content: [
        { type: "text", text: "" },
        { type: "tool_use", name: "launch_bubble_recovery", input: { duration_seconds: 45, intensity: "low" } },
      ],
    });
    expect(prop.action).toBe("launch_bubble_recovery");
    expect(prop.arguments?.duration_seconds).toBe(45);
    expect(prop.arguments?.intensity).toBe("low");
  });

  it("respuesta sin tool_use -> acción desconocida (se degradará)", () => {
    const prop = parseAnthropicProposal({ content: [{ type: "text", text: "hola" }] });
    expect(prop.action).toBe("__no_tool_use__");
  });

  it("propose con fetch simulado -> devuelve la herramienta", async () => {
    globalThis.fetch = (async () => ({
      ok: true,
      json: async () => ({ content: [{ type: "tool_use", name: "show_subtle_notification", input: { intensity: "low" } }] }),
    })) as unknown as typeof fetch;
    const p = new AnthropicModelProvider(testConfig({ anthropicApiKey: "sk-test", anthropicModel: "claude-3-haiku-20240307" }));
    const prop = await p.propose(loadFixture("scenario-B-friction-available.json"));
    expect(prop.action).toBe("show_subtle_notification");
  });

  it("error HTTP -> lanza ProviderError", async () => {
    globalThis.fetch = (async () => ({ ok: false, status: 429, text: async () => "rate limited" })) as unknown as typeof fetch;
    const p = new AnthropicModelProvider(testConfig({ anthropicApiKey: "sk-test", anthropicModel: "m" }));
    await expect(p.propose(loadFixture("scenario-B-friction-available.json"))).rejects.toThrow(/429/);
  });
});
