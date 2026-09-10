// Search for the smallest set of secondary-weight additions that makes every Enneagram type
// reachable, choosing only among additions whose meaning has been vouched for by hand.
//
// The problem: cores 4 and 7 are unreachable (scripts/probe-type-reachability.mjs). The obvious fix
// is to nudge weights until the probe passes, and that is exactly the fix not to make by hand --
// it turns the item bank into whatever produced a green light, and the next change breaks it again
// for reasons nobody can see.
//
// So the split is: a human decides what an option MAY mean, and the search decides which of those
// meanings the bank NEEDS. Every candidate below is an existing option text plus a core it can
// honestly carry as a secondary signal, with the reason written down; nothing here invents a
// meaning the Thai does not already support, and no option text changes at all -- the wording in
// f-e-9 and f-e-10 was reviewed twice by the Products Owner and is untouched.
//
// The search then takes the smallest subset that makes all 18 core+wing pairs reachable, so the
// bank gains the least it can and every gain has a stated reason.
//
// Usage: node scripts/find-weight-repairs.mjs

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, "..");
const dataPath = path.join(root, "app/lib/assessment-data.ts");
const original = fs.readFileSync(dataPath, "utf8");

// Each candidate: the item, the option's exact existing text, the core to add at weight 1, and why
// that option can honestly carry that core. A secondary weight of 1 says "this answer is
// consistent with that core", not "this answer means that core" -- which is the level of claim
// these all make.
const CANDIDATES = [
  { item: "f-e-4", text: "สิทธิ์กำหนดทางของตัวเอง", core: 4,
    why: "a 4 needs authorship of their own response, not only the 8's need for command" },
  { item: "f-e-4", text: "ทางเลือกที่ยังเปิดอยู่", core: 4,
    why: "an open option is room for a 4's own reading of the situation" },
  { item: "f-e-8", text: "อยู่กับความสนใจของตัวเอง", core: 4,
    why: "a day alone with what interests you is a 4's inner world as much as a 5's study" },
  { item: "f-e-9", text: "จบโดยไม่ต้องฝืนยอมตาม", core: 4,
    why: "a 4 will not suppress their own view to close a disagreement" },
  { item: "f-e-9", text: "จบโดยทุกฝ่ายยังทำงานร่วมกันได้", core: 7,
    why: "a 7 wants the tension lifted so the group can move again" },
  { item: "f-e-10", text: "จังหวะการทำงานที่ไม่ถูกเร่ง", core: 4,
    why: "a 4 needs an unhurried rhythm to work from their own state" },
  { item: "f-e-10", text: "จังหวะการทำงานที่ไม่ถูกเร่ง", core: 5,
    why: "an unrushed pace is what a 5 protects in order to think" },
  { item: "f-e-10", text: "การจัดลำดับงานของตัวเอง", core: 7,
    why: "a 7 keeps their own ordering so the options stay open" },
  { item: "f-e-1", text: "งานนั้นสะท้อนความเป็นตัวเอง", core: 7,
    why: "for a 7 a finished piece satisfies when it opened something, which reads as its own mark" },
  { item: "f-e-7", text: "เป็นคนมีมุมมองเฉพาะตัว", core: 7,
    why: "being called original is praise a 7 takes as readily as a 4" },
  { item: "f-e-5", text: "เร่งทำให้เห็นผลลัพธ์", core: 7,
    why: "under pressure a 7 accelerates and multiplies activity, the same surface as a 3's push" },
  { item: "f-e-5", text: "เข้าไปดูแลคนที่เกี่ยวข้อง", core: 4,
    why: "a 4 under pressure attends to how people are actually feeling about it" },
];

function patched(subset) {
  let out = original;
  for (const c of subset) {
    // Add the core to that option's enneagram weights, in place, without touching its text.
    const marker = `{ text: "${c.text}"`;
    let index = out.indexOf(marker);
    // Find the occurrence inside the right item.
    const itemAt = out.indexOf(`id: "${c.item}"`);
    index = out.indexOf(marker, itemAt);
    if (index < 0 || itemAt < 0) throw new Error(`cannot find ${c.item} / ${c.text}`);
    const close = out.indexOf("} } },", index);
    const head = out.slice(index, close + 1);
    const weights = head.slice(head.indexOf("enneagram: {") + "enneagram: {".length);
    if (new RegExp(`\\b${c.core}:`).test(weights)) continue; // already carries it
    out = out.slice(0, close) + `, ${c.core}: 1 ` + out.slice(close);
  }
  return out;
}

