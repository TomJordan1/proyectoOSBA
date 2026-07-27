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
  // Acepta un paquete o un lote (array) de paquetes.
  const packets = Array.isArray(parsed) ? parsed : [parsed];
  if (packets.length === 0) {
    return json(400, { error: "EMPTY_BATCH" });
  }
  for (const p of packets) {
    if (!validateTeamMetrics(p)) {
      return json(400, { error: "SCHEMA_VALIDATION" });
    }
  }
  try {
    await aggregator.ingestMany(packets as TeamMetricsPacket[]);
  } catch (err) {
    console.error(JSON.stringify({ evt: "team_metrics_error", message: (err as Error).message }));
    return json(500, { error: "STORE_ERROR" });
  }
  // Log content-blind: sin payload, sin identidad.
  console.log(JSON.stringify({ evt: "team_metrics", accepted: true, count: packets.length }));
  return json(202, { accepted: true, count: packets.length });
}
