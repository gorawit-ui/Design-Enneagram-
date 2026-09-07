// Focused resolver + fallback tests for the approved Core 2 living-character pilot.
//
// Scope guard: INTJ, ISTJ, ENFP, ESFP x Female, Male, Neutral = 12 assets, Core 2 only.
// These tests exist to keep the pilot from silently drifting or expanding (27 / 432 assets),
// and to pin every fallback route so the existing neutral behavior cannot regress.
//
// Expected paths below are written as literals on purpose: deriving them from the manifest
// would let a manifest edit pass its own test.

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);
const projectRoot = path.resolve(import.meta.dirname, "..");
const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "tdfb-living-character-pilot-tests-"));

const PILOT_TYPES = ["INTJ", "ISTJ", "ENFP", "ESFP"];
const PRESENTATIONS = ["female", "male", "neutral"];

// The 12 approved cells: [mbti, presentation] -> asset path, pose family, scene kit.
const APPROVED = {
  INTJ: {
    poseFamily: "observant-curiosity",
    sceneKitId: "quiet-strategy",
    female: "/character-assets/living/v1/enneagram-2/intj/female-observant-curiosity.png",
    male: "/character-assets/living/v1/enneagram-2/intj/male-observant-curiosity.png",
    neutral: "/character-assets/living/v1/enneagram-2/intj/neutral-observant-curiosity.png",
  },
  ISTJ: {
    poseFamily: "observant-curiosity",
    sceneKitId: "practical-sequence",
    female: "/character-assets/living/v1/enneagram-2/istj/female-observant-curiosity.png",
    male: "/character-assets/living/v1/enneagram-2/istj/male-observant-curiosity.png",
    neutral: "/character-assets/living/v1/enneagram-2/istj/neutral-observant-curiosity.png",
  },
  ENFP: {
    poseFamily: "idea-spark",
    sceneKitId: "open-connection",
    female: "/character-assets/living/v1/enneagram-2/enfp/female-idea-spark.png",
    male: "/character-assets/living/v1/enneagram-2/enfp/male-idea-spark.png",
    neutral: "/character-assets/living/v1/enneagram-2/enfp/neutral-idea-spark.png",
  },
  ESFP: {
    poseFamily: "idea-spark",
    sceneKitId: "live-engagement",
    female: "/character-assets/living/v1/enneagram-2/esfp/female-idea-spark.png",
    male: "/character-assets/living/v1/enneagram-2/esfp/male-idea-spark.png",
    neutral: "/character-assets/living/v1/enneagram-2/esfp/neutral-idea-spark.png",
  },
};

const NEUTRAL_ALT = "ภาพกลางสำหรับผลที่ยังไม่ชัดเจน";

function compile(relativeSources) {
  const sources = relativeSources.map((relative) => path.join(projectRoot, relative));
  const program = ts.createProgram(sources, {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.CommonJS,
    moduleResolution: ts.ModuleResolutionKind.Node10,
    outDir: temporaryDirectory,
    esModuleInterop: true,
    skipLibCheck: true,
    strict: true,
    noEmitOnError: true,
  });
  const diagnostics = ts.getPreEmitDiagnostics(program);
  const emitResult = program.emit();
  if (diagnostics.length || emitResult.emitSkipped) {
    const message = ts.formatDiagnosticsWithColorAndContext(diagnostics, {
      getCanonicalFileName: (fileName) => fileName,
      getCurrentDirectory: () => projectRoot,
      getNewLine: () => os.EOL,
    });
    throw new Error(`Unable to compile pilot modules for tests.${os.EOL}${message}`);
  }
}

