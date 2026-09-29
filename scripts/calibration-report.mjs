// The calibration report: what a batch of sessions says about the instrument.
//
// Takes session codes — real ones from a file, or simulated ones for a dress rehearsal — and
// answers the questions the January outing exists to answer. Same tool for both, so the report the
// outing produces is one that has already been run and read.
//
//   node scripts/calibration-report.mjs --simulate 10
//   node scripts/calibration-report.mjs codes.txt        (one "TYPE<tab>CODE" per line)
//
// WHAT A SIMULATED RUN CANNOT TELL YOU. The "true type" of a simulated respondent is assigned by
// this script, and their answers are generated FROM it at a consistency this script also chooses.
// So the headline match rate of a simulated batch is a restatement of that choice, not a
// measurement of the instrument. Ten simulated people are 4000 simulated people with more noise.
//
// What it CAN do, and why it is worth running before the outing:
//   1. exercise the whole path — answers -> code -> replay -> report — so the outing does not
//      discover a broken pipeline on the day;
//   2. fix the report's shape while there is time to argue with it;
//   3. VALIDATE THE CONSISTENCY ESTIMATOR. The one number real sessions are needed for is how
//      often a person picks the option that matches the type they know themselves to be. On
//      simulated data that number is known, so the estimator can be checked against it here and
//      trusted there.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, "..");
const out = fs.mkdtempSync(path.join(os.tmpdir(), "calib-"));
ts.createProgram(
  ["assessment-data.ts", "character-system.ts", "scoring.ts", "session-export.ts"].map((f) => path.join(root, "app/lib", f)),
  { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS,
    moduleResolution: ts.ModuleResolutionKind.Node10, outDir: out, esModuleInterop: true, skipLibCheck: true },
).emit();
const scoring = require(path.join(out, "scoring.js"));
const data = require(path.join(out, "assessment-data.js"));
const exporter = require(path.join(out, "session-export.js"));

const AXES = [["I", "E"], ["S", "N"], ["T", "F"], ["J", "P"], ["A", "Turbulent"]];
const byId = Object.fromEntries(
  [...data.FOUNDATION_QUESTIONS, ...data.DIMENSION_CHALLENGES, ...data.CORE_CHALLENGES, ...data.WING_CHALLENGES]
    .map((q) => [q.id, q]),
);

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

const wingsOf = (core) => [core === 1 ? 9 : core - 1, core === 9 ? 1 : core + 1];

/** The option a person of this core, wing and MBTI poles would pick: their own marks, weighted. */
function idealOption(question, { core, wing, poles }) {
  let best = null, bestValue = 0;
  question.options.forEach((option, index) => {
    const e = option.weights.enneagram, m = option.weights.mbti;
    const value = e
      ? (e[core] ?? 0) * 2 + (e[wing] ?? 0)
      : poles.reduce((sum, pole) => sum + (m?.[pole] ?? 0), 0);
    if (value > bestValue) { bestValue = value; best = index; }
  });
  return best;
}

/**
 * How often this person picked the option that matches the type they say they are.
 *
 * Counted only over items where an option for their type EXISTS -- an item that offers them nothing
 * says nothing about their consistency, only about the item. This is the estimator the outing needs
 * and the reason a dress rehearsal is worth running: here the true value is known, so the estimate
 * can be checked against it.
 */
//
// CORRECTED FOR CHANCE, and the dress rehearsal is what caught that it had to be. The first version
// returned matched/offered, and on simulated data it read 73% for a respondent planted at 55% and
// 77% for one planted at 58%. A respondent who is not answering from their type still lands on
// their own option by luck -- one time in four on a four-option item, one in nine on f-e-3 -- and
// the raw rate counts those as consistency. Used on the outing it would have reported the team as
// markedly more consistent than it is, and every projection downstream would have inherited that.
//
// If a person answers from their type with probability c and otherwise picks uniformly among k
// options, they hit their own option with probability c + (1 - c)/k. Summed across items with
// different k, the method-of-moments estimate is
//     c = Σ(hit_i − 1/k_i) / Σ(1 − 1/k_i)
// which removes the luck, clipped to [0, 1] because a small sample can land outside it.
function estimateConsistency(answers, truth) {
  let offered = 0, matched = 0, excess = 0, room = 0;
  for (const answer of answers) {
    const question = byId[answer.questionId];
    if (!question) continue;
    const ideal = idealOption(question, truth);
    if (ideal === null) continue;
    const chance = 1 / question.options.length;
    const hit = answer.optionIndex === ideal ? 1 : 0;
    offered += 1;
    matched += hit;
    excess += hit - chance;
    room += 1 - chance;
  }
  const rate = room > 0 ? Math.min(1, Math.max(0, excess / room)) : null;
  return { offered, matched, raw: offered ? matched / offered : null, rate };
}

