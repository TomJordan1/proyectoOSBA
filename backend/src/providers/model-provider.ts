import type { DecisionRequest, ModelProposal } from "../domain/types.js";

/** Contrato del motor de decisión. El LLM es la implementación principal (Bedrock). */
export interface ModelProvider {
  readonly name: "mock" | "bedrock" | "anthropic" | "deepseek";
  /** Propone una acción a partir de métricas abstractas y contexto. Puede lanzar en error. */
  propose(request: DecisionRequest): Promise<ModelProposal>;
}

export class ProviderError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = "ProviderError";
    if (options?.cause !== undefined) this.cause = options.cause;
  }
}

export class BedrockDisabledError extends ProviderError {
  constructor() {
    super("BedrockModelProvider está deshabilitado (BEDROCK_ENABLED=false).");
    this.name = "BedrockDisabledError";
  }
}
