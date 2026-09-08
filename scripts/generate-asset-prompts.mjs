// Emit ready-to-paste production prompts for the Module 2 base assets.
//
// One source of truth, one command: the locked block lives here once and is composed into every
// per-core file, so it cannot drift the way nine hand-copied blocks would.
//
// Core-specific English copy (action, expression, prohibited reading) is authored here because the
// repo stores those fields in Thai and in the M2.6.2 behaviour matrix. `poseDirection` and the core
// set ARE read from app/lib/character-system.ts, and the script fails loudly if the two disagree —
// so a core added, removed or re-posed in code cannot silently leave these prompts stale.
//
// Canvas note: the base-asset spec asks for a master of 2048x2048 or larger with a 1024x1024
// runtime export. Hosted image generation returns fixed native sizes (1024x1024, 1024x1536,
// 1536x1024), so requesting 2048 yields a silently downsized image or a lossy upscale. These
// prompts therefore ask for 1024x1024 — the model's native square, and exactly the runtime target.
// The "master >= 2048" requirement is a real, open deviation: it needs either a spec relaxation or
// a different production tool. Recorded in docs/BASE_ASSET_PRODUCTION_PROMPTS.md rather than hidden.
//
// Background: these prompts ask for NO background motif. Verified against the twelve assets that
// actually passed Asset Gate E — every one is the character alone on a transparent canvas — and
// against the gate's own criterion, "no text, logo, participant data, or embedded Scene Kit
// appears". app/result-view.tsx already renders the scene motif as a CSS layer behind the image, so
// a motif baked into the PNG is duplicated, un-editable, and breaks derivative parity by forcing
// the model to redraw the motif as well as the figure.
//
// Usage: npm run assets:prompts   ->   outputs/asset-prompts/

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);
const projectRoot = path.resolve(import.meta.dirname, "..");
const OUT = path.join(projectRoot, "outputs/asset-prompts");

// The PROPORTIONS block below is stated as numbers because "keep the body identical" has been
// asked in prose and come back wrong: one attempt returned shoulders half as wide and a head a
// fifth larger, which is what fails the parity review. The figures come from the approved master,
// via `npm run assets:proportions`, and check-asset verifies them on what comes back. They are not
// explained inside the prompt itself -- a prompt that explains its own reasoning has already been
// misread once here, when a line about how the app renders the background was followed as though
// it were an instruction.
const LOCKED = `Polished, warm, semi-realistic 3D character illustration of a single adult, full body,
standing, centred on a fully transparent background.

BUILD: one balanced adult proportion guide, identical across every character in this family.
Body shape carries no personality, competence, gender or status meaning.

PROPORTIONS — identical in all three presentations of every core:
  - the head is 14% as wide as the figure is tall
  - the shoulders are 25% as wide as the figure is tall, i.e. 1.76 times the head's width
  - the shoulder line sits 25% of the way down from the top of the head
An adult build in every presentation, never adolescent. No presentation gets narrower shoulders,
a slimmer neck or a larger head than the others. All three are one person drawn three times,
differing in face and hair and in nothing else.

WARDROBE (identical for every core and every presentation): forest-green blazer, ivory knit top,
straight charcoal trousers, flat-soled black ankle boots. No heels on any presentation — footwear
is identical across female, male and neutral.

PALETTE: matcha green, forest green, ivory. Core-specific accents appear only in the prop.
Never use colour alone to signal anything.

FINISH: equal lighting, detail density and apparent production value across all cores and
presentations. Soft, even, warm key light. No dramatic rim light, no lens effects.

CANVAS: square, 1024 x 1024 px. PNG with true transparent RGBA.
Leave at least 8% empty transparent margin on all four sides.
Keep the face, prop and identifying silhouette inside the central 76% of the canvas.
Face, both hands, both feet and the prop are all fully visible and unclipped.

PROPS: held in the hands, worn, or resting on a surface the character is touching. Never floating
detached in mid-air, and never presented as an award, medal, trophy, rosette or rank badge.

BACKGROUND: the canvas contains the character and the prop, and nothing else. Every pixel that is
not part of the character or the prop is fully transparent — a cut-out figure on empty space.
Do not add scenery, patterns, lattices, shapes, lines, gradients, a ground plane or a cast shadow.
Genuine alpha transparency, not a white plate and not a checkerboard drawn as pixels.

NEVER INCLUDE: text, numbers, letters, logos, watermarks, participant data, charts, money, luxury or
status objects, badges of rank, job titles, distress, pathology, medical or diagnostic cues,
dominance posturing, flirtation, or any body-shape encoding of personality or gender.`;

