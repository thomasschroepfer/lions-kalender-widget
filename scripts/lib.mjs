// Gemeinsame Helfer: Schlüssel laden und AES-256-GCM ver-/entschlüsseln.
// Dateiformat: 12 Byte IV | 16 Byte Auth-Tag | Ciphertext
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const KEY_FILE = join(ROOT, '.door-key');

export function loadKey({ create = false } = {}) {
  let b64 = process.env.DOOR_KEY?.trim();
  if (!b64 && existsSync(KEY_FILE)) b64 = readFileSync(KEY_FILE, 'utf8').trim();
  if (!b64 && create) {
    b64 = randomBytes(32).toString('base64');
    writeFileSync(KEY_FILE, b64 + '\n', { mode: 0o600 });
    console.log(`Neuer Schlüssel erzeugt: ${KEY_FILE}`);
  }
  if (!b64) throw new Error('Kein Schlüssel: DOOR_KEY setzen oder .door-key anlegen.');
  const key = Buffer.from(b64, 'base64');
  if (key.length !== 32) throw new Error('DOOR_KEY muss 32 Byte (Base64) lang sein.');
  return key;
}

export function encrypt(key, plain) {
  const iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', key, iv);
  const body = Buffer.concat([c.update(plain), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), body]);
}

export function decrypt(key, data) {
  const d = createDecipheriv('aes-256-gcm', key, data.subarray(0, 12));
  d.setAuthTag(data.subarray(12, 28));
  return Buffer.concat([d.update(data.subarray(28)), d.final()]);
}
