// Where the employee list comes from.
//
// Today: nowhere. `getRoster()` returns null and the profile form asks people to type their name
// and team, exactly as it did before. This module exists so that the *shape* of the eventual Slack
// integration is settled now, while the design is being drawn, rather than discovered later.
//
// The design consequence is the reason it is worth writing early: a form where you pick your name
// from a list is a different form from one where you type it, and the difference has to be in the
// mockups before they are drawn, not bolted on afterwards. Both states render today — set
// `getRoster` to return a list and the form becomes a picker with no other change.
//
// What is deliberately NOT written here is any Slack API code. The workspace, the app credentials
// and the scopes all live in the HR-owned account, and until that app exists the shape of what
// Slack actually returns — whether team is a profile field, a user group, or a separate list HR
// maintains — is a guess. Code written against a guess is code that gets rewritten, and worse, it
// looks finished while being wrong. The seam is the part that can be known now; the fetch is not.

export type RosterMember = {
  /** Display name as the participant expects to see it, e.g. "เบนซ์ Gorawit". */
  readonly name: string;
  /** Team label, matching the values HR approves for grouping. */
  readonly team: string;
};

export type Roster = readonly RosterMember[];

/**
 * The employee roster, or null when there is none and the participant should type their details.
 *
 * Null is not a failure state and must not be presented as one: the outing runs perfectly well with
 * people typing their own names, and that is the path that has to keep working whatever happens to
 * the Slack integration.
 */
export function getRoster(): Roster | null {
  return parseRoster(process.env.NEXT_PUBLIC_ROSTER);
}

/**
 * The roster comes from an environment variable, and the names are NOT committed.
 *
 * The calibration run needs a picker rather than two text fields — the same person types their own
 * name three ways across a set, and reconciling that by hand afterwards is both work and a chance
 * to guess wrong. But a list of employees and their teams is personal data, and the repository
 * moves to the HR-owned account in mid-October (docs/HR_DATA_AND_CONSENT.md). Putting six real
 * names in git to save one build-time variable would be the wrong trade in the wrong direction.
 *
 * So: set NEXT_PUBLIC_ROSTER to a JSON array of {name, team} at build time and the form becomes a
 * picker. Leave it unset and the form asks people to type, exactly as it does today.
 *
 *   NEXT_PUBLIC_ROSTER='[{"name":"เบนซ์ Gorawit","team":"Operation"}]' npm run build
 *
 * Exported for the tests, which is the only reason it is not local: a malformed value has to fall
 * back to typing rather than render an empty picker with no way past it, and that is worth
 * asserting rather than hoping.
 */
export function parseRoster(raw: string | undefined): Roster | null {
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // A typo in a deploy variable must not take the assessment down with it.
    return null;
  }
  if (!Array.isArray(parsed) || parsed.length === 0) return null;
  const members: RosterMember[] = [];
  for (const entry of parsed) {
    if (typeof entry !== "object" || entry === null) return null;
    const { name, team } = entry as Record<string, unknown>;
    if (typeof name !== "string" || typeof team !== "string") return null;
    if (name.trim() === "" || team.trim() === "") return null;
    members.push({ name: name.trim(), team: team.trim() });
  }
  // A duplicated name makes the picker ambiguous, which is the problem it exists to solve.
  if (new Set(members.map((member) => member.name)).size !== members.length) return null;
  return members;
}
