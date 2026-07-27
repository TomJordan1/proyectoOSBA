// Configuración por variables de entorno. Sin secretos aquí.
export interface AppConfig {
  bedrockEnabled: boolean;
  killSwitch: boolean;
  bedrockModelId: string | undefined;
  maxCallsPerHour: number;
  maxCallsPerDay: number;
  maxOutputTokens: number;
  decisionTtlSeconds: number;
  // Puertas
  minimumObservationMinutes: number;
  sustainedWindows: number;
  frictionThreshold: number;
  decisionCooldownMinutes: number;
  recoveryCooldownMinutes: number;
  maxRecoveryDurationSeconds: number;
  // Capa de aprendizaje local (ADR-017); opt-in, por defecto desactivada.
  learningEnabled: boolean;
  learningMinSamples: number;
  aggregatesTable: string | undefined;
  awsRegion: string | undefined;
  // Proveedor Anthropic directo (alternativa a Bedrock; usa la API de Anthropic).
  anthropicApiKey: string | undefined;
  anthropicModel: string | undefined;
  // Proveedor DeepSeek (API compatible con OpenAI; más económico).
  deepseekApiKey: string | undefined;
  deepseekModel: string | undefined;
  // Gate de códigos de prueba (tope de gasto por usuario). Tabla en DynamoDB.
  trialCodesTable: string | undefined;
  trialMaxCalls: number; // tope de llamadas a la IA por código (proxy de ~US$0.50)
}

function num(v: string | undefined, def: number): number {
  if (v === undefined || v.trim() === "") return def;
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}
function bool(v: string | undefined, def: boolean): boolean {
  if (v === undefined) return def;
  return v.toLowerCase() === "true";
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  return {
    bedrockEnabled: bool(env.BEDROCK_ENABLED, false),
    killSwitch: bool(env.KILL_SWITCH, false),
    bedrockModelId: env.BEDROCK_MODEL_ID,
    maxCallsPerHour: num(env.MAX_CALLS_PER_HOUR, 20),
    maxCallsPerDay: num(env.MAX_CALLS_PER_DAY, 100),
    maxOutputTokens: num(env.MAX_OUTPUT_TOKENS, 180),
    decisionTtlSeconds: num(env.DECISION_TTL_SECONDS, 20),
    minimumObservationMinutes: num(env.MIN_OBSERVATION_MINUTES, 3),
    sustainedWindows: num(env.SUSTAINED_WINDOWS, 3),
    frictionThreshold: num(env.FRICTION_THRESHOLD, 0.78),
    decisionCooldownMinutes: num(env.DECISION_COOLDOWN_MINUTES, 15),
    recoveryCooldownMinutes: num(env.RECOVERY_COOLDOWN_MINUTES, 30),
    maxRecoveryDurationSeconds: num(env.MAX_RECOVERY_DURATION_SECONDS, 60),
    learningEnabled: bool(env.LEARNING_ENABLED, false),
    learningMinSamples: num(env.LEARNING_MIN_SAMPLES, 5),
    aggregatesTable: env.AGGREGATES_TABLE,
    awsRegion: env.AWS_REGION,
    anthropicApiKey: env.ANTHROPIC_API_KEY && env.ANTHROPIC_API_KEY.trim() !== "" ? env.ANTHROPIC_API_KEY : undefined,
    anthropicModel: env.ANTHROPIC_MODEL && env.ANTHROPIC_MODEL.trim() !== "" ? env.ANTHROPIC_MODEL : undefined,
    deepseekApiKey: env.DEEPSEEK_API_KEY && env.DEEPSEEK_API_KEY.trim() !== "" ? env.DEEPSEEK_API_KEY : undefined,
    deepseekModel: env.DEEPSEEK_MODEL && env.DEEPSEEK_MODEL.trim() !== "" ? env.DEEPSEEK_MODEL : "deepseek-chat",
    trialCodesTable: env.TRIAL_CODES_TABLE && env.TRIAL_CODES_TABLE.trim() !== "" ? env.TRIAL_CODES_TABLE : undefined,
    trialMaxCalls: num(env.TRIAL_MAX_CALLS, 400),
  };
}
