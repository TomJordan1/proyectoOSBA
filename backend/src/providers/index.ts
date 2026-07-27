import type { AppConfig } from "../config.js";
import { MockModelProvider } from "./mock-model-provider.js";
import { BedrockModelProvider } from "./bedrock-model-provider.js";
import { AnthropicModelProvider } from "./anthropic-model-provider.js";
import { DeepSeekModelProvider } from "./deepseek-model-provider.js";
import { makeBedrockConverseClient } from "./bedrock-client.js";
import type { ModelProvider } from "./model-provider.js";

/**
 * Selecciona el proveedor por prioridad:
 * 1) DeepSeek si hay DEEPSEEK_API_KEY (más económico; API compatible con OpenAI).
 * 2) Anthropic directo si hay ANTHROPIC_API_KEY + ANTHROPIC_MODEL.
 * 3) Bedrock si BEDROCK_ENABLED=true y hay modelId.
 * 4) Mock en cualquier otro caso.
 */
export function selectProvider(config: AppConfig): ModelProvider {
  if (config.deepseekApiKey && config.deepseekModel) {
    const provider = new DeepSeekModelProvider(config);
    provider.ensureConfigured();
    return provider;
  }
  if (config.anthropicApiKey && config.anthropicModel) {
    const provider = new AnthropicModelProvider(config);
    provider.ensureConfigured();
    return provider;
  }
  if (config.bedrockEnabled && config.bedrockModelId) {
    const provider = new BedrockModelProvider(config, makeBedrockConverseClient(config.awsRegion));
    provider.ensureConfigured();
    return provider;
  }
  return new MockModelProvider(config);
}

export { MockModelProvider, BedrockModelProvider, AnthropicModelProvider, DeepSeekModelProvider };
export * from "./model-provider.js";
