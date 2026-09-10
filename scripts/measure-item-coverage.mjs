import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";
const require = createRequire(import.meta.url);
const root = "/home/user/Design-Enneagram-";
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "cov-"));
const files = ["assessment-data.ts", "character-system.ts", "scoring.ts"].map((f) => path.join(root, "app/lib", f));
ts.createProgram(files, { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS,
  moduleResolution: ts.ModuleResolutionKind.Node10, outDir: tmp, esModuleInterop: true, skipLibCheck: true }).emit();
const data = require(path.join(tmp, "assessment-data.js"));

const tally = (questions, label) => {
  const primary = {}, secondary = {}, byItem = {};
  for (let c = 1; c <= 9; c += 1) { primary[c] = 0; secondary[c] = 0; }
  for (const q of questions) {
    const cores = new Set();
    for (const o of q.options) {
      const e = o.weights?.enneagram ?? {};
      for (const [core, w] of Object.entries(e)) {
        cores.add(+core);
        if (w >= 2) primary[core] += 1; else secondary[core] += 1;
      }
    }
    byItem[q.id] = [...cores].sort((a, b) => a - b);
  }
  console.log(`\n### ${label} (${questions.length} items)`);
  console.log("core   primary options   secondary   total weight");
  let totals = [];
  for (let c = 1; c <= 9; c += 1) {
    const weight = primary[c] * 2 + secondary[c];
    totals.push({ c, weight, p: primary[c], s: secondary[c] });
  }
  const max = Math.max(...totals.map((t) => t.weight));
  for (const t of totals.sort((a, b) => b.weight - a.weight)) {
    const bar = "█".repeat(Math.round(t.weight / max * 26));
    console.log(`  ${t.c}  ${String(t.p).padStart(6)}      ${String(t.s).padStart(8)}   ${String(t.weight).padStart(6)}  ${bar}`);
  }
  return { byItem, totals };
};

const foundation = data.FOUNDATION_QUESTIONS.filter((q) => q.id.startsWith("f-e-"));
const { byItem } = tally(foundation, "Enneagram foundation — the 10 items everyone answers");
console.log("\nwhich cores each item can even express:");
for (const [id, cores] of Object.entries(byItem)) {
  const missing = [1,2,3,4,5,6,7,8,9].filter((c) => !cores.includes(c));
  console.log(`  ${id.padEnd(8)} reaches ${cores.join(",").padEnd(14)}  silent on ${missing.join(",")}`);
}
tally([...data.CORE_CHALLENGES, ...data.WING_CHALLENGES],
  "Enneagram adaptive challenges — asked only when selected, so nobody answers all of them");

// The sharper statistic. Aggregate weight per core turns out to be fairly even, which is not the
// question that matters. What matters is: on how many of the ten items a person of core N finds no
// option that belongs to them, and must therefore hand their answer to a core that is not theirs.
// Where it goes is decided by the wording of the other three options, not by the respondent.
console.log("\n### Forced donation — items with no option for that core");
console.log("core   silent items   share of the block   which items");
const silent = {};
for (let c = 1; c <= 9; c += 1) silent[c] = [];
for (const [id, cores] of Object.entries(byItem)) {
  for (let c = 1; c <= 9; c += 1) if (!cores.includes(c)) silent[c].push(id);
}
const rows = Object.entries(silent).map(([c, items]) => ({ c: +c, items }))
  .sort((a, b) => b.items.length - a.items.length);
for (const r of rows) {
  const pct = (r.items.length / foundation.length * 100).toFixed(0);
  console.log(`  ${r.c}  ${String(r.items.length).padStart(9)}   ${String(pct + "%").padStart(12)}        ${r.items.join(" ")}`);
}
console.log("\nA core silent on half the block cannot be measured by the block; it can only be");
console.log("inferred from what its holder was forced to choose instead.");
fs.rmSync(tmp, { recursive: true, force: true });
