/**
 * Where this app lives, for the things that have to say so out loud: the QR code a facilitator
 * projects before the activity, and the link a participant types.
 *
 * One constant rather than a literal in three places, because the value moves — the repository and
 * its hosting move to the HR-owned account in mid-October (docs/HR_ITEMS_OWED.md), and every place
 * that names the URL has to move with it. Set NEXT_PUBLIC_SITE_URL at build time and re-run
 * `npm run qr`; the gate below is what stops the QR and the printed link from disagreeing.
 */
export const SITE_URL: string = process.env.NEXT_PUBLIC_SITE_URL ?? "https://personality.tdfb.co";

/** What a person reads off a slide or types from a poster: no scheme, no trailing slash. */
export const SITE_URL_DISPLAY: string = SITE_URL.replace(/^https?:\/\//, "").replace(/\/$/, "");
