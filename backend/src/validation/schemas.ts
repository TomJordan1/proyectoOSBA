// Copia ejecutable de los contratos. La fuente humana canónica vive en /contracts/schemas.
// tests/contracts-sync.test.ts verifica que ambas copias no diverjan.
import Ajv, { type ValidateFunction } from "ajv";
import addFormats from "ajv-formats";

export const decisionRequestSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  $id: "https://laminar.local/schemas/decision-request.json",
  title: "DecisionRequest",
  description: "Petición content-blind enviada por el desktop a POST /v1/decisions. Solo métricas abstractas y contexto booleano.",
  type: "object",
  additionalProperties: false,
  required: ["schema_version", "event_id", "timestamp", "friction", "context", "preferences"],
  properties: {
    schema_version: { const: "1.0" },
    event_id: { type: "string", format: "uuid" },
    timestamp: { type: "string", format: "date-time" },
    friction: {
      type: "object",
      additionalProperties: false,
      required: ["score", "sustained_minutes", "delete_z", "switch_z", "cursor_z"],
      properties: {
        score: { type: "number", minimum: 0, maximum: 1 },
        sustained_minutes: { type: "integer", minimum: 0 },
        delete_z: { type: "number" },
        switch_z: { type: "number" },
        cursor_z: { type: "number" },
      },
    },
    context: {
      type: "object",
      additionalProperties: false,
      required: ["meeting_active", "screen_sharing", "fullscreen_active", "quiet_mode", "session_minutes", "last_intervention_minutes"],
      properties: {
        meeting_active: { type: "boolean" },
        screen_sharing: { type: "boolean" },
        fullscreen_active: { type: "boolean" },
        quiet_mode: { type: "boolean" },
        session_minutes: { type: "integer", minimum: 0 },
        last_intervention_minutes: { type: "integer", minimum: 0 },
      },
    },
    preferences: {
      type: "object",
      additionalProperties: false,
      required: ["preferred_recovery", "reduced_motion", "max_duration_seconds"],
      properties: {
        preferred_recovery: { type: "string", enum: ["bubbles", "breathing", "none"] },
        reduced_motion: { type: "boolean" },
        max_duration_seconds: { type: "integer", minimum: 0, maximum: 60 },
      },
    },
    recent_feedback: { type: "string", enum: ["helpful", "not_now", "false_positive", "dismissed", "none"] },
  },
} as const;

export const decisionResponseSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  $id: "https://laminar.local/schemas/decision-response.json",
  title: "DecisionResponse",
  description: "Decisión estructurada devuelta por el backend. Validada de nuevo por el desktop antes de ejecutar.",
  type: "object",
  additionalProperties: false,
  required: ["schema_version", "decision_id", "event_id", "action", "arguments", "reason_code", "explanation", "expires_at", "decision_source", "fallback"],
  properties: {
    schema_version: { const: "1.0" },
    decision_id: { type: "string", format: "uuid" },
    event_id: { type: "string", format: "uuid" },
    action: { type: "string", enum: ["do_nothing", "show_subtle_notification", "postpone_intervention", "launch_bubble_recovery", "enable_quiet_mode"] },
    arguments: {
      type: "object",
      additionalProperties: false,
      properties: {
        duration_seconds: { type: "integer", minimum: 0, maximum: 60 },
        intensity: { type: "string", enum: ["low", "medium"] },
      },
    },
    reason_code: {
      type: "string",
      enum: ["STABLE_PATTERN", "SUSTAINED_FRICTION_CONTEXT_AVAILABLE", "PROTECTED_CONTEXT", "QUIET_MODE", "COOLDOWN_ACTIVE", "PENDING_RECOVERY_RESUMED", "SERVER_BUDGET_LIMIT", "PROVIDER_ERROR_FALLBACK", "INVALID_MODEL_RESPONSE_FALLBACK", "UNKNOWN_ACTION_DOWNGRADED"],
    },
    explanation: { type: "string", maxLength: 240 },
    expires_at: { type: "string", format: "date-time" },
    decision_source: { type: "string", enum: ["bedrock", "anthropic", "deepseek", "cache", "local_policy", "mock"] },
    fallback: { type: "boolean" },
  },
} as const;

export const feedbackSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  $id: "https://laminar.local/schemas/feedback.json",
  title: "Feedback",
  description: "POST /v1/feedback. Endpoint separado; save_feedback no es una acción de decisión.",
  type: "object",
  additionalProperties: false,
  required: ["schema_version", "decision_id", "result"],
  properties: {
    schema_version: { const: "1.0" },
    decision_id: { type: "string", format: "uuid" },
    result: { type: "string", enum: ["helpful", "not_now", "false_positive", "dismissed"] },
    reason: { type: "string", enum: ["good_timing", "bad_timing", "not_relevant", "too_frequent", "other"] },
    recovery_completed: { type: "boolean" },
    duration_seconds: { type: "integer", minimum: 0, maximum: 60 },
  },
} as const;

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

export const validateDecisionRequest: ValidateFunction = ajv.compile(decisionRequestSchema);
export const validateDecisionResponse: ValidateFunction = ajv.compile(decisionResponseSchema);
export const validateFeedback: ValidateFunction = ajv.compile(feedbackSchema);

export function formatErrors(v: ValidateFunction): string {
  return (v.errors ?? []).map((e) => `${e.instancePath || "/"} ${e.message ?? ""}`.trim()).join("; ");
}
