// Can the MBTI half be rescued WITHOUT adding items?
//
// The Products Owner's question, and the honest answer needs numbers rather than an opinion. An
// axis carries two items, an end option is worth 2 and a middle rung 1, an axis is unclear below a
// margin of 2, and ONE unclear axis nulls the whole four-letter type. Two levers exist that cost
// no questions at all:
//
//   SPREAD   ends worth 3 instead of 2. Today a strong answer one way and a weak answer the other
//            lands at 2 vs 1 -- margin 1, unclear. At 3 vs 1 it is margin 2 and resolves. Two weak
//            answers pointing opposite ways stay unclear (1 vs 1), and so do two strong ones
//            (3 vs 3), which is right: those people really are balanced.
//   PER-AXIS reporting the letters that ARE clear instead of throwing away four good axes because
//            the fifth is tied. Measured here as "how many letters would a person be handed".
//
// Usage: node scripts/measure-mbti-options.mjs [consistency] [sessions]

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, "..");

const SHIPPED = `    { text: choices[0], weights: { mbti: { [left]: 3 } } },
    { text: choices[1], weights: { mbti: { [left]: 1 } } },
    { text: choices[2], weights: { mbti: { [right]: 1 } } },
    { text: choices[3], weights: { mbti: { [right]: 3 } } },`;
const OLD = `    { text: choices[0], weights: { mbti: { [left]: 2 } } },
    { text: choices[1], weights: { mbti: { [left]: 1 } } },
    { text: choices[2], weights: { mbti: { [right]: 1 } } },
    { text: choices[3], weights: { mbti: { [right]: 2 } } },`;

function build(label, narrow) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `mo-${label}-`));
  const src = path.join(dir, "src");
  fs.mkdirSync(src);
  for (const file of ["assessment-data.ts", "character-system.ts", "scoring.ts"]) {
    let text = fs.readFileSync(path.join(root, "app/lib", file), "utf8");
    if (file === "assessment-data.ts" && narrow) {
      if (!text.includes(SHIPPED)) throw new Error("mbtiQuestion no longer has the weights this script patches");
      text = text.replace(SHIPPED, OLD);
    }
    fs.writeFileSync(path.join(src, file), text);
  }
  const out = path.join(dir, "out");
  ts.createProgram(["assessment-data.ts", "character-system.ts", "scoring.ts"].map((f) => path.join(src, f)),
    { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS,
      moduleResolution: ts.ModuleResolutionKind.Node10, outDir: out, esModuleInterop: true, skipLibCheck: true }).emit();
  return { scoring: require(path.join(out, "scoring.js")), data: require(path.join(out, "assessment-data.js")) };
}

const CONSISTENCY = Number(process.argv[2] ?? 0.75);
const SESSIONS = Number(process.argv[3] ?? 2000);
const AXES = [["I", "E"], ["S", "N"], ["T", "F"], ["J", "P"], ["A", "Turbulent"]];

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

function idealOption(question, poles) {
  let best = null, bestValue = 0;
  question.options.forEach((option, index) => {
    const m = option.weights?.mbti;
    if (!m) return;
    const value = poles.reduce((sum, pole) => sum + (m[pole] ?? 0), 0);
    if (value > bestValue) { bestValue = value; best = index; }
  });
  return best;
}

function run({ scoring, data }, label) {
  const random = mulberry32(31337);
  let named = 0, correct = 0, letters = 0, lettersRight = 0;
  for (let session = 0; session < SESSIONS; session += 1) {
    const poles = AXES.map(([left, right]) => (random() < 0.5 ? left : right));
    const answers = [];
    for (let position = 0; position < data.MAX_QUESTIONS; position += 1) {
      const question = scoring.selectNextQuestion(answers);
      if (!question) break;
      const ideal = idealOption(question, poles);
      answers.push({ questionId: question.id,
        optionIndex: ideal !== null && random() < CONSISTENCY ? ideal : Math.floor(random() * question.options.length) });
    }
    const result = scoring.scoreAssessment(answers);
    const truth = `${poles.slice(0, 4).join("")}-${poles[4] === "Turbulent" ? "T" : "A"}`;
    if (result.mbti.type) { named += 1; if (result.mbti.type === truth) correct += 1; }
    // Per-axis: count the axes that cleared on their own, and how many of those are right.
    Object.entries(result.dimensions).forEach(([name, d], index) => {
      if (d.margin < 2 || d.evidence < 2) return;
      letters += 1;
      const [left, right] = AXES[["IE", "SN", "TF", "JP", "AT"].indexOf(name)];
      if ((d.left > d.right ? left : right) === poles[index]) lettersRight += 1;
    });
  }
  const pct = (n, of = SESSIONS) => `${((n / of) * 100).toFixed(1)}%`;
  console.log(`${label}`);
  console.log(`  ได้ type ครบ 4 ตัว        ${pct(named)}   ถูก ${pct(correct)}`);
  console.log(`  ตัวอักษรที่ชัดต่อคน        ${(letters / SESSIONS).toFixed(2)} จาก 5   ถูก ${pct(lettersRight, letters)} ของที่ชัด`);
  return { named, correct, letters, lettersRight };
}

console.log(`${SESSIONS} คน มี type จริง ตอบตรงตัวเอง ${Math.round(CONSISTENCY * 100)}%\n`);
const a = run(build("old", true), "แบบเดิม — ปลาย 2 แต้ม กลาง 1 แต้ม (ระยะห่างไม่เท่ากัน)");
console.log();
const b = run(build("now", false), "ที่ใช้อยู่ — ปลาย 3 แต้ม กลาง 1 แต้ม (จำนวนข้อเท่าเดิม)");
console.log(`\nต่างกัน: ได้ type ${(((b.named - a.named) / SESSIONS) * 100).toFixed(1)} จุด · ถูก ${(((b.correct - a.correct) / SESSIONS) * 100).toFixed(1)} จุด`);
