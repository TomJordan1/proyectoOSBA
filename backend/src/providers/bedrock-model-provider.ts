import type { AppConfig } from "../config.js";
import type { DecisionRequest, ModelProposal } from "../domain/types.js";
import { BedrockDisabledError, ProviderError, type ModelProvider } from "./model-provider.js";

/**
 * Interfaz mínima del cliente Converse. Se inyecta para poder probar sin la SDK
 * de AWS ni llamadas reales. En despliegue supervisado se adapta a
 * @aws-sdk/client-bedrock-runtime (ver nota al final). NO se llama a AWS aquí.
 */
export interface ConverseClient {
  converse(input: ConverseInput): Promise<ConverseOutput>;
}
export interface ConverseInput {
  modelId: string;
  messages: Array<{ role: "user" | "assistant"; content: Array<{ text?: string }> }>;
  system?: Array<{ text: string }>;
  toolConfig: { tools: Array<{ toolSpec: ToolSpec }> };
  inferenceConfig?: { maxTokens?: number; temperature?: number };
}
export interface ToolSpec {
  name: string;
  description: string;
  inputSchema: { json: Record<string, unknown> };
}
export interface ConverseOutput {
  stopReason: string;
  output: { message: { content: Array<{ toolUse?: { name: string; input: Record<string, unknown> } }> } };
  usage?: { inputTokens?: number; outputTokens?: number };
}

/** Las 5 herramientas declaradas al modelo (mismo enum canónico). */
export function buildToolConfig(maxDuration: number): { tools: Array<{ toolSpec: ToolSpec }> } {
  const durationSchema = { type: "integer", minimum: 0, maximum: maxDuration };
  const spec = (name: string, description: string, withArgs = false): ToolSpec => ({
    name,
    description,
    inputSchema: {
      json: withArgs
        ? { type: "object", additionalProperties: false, properties: { duration_seconds: durationSchema, intensity: { type: "string", enum: ["low", "medium"] } } }
        : { type: "object", additionalProperties: false, properties: {} },
    },
  });
  return {
    tools: [
      { toolSpec: spec("do_nothing", "No intervenir; situación estable o evidencia insuficiente.") },
      { toolSpec: spec("show_subtle_notification", "Mostrar una señal discreta.", true) },
      { toolSpec: spec("postpone_intervention", "Posponer por contexto protegido o pausa reciente.") },
      { toolSpec: spec("launch_bubble_recovery", "Iniciar una recuperación breve con burbujas.", true) },
      { toolSpec: spec("enable_quiet_mode", "Activar modo no molestar por un tiempo.") },
    ],
  };
}

/** Prompt content-blind: solo métricas abstractas y booleanos de contexto. */
export function buildMessages(req: DecisionRequest): ConverseInput["messages"] {
  const payload = {
    friction: req.friction,
    context: req.context,
    preferences: req.preferences,
    recent_feedback: req.recent_feedback ?? "none",
  };
  return [{ role: "user", content: [{ text: JSON.stringify(payload) }] }];
}

const SYSTEM_PROMPT =
  "Eres el motor de decisión de Laminar. Recibes métricas abstractas y contexto booleano (sin contenido). " +
  "Elige exactamente UNA herramienta según fricción, duración de la anomalía, contexto protegido, quiet mode, " +
  "intervención reciente y preferencias. No expliques; solo llama a la herramienta adecuada.";

/**
 * Proveedor real de Bedrock (Converse API + tool use). Deshabilitado por defecto.
 * - No realiza llamadas si BEDROCK_ENABLED=false.
 * - Requiere un ConverseClient inyectado (el adaptador real se crea en deploy).
 */
export class BedrockModelProvider implements ModelProvider {
  readonly name = "bedrock" as const;
  constructor(private readonly config: AppConfig, private readonly client?: ConverseClient) {}

  ensureConfigured(): void {
    if (!this.config.bedrockEnabled) throw new BedrockDisabledError();
    if (!this.config.bedrockModelId || this.config.bedrockModelId.trim() === "") {
      throw new ProviderError("BEDROCK_MODEL_ID no está configurado. Confirmar modelo en F0-03 antes de habilitar.");
    }
  }

  async propose(request: DecisionRequest): Promise<ModelProposal> {
    this.ensureConfigured();
    if (!this.client) {
      throw new ProviderError("BedrockModelProvider requiere un ConverseClient inyectado (adaptador AWS SDK en deploy supervisado).");
    }
    const out = await this.client.converse({
      modelId: this.config.bedrockModelId!,
      system: [{ text: SYSTEM_PROMPT }],
      messages: buildMessages(request),
      toolConfig: buildToolConfig(this.config.maxRecoveryDurationSeconds),
      inferenceConfig: { maxTokens: this.config.maxOutputTokens, temperature: 0 },
    });
    return parseProposal(out);
  }
}

/** Extrae la herramienta elegida del resultado de Converse. */
export function parseProposal(out: ConverseOutput): ModelProposal {
  const content = out.output?.message?.content ?? [];
  const toolUse = content.find((c) => c.toolUse)?.toolUse;
  if (!toolUse) {
    // Sin tool use válido: se degrada aguas abajo (enforcePostLlm).
    return { action: "__no_tool_use__" };
  }
  const args = toolUse.input ?? {};
  return {
    action: toolUse.name,
    arguments: {
      duration_seconds: typeof args.duration_seconds === "number" ? args.duration_seconds : undefined,
      intensity: args.intensity === "low" || args.intensity === "medium" ? args.intensity : undefined,
    },
    reason_code: "SUSTAINED_FRICTION_CONTEXT_AVAILABLE",
  };
}

/*
 * ADAPTADOR REAL (solo en despliegue supervisado, con la SDK instalada):
 *
 *   import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
 *   const aws = new BedrockRuntimeClient({ region: process.env.AWS_REGION });
 *   const client: ConverseClient = {
 *     converse: (input) => aws.send(new ConverseCommand(input as any)) as any,
 *   };
 *   const provider = new BedrockModelProvider(config, client);
 *
 * Mientras BEDROCK_ENABLED=false, selectProvider() usa el mock y este código no se ejecuta.
 */
