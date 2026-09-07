// Release control for the Core 2 pose & action pilot (INTJ, ISTJ, ENFP, ESFP x Female/Male/Neutral).
//
// This is the feature-flag boundary required by the system plan's SA contract gate. It exists so the
// Asset Gate E owner can withdraw the pilot without editing component code: set
// NEXT_PUBLIC_LIVING_CHARACTER_PILOT=off and rebuild. Turning it off routes every result through the
// existing neutral fallback and cannot change scoring, questions, challenge selection, profile,
// consent, confidence, Wing, or A/T behavior.
//
// Default is enabled so the flag's introduction does not itself alter what participants see.

export const LIVING_CHARACTER_PILOT_FLAG = "NEXT_PUBLIC_LIVING_CHARACTER_PILOT" as const;
export const LIVING_CHARACTER_PILOT_OFF = "off" as const;

/** Only the exact string "off" withdraws the pilot; anything else (including unset) keeps it enabled. */
export function isLivingCharacterPilotEnabled(rawFlag: string | undefined): boolean {
  return rawFlag !== LIVING_CHARACTER_PILOT_OFF;
}

// Referenced statically so Next.js inlines the value at build time; a dynamic lookup would not be inlined.
export const LIVING_CHARACTER_PILOT_ENABLED = isLivingCharacterPilotEnabled(
  process.env.NEXT_PUBLIC_LIVING_CHARACTER_PILOT,
);
