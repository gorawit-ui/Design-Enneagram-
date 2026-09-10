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
  return null;
}
