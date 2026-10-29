// Encrypts private/course.json into data/course.enc.json
// Usage: node tools/build.mjs
import fs from 'node:fs';
import path from 'node:path';
import { PRIVATE, DATA, ensureKey, aesEncrypt } from './lib.mjs';

const src = path.join(PRIVATE, 'course.json');
if (!fs.existsSync(src)) { console.error('Missing private/course.json'); process.exit(1); }
const course = JSON.parse(fs.readFileSync(src, 'utf8'));
for (const m of course.modules) {
  if (!/^[\w-]{11}$/.test(m.video)) { console.error('Bad YouTube id in', m.title); process.exit(1); }
}
const K = ensureKey();
const { iv, ct } = await aesEncrypt(K, new TextEncoder().encode(JSON.stringify(course)));
fs.mkdirSync(DATA, { recursive: true });
fs.writeFileSync(path.join(DATA, 'course.enc.json'), JSON.stringify({ v: 1, iv, ct }) + '\n');
console.log('Wrote data/course.enc.json with', course.modules.length, 'modules');
