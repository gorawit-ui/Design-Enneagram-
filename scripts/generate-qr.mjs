// The QR code, generated into public/ as a static file.
//
// docs/ONSITE_ACTIVITY_50_MIN.md requires a QR and a short URL for pre-event operations and
// neither existed. Generated at BUILD time rather than drawn in the browser, for three reasons: it
// costs the client bundle nothing, it works when the venue's wifi does not, and a facilitator
// needs the same image for a slide and a printed poster, which a canvas in a React component
// cannot give them.
//
// Usage: NEXT_PUBLIC_SITE_URL=https://... npm run qr

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const QRCode = require("qrcode");
const projectRoot = path.resolve(import.meta.dirname, "..");
const OUT = path.join(projectRoot, "public");

const url = process.env.NEXT_PUBLIC_SITE_URL ?? "https://personality.tdfb.co";

// Error correction M: the printed poster will be photographed at an angle in a room with uneven
// light, and M tolerates ~15% damage without making the modules noticeably smaller. The margin is
// 2 rather than the default 4 because the page draws its own frame around it.
const options = { errorCorrectionLevel: "M", margin: 2, color: { dark: "#16362f", light: "#fefdfa" } };

const svg = await QRCode.toString(url, { ...options, type: "svg", width: 512 });
fs.writeFileSync(path.join(OUT, "qr.svg"), svg);
await QRCode.toFile(path.join(OUT, "qr.png"), url, { ...options, width: 1024 });

// The URL is written next to the images so the app and the gate can both read what was encoded,
// rather than trusting that whoever regenerated the images used the same value the app displays.
fs.writeFileSync(path.join(OUT, "qr.json"), `${JSON.stringify({ url, generated: new Date().toISOString().slice(0, 10) }, null, 2)}\n`);

const modules = (svg.match(/viewBox="0 0 (\d+)/) ?? [])[1];
console.log(`encoded: ${url}`);
console.log(`  public/qr.svg   ${modules}x${modules} modules, error correction M`);
console.log(`  public/qr.png   1024px`);
console.log(`  public/qr.json  what was encoded, for the app and the gate to check against`);
