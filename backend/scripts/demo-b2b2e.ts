// Demo integrada A–F sin AWS. Muestra los dos canales separados:
//  - Decisiones (A–D) con el motor + MockModelProvider
//  - Agregación (E–F) con el Aggregator + privacidad grupal
// Uso: npx tsx scripts/demo-b2b2e.ts
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadConfig } from "../src/config.js";
import { MockModelProvider } from "../src/providers/mock-model-provider.js";
import { createDefaultEngine } from "../src/agent/decide.js";
import { Aggregator } from "../src/aggregation/aggregator.js";
import type { DecisionRequest } from "../src/domain/types.js";
import type { TeamMetricsPacket } from "../src/domain/team-types.js";

const here = dirname(fileURLToPath(import.meta.url));
const fx = resolve(here, "../../contracts/fixtures");
const config = loadConfig({});
const engine = createDefaultEngine(config, new MockModelProvider(config));

console.log("== CANAL DE DECISIONES (Laminar Personal → Cloud) ==");
for (const [label, file] of [
  ["A stable", "scenario-A-stable.json"],
  ["B friction", "scenario-B-friction-available.json"],
  ["C protected", "scenario-C-protected.json"],
  ["D resumed", "scenario-D-protected-ended.json"],
] as const) {
  const req = JSON.parse(readFileSync(resolve(fx, file), "utf8")) as DecisionRequest;
  const d = await engine.decide(req);
  console.log(`  ${label.padEnd(12)} -> ${d.action.padEnd(24)} ${d.reason_code.padEnd(38)} [${d.decision_source}]`);
}

console.log("\n== CANAL DE AGREGACIÓN (Cloud → Laminar Teams) ==");
const PERIOD = { periodStart: "2026-07-22T00:00:00Z", periodEnd: "2026-07-22T23:59:59Z", applyDelay: false as const };
for (const [label, file, team] of [
  ["E group=5", "team/scenario-E-group5.json", "backend"],
  ["F group=4", "team/scenario-F-group4.json", "backend"],
] as const) {
  const packets = JSON.parse(readFileSync(resolve(fx, file), "utf8")) as TeamMetricsPacket[];
  const agg = new Aggregator();
  await agg.ingestMany(packets);
  const s = await agg.summarize("org_demo", team, PERIOD);
  const metrics = s.privacy_status === "visible" ? `avg=${s.avg_friction} trend=${s.trend} helpful=${s.helpful_rate}` : "(métricas suprimidas)";
  console.log(`  ${label.padEnd(10)} -> contributors=${s.contributor_count} privacy=${s.privacy_status.padEnd(18)} ${metrics}`);
}
