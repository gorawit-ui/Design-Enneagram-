// Answer our own item set as a stated type, and see what the scorer returns.
//
// Every fixture in app/lib/assessment-fixtures.ts was searched for: an answer vector
// reverse-engineered by scripts/find-fixtures.mjs until it produced a target result. Those prove
// the scorer is self-consistent. They cannot prove it is right about a person, because no person
// is in them.
//
// This runs the other direction. The answers below are chosen by reading each item as the stated
// type would read it -- so they are an argument, not a measurement, and the picks are printed with
// their reasoning so the argument can be disagreed with. What makes it worth running anyway is
// that a bank which cannot produce the right answer even when someone is TRYING to answer as that
// type has a hole, and the hole is in the items.
//
// Usage: node scripts/probe-ground-truth.mjs

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, "..");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "probe-"));
ts.createProgram(
  ["assessment-data.ts", "character-system.ts", "scoring.ts", "result-insights.ts"]
    .map((f) => path.join(root, "app/lib", f)),
  { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS,
    moduleResolution: ts.ModuleResolutionKind.Node10, outDir: tmp, esModuleInterop: true, skipLibCheck: true },
).emit();
const scoring = require(path.join(tmp, "scoring.js"));

// Two profiles, and the second one is the point.
//
// 5w4 is the Products Owner's own type, established outside this project. Answering as that type
// works -- but three of the ten Enneagram answers are forced donations (core 5 has no option on
// f-e-1, f-e-3, f-e-6 and f-e-10), and two of those donations land on core 4, which for a 5w4 is
// the wing. So they push the score somewhere that happens to be right for THIS person.
//
// 5w6 tests whether that was luck. Same core, same "5 is present" answers, and the four donations
// sent where a 5w6 would send them instead. If core 5 survives both, the donations are harmless.
// If it survives only the 5w4 pass, the block is measuring the wing and calling it the core.
const PROFILES = {
  "5w4": {
    label: "INTJ-A · core 5 · wing 4",
    expect: { mbti: "INTJ-A", core: 5, wing: 4 },
    choices: {
      "f-e-1": ["เข้าใจสิ่งที่ทำอยู่ลึกขึ้น", "no option for 5 -- nearest is 4's self-expression"],
      "f-e-2": ["เข้าใจภาพรวมของสถานการณ์", "5 present: understanding as the ground to stand on"],
      "f-e-3": ["ไม่ได้แสดงความเป็นตัวเอง", "no option for 5 -- donated to 4, which here is the wing"],
      "f-e-4": ["ข้อมูลและเวลาคิด", "5 present, and the cleanest 5 item in the block"],
      "f-e-5": ["ถอยมารวบรวมข้อมูล", "5 present"],
      "f-e-6": ["ยอมรับความรู้สึกของตัวเอง", "NO OPTION FOR 5 -- choices are 4/6/7/9; a 5w4 lands on 4"],
      "f-e-7": ["มองเห็นสิ่งที่คนอื่นมองข้าม", "5 present"],
      "f-e-8": ["เวลาอยู่กับความคิดของตัวเอง", "5 present"],
      "f-e-9": ["จบเมื่อเข้าใจเหตุผลของทุกฝ่ายแล้ว", "5 present"],
      "f-e-10": ["จังหวะการทำงานที่ไม่ถูกเร่ง", "no option for 5 -- donated to 9"],
    },
    wingWeight: 4,
  },
  "5w6": {
    label: "INTJ-A · core 5 · wing 6",
    expect: { mbti: "INTJ-A", core: 5, wing: 6 },
    choices: {
      "f-e-1": [null, "no option for 5 -- a 5w6 sends it to 6, not 4"],
      "f-e-2": ["เข้าใจภาพรวมของสถานการณ์", "5 present"],
      "f-e-3": [null, "no option for 5 -- a 5w6 sends it to 1 or 6, not 4"],
      "f-e-4": ["ข้อมูลและเวลาคิด", "5 present"],
      "f-e-5": ["ถอยมารวบรวมข้อมูล", "5 present"],
      "f-e-6": ["เตรียมรับความเสี่ยง", "NO OPTION FOR 5 -- a 5w6 lands on 6"],
      "f-e-7": ["มองเห็นสิ่งที่คนอื่นมองข้าม", "5 present"],
      "f-e-8": ["เวลาอยู่กับความคิดของตัวเอง", "5 present"],
      "f-e-9": ["จบเมื่อเข้าใจเหตุผลของทุกฝ่ายแล้ว", "5 present"],
      "f-e-10": [null, "no option for 5 -- a 5w6 sends it to 9 or 3"],
    },
    wingWeight: 6,
  },
};
const profileName = (process.argv.find((a) => a.startsWith("--type=")) ?? "--type=5w4").split("=")[1];
const profile = PROFILES[profileName];
if (!profile) throw new Error(`unknown --type=${profileName}; try ${Object.keys(PROFILES).join(" or ")}`);
const CHOICES = profile.choices;

