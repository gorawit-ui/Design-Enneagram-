// Find an option ORDER for the Enneagram foundation items that keeps straight-lining meaningless.
//
// A respondent who clicks the same position twenty-four times has told us nothing, and the project
// committed to never handing that person a confident type. What was actually protecting it was an
// accident: core 1 and core 8 both happened to total six at index 0, and moving one option in
// f-e-2 broke the tie. An accident is not a property.
//
// Option order inside an item carries no meaning -- there is no "first" answer to "what steadies
// you" -- so order is the free variable, and text and weights are never touched here. The search
// looks for an order satisfying two things at once:
//
//   1. No core is the top weight at the same index in more than two of the ten items. Clustering is
//      what lets a non-reader accumulate a leader at all.
//   2. All four straight lines finish with no core named and no MBTI type named, scored through the
//      real selector so the adaptive block -- which a straight line also steers -- is included.
//
// Deterministic: fixed seed, fixed restart count. Prints the order to apply; --write applies it.
//
// Usage: node scripts/balance-item-order.mjs [--write]

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, "..");
const out = fs.mkdtempSync(path.join(os.tmpdir(), "balance-"));
ts.createProgram(
  ["assessment-data.ts", "scoring.ts"].map((f) => path.join(root, "app/lib", f)),
  { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS,
    moduleResolution: ts.ModuleResolutionKind.Node10, outDir: out, esModuleInterop: true, skipLibCheck: true },
).emit();
const scoring = require(path.join(out, "scoring.js"));
const data = require(path.join(out, "assessment-data.js"));

// scoring.ts indexes the same question objects these arrays hold, so reordering an options array
// IN PLACE is seen by the scorer without rebuilding anything.
const items = data.FOUNDATION_QUESTIONS.filter((q) => q.id.startsWith("f-e-"));
const original = items.map((q) => [...q.options]);

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

const topCore = (option) => {
  const e = option.weights?.enneagram;
  if (!e) return null;
  return Object.entries(e).sort((a, b) => b[1] - a[1])[0][0];
};

/** Worst number of items placing the same core at the same index. Lower is better; 2 is the cap. */
function clustering() {
  let worst = 0;
  for (let index = 0; index < 4; index += 1) {
    const tally = {};
    for (const item of items) {
      const core = topCore(item.options[Math.min(index, item.options.length - 1)]);
      if (core) tally[core] = (tally[core] ?? 0) + 1;
    }
    worst = Math.max(worst, ...Object.values(tally));
  }
  return worst;
}

/** How close each straight line comes to naming something. Zero means all four say nothing. */
function straightLineLeak() {
  let leak = 0;
  for (let index = 0; index < 4; index += 1) {
    const answers = [];
    for (let slot = 0; slot < data.MAX_QUESTIONS; slot += 1) {
      const question = scoring.selectNextQuestion(answers);
      if (!question) break;
      answers.push({ questionId: question.id, optionIndex: index });
    }
    const result = scoring.scoreAssessment(answers);
    if (result.enneagram.core !== null) {
      const scores = Object.values(result.scores.enneagram).sort((a, b) => b - a);
      leak += 10 + (scores[0] - scores[1]);
    }
    if (result.mbti.type !== null) leak += 10;
  }
  return leak;
}

const changed = () => items.reduce((n, item, i) =>
  n + (item.options.some((option, j) => option !== original[i][j]) ? 1 : 0), 0);

const cost = () => straightLineLeak() * 100 + Math.max(0, clustering() - 2) * 50 + changed();

let bestOrder = items.map((q) => [...q.options]);
let bestCost = cost();
const random = mulberry32(20260915);

for (let restart = 0; restart < 400 && bestCost > 0; restart += 1) {
  // Start from the current bank, then hill-climb by swapping two options inside one item.
  items.forEach((item, i) => { item.options.splice(0, item.options.length, ...original[i]); });
  let current = cost();
  for (let step = 0; step < 600; step += 1) {
    const item = items[Math.floor(random() * items.length)];
    const a = Math.floor(random() * item.options.length);
    const b = Math.floor(random() * item.options.length);
    if (a === b) continue;
    [item.options[a], item.options[b]] = [item.options[b], item.options[a]];
    const next = cost();
    if (next <= current) { current = next; } else {
      [item.options[a], item.options[b]] = [item.options[b], item.options[a]];
    }
    if (current === 0) break;
  }
  if (current < bestCost) { bestCost = current; bestOrder = items.map((q) => [...q.options]); }
}

items.forEach((item, i) => { item.options.splice(0, item.options.length, ...bestOrder[i]); });
console.log(`straight-line leak ${straightLineLeak()}   worst clustering ${clustering()}   items reordered ${changed()}/${items.length}`);
if (straightLineLeak() > 0 || clustering() > 2) {
  console.error("no order found that satisfies both properties — the item set itself needs a change, not a shuffle");
  process.exit(1);
}

const moves = items
  .map((item, i) => ({ id: item.id, order: item.options.map((option) => original[i].indexOf(option)) }))
  .filter((move) => move.order.some((from, to) => from !== to));
for (const move of moves) console.log(`  ${move.id}  ${move.order.join(" ")}   (ตำแหน่งเดิมของแต่ละตัวเลือก)`);

if (process.argv.includes("--write")) {
  let source = fs.readFileSync(path.join(root, "app/lib/assessment-data.ts"), "utf8");
  for (const move of moves) {
    // The authored source is what gets reordered; applyKeying still reverses afterwards for the
    // items that are reverse-keyed, so work in authored space.
    const reversed = data.isReverseKeyed(move.id);
    const block = new RegExp(`(id: "${move.id}".*?options: \\[)(.*?)(\\n    \\],)`, "s").exec(source);
    if (!block) throw new Error(`cannot locate ${move.id}`);
    const authored = block[2].match(/\n      \{ text: .*?\},/g);
    if (!authored) throw new Error(`cannot parse options of ${move.id}`);
    const display = reversed ? [...authored].reverse() : authored;
    const next = move.order.map((from) => display[from]);
    const written = reversed ? [...next].reverse() : next;
    source = source.slice(0, block.index + block[1].length) + written.join("")
      + source.slice(block.index + block[1].length + block[2].length);
  }
  fs.writeFileSync(path.join(root, "app/lib/assessment-data.ts"), source);
  console.log(`\nwrote ${moves.length} reordered items`);
}
