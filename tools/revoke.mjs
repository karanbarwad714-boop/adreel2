// Removes one access code. Usage: node tools/revoke.mjs ADREEL-XXXX-XXXX-XXXX
// Then upload data/access.json. That code stops working on the customer's next visit.
import { readAccess, writeAccess, deriveFromCode } from './lib.mjs';
const code = process.argv[2];
if (!code) { console.error('Give the code to revoke'); process.exit(1); }
const { id } = await deriveFromCode(code);
const list = readAccess();
const next = list.filter((e) => e.id !== id);
if (next.length === list.length) { console.log('That code was not found.'); process.exit(0); }
writeAccess(next);
console.log('Revoked. Upload data/access.json');
