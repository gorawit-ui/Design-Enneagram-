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

// The STYLE block exists because "semi-realistic" in the opening line was too loose to hold. Core 2
// male came back with a face that read as a photograph of a real person while the rest of the set
// read as animation, which breaks the FINISH clause's requirement of equal apparent production
// value across cores. Two attempts to measure the drift failed and are worth recording so they are
// not tried again: mean absolute Laplacian over the whole figure put Core 1 male at 9.04 against
// Core 2 male's 6.10, and over the head at 12.53 against 10.00 -- both the opposite of what a
// reviewer saw, because photographic realism lives in proportion, eye rendering and shading
// gradients rather than in high-frequency detail. There is no number for this one; it is named
// explicitly in the prompt instead, and ruled on by eye.
//
// The canvas block asks for two things and no more: a square, and real transparency. It used to
// specify 1024 px, an 8% margin and a central 76% safe region, and the margin was honoured on none
// of four attempts. All three are now reframed by assets:normalize from whatever comes back, along
// with file size and the alpha ramp -- so asking for them bought nothing and spent attention that
// belongs on the character. Transparency stays, because it is the one export property that cannot
// be recovered reliably: assets:unbake can undo a flattened checkerboard, but not a painted scene.
//
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

EQUAL STANDING: no presentation may read as more capable, more senior, more employable or more
physically dominant than another. Build may differ between presentations; power may not. Same pose,
same action, same prop prominence, same lighting, same production value, same framing.

WARDROBE (identical for every core and every presentation): forest-green blazer, ivory knit top,
straight charcoal trousers, flat-soled black ankle boots. No heels on any presentation — footwear
is identical across female, male and neutral.

PALETTE: matcha green, forest green, ivory. Core-specific accents appear only in the prop.
Never use colour alone to signal anything.

STYLE: stylised 3D character rendering of the kind an animated feature uses — not photographic.
Skin is smoothly and evenly shaded, with no visible pores, blemishes or photographic subsurface
detail. Eyes are drawn rather than photographed: clean iris shapes, no studio catchlights. Facial
proportions are gently idealised rather than anatomically exact. Every core and every presentation
sits at the same distance from realism as the others — a face that reads as a photograph of a real
person does not belong in this set, however well rendered.

FINISH: equal lighting, detail density and apparent production value across all cores and
presentations. Soft, even, warm key light. No dramatic rim light, no lens effects.

CANVAS: square, and a PNG with true transparent RGBA — not a white plate, and not a checkerboard
drawn as pixels. Face, both hands, both feet and the prop are all fully visible and unclipped.

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

// Deliberately no attachment. Attaching the master routes the request through the generator's edit
// path, and that path exports differently: two prompts sent without one came back as 1024x1024 PNG
// with alpha intact, and two sent with one came back as 1254x1254 with the checkerboard flattened
// in -- twice, including after a corrective round. The generator reported its own file as 1254 RGB,
// so the difference is in what it produces, not in how the file travels.
//
// Identity is carried by the conversation instead. Sent in the same chat that produced the master,
// the character is already established there, so the request can ask for the same person without
// handing back a file and pushing the request into the path that loses the alpha.
const ASK_POSE = (gender) => `ส่งข้อความนี้ในแชทเดิมที่สร้าง ${gender} master ไว้ — ห้ามแนบไฟล์
(การแนบไฟล์ทำให้ ChatGPT สลับไปโหมดแก้ไขภาพ ซึ่ง export ออกมาเป็น 1254x1254 ทึบ ใช้ไม่ได้)

สร้างภาพใหม่ 1 ภาพ เป็น "คนเดิม" กับ ${gender} master ที่เราล็อกไว้ในแชทนี้
เปลี่ยนแค่ท่า การกระทำ อุปกรณ์ และสีหน้า
- ทำทีละภาพ อย่าสร้างหลายเวอร์ชันให้เลือก
- ห้ามเปลี่ยนหน้า ผม สีผิว ส่วนสูง ความกว้างไหล่ หรือเสื้อผ้า
- ห้ามเพิ่ม lighting drama และห้ามเปลี่ยนท่าให้ "ดูมั่นใจขึ้น"

---`;

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const written = [];
const write = (name, body) => {
  fs.writeFileSync(path.join(OUT, name), `${body.trim()}\n`);
  written.push(name);
};

// Each presentation is its own locked character, and the nine cores are poses of that character.
//
// The alternative -- one master per core with the other two presentations derived from it -- is the
// approach that failed. Asked to change only the head of an attached figure, the generator redraws
// the whole body, and turning a woman into a man is the hardest edit to ask of it. Turning one
// person from one pose into another is a far easier one, and it is what this ordering asks for.
//
// The two axes swap. Instead of nine cross-gender parity reviews, there is one -- between the three
// masters, done once -- and then nine same-person checks per presentation. The numeric PROPORTIONS
// block is what keeps the three masters on one build, so they still satisfy the spec's requirement
// that presentations share the physical build. The approved Core 2 pilot was produced this way:
// three consistent characters across four types.
// Each presentation's build, measured off its own approved master by `assets:proportions --record`.
// Read rather than retyped: the numbers are what the core-2-to-9 prompts promise and what
// check-asset then verifies, and a copy of them drifting would break both ends at once. A
// presentation with no reading yet has not been locked, so its prompt states the shared target
// instead of numbers it cannot honestly claim.
const RECORDED = fs.existsSync(path.join(projectRoot, "outputs/asset-masters/proportions.json"))
  ? JSON.parse(fs.readFileSync(path.join(projectRoot, "outputs/asset-masters/proportions.json"), "utf8"))
  : {};

