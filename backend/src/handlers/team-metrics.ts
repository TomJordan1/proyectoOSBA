import { validateTeamMetrics } from "../validation/team-schemas.js";
import type { TeamMetricsPacket } from "../domain/team-types.js";
import { aggregator } from "./runtime.js";
import { json, type ProxyEvent, type ProxyResult } from "./http-types.js";

/** POST /v1/team-metrics — canal de agregación. Nunca identidad humana. */
export async function handler(event: ProxyEvent): Promise<ProxyResult> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(event.body ?? "null");
  } catch {
    return json(400, { error: "INVALID_JSON" });
  }
  if (!validateTeamMetrics(parsed)) {
    return json(400, { error: "SCHEMA_VALIDATION" });
  }
  aggregator.ingest(parsed as TeamMetricsPacket);
  // Log content-blind: sin payload, sin identidad.
  console.log(JSON.stringify({ evt: "team_metrics", accepted: true }));
  return json(202, { accepted: true });
}
