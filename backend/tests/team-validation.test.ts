import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { validateTeamMetrics } from "../src/validation/team-schemas.js";
import { contractsDir } from "./helpers.js";

function firstPacket(file: string) {
  const arr = JSON.parse(readFileSync(resolve(contractsDir, "fixtures/team", file), "utf8"));
  return arr[0];
}

describe("validación de team-metrics (sin identidad humana)", () => {
  it("acepta un paquete válido", () => {
    expect(validateTeamMetrics(firstPacket("scenario-E-group5.json"))).toBe(true);
  });
  it("rechaza user_id", () => {
    const p = { ...firstPacket("scenario-E-group5.json"), user_id: "raul" };
    expect(validateTeamMetrics(p)).toBe(false);
  });
  it("rechaza email/name (identidad)", () => {
    expect(validateTeamMetrics({ ...firstPacket("scenario-E-group5.json"), email: "x@y.z" })).toBe(false);
    expect(validateTeamMetrics({ ...firstPacket("scenario-E-group5.json"), name: "X" })).toBe(false);
  });
  it("rechaza campos desconocidos (title/url)", () => {
    expect(validateTeamMetrics({ ...firstPacket("scenario-E-group5.json"), window_title: "a" })).toBe(false);
  });
  it("rechaza window_minutes != 15", () => {
    expect(validateTeamMetrics({ ...firstPacket("scenario-E-group5.json"), window_minutes: 30 })).toBe(false);
  });
});
