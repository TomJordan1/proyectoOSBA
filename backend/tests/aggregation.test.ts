import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Aggregator } from "../src/aggregation/aggregator.js";
import { validateTeamSummary } from "../src/validation/team-schemas.js";
import type { TeamMetricsPacket } from "../src/domain/team-types.js";
import { contractsDir } from "./helpers.js";

function load(file: string): TeamMetricsPacket[] {
  return JSON.parse(readFileSync(resolve(contractsDir, "fixtures/team", file), "utf8"));
}
const PERIOD = { periodStart: "2026-07-22T00:00:00Z", periodEnd: "2026-07-22T23:59:59Z", applyDelay: false as const };

describe("agregación y privacidad grupal (escenarios E–F)", () => {
  it("E — 5 contribuyentes -> visible, con métricas y recomendaciones", async () => {
    const agg = new Aggregator();
    await agg.ingestMany(load("scenario-E-group5.json"));
    const s = await agg.summarize("org_demo", "backend", PERIOD);
    expect(s.privacy_status).toBe("visible");
    expect(s.contributor_count).toBe(5);
    expect(typeof s.avg_friction).toBe("number");
    expect(s.recommendations && s.recommendations.length).toBeGreaterThan(0);
    expect(validateTeamSummary(s)).toBe(true);
  });

  it("F — 4 contribuyentes -> insufficient_group, SIN métricas (dato suprimido)", async () => {
    const agg = new Aggregator();
    await agg.ingestMany(load("scenario-F-group4.json"));
    const s = await agg.summarize("org_demo", "backend", PERIOD);
    expect(s.privacy_status).toBe("insufficient_group");
    expect(s.contributor_count).toBe(4);
    expect(s.avg_friction).toBeUndefined();
    expect(s.trend).toBeUndefined();
    expect(s.recommendations).toBeUndefined();
    expect(validateTeamSummary(s)).toBe(true);
  });

  it("equipo sin datos -> unavailable", async () => {
    const agg = new Aggregator();
    const s = await agg.summarize("org_demo", "vacio", PERIOD);
    expect(s.privacy_status).toBe("unavailable");
    expect(s.contributor_count).toBe(0);
  });

  it("no mezcla equipos: solo cuenta el equipo consultado", async () => {
    const agg = new Aggregator();
    await agg.ingestMany(load("scenario-E-group5.json")); // team backend
    const s = await agg.summarize("org_demo", "frontend", PERIOD);
    expect(s.contributor_count).toBe(0);
  });
});
