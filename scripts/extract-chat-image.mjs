// Pull images out of the chat transcript so they never have to be uploaded twice.
//
// An image pasted into the conversation reaches Claude as a picture, but not always as a file on
// disk — and without a file, none of the asset checks can run, so the image has to be sent again.
// The transcript keeps the bytes either way. This reads them straight out of it.
//
// This is a workflow aid, not part of the application: it depends on the transcript layout, which
// is owned by the CLI and can change. If it ever stops finding images, fall back to re-uploading.
//
// Usage:
//   npm run chat:images                      list the images in this conversation, newest first
//   npm run chat:images -- --save            save the newest one into the scratchpad
//   npm run chat:images -- --save --all      save every image
//   npm run chat:images -- --save --index 2  save a specific one from the list

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import readline from "node:readline";

const EXTENSIONS = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif" };

function parseArgs(argv) {
  const args = { save: false, all: false, index: null, outDir: null, transcript: null };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--save") args.save = true;
    else if (token === "--all") args.all = true;
    else if (token === "--index") args.index = Number(argv[++i]);
    else if (token === "--out-dir") args.outDir = argv[++i];
    else if (token === "--transcript") args.transcript = argv[++i];
    else throw new Error(`unknown option ${token}`);
  }
  return args;
}

// The CLI writes one transcript per session under a directory named after the project path. The
// newest is this conversation; there is no marker inside the file that identifies it more directly.
function findTranscript() {
  const root = path.join(os.homedir(), ".claude", "projects");
  if (!fs.existsSync(root)) throw new Error(`no transcript directory at ${root}`);
  const slug = process.cwd().replace(/[/.]/g, "-");
  const dir = fs.existsSync(path.join(root, slug)) ? path.join(root, slug) : null;
  const candidates = (dir ? [dir] : fs.readdirSync(root).map((d) => path.join(root, d)))
    .filter((d) => fs.statSync(d).isDirectory())
    .flatMap((d) => fs.readdirSync(d).filter((f) => f.endsWith(".jsonl")).map((f) => path.join(d, f)))
    .map((f) => ({ file: f, mtime: fs.statSync(f).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);
  if (!candidates.length) throw new Error(`no transcript found under ${root}`);
  return candidates[0].file;
}

function collectImages(node, sink) {
  if (Array.isArray(node)) { for (const item of node) collectImages(item, sink); return; }
  if (!node || typeof node !== "object") return;
  if (node.type === "image" && node.source?.type === "base64" && node.source.data) {
    sink.push({ mediaType: node.source.media_type, data: node.source.data });
    return;
  }
  for (const value of Object.values(node)) collectImages(value, sink);
}

async function readImages(transcript) {
  const found = [];
  const stream = readline.createInterface({
    input: fs.createReadStream(transcript, { encoding: "utf8" }),
    crlfDelay: Infinity,
  });
  let lineNumber = 0;
  for await (const line of stream) {
    lineNumber += 1;
    if (!line.includes('"image"')) continue;   // 16 MB of transcript, so skip the cheap way first
    let entry;
    try { entry = JSON.parse(line); } catch { continue; }
    const sink = [];
    collectImages(entry.message ?? entry, sink);
    for (const image of sink) {
      found.push({ ...image, lineNumber, role: entry.message?.role ?? entry.type ?? "unknown",
                   timestamp: entry.timestamp ?? null });
    }
  }
  return found;
}

const args = parseArgs(process.argv.slice(2));
const transcript = args.transcript ?? findTranscript();
const images = (await readImages(transcript)).reverse();   // newest first

if (!images.length) {
  console.log(`No images found in ${transcript}.`);
  process.exit(0);
}

const outDir = args.outDir
  ?? path.join(process.env.TMPDIR ?? "/tmp", "chat-images");

console.log(`transcript ${transcript}`);
console.log(`${images.length} image(s), newest first:\n`);

const chosen = args.all ? images.map((_, i) => i)
  : args.index !== null ? [args.index]
  : [0];

images.forEach((image, index) => {
  const bytes = Buffer.byteLength(image.data, "base64");
  const marker = args.save && chosen.includes(index) ? " <- saving" : "";
  const when = image.timestamp ? new Date(image.timestamp).toISOString().slice(11, 19) : "--:--:--";
  console.log(`  [${index}] ${when}  ${image.role.padEnd(9)} ${image.mediaType.padEnd(10)} `
    + `${String(Math.round(bytes / 1024)).padStart(5)} KB${marker}`);
});

if (!args.save) {
  console.log("\nNothing saved. Add --save to write the newest one, or --save --all for every image.");
  process.exit(0);
}

fs.mkdirSync(outDir, { recursive: true });
console.log("");
for (const index of chosen) {
  const image = images[index];
  if (!image) { console.error(`  no image at index ${index}`); process.exitCode = 1; continue; }
  const ext = EXTENSIONS[image.mediaType] ?? "bin";
  const target = path.join(outDir, `chat-image-${String(index).padStart(2, "0")}.${ext}`);
  fs.writeFileSync(target, Buffer.from(image.data, "base64"));
  console.log(`  wrote ${target} (${Math.round(fs.statSync(target).size / 1024)} KB)`);
}
