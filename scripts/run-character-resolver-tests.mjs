import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);
const projectRoot = path.resolve(import.meta.dirname, "..");
const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "tdfb-character-resolver-tests-"));

const expectedPaths = [
  "/character-assets/living/v1/enneagram-2/intj/female-observant-curiosity.png",
  "/character-assets/living/v1/enneagram-2/intj/male-observant-curiosity.png",
  "/character-assets/living/v1/enneagram-2/intj/neutral-observant-curiosity.png",
  "/character-assets/living/v1/enneagram-2/istj/female-observant-curiosity.png",
  "/character-assets/living/v1/enneagram-2/istj/male-observant-curiosity.png",
  "/character-assets/living/v1/enneagram-2/istj/neutral-observant-curiosity.png",
  "/character-assets/living/v1/enneagram-2/enfp/female-idea-spark.png",
  "/character-assets/living/v1/enneagram-2/enfp/male-idea-spark.png",
  "/character-assets/living/v1/enneagram-2/enfp/neutral-idea-spark.png",
  "/character-assets/living/v1/enneagram-2/esfp/female-idea-spark.png",
  "/character-assets/living/v1/enneagram-2/esfp/male-idea-spark.png",
  "/character-assets/living/v1/enneagram-2/esfp/neutral-idea-spark.png",
].sort();

try {
  const sourceFile = path.join(projectRoot, "app/lib/living-character-resolver.ts");
  const program = ts.createProgram([sourceFile], {
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
    throw new Error(`Unable to compile character resolver for tests.${os.EOL}${message}`);
  }

  const resolver = require(path.join(temporaryDirectory, "living-character-resolver.js"));
  const recipes = resolver.APPROVED_POSE_ACTION_RECIPES;
  const actualPaths = Object.values(recipes)
    .flatMap((recipe) => Object.values(recipe.presentations).map((asset) => asset.assetPath))
    .sort();

  assert.deepEqual(actualPaths, expectedPaths, "manifest contains exactly the 12 approved pilot paths");
  assert.equal(new Set(actualPaths).size, 12, "all approved paths are unique");

  for (const assetPath of actualPaths) {
    const absolutePath = path.join(projectRoot, "public", assetPath.replace(/^\//, ""));
    const png = fs.readFileSync(absolutePath);
    assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10], `${assetPath}: PNG signature`);
    assert.equal(png.readUInt32BE(16), 1122, `${assetPath}: width`);
    assert.equal(png.readUInt32BE(20), 1402, `${assetPath}: height`);
    assert.equal(png[25], 6, `${assetPath}: RGBA color type`);
    assert.ok(png.length <= 750 * 1024, `${assetPath}: within 750 KB hard gate`);
  }

  const baseSource = {
    schemaVersion: resolver.LIVING_CHARACTER_SCHEMA_VERSION,
    enabled: true,
    core: 2,
    mbti: "INTJ",
    mbtiConfidence: "clear",
    enneagramConfidence: "close",
    presentation: "female",
    existingAssetPath: "",
    existingAlt: "existing fallback",
  };

  for (const [mbti, recipe] of Object.entries(recipes)) {
    const parityMetadata = [];
    for (const presentation of ["female", "male", "neutral"]) {
      const result = resolver.resolveLivingCharacterVisual({ ...baseSource, mbti, presentation });
      assert.deepEqual(result.resolution, { mode: "specific", reason: "valid" }, `${mbti}/${presentation}: specific resolution`);
      assert.equal(result.visual.assetPath, recipe.presentations[presentation].assetPath, `${mbti}/${presentation}: approved path`);
      parityMetadata.push({ poseFamily: result.visual.poseFamily, sceneKitId: result.visual.sceneKitId, alt: result.visual.alt });
    }
    assert.deepEqual(parityMetadata[0], parityMetadata[1], `${mbti}: Female/Male parity metadata`);
    assert.deepEqual(parityMetadata[1], parityMetadata[2], `${mbti}: Male/Neutral parity metadata`);
  }

  const invalidPresentation = resolver.resolveLivingCharacterVisual({ ...baseSource, presentation: null });
  assert.equal(invalidPresentation.visual.assetPath, recipes.INTJ.presentations.neutral.assetPath, "missing presentation selects first-class Neutral asset");

  for (const confidenceField of ["mbtiConfidence", "enneagramConfidence"]) {
    const ambiguous = resolver.resolveLivingCharacterVisual({ ...baseSource, [confidenceField]: "ambiguous" });
    assert.deepEqual(ambiguous.resolution, { mode: "fallback", reason: "ambiguous-result" }, `${confidenceField}: ambiguous fallback`);
    assert.equal(ambiguous.visual.assetPath, "", `${confidenceField}: never renders a candidate asset`);
  }

  const unsupported = resolver.resolveLivingCharacterVisual({ ...baseSource, core: 3, existingAssetPath: "/existing/neutral.png" });
  assert.deepEqual(unsupported.resolution, { mode: "fallback", reason: "unsupported-combination" }, "unsupported pair fallback");
  assert.equal(unsupported.visual.assetPath, "/existing/neutral.png", "unsupported pair preserves existing fallback");

  const disabled = resolver.resolveLivingCharacterVisual({ ...baseSource, enabled: false, existingAssetPath: "/existing/neutral.png" });
  assert.deepEqual(disabled.resolution, { mode: "fallback", reason: "flag-disabled" }, "flag-off fallback");
  assert.equal(disabled.visual.assetPath, "/existing/neutral.png", "flag off preserves existing behavior");

  const schemaError = resolver.resolveLivingCharacterVisual({ ...baseSource, schemaVersion: 2, existingAssetPath: "/existing/neutral.png" });
  assert.deepEqual(schemaError.resolution, { mode: "fallback", reason: "schema-error" }, "schema mismatch fallback");
  assert.equal(schemaError.visual.assetPath, "", "schema mismatch does not guess an asset");

  const frozenSource = Object.freeze({ ...baseSource });
  const before = JSON.stringify(frozenSource);
  const withModifiersA = resolver.resolveLivingCharacterVisual({ ...frozenSource, wing: 1, assertiveness: "A" });
  const withModifiersT = resolver.resolveLivingCharacterVisual({ ...frozenSource, wing: 3, assertiveness: "T" });
  assert.deepEqual(withModifiersA, withModifiersT, "Wing and A/T cannot alter the selected character asset");
  assert.equal(JSON.stringify(frozenSource), before, "resolver does not mutate the resolved result projection");

  for (const protectedModule of ["app/lib/scoring.ts", "app/lib/assessment-data.ts", "app/lib/profile-contract.ts"]) {
    const contents = fs.readFileSync(path.join(projectRoot, protectedModule), "utf8");
    assert.equal(contents.includes("living-character-resolver"), false, `${protectedModule}: no visual resolver dependency`);
  }

  console.log("Living character resolver tests passed: 12 approved paths, PNG contract, deterministic mapping, presentation parity, neutral fallbacks, isolation, and no source mutation.");
} finally {
  fs.rmSync(temporaryDirectory, { recursive: true, force: true });
}
