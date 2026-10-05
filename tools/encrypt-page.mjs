// Encrypts a self-contained HTML page into a password-gated wrapper.
// AES-256-GCM, key from PBKDF2-SHA256 (600k iterations). The plaintext never
// ships; without the password the page source holds only ciphertext.
// Usage: node tools/encrypt-page.mjs <source.html> <password> <out.html>
import { readFileSync, writeFileSync } from 'node:fs';
import { webcrypto as crypto } from 'node:crypto';

const [src, password, out] = process.argv.slice(2);
if (!src || !password || !out) { console.error('usage: <source.html> <password> <out.html>'); process.exit(1); }

const ITER = 600000;
const enc = new TextEncoder();
const salt = crypto.getRandomValues(new Uint8Array(16));
const iv = crypto.getRandomValues(new Uint8Array(12));
const base = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: ITER, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(readFileSync(src, 'utf8'))));
const b64 = (u) => Buffer.from(u).toString('base64');

const tpl = readFileSync(new URL('./gate-template.html', import.meta.url), 'utf8');
writeFileSync(out, tpl
  .replace('__PAYLOAD__', JSON.stringify({ iter: ITER, salt: b64(salt), iv: b64(iv), ct: b64(ct) })));
console.log(`wrote ${out} (${ct.length} bytes ciphertext)`);