// core -> authored English copy. `pose` is cross-checked against character-system.ts below.
const CORES = {
  1: { title: "Standards Keeper", pose: "forward",
       action: "stands steady and checks one item in an open notebook",
       prop: "a standards notebook and a small quality seal",
       expression: "calm, attentive, unhurried",
       never: "a rigid enforcer, scolding, morally superior, or joyless" },
  2: { title: "Relationship Guide", pose: "right",
       action: "opens a network map toward the viewer's side with a welcoming hand",
       prop: "a network map and a small welcome set",
       expression: "warm, friendly, contained",
       never: "self-sacrificing, ingratiating, intrusive, or emotionally needy" },
  3: { title: "Goal Driver", pose: "right",
       action: "indicates one milestone on a goal board",
       prop: "a goal board and a milestone medallion",
       expression: "focused, positive, composed",
       never: "status-seeking, boastful, salesy, or image-obsessed" },
  4: { title: "Identity Storyteller", pose: "left",
       action: "holds an open story notebook beside layered colour swatches",
       prop: "a story notebook and mood colour swatches",
       expression: "thoughtful, sincere, settled",
       never: "melancholic, a tortured artist, fragile, or self-absorbed" },
  5: { title: "Systems Cartographer", pose: "left",
       action: "arranges a systems map and data tiles, one contingency pin set aside",
       prop: "a systems map and data tiles",
       expression: "absorbed, calm, quietly capable",
       never: "aloof, socially detached, secretive, or a lone genius" },
  6: { title: "Risk Scout", pose: "forward",
       action: "holds a compass level while a contingency satchel rests ready",
       prop: "a risk compass and a contingency satchel",
       expression: "prepared, steady, alert but calm",
       never: "anxious, paranoid, fearful, or distrustful" },
  7: { title: "Possibility Explorer", pose: "right",
       action: "raises a spotting scope toward an open route among idea cards",
       prop: "a spotting scope and idea cards",
       expression: "bright, curious, contained",
       never: "scattered, manic, childish, or thrill-seeking" },
  8: { title: "Boundary Guardian", pose: "forward",
       action: "holds a boundary shield steady, decision baton lowered and relaxed",
       prop: "a boundary shield and a decision baton",
       expression: "warm but firm, grounded",
       never: "aggressive, intimidating, domineering, or confrontational" },
  9: { title: "Path Harmoniser", pose: "left",
       action: "gathers several path strands into one ring with both hands",
       prop: "a path ring and a joining cord",
       expression: "settled, unhurried, present",
       never: "passive, sleepy, checked-out, or conflict-avoidant" },
};

