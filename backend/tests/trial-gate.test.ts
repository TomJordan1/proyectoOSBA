import { describe, it, expect } from "vitest";
import { TrialGate, InMemoryTrialStore } from "../src/policies/trial-gate.js";

describe("TrialGate (tope de gasto por código de prueba)", () => {
  const now = new Date("2026-01-01T00:00:00Z");
  const future = "2026-12-31T00:00:00Z";
  const past = "2025-01-01T00:00:00Z";

  it("sin código no permite (gating activo exige código)", async () => {
    const g = new TrialGate(new InMemoryTrialStore(), 5);
    expect(await g.allow(undefined, now)).toBe(false);
    expect(await g.allow("", now)).toBe(false);
  });

  it("código desconocido no permite", async () => {
    const g = new TrialGate(new InMemoryTrialStore(), 5);
    expect(await g.allow("no-existe", now)).toBe(false);
  });

  it("permite hasta el tope del código y luego corta", async () => {
    const store = new InMemoryTrialStore();
    store.put("ABC", { expiresAt: future, maxCalls: 3 });
    const g = new TrialGate(store, 5);
    expect(await g.allow("ABC", now)).toBe(true);
    expect(await g.allow("ABC", now)).toBe(true);
    expect(await g.allow("ABC", now)).toBe(true);
    expect(await g.allow("ABC", now)).toBe(false); // agotado
  });

  it("usa el tope por defecto si el código no fija maxCalls", async () => {
    const store = new InMemoryTrialStore();
    store.put("D", { expiresAt: future });
    const g = new TrialGate(store, 2);
    expect(await g.allow("D", now)).toBe(true);
    expect(await g.allow("D", now)).toBe(true);
    expect(await g.allow("D", now)).toBe(false);
  });

  it("código vencido no permite", async () => {
    const store = new InMemoryTrialStore();
    store.put("OLD", { expiresAt: past, maxCalls: 10 });
    expect(await new TrialGate(store, 5).allow("OLD", now)).toBe(false);
  });

  it("código inactivo no permite", async () => {
    const store = new InMemoryTrialStore();
    store.put("OFF", { expiresAt: future, active: false });
    expect(await new TrialGate(store, 5).allow("OFF", now)).toBe(false);
  });
});
