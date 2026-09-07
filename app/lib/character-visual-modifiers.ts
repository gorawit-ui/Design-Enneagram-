export type VisualMbti =
  | "INTJ" | "INTP" | "ENTJ" | "ENTP"
  | "INFJ" | "INFP" | "ENFJ" | "ENFP"
  | "ISTJ" | "ISFJ" | "ESTJ" | "ESFJ"
  | "ISTP" | "ISFP" | "ESTP" | "ESFP";

export type SceneObject =
  | "strategy-map" | "concept-lab" | "direction-board" | "possibility-field"
  | "people-map" | "meaning-notebook" | "shared-path" | "connection-garden"
  | "operations-check" | "support-route" | "action-board" | "team-pulse"
  | "tool-detail" | "craft-detail" | "action-route" | "live-exchange"
  | "neutral-panel";

export type CharacterSceneKit = {
  id: string;
  primaryObject: SceneObject;
  secondaryObjects: readonly string[];
  compositionAnchor: "prop" | "outward" | "recipient" | "surround";
  tileLayout: "aligned" | "open";
  tone: "settled" | "reflective" | "neutral";
  wingAccent?: "left" | "right";
};

type SceneKitRecipe = Omit<CharacterSceneKit, "tone" | "wingAccent">;

export const MBTI_SCENE_KITS = {
  INTJ: { id: "quiet-strategy", primaryObject: "strategy-map", secondaryObjects: ["decision-stack", "pattern-key"], compositionAnchor: "prop", tileLayout: "aligned" },
  INTP: { id: "open-concepts", primaryObject: "concept-lab", secondaryObjects: ["hypothesis-chip", "alternate-model"], compositionAnchor: "surround", tileLayout: "open" },
  ENTJ: { id: "forward-direction", primaryObject: "direction-board", secondaryObjects: ["milestone-card", "outcome-marker"], compositionAnchor: "outward", tileLayout: "aligned" },
  ENTP: { id: "branching-possibilities", primaryObject: "possibility-field", secondaryObjects: ["experiment-card", "option-chip"], compositionAnchor: "outward", tileLayout: "open" },
  INFJ: { id: "shared-context", primaryObject: "people-map", secondaryObjects: ["context-card", "relationship-pair"], compositionAnchor: "prop", tileLayout: "aligned" },
  INFP: { id: "personal-meaning", primaryObject: "meaning-notebook", secondaryObjects: ["reflection-card", "value-chip"], compositionAnchor: "surround", tileLayout: "open" },
  ENFJ: { id: "shared-direction", primaryObject: "shared-path", secondaryObjects: ["contribution-card", "route-pair"], compositionAnchor: "recipient", tileLayout: "aligned" },
  ENFP: { id: "open-connection", primaryObject: "connection-garden", secondaryObjects: ["connection-card", "possibility-bloom"], compositionAnchor: "recipient", tileLayout: "open" },
  ISTJ: { id: "practical-sequence", primaryObject: "operations-check", secondaryObjects: ["route-marker", "detail-card"], compositionAnchor: "prop", tileLayout: "aligned" },
  ISFJ: { id: "grounded-support", primaryObject: "support-route", secondaryObjects: ["shared-detail", "support-marker"], compositionAnchor: "recipient", tileLayout: "aligned" },
  ESTJ: { id: "active-coordination", primaryObject: "action-board", secondaryObjects: ["action-marker", "sequence-card"], compositionAnchor: "outward", tileLayout: "aligned" },
  ESFJ: { id: "responsive-team", primaryObject: "team-pulse", secondaryObjects: ["contribution-tile", "shared-marker"], compositionAnchor: "recipient", tileLayout: "aligned" },
  ISTP: { id: "close-inspection", primaryObject: "tool-detail", secondaryObjects: ["component-card", "inspection-chip"], compositionAnchor: "prop", tileLayout: "open" },
  ISFP: { id: "present-craft", primaryObject: "craft-detail", secondaryObjects: ["material-swatch", "detail-tile"], compositionAnchor: "surround", tileLayout: "open" },
  ESTP: { id: "immediate-route", primaryObject: "action-route", secondaryObjects: ["route-chip", "action-point"], compositionAnchor: "outward", tileLayout: "open" },
  ESFP: { id: "live-engagement", primaryObject: "live-exchange", secondaryObjects: ["activity-card", "exchange-token"], compositionAnchor: "recipient", tileLayout: "open" },
} as const satisfies Record<VisualMbti, SceneKitRecipe>;

const NEUTRAL_SCENE_KIT: CharacterSceneKit = {
  id: "neutral", primaryObject: "neutral-panel", secondaryObjects: [],
  compositionAnchor: "surround", tileLayout: "open", tone: "neutral",
};

export function resolveCharacterSceneKit(
  mbti: string | null | undefined,
  wing: "left" | "right" | null | undefined,
  assertiveness: "A" | "T" | null | undefined,
): CharacterSceneKit {
  if (!mbti || !Object.prototype.hasOwnProperty.call(MBTI_SCENE_KITS, mbti)) return NEUTRAL_SCENE_KIT;
  return {
    ...MBTI_SCENE_KITS[mbti as VisualMbti],
    tone: assertiveness === "A" ? "settled" : assertiveness === "T" ? "reflective" : "neutral",
    ...(wing ? { wingAccent: wing } : {}),
  };
}
