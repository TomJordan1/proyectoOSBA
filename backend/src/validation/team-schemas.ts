// Copia ejecutable de los contratos B2B2E. Fuente canónica: /contracts/schemas.
// tests/contracts-sync.test.ts verifica que no diverjan.
import Ajv, { type ValidateFunction } from "ajv";
import addFormats from "ajv-formats";

export const teamMetricsSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  $id: "https://laminar.local/schemas/team-metrics.json",
  title: "TeamMetricsPacket",
  description: "Paquete agregado (canal de agregación, distinto del canal de decisiones). Nivel C de gobierno de datos: nunca identidad humana. POST /v1/team-metrics.",
  type: "object",
  additionalProperties: false,
  required: ["schema_version", "organization_id", "team_id", "window_start", "window_minutes", "friction_band", "avg_friction", "peak_friction", "interventions", "helpful_feedback", "active_contributor", "scenario"],
  properties: {
    schema_version: { const: "1.0" },
    organization_id: { type: "string", minLength: 1, maxLength: 64 },
    team_id: { type: "string", minLength: 1, maxLength: 64 },
    installation_token: { type: "string", description: "Token rotativo NO humano, solo para contar contribuyentes y deduplicar dentro de una ventana. No es user_id.", maxLength: 128 },
    window_start: { type: "string", format: "date-time" },
    window_minutes: { type: "integer", enum: [15] },
    friction_band: { type: "string", enum: ["low", "moderate", "elevated", "high"] },
    avg_friction: { type: "number", minimum: 0, maximum: 1 },
    peak_friction: { type: "number", minimum: 0, maximum: 1 },
    interventions: { type: "integer", minimum: 0 },
    helpful_feedback: { type: "integer", minimum: 0 },
    active_contributor: { type: "boolean" },
    scenario: { type: "string", enum: ["demo", "real"] },
  },
  not: {
    anyOf: [
      { required: ["user_id"] },
      { required: ["name"] },
      { required: ["email"] },
      { required: ["employee_id"] },
    ],
  },
} as const;

export const teamSummarySchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  $id: "https://laminar.local/schemas/team-summary.json",
  title: "TeamSummary",
  description: "Resumen colectivo para Laminar Teams. Sin individuos, sin rankings. GET /v1/teams/{teamId}/summary.",
  type: "object",
  additionalProperties: false,
  required: ["team_id", "period_start", "period_end", "contributor_count", "privacy_status", "confidence"],
  properties: {
    team_id: { type: "string", minLength: 1 },
    period_start: { type: "string", format: "date-time" },
    period_end: { type: "string", format: "date-time" },
    contributor_count: { type: "integer", minimum: 0 },
    privacy_status: { type: "string", enum: ["visible", "insufficient_group", "delayed", "unavailable"] },
    avg_friction: { type: "number", minimum: 0, maximum: 1 },
    trend: { type: "string", enum: ["increasing", "stable", "decreasing"] },
    helpful_rate: { type: "number", minimum: 0, maximum: 1 },
    confidence: { type: "string", enum: ["exploratory", "indicative"] },
    recommendations: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["code", "message"],
        properties: {
          code: { type: "string", enum: ["REVIEW_MEETING_DENSITY", "REVIEW_DELIVERY_LOAD", "REVIEW_FOCUS_TIME", "NO_ACTION_NEEDED"] },
          message: { type: "string", maxLength: 240 },
        },
      },
    },
  },
} as const;

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
export const validateTeamMetrics: ValidateFunction = ajv.compile(teamMetricsSchema);
export const validateTeamSummary: ValidateFunction = ajv.compile(teamSummarySchema);