function evaluate(subset) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "repair-"));
  const src = path.join(tmp, "src");
  fs.mkdirSync(src, { recursive: true });
  for (const f of ["assessment-data.ts", "character-system.ts", "scoring.ts"]) {
    fs.copyFileSync(path.join(root, "app/lib", f), path.join(src, f));
  }
  fs.writeFileSync(path.join(src, "assessment-data.ts"), patched(subset));
  const out = path.join(tmp, "out");
  ts.createProgram(["assessment-data.ts", "character-system.ts", "scoring.ts"].map((f) => path.join(src, f)),
    { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS,
      moduleResolution: ts.ModuleResolutionKind.Node10, outDir: out, esModuleInterop: true, skipLibCheck: true }).emit();
  const scoring = require(path.join(out, "scoring.js"));
  const data = require(path.join(out, "assessment-data.js"));
  const WINGS = { 1: [9,2], 2: [1,3], 3: [2,4], 4: [3,5], 5: [4,6], 6: [5,7], 7: [6,8], 8: [7,9], 9: [8,1] };
  const MBTI = new Set(["I", "N", "T", "J", "A"]);
  let misses = 0;
  let worstMargin = Infinity;
  const failing = [];
  for (const core of [1,2,3,4,5,6,7,8,9]) {
    for (const wing of WINGS[core]) {
      const answers = [];
      for (let position = 0; position < data.MAX_QUESTIONS; position += 1) {
        const question = scoring.selectNextQuestion(answers);
        if (!question) break;
        let bestIndex = 0, bestScore = -Infinity;
        question.options.forEach((option, i) => {
          const e = option.weights?.enneagram ?? {}, m = option.weights?.mbti ?? {};
          let score = (e[core] ?? 0) * 3 + (e[wing] ?? 0) * 1.5;
          for (const [pole, w] of Object.entries(m)) score += (MBTI.has(pole) ? 2 : -1) * w;
          if (score > bestScore) { bestScore = score; bestIndex = i; }
        });
        answers.push({ questionId: question.id, optionIndex: bestIndex });
      }
      const r = scoring.scoreAssessment(answers);
      const ranked = Object.entries(r.scores.enneagram).map(([c, v]) => ({ c: +c, v })).sort((a, b) => b.v - a.v);
      const margin = ranked[0].v - ranked[1].v;
      if (r.enneagram.core === core) worstMargin = Math.min(worstMargin, margin);
      if (r.enneagram.core !== core || r.wing !== wing) { misses += 1; failing.push(`${core}w${wing}`); }
    }
  }
  fs.rmSync(tmp, { recursive: true, force: true });
  return { misses, failing, worstMargin };
}

const base = evaluate([]);
console.error(`no repairs: ${base.misses} miss(es) -- ${base.failing.join(" ")}\n`);

// Greedy forward selection: at each step add the single candidate that removes the most misses,
// breaking ties by the larger worst-case margin. Greedy rather than exhaustive because 2^12 full
// evaluations is minutes of TypeScript compilation for a search whose answer is three or four
// items; the result is re-checked exhaustively for redundancy at the end.
let chosen = [];
let current = base;
while (current.misses > 0) {
  let best = null;
  for (const candidate of CANDIDATES) {
    if (chosen.includes(candidate)) continue;
    const trial = evaluate([...chosen, candidate]);
    if (!best || trial.misses < best.trial.misses
      || (trial.misses === best.trial.misses && trial.worstMargin > best.trial.worstMargin)) {
      best = { candidate, trial };
    }
  }
  if (!best || best.trial.misses >= current.misses) {
    console.error(`stuck at ${current.misses} miss(es): ${current.failing.join(" ")}`);
    console.error("No vouched-for addition closes the rest. That needs a new item or new option");
    console.error("text, which is authoring rather than searching -- stopping instead of guessing.");
    break;
  }
  chosen.push(best.candidate);
  current = best.trial;
  console.error(`+ ${best.candidate.item} "${best.candidate.text}" core ${best.candidate.core}`
    + `  -> ${current.misses} miss(es), worst margin ${current.worstMargin}`);
}

// Drop any addition the others made unnecessary.
for (const candidate of [...chosen]) {
  const without = chosen.filter((c) => c !== candidate);
  const trial = evaluate(without);
  if (trial.misses <= current.misses && trial.worstMargin >= current.worstMargin) {
    chosen = without;
    current = trial;
    console.error(`- ${candidate.item} "${candidate.text}" core ${candidate.core} was redundant`);
  }
}

console.error(`\n${chosen.length} addition(s), ${current.misses} miss(es) remaining, `
  + `worst margin ${current.worstMargin}\n`);
for (const c of chosen) console.error(`  ${c.item}  "${c.text}"  +${c.core}:1   // ${c.why}`);
if (process.argv.includes("--write")) {
  fs.writeFileSync(dataPath, patched(chosen));
  console.error(`\nwrote app/lib/assessment-data.ts with ${chosen.length} addition(s)`);
  if (current.misses) {
    console.error(`${current.misses} type(s) still unreachable: ${current.failing.join(" ")} --`);
    console.error("closing those needs new items, not new weights.");
  }
}
