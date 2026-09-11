// The roster parser, which decides whether the profile form is a picker or two text fields.
//
// Every invalid case has to fall back to typing rather than to an empty picker: a participant
// facing a dropdown with nothing in it has no way to continue, and a typo in a deploy variable
// must not be able to take the assessment down with it.

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);
const projectRoot = path.resolve(import.meta.dirname, "..");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "roster-"));
ts.createProgram([path.join(projectRoot, "app/lib/roster.ts")], {
  target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS,
  moduleResolution: ts.ModuleResolutionKind.Node10, outDir: tmp, esModuleInterop: true, skipLibCheck: true,
}).emit();
const { parseRoster } = require(path.join(tmp, "roster.js"));

const typing = [
  ["unset", undefined],
  ["empty string", ""],
  ["not JSON", "เบนซ์, Operation"],
  ["not an array", '{"name":"a","team":"b"}'],
  ["empty array", "[]"],
  ["a string instead of a member", '["เบนซ์"]'],
  ["null member", "[null]"],
  ["missing team", '[{"name":"เบนซ์"}]'],
  ["missing name", '[{"team":"Operation"}]'],
  ["blank name", '[{"name":"  ","team":"Operation"}]'],
  ["blank team", '[{"name":"เบนซ์","team":" "}]'],
  ["a number where a name goes", '[{"name":1,"team":"Operation"}]'],
  ["duplicate names", '[{"name":"เบนซ์","team":"Operation"},{"name":"เบนซ์","team":"R&D"}]'],
];
for (const [label, value] of typing) {
  assert.equal(parseRoster(value), null, `${label} must fall back to typing, not to an empty picker`);
}

const one = parseRoster('[{"name":"เบนซ์ Gorawit","team":"Operation"}]');
assert.deepEqual(one, [{ name: "เบนซ์ Gorawit", team: "Operation" }], "a single valid member parses");

const six = parseRoster(JSON.stringify(
  Array.from({ length: 6 }, (_, index) => ({ name: `คนที่ ${index + 1}`, team: "Operation" }))));
assert.equal(six.length, 6, "a six-person team parses");

// Whitespace is trimmed, because a trailing space is how the same team becomes two teams in a
// calibration set.
assert.deepEqual(parseRoster('[{"name":" เบนซ์ ","team":" Operation "}]'),
  [{ name: "เบนซ์", team: "Operation" }], "names and teams are trimmed");

console.log(`Roster tests passed: ${typing.length} invalid inputs all fall back to typing, valid rosters parse and trim.`);