const buildBlock = (gender) => {
  const r = RECORDED[gender];
  if (!r) {
    return `PROPORTIONS: one balanced adult build, shoulders about twice the width of the head.
An adult build, never adolescent.`;
  }
  return `PROPORTIONS — measured off the locked ${gender} master, and identical across all nine cores
of this presentation:
  - the head is ${r.headWidthPct}% as wide as the figure is tall
  - the shoulders are ${r.shoulderWidthPct}% as wide as the figure is tall, i.e. ${r.shoulderToHead} times the head's width
An adult build, never adolescent.`;
};

const PRESENTATIONS = [
  ["1-female", "female", `female presentation, conveyed only through face and hair. Hair may be
worn up or long. An adult woman.`],
  ["2-male", "male", `male presentation, conveyed only through face and hair. Short hair that does
not cover the ears and does not fall past the collar. An adult man with an adult jaw, never a
teenager. Shoulders, neck and head are the widths given under PROPORTIONS -- the same as the other
two presentations, not narrower.`],
  ["3-neutral", "neutral", `gender-neutral presentation, conveyed only through face and hair.
Neither markedly feminine nor markedly masculine, and not a compromise that reads as either.
An adult.`],
];

const MASTER_CORE = "1";
const flat = (text) => text.replace(/\s+/g, " ").trim();

const coreBlock = (core, c) => `CORE: ${core} — ${c.title}
POSE ORIENTATION: ${c.pose}
ACTION: ${c.action}
PROP: ${c.prop}
EXPRESSION: ${c.expression}`;
const prohibited = (c) => `PROHIBITED READING FOR THIS CORE: never read as ${c.never}.`;

// The three masters: generated from nothing, so each carries the whole locked spec.
for (const [slug, gender, presentation] of PRESENTATIONS) {
  write(`master-${slug}.txt`, `${ASK_NEW}

${LOCKED}

${buildBlock(gender)}

${coreBlock(MASTER_CORE, CORES[MASTER_CORE])}
PRESENTATION: ${flat(presentation)}
${prohibited(CORES[MASTER_CORE])}

This image becomes the locked ${gender} master. Every other core is this same person in a
different pose, so face, hair, skin tone and build are fixed from here on.`);
}

// The remaining cores: the master is attached, and what changes is the pose, not the person.
for (const [core, c] of Object.entries(CORES)) {
  if (core === MASTER_CORE) continue;
  for (const [slug, gender] of PRESENTATIONS) {
    write(`core-${core}-${slug}.txt`, `${ASK_POSE(gender)}

${LOCKED}

${buildBlock(gender)}

${coreBlock(core, c)}
${prohibited(c)}

SAME PERSON as the ${gender} master locked earlier in this conversation: face, facial structure,
hair style and colour, skin tone, build, shoulder width, height and wardrobe are all unchanged.
A viewer must recognise them as one character across all nine cores.

WHAT CHANGES: only the pose orientation, the action, the prop and the expression, exactly as listed
above. Do not carry over core 1's notebook or seal — this core has its own prop and no other.`);
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

โครง: 3 master (เพศละ 1 ตัว) แล้วอีก 8 core คือคนเดิมเปลี่ยนท่า

  ขั้นที่ 1 — ล็อก master 3 ตัว (ไม่ต้องแนบรูป copy ทั้งไฟล์แล้ววาง)
      master-1-female.txt
      master-2-male.txt
      master-3-neutral.txt
    ได้ครบ 3 ตัวแล้วตรวจ parity ระหว่างกัน 1 ครั้ง — ผ่านแล้วล็อกเลย ห้ามสร้างใหม่

  ขั้นที่ 2 — core 2 ถึง 9 (ส่งในแชทเดิมของเพศนั้น ห้ามแนบไฟล์)
      core-N-1-female.txt   ส่งในแชทที่สร้าง female master
      core-N-2-male.txt     ส่งในแชทที่สร้าง male master
      core-N-3-neutral.txt  ส่งในแชทที่สร้าง neutral master
    ห้ามแนบไฟล์ — แนบแล้ว ChatGPT จะสลับไปโหมดแก้ไขภาพ ซึ่ง export เป็น
    1254x1254 ทึบ ไม่มี alpha (เจอมา 2 ครั้ง) ส่วน prompt ที่ไม่แนบไฟล์
    ได้ PNG 1024x1024 โปร่งใสทั้ง 2 ครั้ง

  ถ้าพื้นหลังไม่โปร่งใส : fix-background-not-transparent.txt
  ถ้าสัดส่วนไม่ตรงกัน   : fix-parity-failed.txt

ครบ 9 core แล้วค่อยทำ step-10-fallback-exploration.txt

เดิมใช้วิธี master 1 ตัวต่อ core แล้วแปลงเพศ — ตีตกแล้ว generator วาดใหม่ทั้งตัว
ทำให้ไหล่แคบกว่าเดิมครึ่งหนึ่ง วิธีนี้ขอแค่ "คนเดิมเปลี่ยนท่า" ซึ่งง่ายกว่ามาก

ได้ไฟล์มาแล้วส่งในแชท Claude Code ครั้งเดียว ไม่ต้องแก้ขอบหรือย่อไฟล์เอง — ทำต่อด้วย:
  npm run assets:normalize -- <ไฟล์> --out public/character-assets/enneagram-N/female.webp
  npm run assets:check -- <master> <ไฟล์ใหม่>      ตรวจสัดส่วน 40 จุด
  npm run assets:manifest && npm run gate:m2`);

console.log(`Wrote ${written.length} files to outputs/asset-prompts/`);
console.log("  3 locked masters + 24 pose prompts (cores 2-9 x 3) + 2 fix templates + fallback + README");
console.log("  every file is self-contained: instruction + spec assembled, no placeholders");
console.log("  pose directions cross-checked against app/lib/character-system.ts");
