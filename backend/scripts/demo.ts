// Demo local sin AWS: recorre los 4 escenarios con el MockModelProvider.
// Uso: npx tsx scripts/demo.ts
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadConfig } from "../src/config.js";
import { MockModelProvider } from "../src/providers/mock-model-provider.js";
import { createDefaultEngine } from "../src/agent/decide.js";
import type { DecisionRequest } from "../src/domain/types.js";

const here = dirname(fileURLToPath(import.meta.url));
const fixturesDir = resolve(here, "../../contracts/fixtures");
const config = loadConfig({}); // BEDROCK_ENABLED por defecto false -> mock
const engine = createDefaultEngine(config, new MockModelProvider(config));

const files = [
  ["A stable", "scenario-A-stable.json"],
  ["B friction", "scenario-B-friction-available.json"],
  ["C protected", "scenario-C-protected.json"],
  ["D resumed", "scenario-D-protected-ended.json"],
] as const;

for (const [label, file] of files) {
  const req = JSON.parse(readFileSync(resolve(fixturesDir, file), "utf8")) as DecisionRequest;
  const d = await engine.decide(req);
  console.log(`${label.padEnd(12)} -> ${d.action.padEnd(24)} ${d.reason_code.padEnd(38)} [${d.decision_source}]`);
}