try {
  compile(["app/lib/living-character-resolver.ts", "app/lib/living-character-flag.ts"]);
  const resolver = require(path.join(temporaryDirectory, "living-character-resolver.js"));
  const flag = require(path.join(temporaryDirectory, "living-character-flag.js"));

  const base = {
    schemaVersion: resolver.LIVING_CHARACTER_SCHEMA_VERSION,
    enabled: true,
    core: 2,
    mbti: "INTJ",
    mbtiConfidence: "clear",
    enneagramConfidence: "clear",
    presentation: "neutral",
    existingAssetPath: "",
    existingAlt: "existing fallback",
  };
  const resolve = (overrides) => resolver.resolveLivingCharacterVisual({ ...base, ...overrides });

  // --- 1. Pilot scope: exactly the 12 approved cells, no expansion ------------------------------
  const manifestTypes = Object.keys(resolver.APPROVED_POSE_ACTION_RECIPES);
  assert.deepEqual([...manifestTypes].sort(), [...PILOT_TYPES].sort(), "manifest covers exactly the 4 pilot MBTI types");

  const manifestPaths = manifestTypes.flatMap((mbti) =>
    Object.values(resolver.APPROVED_POSE_ACTION_RECIPES[mbti].presentations).map((asset) => asset.assetPath));
  assert.equal(manifestPaths.length, 12, "manifest declares exactly 12 assets (not 27, not 432)");
  assert.equal(new Set(manifestPaths).size, 12, "all 12 manifest paths are unique");
  for (const assetPath of manifestPaths) {
    assert.ok(assetPath.startsWith("/character-assets/living/v1/enneagram-2/"),
      `${assetPath}: stays inside the approved Core 2 pilot directory`);
  }

  // Disk must not carry pilot art beyond the approved 12 (catches an un-manifested expansion).
  const livingRoot = path.join(projectRoot, "public/character-assets/living");
  const onDisk = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const absolute = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(absolute);
      else if (entry.name.endsWith(".png")) onDisk.push(`/${path.relative(path.join(projectRoot, "public"), absolute)}`);
    }
  };
  walk(livingRoot);
  assert.deepEqual(onDisk.sort(), [...manifestPaths].sort(),
    "public/character-assets/living contains exactly the 12 approved assets and nothing else");

  // --- 2. Exhaustive 12-cell resolution against literal expectations -----------------------------
  let cells = 0;
  for (const mbti of PILOT_TYPES) {
    for (const presentation of PRESENTATIONS) {
      const result = resolve({ mbti, presentation });
      const expected = APPROVED[mbti];
      assert.deepEqual(result.resolution, { mode: "specific", reason: "valid" }, `${mbti}/${presentation}: specific`);
      assert.equal(result.visual.assetPath, expected[presentation], `${mbti}/${presentation}: approved asset path`);
      assert.equal(result.visual.poseFamily, expected.poseFamily, `${mbti}/${presentation}: pose family`);
      assert.equal(result.visual.sceneKitId, expected.sceneKitId, `${mbti}/${presentation}: scene kit`);
      assert.ok(fs.existsSync(path.join(projectRoot, "public", result.visual.assetPath.slice(1))),
        `${mbti}/${presentation}: resolved asset exists on disk`);
      cells += 1;
    }
  }
  assert.equal(cells, 12, "exercised all 12 pilot cells");

  // --- 3. Presentation parity: only the asset file may differ ------------------------------------
  for (const mbti of PILOT_TYPES) {
    const byPresentation = PRESENTATIONS.map((presentation) => resolve({ mbti, presentation }));
    const [female, male, neutral] = byPresentation;
    for (const [label, other] of [["male", male], ["neutral", neutral]]) {
      assert.equal(other.visual.poseFamily, female.visual.poseFamily, `${mbti}/${label}: same pose family as female`);
      assert.equal(other.visual.sceneKitId, female.visual.sceneKitId, `${mbti}/${label}: same scene kit as female`);
      assert.equal(other.visual.alt, female.visual.alt, `${mbti}/${label}: same accessibility description as female`);
      assert.notEqual(other.visual.assetPath, female.visual.assetPath, `${mbti}/${label}: distinct asset file`);
    }
    // Filenames may differ only by the presentation prefix; the action suffix is shared.
    const suffixes = byPresentation.map((entry) => path.basename(entry.visual.assetPath).split("-").slice(1).join("-"));
    assert.equal(new Set(suffixes).size, 1, `${mbti}: presentation variants share one action suffix`);
    const prefixes = byPresentation.map((entry) => path.basename(entry.visual.assetPath).split("-")[0]);
    assert.deepEqual(prefixes, PRESENTATIONS, `${mbti}: filenames differ only by presentation prefix`);
  }

  // --- 4. Fallback matrix: every route pinned ----------------------------------------------------
  const withExisting = { existingAssetPath: "/existing/neutral.png", existingAlt: "existing fallback" };

  const flagOff = resolve({ ...withExisting, enabled: false });
  assert.deepEqual(flagOff.resolution, { mode: "fallback", reason: "flag-disabled" }, "flag off: fallback");
  assert.equal(flagOff.visual.assetPath, "/existing/neutral.png", "flag off: preserves the existing asset");
  assert.equal(flagOff.visual.alt, "existing fallback", "flag off: preserves the existing alt text");
  assert.equal(flagOff.visual.poseFamily, "neutral", "flag off: neutral pose family");
  assert.equal(flagOff.visual.sceneKitId, null, "flag off: no scene kit");

  const schemaError = resolve({ ...withExisting, schemaVersion: resolver.LIVING_CHARACTER_SCHEMA_VERSION + 1 });
  assert.deepEqual(schemaError.resolution, { mode: "fallback", reason: "schema-error" }, "schema mismatch: fallback");
  assert.equal(schemaError.visual.assetPath, "", "schema mismatch: never guesses an asset");
  assert.equal(schemaError.visual.alt, NEUTRAL_ALT, "schema mismatch: neutral alt text");

  for (const missing of [{ core: null }, { core: undefined }, { mbti: null }, { mbti: undefined }]) {
    const result = resolve({ ...withExisting, ...missing });
    assert.deepEqual(result.resolution, { mode: "fallback", reason: "missing-value" },
      `${JSON.stringify(missing)}: missing-value fallback`);
    assert.equal(result.visual.assetPath, "", `${JSON.stringify(missing)}: renders no candidate asset`);
  }

  // Ambiguity on either axis withdraws the specific asset entirely (never the existing one).
  for (const field of ["mbtiConfidence", "enneagramConfidence"]) {
    for (const value of ["ambiguous", "missing"]) {
      const result = resolve({ ...withExisting, [field]: value });
      assert.deepEqual(result.resolution, { mode: "fallback", reason: "ambiguous-result" }, `${field}=${value}: fallback`);
      assert.equal(result.visual.assetPath, "", `${field}=${value}: renders no candidate asset`);
      assert.equal(result.visual.alt, NEUTRAL_ALT, `${field}=${value}: neutral alt text`);
      assert.equal(result.visual.poseFamily, "neutral", `${field}=${value}: neutral pose family`);
    }
  }

  // "close" is a confident-enough result and keeps its specific asset: preserved confidence behavior.
  for (const field of ["mbtiConfidence", "enneagramConfidence"]) {
    const result = resolve({ [field]: "close", mbti: "ENFP", presentation: "male" });
    assert.deepEqual(result.resolution, { mode: "specific", reason: "valid" }, `${field}=close: still specific`);
    assert.equal(result.visual.assetPath, APPROVED.ENFP.male, `${field}=close: approved asset`);
  }

  // Outside the pilot: non-pilot MBTI, and non-Core-2, both keep existing behavior.
  for (const mbti of ["INFP", "ESTJ", "ENTP", "ISFJ"]) {
    const result = resolve({ ...withExisting, mbti });
    assert.deepEqual(result.resolution, { mode: "fallback", reason: "unsupported-combination" },
      `Core 2 x ${mbti}: not in the pilot`);
    assert.equal(result.visual.assetPath, "/existing/neutral.png", `Core 2 x ${mbti}: preserves existing asset`);
  }
  for (const core of [1, 3, 4, 5, 6, 7, 8, 9]) {
    const result = resolve({ ...withExisting, core });
    assert.deepEqual(result.resolution, { mode: "fallback", reason: "unsupported-combination" },
      `Core ${core} x INTJ: pilot is Core 2 only`);
    assert.equal(result.visual.assetPath, "/existing/neutral.png", `Core ${core}: preserves existing asset`);
  }

  // Unknown presentation degrades to the first-class Neutral asset rather than guessing.
  for (const presentation of [null, undefined, "nonbinary", ""]) {
    const result = resolve({ presentation, mbti: "ISTJ" });
    assert.deepEqual(result.resolution, { mode: "specific", reason: "valid" }, `presentation=${presentation}: specific`);
    assert.equal(result.visual.assetPath, APPROVED.ISTJ.neutral, `presentation=${presentation}: neutral asset`);
  }

  // --- 5. Wing and A/T cannot reach the asset, across all 12 cells --------------------------------
  for (const mbti of PILOT_TYPES) {
    for (const presentation of PRESENTATIONS) {
      const wingOne = resolve({ mbti, presentation, wing: 1, assertiveness: "A" });
      const wingThree = resolve({ mbti, presentation, wing: 3, assertiveness: "T" });
      assert.deepEqual(wingOne, wingThree, `${mbti}/${presentation}: Wing and A/T do not alter the visual`);
    }
  }

  // --- 6. Feature-flag boundary ------------------------------------------------------------------
  assert.equal(flag.isLivingCharacterPilotEnabled(undefined), true, "unset flag keeps the pilot enabled");
  assert.equal(flag.isLivingCharacterPilotEnabled("off"), false, '"off" withdraws the pilot');
  assert.equal(flag.isLivingCharacterPilotEnabled("on"), true, "any other value keeps the pilot enabled");
  assert.equal(flag.isLivingCharacterPilotEnabled("OFF"), true, "the switch is exact-match, not case-folded");
  assert.equal(typeof flag.LIVING_CHARACTER_PILOT_ENABLED, "boolean", "the resolved flag is a boolean");

  // --- 7. Resolver purity ------------------------------------------------------------------------
  const frozen = Object.freeze({ ...base, mbti: "ESFP", presentation: "female" });
  const snapshot = JSON.stringify(frozen);
  const first = resolver.resolveLivingCharacterVisual(frozen);
  const second = resolver.resolveLivingCharacterVisual(frozen);
  assert.deepEqual(first, second, "resolution is deterministic for identical input");
  assert.equal(JSON.stringify(frozen), snapshot, "resolver does not mutate its source");

  console.log("Living character pilot tests passed: 12/12 approved cells, scope guard (4 types x 3 presentations, Core 2 only), presentation parity, full fallback matrix, close-confidence behavior, Wing/A-T isolation, and the feature-flag boundary.");
} finally {
  fs.rmSync(temporaryDirectory, { recursive: true, force: true });
}