function replay(digits) {
  const answers = [];
  for (const optionIndex of digits) {
    const question = scoring.selectNextQuestion(answers);
    if (!question) break;
    answers.push({ questionId: question.id, optionIndex });
  }
  return answers;
}

// ---------------------------------------------------------------- build the batch

const arg = process.argv[2];
let batch = [];

if (arg === "--simulate") {
  const count = Number(process.argv[3] ?? 10);
  const random = mulberry32(Number(process.argv[4] ?? 20260929));
  // A spread of types, and a spread of how consistently people answer -- some people know
  // themselves well and answer cleanly, some do not. Both are assigned here, which is exactly why
  // the match rate below is not evidence about the instrument.
  for (let person = 0; person < count; person += 1) {
    const core = (person % 9) + 1;
    const wing = wingsOf(core)[random() < 0.5 ? 0 : 1];
    const poles = AXES.map(([left, right]) => (random() < 0.5 ? left : right));
    const consistency = 0.55 + random() * 0.4;
    const truth = { core, wing, poles };
    const answers = [];
    for (let slot = 0; slot < data.MAX_QUESTIONS; slot += 1) {
      const question = scoring.selectNextQuestion(answers);
      if (!question) break;
      const ideal = idealOption(question, truth);
      answers.push({ questionId: question.id,
        optionIndex: ideal !== null && random() < consistency ? ideal : Math.floor(random() * question.options.length) });
    }
    const result = scoring.scoreAssessment(answers);
    batch.push({
      label: `จำลอง ${String(person + 1).padStart(2, "0")}`,
      known: `${core}w${wing} · ${poles.slice(0, 4).join("")}-${poles[4] === "Turbulent" ? "T" : "A"}`,
      truth, answers, result, durations: [],
      plantedConsistency: consistency,
      code: exporter.encodeSessionCode(answers, result),
    });
  }
} else if (arg) {
  for (const line of fs.readFileSync(arg, "utf8").split("\n")) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const [known, code] = line.split("\t").map((s) => s.trim());
    const field = Object.fromEntries(code.split("|").slice(1)
      .map((s) => [s.slice(0, s.indexOf("=")), s.slice(s.indexOf("=") + 1)]));
    if (field.b !== data.ITEM_BANK_VERSION) {
      console.error(`!! ${known}: คลังข้อ ${field.b} ไม่ตรงกับตอนนี้ (${data.ITEM_BANK_VERSION}) — เทียบกันไม่ได้`);
    }
    const digits = field.a.replace(/[^0-9]/g, "").split("").map(Number);
    const answers = replay(digits);
    const core = Number(known.match(/^(\d)/)?.[1]);
    const wing = Number(known.match(/w(\d)/)?.[1]);
    const letters = (known.match(/([IE][SN][TF][JP])-([AT])/) ?? [])[0];
    batch.push({
      label: known, known, answers, result: scoring.scoreAssessment(answers),
      durations: (field.d ?? "").replace(/[^0-9,]/g, "").split(",").filter(Boolean).map(Number),
      truth: core ? { core, wing: wing || wingsOf(core)[0],
        poles: letters ? [...letters.slice(0, 4)].map((l, i) => (l === "T" && i === 3 ? "Turbulent" : l))
          .concat(letters.endsWith("T") ? ["Turbulent"] : ["A"]) : [] } : null,
      code,
    });
  }
} else {
  console.error("usage: calibration-report.mjs --simulate 10   |   calibration-report.mjs codes.txt");
  process.exit(1);
}

// ---------------------------------------------------------------- the report

