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
straight charcoal trousers, black ankle boots.

PALETTE: matcha green, forest green, ivory. Core-specific accents appear only in the prop and the
background motif. Never use colour alone to signal anything.

FINISH: equal lighting, detail density and apparent production value across all cores and
presentations. Soft, even, warm key light. No dramatic rim light, no lens effects.

CANVAS: square, 2048 x 2048 px or larger. PNG with true transparent RGBA.
Leave at least 8% empty transparent margin on all four sides.
Keep the face, prop and identifying silhouette inside the central 76% of the canvas.
Face, both hands, both feet and the prop are all fully visible and unclipped.

BACKGROUND: genuine alpha transparency. No checkerboard pattern rendered as pixels, no white plate,
no vignette, no floor shadow touching the canvas edge.

NEVER INCLUDE: text, numbers, letters, logos, watermarks, participant data, charts, money, luxury or
status objects, badges of rank, job titles, distress, pathology, medical or diagnostic cues,
dominance posturing, flirtation, or any body-shape encoding of personality or gender.`;

// core -> authored English copy. `pose` is cross-checked against character-system.ts below.
const CORES = {
  1: { title: "Standards Keeper", pose: "forward",
       action: "stands steady and checks one item in an open notebook",
       prop: "a standards notebook and a small quality seal",
       motif: "precise grid lines",
       expression: "calm, attentive, unhurried",
       never: "a rigid enforcer, scolding, morally superior, or joyless" },
  2: { title: "Relationship Guide", pose: "right",
       action: "opens a network map toward the viewer's side with a welcoming hand",
       prop: "a network map and a small welcome set",
       motif: "interconnected orbits",
       expression: "warm, friendly, contained",
       never: "self-sacrificing, ingratiating, intrusive, or emotionally needy" },
  3: { title: "Goal Driver", pose: "right",
       action: "indicates one milestone on a goal board",
       prop: "a goal board and a milestone medallion",
       motif: "a path leading to one milestone",
       expression: "focused, positive, composed",
       never: "status-seeking, boastful, salesy, or image-obsessed" },
  4: { title: "Identity Storyteller", pose: "left",
       action: "holds an open story notebook beside layered colour swatches",
       prop: "a story notebook and mood colour swatches",
       motif: "layered story ribbons",
       expression: "thoughtful, sincere, settled",
       never: "melancholic, a tortured artist, fragile, or self-absorbed" },
  5: { title: "Systems Cartographer", pose: "left",
       action: "arranges a systems map and data tiles, one contingency pin set aside",
       prop: "a systems map and data tiles",
       motif: "data nodes and connecting routes",
       expression: "absorbed, calm, quietly capable",
       never: "aloof, socially detached, secretive, or a lone genius" },
  6: { title: "Risk Scout", pose: "forward",
       action: "holds a compass level while a contingency satchel rests ready",
       prop: "a risk compass and a contingency satchel",
       motif: "a radar sweep with one alternate route",
       expression: "prepared, steady, alert but calm",
       never: "anxious, paranoid, fearful, or distrustful" },
  7: { title: "Possibility Explorer", pose: "right",
       action: "raises a spotting scope toward an open route among idea cards",
       prop: "a spotting scope and idea cards",
       motif: "sparks and one fork in the path",
       expression: "bright, curious, contained",
       never: "scattered, manic, childish, or thrill-seeking" },
  8: { title: "Boundary Guardian", pose: "forward",
       action: "holds a boundary shield steady, decision baton lowered and relaxed",
       prop: "a boundary shield and a decision baton",
       motif: "one protective line and calm energy lines",
       expression: "warm but firm, grounded",
       never: "aggressive, intimidating, domineering, or confrontational" },
  9: { title: "Path Harmoniser", pose: "left",
       action: "gathers several path strands into one ring with both hands",
       prop: "a path ring and a joining cord",
       motif: "converging streams and one balance circle",
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
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const written = [];
const write = (name, body) => {
  fs.writeFileSync(path.join(OUT, name), `${body.trim()}\n`);
  written.push(name);
};

for (const [core, c] of Object.entries(CORES)) {
  write(`core-${core}-female-master.txt`, `${LOCKED}

CORE: ${core} — ${c.title}
POSE ORIENTATION: ${c.pose}
ACTION: ${c.action}
PROP: ${c.prop}
BACKGROUND MOTIF: ${c.motif}, rendered as a restrained flat graphic behind the character,
  clearly separate from it and never overlapping the face or hands.
EXPRESSION: ${c.expression}
PRESENTATION: female presentation, conveyed only through face and hair.
PROHIBITED READING FOR THIS CORE: never read as ${c.never}.`);
}

write("derivative-male-neutral.txt", `Using the attached approved Female master as the exact reference, change ONLY the face and hair
to read as {male | gender-neutral} presentation.

Keep IDENTICAL and unchanged: pose, gaze direction and target, shoulder line, arm positions,
which hand holds what, finger placement, foot stance, wardrobe, prop shape and position,
background motif and its placement, lighting direction and intensity, canvas position, scale,
crop, and expression intensity.

Do not change body build, height, shoulder width, or silhouette. Do not add or remove any prop or
motif. Do not restyle the wardrobe. Do not alter the expression's intensity — only the face's
presentation.

Canvas stays square 2048 x 2048 or larger. Background stays true transparent RGBA.`);

write("background-extraction.txt", `Remove only the baked checkerboard or background pixels from the attached image.
Produce genuine alpha transparency. Preserve fine edges, hair strands and prop edges exactly.
No halo, no fringe, no colour bleed at the silhouette.
Do not alter the character, prop, motif, lighting, or framing in any way.`);

write("fallback-exploration.txt", `${LOCKED}

CORE: none — this is the neutral exploration fallback.
POSE ORIENTATION: forward
ACTION: stands calmly with an open, unmarked map held loosely in both hands, as if still choosing
  a direction.
PROP: one blank, unmarked open map. No core prop: no seal, no shield, no scope, no ring, no board.
BACKGROUND MOTIF: a single soft open circle. No grid, orbit, path, ribbon, radar, spark,
  protective line or converging stream.
EXPRESSION: open, unhurried, neither confident nor uncertain.
PRESENTATION: gender-neutral, conveyed only through face and hair.
PROHIBITED READING: never suggest a conclusion, a diagnosis, a rank, or that any particular core
  has been identified. It must not resemble any of the nine core characters.`);

console.log(`Wrote ${written.length} prompt files to outputs/asset-prompts/`);
console.log(`  9 female masters + 1 derivative template + 1 background extraction + 1 fallback`);
console.log(`  pose directions cross-checked against app/lib/character-system.ts`);
