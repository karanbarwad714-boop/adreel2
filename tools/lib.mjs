// Shared crypto helpers. Must match the unlock code in index.html.
import { webcrypto as c } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const PRIVATE = path.join(ROOT, 'private');
export const DATA = path.join(ROOT, 'data');
export const SALT = 'adreel-academy-v1';
export const ITER = 250000;
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0 O 1 I

export const b64 = (u) => Buffer.from(u).toString('base64');
export const unb64 = (s) => new Uint8Array(Buffer.from(s, 'base64'));
export const hex = (u) => Buffer.from(u).toString('hex');
export const normCode = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

export function newCode() {
  const r = c.getRandomValues(new Uint8Array(12));
  const s = [...r].map((x) => ALPHABET[x % 32]).join('');
  return `ADREEL-${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8, 12)}`;
}

export async function deriveFromCode(code) {
  const enc = new TextEncoder();
  const base = await c.subtle.importKey('raw', enc.encode(normCode(code)), 'PBKDF2', false, ['deriveBits']);
  const bits = new Uint8Array(await c.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(SALT), iterations: ITER }, base, 384));
  return { id: hex(bits.slice(0, 16)), key: bits.slice(16, 48) };
}

export async function aesEncrypt(rawKey, bytes) {
  const iv = c.getRandomValues(new Uint8Array(12));
  const k = await c.subtle.importKey('raw', rawKey, 'AES-GCM', false, ['encrypt']);
  const ct = new Uint8Array(await c.subtle.encrypt({ name: 'AES-GCM', iv }, k, bytes));
  return { iv: b64(iv), ct: b64(ct) };
}

export function readKey() {
  const f = path.join(PRIVATE, 'secret.key');
  if (!fs.existsSync(f)) return null;
  return new Uint8Array(Buffer.from(fs.readFileSync(f, 'utf8').trim(), 'hex'));
}
export function ensureKey() {
  let k = readKey();
  if (!k) {
    fs.mkdirSync(PRIVATE, { recursive: true });
    k = c.getRandomValues(new Uint8Array(32));
    fs.writeFileSync(path.join(PRIVATE, 'secret.key'), hex(k) + '\n');
    console.log('Created private/secret.key. Keep it safe and never upload it.');
  }
  return k;
}
export function readAccess() {
  const f = path.join(DATA, 'access.json');
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : [];
}
export function writeAccess(list) {
  fs.mkdirSync(DATA, { recursive: true });
  fs.writeFileSync(path.join(DATA, 'access.json'), JSON.stringify(list, null, 1) + '\n');
}
export async function wrapEntry(code, K) {
  const { id, key } = await deriveFromCode(code);
  const { iv, ct } = await aesEncrypt(key, K);
  return { id, iv, w: ct };
}
