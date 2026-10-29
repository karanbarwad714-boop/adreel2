// Adds new access codes. Usage: node tools/add-codes.mjs 50
// Adds the codes to data/access.json (public, upload it) and private/codes.txt (keep private).
import fs from 'node:fs';
import path from 'node:path';
import { PRIVATE, readKey, readAccess, writeAccess, wrapEntry, newCode } from './lib.mjs';

const n = parseInt(process.argv[2] || '10', 10);
const K = readKey();
if (!K) { console.error('Missing private/secret.key. Run node tools/build.mjs first.'); process.exit(1); }
const list = readAccess();
const codes = [];
for (let i = 0; i < n; i++) {
  const code = newCode();
  list.push(await wrapEntry(code, K));
  codes.push(code);
}
writeAccess(list);
fs.mkdirSync(PRIVATE, { recursive: true });
const f = path.join(PRIVATE, 'codes.txt');
const had = fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : 'CODE | GIVEN TO (name / email) | DATE\n';
fs.writeFileSync(f, had + codes.map((c) => `${c} | |`).join('\n') + '\n');
console.log(`Added ${n} codes. Upload data/access.json. Codes are in private/codes.txt`);