// The MBTI side, answered as INTJ-A.
const MBTI_PREFERENCE = { I: 1, N: 1, T: 1, J: 1, A: 1, E: 0, S: 0, F: 0, Turbulent: 0 };

const answers = [];
const log = [];
for (let position = 0; position < 24; position += 1) {
  const question = scoring.selectNextQuestion(answers);
  if (!question) break;
  let index = -1;
  let why = "";
  const wanted = CHOICES[question.id];
  if (wanted) {
    if (wanted[0] !== null) index = question.options.findIndex((o) => o.text === wanted[0]);
    why = wanted[1];
  }
  if (index < 0) {
    // Score every option by how much it agrees with 5w4 on the Enneagram side and INTJ-A on the
    // MBTI side, and take the best. Deterministic, and it never invents a preference.
    let best = -Infinity;
    question.options.forEach((option, i) => {
      const e = option.weights?.enneagram ?? {};
      const m = option.weights?.mbti ?? {};
      let score = (e[5] ?? 0) * 3 + (e[profile.wingWeight] ?? 0) * 1.5;
      for (const [pole, w] of Object.entries(m)) score += (MBTI_PREFERENCE[pole] ?? 0) * w * 2 - (1 - (MBTI_PREFERENCE[pole] ?? 0)) * w;
      if (score > best) { best = score; index = i; }
    });
    why = why || `derived: best fit for ${profileName} / INTJ-A among the four`;
  }
  answers.push({ questionId: question.id, optionIndex: index });
  log.push({ position: position + 1, id: question.id, text: question.options[index].text, why });
}

for (const row of log) {
  console.log(`${String(row.position).padStart(2)}. ${row.id.padEnd(10)} "${row.text}"`);
  if (row.why) console.log(`    ${row.why}`);
}

const result = scoring.scoreAssessment(answers);
const top = result.scores.enneagram;
console.log(`\n${"=".repeat(80)}`);
console.log(`expected   ${profile.label}`);
console.log(`got        ${result.mbti.type ?? "null"} (${result.mbti.confidence})`
  + `  ·  core ${result.enneagram.core ?? "null"} (${result.enneagram.confidence})`
  + `  ·  wing ${result.wing ?? "null"} (${result.wingStatus})`);
if (top) {
  const ranked = Object.entries(top).map(([c, v]) => ({ c: +c, v })).sort((a, b) => b.v - a.v);
  console.log(`\nEnneagram scores: ${ranked.map((r) => `${r.c}:${r.v}`).join("  ")}`);
  console.log(`margin between first and second: ${ranked[0].v - ranked[1].v}`);
}
const ok = result.mbti.type === profile.expect.mbti && result.enneagram.core === profile.expect.core && result.wing === profile.expect.wing;
console.log(`\n${ok ? "MATCH" : "MISMATCH"} -- ${ok ? "the bank can express this type" : "see which axis missed, and read it as a finding about the items"}`);
fs.rmSync(tmp, { recursive: true, force: true });