const simulated = arg === "--simulate";
const pct = (n, d) => (d ? `${((n / d) * 100).toFixed(0)}%` : "—");
console.log(`\n${"═".repeat(78)}`);
console.log(`รายงานผลการสอบเทียบ · ${batch.length} คน · คลังข้อ ${data.ITEM_BANK_VERSION}`);
if (simulated) console.log(`*** ข้อมูลจำลอง — type จริงของแต่ละคนถูกกำหนดโดยสคริปต์นี้เอง ***`);
console.log("═".repeat(78));

console.log(`\n1 · ตรงกับที่เจ้าตัวรู้ไหม\n`);
console.log(`คน          รู้ตัวว่า            ระบบตอบ              ลักษณ์  ปีก  MBTI`);
console.log(`${"─".repeat(78)}`);
let coreOk = 0, coreTotal = 0, wingOk = 0, wingTotal = 0, mbtiOk = 0, mbtiTotal = 0;
for (const row of batch) {
  const r = row.result;
  const got = `${r.enneagram.core ?? "—"}${r.wingStatus === "valid" ? `w${r.wing}` : ""} · ${r.mbti.type ?? "—"}`;
  const t = row.truth;
  let c = "  ", w = "  ", m = "   ";
  if (t?.core) { coreTotal += 1; if (r.enneagram.core === t.core) { coreOk += 1; c = "✓ "; } else c = "✗ "; }
  if (t?.wing) { wingTotal += 1; if (r.wingStatus === "valid" && r.wing === t.wing) { wingOk += 1; w = "✓ "; } else w = "✗ "; }
  if (t?.poles?.length === 5) {
    mbtiTotal += 1;
    const truthType = `${t.poles.slice(0, 4).join("")}-${t.poles[4] === "Turbulent" ? "T" : "A"}`;
    if (r.mbti.type === truthType) { mbtiOk += 1; m = "✓  "; } else m = "✗  ";
  }
  console.log(`${row.label.padEnd(11)} ${String(row.known).padEnd(19)} ${got.padEnd(20)} ${c}     ${w}   ${m}`);
}
console.log(`${"─".repeat(78)}`);
console.log(`ตรง: ลักษณ์ ${pct(coreOk, coreTotal)} (${coreOk}/${coreTotal}) · ปีก ${pct(wingOk, wingTotal)} · MBTI ${pct(mbtiOk, mbtiTotal)}`);

console.log(`\n2 · ความสม่ำเสมอ — คนตอบตรงกับ type ที่ตัวเองรู้กี่ %\n`);
console.log(`   นี่คือเลขที่ต้องการจากคนจริง ทุกตัวเลขคาดการณ์แขวนอยู่กับมัน`);
if (simulated) console.log(`   (คอลัมน์ "ที่ฝังไว้" คือค่าจริงที่สคริปต์กำหนด — มีให้ดูเฉพาะข้อมูลจำลอง เพื่อตรวจว่าตัวประมาณแม่นไหม)\n`);
let errSum = 0, errN = 0, estSum = 0, rawSum = 0, plantSum = 0, teamN = 0;
for (const row of batch) {
  if (!row.truth?.core) continue;
  const est = estimateConsistency(row.answers, row.truth);
  const planted = row.plantedConsistency;
  estSum += est.rate; rawSum += est.raw; teamN += 1;
  if (planted !== undefined) { errSum += Math.abs(est.rate - planted); errN += 1; plantSum += planted; }
  console.log(`${row.label.padEnd(11)} ประมาณได้ ${(est.rate * 100).toFixed(0).padStart(3)}%  (ตรงดิบ ${est.matched}/${est.offered} หักโอกาสเดาโดนแล้ว)`
    + (planted !== undefined ? `   ที่ฝังไว้ ${(planted * 100).toFixed(0)}%` : ""));
}
// One person answers ~22 relevant items, so one person's estimate is noisy. The outing is not
// asking about one person -- it is asking what the TEAM does, and averaging over people cancels
// the noise that no single session can. That average is the number the report exists to produce.
if (teamN) {
  console.log(`\n   ▶ ค่าเฉลี่ยทั้งทีม: ${((estSum / teamN) * 100).toFixed(1)}%`
    + (errN ? `   ค่าจริง ${((plantSum / errN) * 100).toFixed(1)}%   ห่างกัน ${Math.abs((estSum - plantSum) / teamN * 100).toFixed(1)} จุด` : ""));
  if (errN) console.log(`     (ถ้าไม่หักโอกาสเดาโดน จะได้ ${((rawSum / teamN) * 100).toFixed(1)}% — เอียงสูงไป ${((rawSum - plantSum) / teamN * 100).toFixed(1)} จุด)`);
}
if (errN) console.log(`\n   รายคนคลาดเฉลี่ย ${((errSum / errN) * 100).toFixed(1)} จุด — เพราะคนหนึ่งตอบแค่ราว 22 ข้อ ค่ารายคนจึงแกว่ง แต่ค่าเฉลี่ยทีมหักล้างกันได้`);

