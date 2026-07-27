import { describe, it, expect } from "vitest";
import { parseDeepSeekProposal } from "../src/providers/deepseek-model-provider.js";

describe("parseDeepSeekProposal (formato OpenAI tool_calls)", () => {
  it("extrae la herramienta elegida y sus argumentos", () => {
    const data = {
      choices: [
        {
          message: {
            tool_calls: [
              {
                function: {
                  name: "launch_bubble_recovery",
                  arguments: JSON.stringify({ duration_seconds: 45, intensity: "low" }),
                },
              },
            ],
          },
        },
      ],
    };
    const p = parseDeepSeekProposal(data);
    expect(p.action).toBe("launch_bubble_recovery");
    expect(p.arguments?.duration_seconds).toBe(45);
    expect(p.arguments?.intensity).toBe("low");
  });

  it("sin tool_calls devuelve __no_tool_use__ (se degrada aguas abajo)", () => {
    const p = parseDeepSeekProposal({ choices: [{ message: { content: "hola" } }] });
    expect(p.action).toBe("__no_tool_use__");
  });

  it("argumentos malformados no rompen (arguments vacíos)", () => {
    const data = { choices: [{ message: { tool_calls: [{ function: { name: "do_nothing", arguments: "{no-json" } }] } }] };
    const p = parseDeepSeekProposal(data);
    expect(p.action).toBe("do_nothing");
    expect(p.arguments?.duration_seconds).toBeUndefined();
  });
});
