import { describe, it, expect } from "vitest";
import { decisionRequestSchema, decisionResponseSchema, feedbackSchema } from "../src/validation/schemas.js";
import { teamMetricsSchema, teamSummarySchema } from "../src/validation/team-schemas.js";
import { loadSchema } from "./helpers.js";

describe("los esquemas embebidos coinciden con /contracts (fuente canónica)", () => {
  it("decision-request", () => { expect(loadSchema("decision-request.schema.json")).toEqual(decisionRequestSchema); });
  it("decision-response", () => { expect(loadSchema("decision-response.schema.json")).toEqual(decisionResponseSchema); });
  it("feedback", () => { expect(loadSchema("feedback.schema.json")).toEqual(feedbackSchema); });
  it("team-metrics", () => { expect(loadSchema("team-metrics.schema.json")).toEqual(teamMetricsSchema); });
  it("team-summary", () => { expect(loadSchema("team-summary.schema.json")).toEqual(teamSummarySchema); });
});
