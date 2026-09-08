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

const LOCKED = `Polished, warm, semi-realistic 3D character illustration of a single adult, full body,
standing, centred on a fully transparent background.

BUILD: one balanced adult proportion guide, identical across every character in this family.
Body shape carries no personality, competence, gender or status meaning.

WARDROBE (identical for every core and every presentation): forest-green blazer, ivory knit top,
straight charcoal trousers, flat-soled black ankle boots. No heels on any presentation — footwear
is identical across female, male and neutral.

PALETTE: matcha green, forest green, ivory. Core-specific accents appear only in the prop and the
background motif. Never use colour alone to signal anything.

FINISH: equal lighting, detail density and apparent production value across all cores and
presentations. Soft, even, warm key light. No dramatic rim light, no lens effects.

CANVAS: square, 1024 x 1024 px. PNG with true transparent RGBA.
Leave at least 8% empty transparent margin on all four sides.
Keep the face, prop and identifying silhouette inside the central 76% of the canvas.
Face, both hands, both feet and the prop are all fully visible and unclipped.

PROPS: held in the hands, worn, or resting on a surface the character is touching. Never floating
detached in mid-air, and never presented as an award, medal, trophy, rosette or rank badge.

BACKGROUND: nothing at all — the character stands alone on a fully transparent canvas.
No background motif, no grid, no orbits, no paths, no ribbons, no radar, no sparks, no lines,
no shapes, no scenery, no gradient, no ground plane. The application draws the scene behind the
character at runtime, so any background baked into this image is a defect.
Genuine alpha transparency. No checkerboard pattern rendered as pixels, no white plate,
no vignette, no floor shadow touching the canvas edge.

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

const ASK_DERIVE = (label) => `แนบไฟล์ Female master ที่อนุมัติแล้วของ core นี้มาพร้อมข้อความนี้

ใช้ไฟล์ที่แนบมาเป็น reference หลัก แก้เฉพาะใบหน้าและผม ให้อ่านเป็น ${label}
- ขนาด square 1024x1024 PNG พื้นหลังโปร่งใสจริง เท่าเดิม
- ทำทีละภาพ
- ถ้าทำ neutral ให้แนบไฟล์ master ตัวเดิมอีกครั้ง ห้ามแนบไฟล์ male ที่เพิ่งได้มา

---`;

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const written = [];
const write = (name, body) => {
  fs.writeFileSync(path.join(OUT, name), `${body.trim()}\n`);
  written.push(name);
};

for (const [core, c] of Object.entries(CORES)) {
  write(`core-${core}-1-female-master.txt`, `${ASK_NEW}

${LOCKED}

CORE: ${core} — ${c.title}
POSE ORIENTATION: ${c.pose}
ACTION: ${c.action}
PROP: ${c.prop}
EXPRESSION: ${c.expression}
PRESENTATION: female presentation, conveyed only through face and hair.
PROHIBITED READING FOR THIS CORE: never read as ${c.never}.`);
}

const DERIVE_BODY = `Using the attached approved Female master as the exact reference, change ONLY the face and hair
to read as PRESENTATION_LABEL.

Keep IDENTICAL and unchanged: pose, gaze direction and target, shoulder line, arm positions,
which hand holds what, finger placement, foot stance, wardrobe, prop shape and position,
background motif and its placement, lighting direction and intensity, canvas position, scale,
crop, and expression intensity.

Do not change body build, height, shoulder width, or silhouette. Do not add or remove any prop or
motif. Do not restyle the wardrobe. Do not alter the expression's intensity — only the face's
presentation.

Canvas stays square 1024 x 1024. Background stays true transparent RGBA.`;

write("step-2-derive-male.txt",
  `${ASK_DERIVE("male presentation")}\n\n${DERIVE_BODY.replace("PRESENTATION_LABEL", "male presentation")}`);
write("step-3-derive-neutral.txt",
  `${ASK_DERIVE("gender-neutral presentation")}\n\n${DERIVE_BODY.replace("PRESENTATION_LABEL", "gender-neutral presentation")}`);

write("fix-background-not-transparent.txt", `แนบภาพที่ได้มาพร้อมข้อความนี้

พื้นหลังยังไม่โปร่งใสจริง ช่วยแก้ตามนี้

---

Remove only the baked checkerboard or background pixels from the attached image.
Produce genuine alpha transparency. Preserve fine edges, hair strands and prop edges exactly.
No halo, no fringe, no colour bleed at the silhouette.
Do not alter the character, prop, motif, lighting, or framing in any way.
Keep the canvas square 1024 x 1024.`);

write("fix-parity-failed.txt", `แนบไฟล์ Female master ตัวเดิมมาพร้อมข้อความนี้ (ไม่ใช่ derivative ที่ตก)

derivative ตัวนี้ไม่ผ่าน parity เพราะมีความต่างจาก master นอกเหนือจากใบหน้าและผม คือ:
[เขียนสิ่งที่ต่างตรงนี้ เช่น "มือขวาถือ prop คนละมุม" หรือ "ไหล่กว้างกว่า"]

ทำ derivative ใหม่จากไฟล์ master ที่แนบ โดยแก้เฉพาะใบหน้าและผมเท่านั้น
ห้ามแก้ master ให้ตรงกับ derivative — master คือ reference ที่ต้องคงเดิม
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

ทุกไฟล์ copy ทั้งไฟล์แล้ววางได้เลย ไม่ต้องประกอบเอง ไม่มีช่องให้เติม

ลำดับต่อ 1 core (ทำให้ครบ 3 ภาพก่อนขึ้น core ถัดไป):

  1. core-N-1-female-master.txt      -> ได้ Female master
  2. step-2-derive-male.txt          -> แนบ master แล้ววาง
  3. step-3-derive-neutral.txt       -> แนบ master ตัวเดิมอีกครั้ง แล้ววาง

  ถ้าพื้นหลังไม่โปร่งใส : fix-background-not-transparent.txt
  ถ้า parity ไม่ผ่าน    : fix-parity-failed.txt

ครบ 9 cores แล้วค่อยทำ step-10-fallback-exploration.txt

หลังได้ไฟล์ วางที่ public/character-assets/enneagram-N/{female,male,neutral}.png แล้วรัน:
  npm run assets:manifest && npm run gate:m2`);

console.log(`Wrote ${written.length} files to outputs/asset-prompts/`);
console.log("  9 female masters + 2 derivative steps + 2 fix templates + fallback + README");
console.log("  every file is self-contained: instruction + spec assembled, no placeholders");
console.log("  pose directions cross-checked against app/lib/character-system.ts");
