import { validateTeamSummary } from "../validation/team-schemas.js";
import { aggregator } from "./runtime.js";
import { json, type ProxyEvent, type ProxyResult } from "./http-types.js";

/** GET /v1/teams/{teamId}/summary?organization_id=&period_start=&period_end= */
export async function handler(event: ProxyEvent): Promise<ProxyResult> {
  const teamId = event.pathParameters?.teamId;
  const org = event.queryStringParameters?.organization_id;
  const periodStart = event.queryStringParameters?.period_start;
  const periodEnd = event.queryStringParameters?.period_end;
  if (!teamId || !org || !periodStart || !periodEnd) {
    return json(400, { error: "MISSING_PARAMETERS" });
  }
  const summary = aggregator.summarize(org, teamId, { periodStart, periodEnd, applyDelay: false });
  if (!validateTeamSummary(summary)) {
    return json(500, { error: "SUMMARY_VALIDATION" });
  }
  return json(200, summary);
}
