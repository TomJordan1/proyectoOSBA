import type { AppConfig } from "../config.js";
import { MockModelProvider } from "./mock-model-provider.js";
import { BedrockModelProvider } from "./bedrock-model-provider.js";
import type { ModelProvider } from "./model-provider.js";

/**
 * Selecciona el proveedor. Mientras BEDROCK_ENABLED=false se usa el mock.
 * BedrockModelProvider solo se selecciona si está habilitado Y hay modelId.
 */
export function selectProvider(config: AppConfig): ModelProvider {
  if (config.bedrockEnabled && config.bedrockModelId) {
    const provider = new BedrockModelProvider(config);
    provider.ensureConfigured();
    return provider;
  }
  return new MockModelProvider(config);
}

export { MockModelProvider, BedrockModelProvider };
export * from "./model-provider.js";
