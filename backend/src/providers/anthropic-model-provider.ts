import type { AppConfig } from "../config.js";
import type { DecisionRequest, ModelProposal } from "../domain/types.js";
import { ProviderError, type ModelProvider } from "./model-provider.js";
import { buildToolConfig, buildMessages } from "./bedrock-model-provider.js";

const SYSTEM_PROMPT =
  "Eres el motor de decisión de Laminar. Recibes métricas abstractas y contexto booleano (sin contenido). " +
  "Elige exactamente UNA herramienta según fricción, duración de la anomalía, contexto protegido, quiet mode, " +
  "intervención reciente y preferencias. No expliques; solo llama a la herramienta adecuada.";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

/**
 * Proveedor directo de la API de Anthropic (Messages API + tool use). Alternativa
 * a Bedrock para evitar límites de cuota de cuentas nuevas. Content-blind: solo
 * envía métricas abstractas y flags de contexto (nunca contenido del usuario).
 */
export class AnthropicModelProvider implements ModelProvider {
  readonly name = "anthropic" as const;
  constructor(private readonly config: AppConfig) {}

  ensureConfigured(): void {
    if (!this.config.anthropicApiKey) throw new ProviderError("ANTHROPIC_API_KEY no está configurado.");
    if (!this.config.anthropicModel) throw new ProviderError("ANTHROPIC_MODEL no está configurado.");
  }

  async propose(request: DecisionRequest): Promise<ModelProposal> {
    this.ensureConfigured();

    // Reutiliza el esquema de las 5 herramientas y el prompt content-blind del
    // proveedor Bedrock, adaptando el formato al de la API de Anthropic.
    const tools = buildToolConfig(this.config.maxRecoveryDurationSeconds).tools.map((t) => ({
      name: t.toolSpec.name,
      description: t.toolSpec.description,
      input_schema: t.toolSpec.inputSchema.json,
    }));
    const messages = buildMessages(request).map((m) => ({
      role: m.role,
      content: m.content.map((c) => c.text ?? "").join(""),
    }));

    const body = {
      model: this.config.anthropicModel,
      max_tokens: this.config.maxOutputTokens,
      temperature: 0,
      system: SYSTEM_PROMPT,
      tools,
      tool_choice: { type: "any" }, // fuerza a elegir una de las herramientas
      messages,
    };

    const res = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "x-api-key": this.config.anthropicApiKey!,
        "anthropic-version": ANTHROPIC_VERSION,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new ProviderError(`Anthropic API error ${res.status}: ${text.slice(0, 200)}`);
    }
    const data = (await res.json()) as unknown;
    return parseAnthropicProposal(data);
  }
}

/** Extrae la herramienta elegida de la respuesta de la Messages API. */
export function parseAnthropicProposal(data: unknown): ModelProposal {
  const content = (data as { content?: Array<Record<string, unknown>> })?.content ?? [];
  const toolUse = content.find((c) => c.type === "tool_use");
  if (!toolUse) {
    // Sin tool use: se degrada aguas abajo (enforcePostLlm).
    return { action: "__no_tool_use__" };
  }
  const args = (toolUse.input as Record<string, unknown>) ?? {};
  return {
    action: String(toolUse.name),
    arguments: {
      duration_seconds: typeof args.duration_seconds === "number" ? args.duration_seconds : undefined,
      intensity: args.intensity === "low" || args.intensity === "medium" ? args.intensity : undefined,
    },
    reason_code: "SUSTAINED_FRICTION_CONTEXT_AVAILABLE",
  };
}
