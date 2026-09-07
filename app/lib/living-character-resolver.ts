import type { BaseMbtiType, EnneagramCore, GenderPresentation } from "./character-system";

export const LIVING_CHARACTER_SCHEMA_VERSION = 1 as const;

export type LivingCharacterConfidence = "clear" | "close" | "ambiguous" | "missing";
export type LivingCharacterPoseFamily = "observant-curiosity" | "idea-spark" | "neutral";
export type LivingCharacterResolutionReason =
  | "valid"
  | "flag-disabled"
  | "ambiguous-result"
  | "missing-value"
  | "unsupported-combination"
  | "schema-error";

type PilotMbti = Extract<BaseMbtiType, "INTJ" | "ISTJ" | "ENFP" | "ESFP">;

type ApprovedAsset = Readonly<{
  assetId: string;
  assetPath: string;
}>;

type PilotRecipe = Readonly<{
  poseFamily: Exclude<LivingCharacterPoseFamily, "neutral">;
  sceneKitId: string;
  alt: string;
  presentations: Readonly<Record<GenderPresentation, ApprovedAsset>>;
}>;

// Gate-approved pilot inventory only. Do not derive paths for unsupported Core/type pairs.
export const APPROVED_POSE_ACTION_RECIPES = {
  INTJ: {
    poseFamily: "observant-curiosity",
    sceneKitId: "quiet-strategy",
    alt: "A person calmly traces a route on a layered map.",
    presentations: {
      female: { assetId: "enneagram-2-intj-female-observant-curiosity", assetPath: "/character-assets/living/v1/enneagram-2/intj/female-observant-curiosity.png" },
      male: { assetId: "enneagram-2-intj-male-observant-curiosity", assetPath: "/character-assets/living/v1/enneagram-2/intj/male-observant-curiosity.png" },
      neutral: { assetId: "enneagram-2-intj-neutral-observant-curiosity", assetPath: "/character-assets/living/v1/enneagram-2/intj/neutral-observant-curiosity.png" },
    },
  },
  ISTJ: {
    poseFamily: "observant-curiosity",
    sceneKitId: "practical-sequence",
    alt: "A person aligns a route marker beside a practical checklist.",
    presentations: {
      female: { assetId: "enneagram-2-istj-female-observant-curiosity", assetPath: "/character-assets/living/v1/enneagram-2/istj/female-observant-curiosity.png" },
      male: { assetId: "enneagram-2-istj-male-observant-curiosity", assetPath: "/character-assets/living/v1/enneagram-2/istj/male-observant-curiosity.png" },
      neutral: { assetId: "enneagram-2-istj-neutral-observant-curiosity", assetPath: "/character-assets/living/v1/enneagram-2/istj/neutral-observant-curiosity.png" },
    },
  },
  ENFP: {
    poseFamily: "idea-spark",
    sceneKitId: "open-connection",
    alt: "A person links two open possibility cards with contained delight.",
    presentations: {
      female: { assetId: "enneagram-2-enfp-female-idea-spark", assetPath: "/character-assets/living/v1/enneagram-2/enfp/female-idea-spark.png" },
      male: { assetId: "enneagram-2-enfp-male-idea-spark", assetPath: "/character-assets/living/v1/enneagram-2/enfp/male-idea-spark.png" },
      neutral: { assetId: "enneagram-2-enfp-neutral-idea-spark", assetPath: "/character-assets/living/v1/enneagram-2/enfp/neutral-idea-spark.png" },
    },
  },
  ESFP: {
    poseFamily: "idea-spark",
    sceneKitId: "live-engagement",
    alt: "A person moves an activity tile into a shared exchange.",
    presentations: {
      female: { assetId: "enneagram-2-esfp-female-idea-spark", assetPath: "/character-assets/living/v1/enneagram-2/esfp/female-idea-spark.png" },
      male: { assetId: "enneagram-2-esfp-male-idea-spark", assetPath: "/character-assets/living/v1/enneagram-2/esfp/male-idea-spark.png" },
      neutral: { assetId: "enneagram-2-esfp-neutral-idea-spark", assetPath: "/character-assets/living/v1/enneagram-2/esfp/neutral-idea-spark.png" },
    },
  },
} as const satisfies Readonly<Record<PilotMbti, PilotRecipe>>;

export type LivingCharacterSource = Readonly<{
  schemaVersion: number;
  enabled: boolean;
  core: EnneagramCore | null | undefined;
  mbti: BaseMbtiType | null | undefined;
  mbtiConfidence: LivingCharacterConfidence;
  enneagramConfidence: LivingCharacterConfidence;
  presentation: GenderPresentation | null | undefined;
  existingAssetPath: string;
  existingAlt: string;
}>;

export type ResolvedLivingCharacterVisual = Readonly<{
  resolution: Readonly<{
    mode: "specific" | "fallback";
    reason: LivingCharacterResolutionReason;
  }>;
  visual: Readonly<{
    assetId: string;
    assetPath: string;
    poseFamily: LivingCharacterPoseFamily;
    sceneKitId: string | null;
    alt: string;
  }>;
}>;

const NEUTRAL_ALT = "ภาพกลางสำหรับผลที่ยังไม่ชัดเจน";
const PRESENTATIONS = new Set<GenderPresentation>(["female", "male", "neutral"]);

function fallback(
  source: LivingCharacterSource,
  reason: Exclude<LivingCharacterResolutionReason, "valid">,
  keepExistingAsset: boolean,
): ResolvedLivingCharacterVisual {
  const assetPath = keepExistingAsset ? source.existingAssetPath : "";
  return {
    resolution: { mode: "fallback", reason },
    visual: {
      assetId: assetPath ? "existing-approved-character" : "neutral-fallback",
      assetPath,
      poseFamily: "neutral",
      sceneKitId: null,
      alt: assetPath ? source.existingAlt : NEUTRAL_ALT,
    },
  };
}

export function resolveLivingCharacterVisual(source: LivingCharacterSource): ResolvedLivingCharacterVisual {
  if (source.schemaVersion !== LIVING_CHARACTER_SCHEMA_VERSION) return fallback(source, "schema-error", false);
  if (!source.enabled) return fallback(source, "flag-disabled", true);
  if (source.core === null || source.core === undefined || !source.mbti) return fallback(source, "missing-value", false);
  if (source.mbtiConfidence === "ambiguous" || source.mbtiConfidence === "missing"
    || source.enneagramConfidence === "ambiguous" || source.enneagramConfidence === "missing") {
    return fallback(source, "ambiguous-result", false);
  }

  if (source.core !== 2 || !Object.prototype.hasOwnProperty.call(APPROVED_POSE_ACTION_RECIPES, source.mbti)) {
    return fallback(source, "unsupported-combination", true);
  }

  const recipe = APPROVED_POSE_ACTION_RECIPES[source.mbti as PilotMbti];
  const presentation = source.presentation && PRESENTATIONS.has(source.presentation) ? source.presentation : "neutral";
  const asset = recipe.presentations[presentation];

  return {
    resolution: { mode: "specific", reason: "valid" },
    visual: {
      ...asset,
      poseFamily: recipe.poseFamily,
      sceneKitId: recipe.sceneKitId,
      alt: recipe.alt,
    },
  };
}
