import { validateDecisionRequest, formatErrors } from "../validation/schemas.js";
import type { DecisionRequest } from "../domain/types.js";
import { engine } from "./runtime.js";
import { json, type ProxyEvent, type ProxyResult } from "./http-types.js";

/** POST /v1/decisions */
export async function handler(event: ProxyEvent): Promise<ProxyResult> {
  const started = Date.now();
  let parsed: unknown;
  try {
    parsed = JSON.parse(event.body ?? "null");
  } catch {
    return json(400, { error: "INVALID_JSON" });
  }

  if (!validateDecisionRequest(parsed)) {
    // No registrar el cuerpo: solo el motivo de validación.
    return json(400, { error: "SCHEMA_VALIDATION", detail: formatErrors(validateDecisionRequest) });
  }

  const req = parsed as DecisionRequest;
  // Código de prueba por header (no forma parte del contrato JSON). Case-insensitive.
  const h = event.headers ?? {};
  const trialCode = h["x-trial-code"] ?? h["X-Trial-Code"] ?? h["X-TRIAL-CODE"];
  const decision = await engine.decide(req, trialCode ?? undefined);
  const latencyMs = Date.now() - started;
  // Log content-blind: nunca el payload.
  console.log(JSON.stringify({ evt: "decision", action: decision.action, reason_code: decision.reason_code, decision_source: decision.decision_source, fallback: decision.fallback, latencyMs }));
  return json(200, decision);
}
