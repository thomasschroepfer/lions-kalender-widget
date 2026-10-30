#!/usr/bin/env node
// Lokal (macOS) ausführen: skaliert die 24 Türchen-Bilder und legt sie
// verschlüsselt in encrypted/ ab. Nur encrypted/ wird committet.
//
//   node scripts/prepare.mjs [Bildordner]
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { ROOT, loadKey, encrypt } from './lib.mjs';

const srcDir = resolve(process.argv[2] ?? join(ROOT, 'input/test-images-doors'));
const outDir = join(ROOT, 'encrypted');
const key = loadKey({ create: true });

// Türchennummer = letzte Zahl im Dateinamen ("Tuerchen- 2.JPG", "Tuerchen-22JPG.jpeg")
const doors = new Map();
for (const name of readdirSync(srcDir)) {
  if (!/\.(jpe?g|png|heic|webp)$/i.test(name)) continue;
  const nums = name.replace(/\.[^.]+$/, '').match(/\d+/g);
  const day = nums && Number(nums.at(-1));
  if (!day || day < 1 || day > 24) { console.warn(`Übersprungen (keine Nummer 1–24): ${name}`); continue; }
  if (doors.has(day)) throw new Error(`Türchen ${day} doppelt: ${doors.get(day)} und ${name}`);
  doors.set(day, name);
}
const missing = Array.from({ length: 24 }, (_, i) => i + 1).filter(d => !doors.has(d));
if (missing.length) console.warn(`Achtung, es fehlen Türchen: ${missing.join(', ')}`);

const tmp = mkdtempSync(join(tmpdir(), 'doors-'));
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir);

const sips = (src, size, out) =>
  execFileSync('sips', ['-Z', String(size), '-s', 'format', 'jpeg', '-s', 'formatOptions', '82', src, '--out', out], { stdio: 'ignore' });

for (const [day, name] of [...doors].sort((a, b) => a[0] - b[0])) {
  const nn = String(day).padStart(2, '0');
  const full = join(tmp, `${nn}.jpg`), thumb = join(tmp, `${nn}-thumb.jpg`);
  sips(join(srcDir, name), 1200, full);
  sips(join(srcDir, name), 240, thumb);
  writeFileSync(join(outDir, `${nn}.jpg.enc`), encrypt(key, readFileSync(full)));
  writeFileSync(join(outDir, `${nn}-thumb.jpg.enc`), encrypt(key, readFileSync(thumb)));
  console.log(`Türchen ${nn} ← ${name}`);
}
rmSync(tmp, { recursive: true, force: true });
console.log(`\n${doors.size} Türchen verschlüsselt nach ${outDir}`);

// Neue (echte) Bilder → Testansicht sicherheitshalber abschalten
const cfgFile = join(ROOT, 'config.json');
const cfg = JSON.parse(readFileSync(cfgFile, 'utf8'));
if (cfg.simulateDate) {
  delete cfg.simulateDate;
  writeFileSync(cfgFile, JSON.stringify(cfg, null, 2) + '\n');
  console.log('Testansicht (simulateDate) in config.json abgeschaltet.');
}
