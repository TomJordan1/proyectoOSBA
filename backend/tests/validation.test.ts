import { describe, it, expect } from "vitest";
import { validateDecisionRequest } from "../src/validation/schemas.js";
import { loadFixture } from "./helpers.js";

describe("validación de la petición (content-blind, additionalProperties:false)", () => {
  it("acepta un fixture válido", () => {
    expect(validateDecisionRequest(loadFixture("scenario-B-friction-available.json"))).toBe(true);
  });

  it("rechaza campos desconocidos de nivel superior", () => {
    const req = { ...loadFixture("scenario-A-stable.json"), window_title: "secreto.docx" };
    expect(validateDecisionRequest(req)).toBe(false);
  });

  it("rechaza campos prohibidos anidados (texto en friction)", () => {
    const base = loadFixture("scenario-A-stable.json");
    const req = { ...base, friction: { ...base.friction, typed_text: "hola" } };
    expect(validateDecisionRequest(req)).toBe(false);
  });

  it("rechaza max_duration_seconds > 60", () => {
    const base = loadFixture("scenario-B-friction-available.json");
    const req = { ...base, preferences: { ...base.preferences, max_duration_seconds: 120 } };
    expect(validateDecisionRequest(req)).toBe(false);
  });

  it("rechaza score fuera de rango", () => {
    const base = loadFixture("scenario-A-stable.json");
    const req = { ...base, friction: { ...base.friction, score: 1.5 } };
    expect(validateDecisionRequest(req)).toBe(false);
  });
});
