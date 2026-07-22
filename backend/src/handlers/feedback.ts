import { validateFeedback, formatErrors } from "../validation/schemas.js";
import { engine } from "./runtime.js";
import { json, type ProxyEvent, type ProxyResult } from "./http-types.js";

/** POST /v1/feedback — endpoint separado; save_feedback no es acción de decisión. */
export async function handler(event: ProxyEvent): Promise<ProxyResult> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(event.body ?? "null");
  } catch {
    return json(400, { error: "INVALID_JSON" });
  }
  if (!validateFeedback(parsed)) {
    return json(400, { error: "SCHEMA_VALIDATION", detail: formatErrors(validateFeedback) });
  }
  // Alimenta la capa de aprendizaje local (si está activa) sin datos sensibles.
  const fb = parsed as { decision_id: string; result: string };
  engine.recordFeedback(fb.decision_id, fb.result);
  // MVP: solo se acepta. La persistencia agregada (DynamoDB) es posterior.
  console.log(JSON.stringify({ evt: "feedback", accepted: true }));
  return json(202, { accepted: true });
}