console.log(`\n3 · ตัวเลือกที่ไม่มีใครเลือกเลย\n`);
const picked = new Map();
for (const row of batch) for (const a of row.answers) picked.set(`${a.questionId}#${a.optionIndex}`, true);
const asked = new Set(batch.flatMap((r) => r.answers.map((a) => a.questionId)));
const dead = [];
for (const id of asked) {
  byId[id].options.forEach((option, index) => {
    if (!picked.has(`${id}#${index}`)) dead.push(`${id} · ${option.text}`);
  });
}
console.log(dead.length === 0 ? "   ไม่มี — ทุกตัวเลือกในข้อที่ถูกถามมีคนเลือกอย่างน้อยหนึ่งคน"
  : dead.map((d) => `   ${d}`).join("\n"));
// Ten people cannot kill an option. A 4-option item asked of ten people leaves an option unpicked
// by plain luck far more often than a reader would guess, so an unpicked option here is a
// candidate to watch, not a verdict -- the list becomes evidence somewhere past thirty respondents.
if (batch.length < 30 && dead.length > 0) {
  console.log(`   ⚠ ${batch.length} คนน้อยเกินกว่าจะสรุปว่าตัวเลือกไหน "ตาย" — ส่วนใหญ่คือโชค เป็นรายการเฝ้าดู ไม่ใช่คำตัดสิน ต้องการ 30 คนขึ้นไป`);
}
console.log(`   (${asked.size} ข้อถูกถามจริงจาก ${Object.keys(byId).length} ข้อในคลัง)`);

const withTime = batch.filter((r) => r.durations.length > 0);
console.log(`\n4 · เวลาต่อข้อ\n`);
if (withTime.length === 0) {
  console.log(`   ไม่มีข้อมูล — ข้อมูลจำลองไม่มีเวลาจริง และจะไม่แต่งขึ้นมา`);
  console.log(`   ของจริงจะบอกได้ว่าข้อไหนคนอ่านนานผิดปกติ ซึ่งคือข้อที่ต้องเขียนใหม่`);
} else {
  const perItem = new Map();
  for (const row of withTime) row.answers.forEach((a, i) => {
    if (row.durations[i] === undefined) return;
    perItem.set(a.questionId, [...(perItem.get(a.questionId) ?? []), row.durations[i]]);
  });
  const rows = [...perItem.entries()]
    .map(([id, xs]) => ({ id, avg: xs.reduce((a, b) => a + b, 0) / xs.length, n: xs.length }))
    .sort((a, b) => b.avg - a.avg).slice(0, 8);
  for (const r of rows) console.log(`   ${r.id.padEnd(12)} เฉลี่ย ${r.avg.toFixed(0).padStart(3)} วิ  (${r.n} คน)`);
}

console.log(`\n${"═".repeat(78)}`);
if (simulated) {
  console.log(`อ่านรายงานนี้ยังไง: ส่วนที่ 1 บอกอะไรไม่ได้ เพราะ type จริงถูกกำหนดโดยสคริปต์`);
  console.log(`ส่วนที่ 2 คือของจริง — มันพิสูจน์ว่าตัวประมาณความสม่ำเสมอใช้ได้ ก่อนเอาไปใช้กับคนจริง`);
  console.log(`ส่วนที่ 3 กับ 4 จะมีความหมายเต็มตอนมีข้อมูลจริง`);
}
console.log("═".repeat(78));
