import type { AppConfig } from "../config.js";
import type { DecisionRequest, ModelProposal } from "../domain/types.js";
import { ProviderError, type ModelProvider } from "./model-provider.js";
import { buildToolConfig, buildMessages } from "./bedrock-model-provider.js";

const SYSTEM_PROMPT =
  "Eres el motor de decisión de Laminar. Recibes métricas abstractas y contexto booleano (sin contenido). " +
  "Elige exactamente UNA herramienta según fricción, duración de la anomalía, contexto protegido, quiet mode, " +
  "intervención reciente y preferencias. No expliques; solo llama a la herramienta adecuada.";

// DeepSeek expone una API compatible con OpenAI (chat/completions + tool calls).
const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";

/**
 * Proveedor DeepSeek (API compatible con OpenAI, function calling). Alternativa más
 * económica a Anthropic/Bedrock. Content-blind: solo envía métricas abstractas y
 * flags de contexto (nunca contenido del usuario). Reutiliza el esquema de las
 * herramientas y el prompt del proveedor Bedrock, adaptado al formato OpenAI.
 */
export class DeepSeekModelProvider implements ModelProvider {
  readonly name = "deepseek" as const;
  constructor(private readonly config: AppConfig) {}

  ensureConfigured(): void {
    if (!this.config.deepseekApiKey) throw new ProviderError("DEEPSEEK_API_KEY no está configurado.");
    if (!this.config.deepseekModel) throw new ProviderError("DEEPSEEK_MODEL no está configurado.");
  }

  async propose(request: DecisionRequest): Promise<ModelProposal> {
    this.ensureConfigured();

    const tools = buildToolConfig(this.config.maxRecoveryDurationSeconds).tools.map((t) => ({
      type: "function" as const,
      function: {
        name: t.toolSpec.name,
        description: t.toolSpec.description,
        parameters: t.toolSpec.inputSchema.json,
      },
    }));

    const userText = buildMessages(request)
      .map((m) => m.content.map((c) => c.text ?? "").join(""))
      .join("\n");

    const body = {
      model: this.config.deepseekModel,
      max_tokens: this.config.maxOutputTokens,
      temperature: 0,
      tools,
      tool_choice: "required", // fuerza a elegir una herramienta
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userText },
      ],
    };

    const res = await fetch(DEEPSEEK_URL, {
      method: "POST",
      headers: {
        authorization: `Bearer ${this.config.deepseekApiKey!}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new ProviderError(`DeepSeek API error ${res.status}: ${text.slice(0, 200)}`);
    }
    const data = (await res.json()) as unknown;
    return parseDeepSeekProposal(data);
  }
}

/** Extrae la herramienta elegida del formato OpenAI (choices[].message.tool_calls[]). */
export function parseDeepSeekProposal(data: unknown): ModelProposal {
  const choices = (data as { choices?: Array<Record<string, unknown>> })?.choices ?? [];
  const message = (choices[0]?.message as Record<string, unknown>) ?? {};
  const toolCalls = (message.tool_calls as Array<Record<string, unknown>>) ?? [];
  const first = toolCalls[0]?.function as { name?: string; arguments?: string } | undefined;
  if (!first?.name) {
    // Sin tool call: se degrada aguas abajo (enforcePostLlm).
    return { action: "__no_tool_use__" };
  }
  let args: Record<string, unknown> = {};
  try {
    args = first.arguments ? (JSON.parse(first.arguments) as Record<string, unknown>) : {};
  } catch {
    args = {};
  }
  return {
    action: String(first.name),
    arguments: {
      duration_seconds: typeof args.duration_seconds === "number" ? args.duration_seconds : undefined,
      intensity: args.intensity === "low" || args.intensity === "medium" ? args.intensity : undefined,
    },
    reason_code: "SUSTAINED_FRICTION_CONTEXT_AVAILABLE",
  };
}
