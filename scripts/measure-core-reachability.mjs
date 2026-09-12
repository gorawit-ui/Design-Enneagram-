// How easy is each core to land on, from the foundation block alone?
//
// Written after a real miss: a respondent who knows herself as 8w9 came out 3w2. That is not an
// adjacent slip, it is a different centre, and the first question is whether the item bank makes
// some cores easier to reach than others regardless of who is answering.
//
// Three things are measured per core, and they are different questions:
//   coverage  — how many of the 10 foundation items offer this core an option at all. An item with
//               no option for your core cannot record you; your answer goes somewhere else.
//   weight    — the total points available to the core if every one of its options were chosen.
//   donations — points the core receives from options whose PRIMARY target is a different core.
//               A core that collects a lot of these is a magnet: people who are not it drift there.
//
// Usage: npm run items:reach

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, "..");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "reach-"));
ts.createProgram(
  ["assessment-data.ts", "character-system.ts", "scoring.ts"].map((f) => path.join(root, "app/lib", f)),
  { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS,
    moduleResolution: ts.ModuleResolutionKind.Node10, outDir: tmp, esModuleInterop: true, skipLibCheck: true },
).emit();
const data = require(path.join(tmp, "assessment-data.js"));

const cores = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const foundation = data.FOUNDATION_QUESTIONS.filter((q) => q.id.startsWith("f-e-"));

const stat = Object.fromEntries(cores.map((core) => [core, {
  items: new Set(), options: 0, weight: 0, primary: 0, donated: 0,
}]));

for (const question of foundation) {
  for (const option of question.options) {
    const weights = option.weights?.enneagram ?? {};
    const entries = Object.entries(weights).map(([core, value]) => [Number(core), value ?? 0]);
    if (entries.length === 0) continue;
    // The option's primary target is the core it gives the most to; everything else is a donation.
    const top = Math.max(...entries.map(([, value]) => value));
    for (const [core, value] of entries) {
      if (value <= 0) continue;
      stat[core].items.add(question.id);
      stat[core].options += 1;
      stat[core].weight += value;
      if (value === top) stat[core].primary += value;
      else stat[core].donated += value;
    }
  }
}

const pad = (value, width) => String(value).padStart(width);
console.log(`Foundation Enneagram block: ${foundation.length} items\n`);
console.log(`core  items  options  weight  as primary  received as donation`);
for (const core of cores) {
  const row = stat[core];
  console.log(`  ${core}   ${pad(row.items.size, 4)}/${foundation.length}  ${pad(row.options, 6)}`
    + `  ${pad(row.weight, 6)}  ${pad(row.primary, 10)}  ${pad(row.donated, 20)}`);
}

const byWeight = [...cores].sort((a, b) => stat[b].weight - stat[a].weight);
console.log(`\nmost weight available: ${byWeight.slice(0, 3).map((c) => `${c} (${stat[c].weight})`).join(", ")}`);
console.log(`least weight available: ${byWeight.slice(-3).map((c) => `${c} (${stat[c].weight})`).join(", ")}`);
const byDonation = [...cores].sort((a, b) => stat[b].donated - stat[a].donated);
console.log(`biggest donation magnets: ${byDonation.slice(0, 3).map((c) => `${c} (+${stat[c].donated})`).join(", ")}`);
