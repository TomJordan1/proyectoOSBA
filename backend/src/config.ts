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
  };
}