// --- cross-check against the app's own core definitions -----------------------------------------
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tdfb-prompts-"));
try {
  const program = ts.createProgram([path.join(projectRoot, "app/lib/character-system.ts")], {
    target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS,
    moduleResolution: ts.ModuleResolutionKind.Node10, outDir: tmp,
    esModuleInterop: true, skipLibCheck: true, strict: true, noEmitOnError: true,
  });
  if (ts.getPreEmitDiagnostics(program).length || program.emit().emitSkipped) {
    throw new Error("could not compile character-system.ts");
  }
  const { ENNEAGRAM_PROFILES } = require(path.join(tmp, "character-system.js"));
  const inCode = Object.keys(ENNEAGRAM_PROFILES).map(Number).sort((a, b) => a - b);
  const inPrompts = Object.keys(CORES).map(Number).sort((a, b) => a - b);
  if (inCode.join() !== inPrompts.join()) {
    throw new Error(`core set drift: character-system has [${inCode}], prompts cover [${inPrompts}]`);
  }
  for (const core of inCode) {
    const codePose = ENNEAGRAM_PROFILES[core].poseDirection;
    if (codePose !== CORES[core].pose) {
      throw new Error(`core ${core}: poseDirection is "${codePose}" in character-system.ts `
        + `but "${CORES[core].pose}" in these prompts — reconcile before generating art`);
    }
  }
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

// --- emit ----------------------------------------------------------------------------------------
// Every file is complete and self-contained: the Thai instruction line, the locked block and the
// core specifics are already assembled. Nothing is left to paste together by hand, and there are no
// {placeholders} to fill in — both are ways a prompt gets sent subtly wrong.

const ASK_NEW = `สร้างภาพ 1 ภาพ ตาม spec ด้านล่างนี้
- ขนาด square 1024x1024
- PNG พื้นหลังโปร่งใสจริง (transparent alpha) ไม่ใช่พื้นขาว และไม่ใช่ลายหมากรุกที่วาดเป็น pixel
- ส่งไฟล์ให้ดาวน์โหลดได้ที่ความละเอียดเต็ม
- ทำทีละภาพ อย่าสร้างหลายเวอร์ชันให้เลือก
- ห้ามเพิ่ม lighting drama, ห้ามเพิ่มรายละเอียดให้ "ดูดีขึ้น" และห้ามเปลี่ยนท่าให้ "ดูมั่นใจขึ้น"

---`;

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const written = [];
const write = (name, body) => {
  fs.writeFileSync(path.join(OUT, name), `${body.trim()}\n`);
  written.push(name);
};

// One self-contained prompt per presentation rather than a master plus two derivatives. Asked to
// edit only the head of an attached master, the generator redraws the whole figure anyway, and the
// last attempt was rejected for exactly that. Three independent generations against one numeric
// body spec is what remains, so the spec above carries the numbers the parity review turns on.
const PRESENTATIONS = [
  ["1-female", `female presentation, conveyed only through face and hair. Hair may be worn up or
long. An adult woman.`],
  ["2-male", `male presentation, conveyed only through face and hair. Short hair that does not
cover the ears and does not fall past the collar. An adult man with an adult jaw, never a teenager.
Shoulders, neck and head are the widths given under PROPORTIONS — the same as the other two
presentations, not narrower.`],
  ["3-neutral", `gender-neutral presentation, conveyed only through face and hair. Neither markedly
feminine nor markedly masculine, and not a compromise that reads as either. An adult.`],
];

for (const [core, c] of Object.entries(CORES)) {
  for (const [slug, presentation] of PRESENTATIONS) {
    write(`core-${core}-${slug}.txt`, `${ASK_NEW}

${LOCKED}

CORE: ${core} — ${c.title}
POSE ORIENTATION: ${c.pose}
ACTION: ${c.action}
PROP: ${c.prop}
EXPRESSION: ${c.expression}
PRESENTATION: ${presentation.replace(/\n/g, " ")}
PROHIBITED READING FOR THIS CORE: never read as ${c.never}.`);
  }
}

write("fix-background-not-transparent.txt", `แนบภาพที่ได้มาพร้อมข้อความนี้

พื้นหลังยังไม่โปร่งใสจริง ช่วยแก้ตามนี้

---

Remove only the baked checkerboard or background pixels from the attached image.
Produce genuine alpha transparency. Preserve fine edges, hair strands and prop edges exactly.
No halo, no fringe, no colour bleed at the silhouette.
Do not alter the character, prop, motif, lighting, or framing in any way.
Keep the canvas square 1024 x 1024.`);

write("fix-parity-failed.txt", `วางข้อความนี้ต่อท้ายใน chat เดิม พร้อมแนบภาพที่ตก

ภาพนี้ไม่ผ่าน parity — สัดส่วนตัวไม่ตรงกับอีก 2 presentation ของ core เดียวกัน
ตัวเลขที่วัดได้จากภาพนี้:
[วางบรรทัดที่ npm run assets:check บอก เช่น "shoulders is 50% narrower than the master"]

สร้างใหม่ 1 ภาพ ใช้ spec เดิมทั้งหมด แก้เฉพาะสัดส่วนให้ตรงตาม PROPORTIONS:
- หัวกว้าง 14% ของความสูงตัวละคร
- ไหล่กว้าง 25% ของความสูงตัวละคร = 1.76 เท่าของความกว้างหัว
- แนวไหล่อยู่ที่ 25% วัดจากยอดหัวลงมา
เป็นผู้ใหญ่ ไม่ใช่วัยรุ่น · ท่า เสื้อผ้า prop แสง เหมือนเดิมทุกอย่าง
ขนาด square 1024x1024 PNG พื้นหลังโปร่งใสจริง`);

write("step-10-fallback-exploration.txt", `${ASK_NEW}

${LOCKED}

CORE: none — this is the neutral exploration fallback.
POSE ORIENTATION: forward
ACTION: stands calmly with an open, unmarked map held loosely in both hands, as if still choosing
  a direction.
PROP: one blank, unmarked open map. No core prop: no seal, no shield, no scope, no ring, no board.
EXPRESSION: open, unhurried, neither confident nor uncertain.
PRESENTATION: gender-neutral, conveyed only through face and hair.
PROHIBITED READING: never suggest a conclusion, a diagnosis, a rank, or that any particular core
  has been identified. It must not resemble any of the nine core characters.`);

write("README.txt", `outputs/asset-prompts — generated by \`npm run assets:prompts\`. Do not hand-edit.

ทุกไฟล์ copy ทั้งไฟล์แล้ววางได้เลย ไม่ต้องแนบรูป ไม่ต้องประกอบเอง ไม่มีช่องให้เติม

27 ไฟล์หลัก = 9 core x 3 presentation ทำเรียงทีละใบ ทำให้ครบ 3 ใบก่อนขึ้น core ถัดไป

  core-N-1-female.txt
  core-N-2-male.txt
  core-N-3-neutral.txt

ทั้งสามใบเป็น prompt เต็มที่ยืนได้ด้วยตัวเอง และถือตัวเลขสัดส่วนชุดเดียวกัน
(เดิมใช้วิธีแนบ master แล้วสั่งแก้เฉพาะหัว — วิธีนั้นถูกตีตกแล้ว เพราะ generator
วาดใหม่ทั้งตัวทุกครั้ง ทำให้ไหล่แคบกว่าเดิมครึ่งหนึ่ง)

  ถ้าพื้นหลังไม่โปร่งใส : fix-background-not-transparent.txt
  ถ้าสัดส่วนไม่ตรงกัน   : fix-parity-failed.txt

ครบ 9 cores แล้วค่อยทำ step-10-fallback-exploration.txt

ได้ไฟล์มาแล้วส่งในแชท Claude Code ครั้งเดียว ไม่ต้องแก้ขอบหรือย่อไฟล์เอง — ทำต่อด้วย:
  npm run assets:normalize -- <ไฟล์> --out public/character-assets/enneagram-N/female.webp
  npm run assets:normalize -- <ไฟล์> --match <female master> --out .../male.webp
  npm run assets:check -- <female> <male>      ตรวจสัดส่วน 40 จุด
  npm run assets:manifest && npm run gate:m2`);

console.log(`Wrote ${written.length} files to outputs/asset-prompts/`);
console.log("  27 core prompts (9 cores x female/male/neutral) + 2 fix templates + fallback + README");
console.log("  every file is self-contained: instruction + spec assembled, no placeholders");
console.log("  pose directions cross-checked against app/lib/character-system.ts");
