// Build public/character-assets/manifest.json — required by the Module 2 release gate
// ("Manifest, checksums, provenance, ownership, and accessibility descriptions are complete").
//
// Mechanical fields are derived from the files and from the app's own source of truth:
// accessibility descriptions come from ENNEAGRAM_PROFILES and APPROVED_POSE_ACTION_RECIPES, not
// from anything invented here.
//
// Fields that only a person can supply — creator, source tool, licence/ownership, AI generation
// provenance, reviewer and approval — are emitted as null with a "gaps" list per asset. They are
// deliberately NOT guessed: an invented licence record is worse than a visibly missing one, and
// `npm run gate:m2` reads these gaps to report the Module 2 gate honestly.
//
// Usage: npm run assets:manifest

import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);
const projectRoot = path.resolve(import.meta.dirname, "..");
const ASSET_ROOT = path.join(projectRoot, "public/character-assets");
const MANIFEST = path.join(ASSET_ROOT, "manifest.json");

// Human-only fields. Never fabricated; listed per asset so the gate can count them.
const HUMAN_FIELDS = ["sourceTool", "creator", "licenceOwnership", "generationProvenance",
                      "reviewer", "approvalState", "approvalDate"];

const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "tdfb-manifest-"));
function compile(relativeSources) {
  const program = ts.createProgram(relativeSources.map((r) => path.join(projectRoot, r)), {
    target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS,
    moduleResolution: ts.ModuleResolutionKind.Node10, outDir: temporaryDirectory,
    esModuleInterop: true, skipLibCheck: true, strict: true, noEmitOnError: true,
  });
  const diagnostics = ts.getPreEmitDiagnostics(program);
  const emitResult = program.emit();
  if (diagnostics.length || emitResult.emitSkipped) {
    throw new Error("Unable to compile sources for the manifest:" + os.EOL
      + ts.formatDiagnostics(diagnostics, { getCanonicalFileName: (f) => f,
          getCurrentDirectory: () => projectRoot, getNewLine: () => os.EOL }));
  }
}

/** Read width/height/colour type straight from the PNG IHDR chunk. */
function readPng(file) {
  const fd = fs.openSync(file, "r");
  const head = Buffer.alloc(33);
  fs.readSync(fd, head, 0, 33, 0);
  fs.closeSync(fd);
  const isPng = head.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (!isPng) return null;
  return { width: head.readUInt32BE(16), height: head.readUInt32BE(20),
           bitDepth: head[24], colorType: head[25], interlace: head[28] };
}

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function blankHumanFields() {
  return Object.fromEntries(HUMAN_FIELDS.map((field) => [field, null]));
}

try {
  compile(["app/lib/character-system.ts", "app/lib/living-character-resolver.ts"]);
  const characterSystem = require(path.join(temporaryDirectory, "character-system.js"));
  const resolver = require(path.join(temporaryDirectory, "living-character-resolver.js"));

  const assets = [];

  // --- Base assets: /character-assets/enneagram-{core}/{presentation} -------------------------
  for (let core = 1; core <= 9; core++) {
    for (const presentation of ["female", "male", "neutral"]) {
      const relative = `enneagram-${core}/${presentation}.png`;
      const absolute = path.join(ASSET_ROOT, relative);
      if (!fs.existsSync(absolute)) continue;
      const png = readPng(absolute);
      const profile = characterSystem.ENNEAGRAM_PROFILES?.[core];
      assets.push({
        assetId: `enneagram-${core}-${presentation}`,
        publicPath: `/character-assets/${relative}`,
        family: "base",
        enneagramCore: core,
        presentation,
        appliesTo: { mbti: null, wing: null, identity: null },
        fileType: png ? "image/png" : "unknown",
        pixelDimensions: png ? { width: png.width, height: png.height } : null,
        byteSize: fs.statSync(absolute).size,
        checksum: { algorithm: "sha256", value: sha256(absolute) },
        accessibilityDescription: profile?.accessibilityDescriptionThai ?? null,
        ...blankHumanFields(),
      });
    }
  }

  // --- Living pose/action assets: the gate-approved M2.6.2 pilot ------------------------------
  for (const [mbti, recipe] of Object.entries(resolver.APPROVED_POSE_ACTION_RECIPES)) {
    for (const [presentation, asset] of Object.entries(recipe.presentations)) {
      const absolute = path.join(projectRoot, "public", asset.assetPath.replace(/^\//, ""));
      if (!fs.existsSync(absolute)) throw new Error(`approved asset missing: ${asset.assetPath}`);
      const png = readPng(absolute);
      assets.push({
        assetId: asset.assetId,
        publicPath: asset.assetPath,
        family: "living-pose-action",
        enneagramCore: 2,
        presentation,
        appliesTo: { mbti, wing: null, identity: null },
        poseFamily: recipe.poseFamily,
        sceneKitId: recipe.sceneKitId,
        fileType: png ? "image/png" : "unknown",
        pixelDimensions: png ? { width: png.width, height: png.height } : null,
        byteSize: fs.statSync(absolute).size,
        checksum: { algorithm: "sha256", value: sha256(absolute) },
        accessibilityDescription: recipe.alt,
        ...blankHumanFields(),
        // Asset Gate E covers this family; the record below is the gate, not a per-asset sign-off.
        gateReference: "outputs/CORE2_POSE_ACTION_PILOT_GATE_E.md",
        approvalState: "Asset Gate E: PASS (2026-09-07)",
      });
    }
  }

  for (const asset of assets) {
    asset.gaps = HUMAN_FIELDS.filter((field) => asset[field] === null);
  }

  const manifest = {
    $comment: "Generated by scripts/generate-asset-manifest.mjs. Do not hand-edit; run "
      + "`npm run assets:manifest`. Null fields are unrecorded, never inferred — see `gaps`.",
    schemaVersion: 1,
    generatedAt: new Date().toISOString().slice(0, 10),
    expected: { baseAssets: 27, explorationFallback: 1, livingPilotAssets: 12 },
    present: {
      baseAssets: assets.filter((a) => a.family === "base").length,
      explorationFallback: fs.existsSync(path.join(ASSET_ROOT, "fallback")) ? 1 : 0,
      livingPilotAssets: assets.filter((a) => a.family === "living-pose-action").length,
    },
    assets,
  };

  fs.mkdirSync(ASSET_ROOT, { recursive: true });
  fs.writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
  const withGaps = assets.filter((a) => a.gaps.length).length;
  console.log(`Wrote public/character-assets/manifest.json — ${assets.length} assets `
    + `(base ${manifest.present.baseAssets}/27, living ${manifest.present.livingPilotAssets}/12); `
    + `${withGaps} assets have unrecorded human fields (creator, licence, reviewer).`);
} finally {
  fs.rmSync(temporaryDirectory, { recursive: true, force: true });
}
