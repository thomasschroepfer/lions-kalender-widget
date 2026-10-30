#!/usr/bin/env node
// Baut die Seite nach dist/ – mit genau den Türchen, die (Berliner Zeit) schon offen sind.
//
//   node scripts/build.mjs                    # echtes heutiges Datum
//   node scripts/build.mjs --date 2026-12-06  # Vorschau für einen Tag (nur lokal!)
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, loadKey, decrypt } from './lib.mjs';

const cfg = JSON.parse(readFileSync(join(ROOT, 'config.json'), 'utf8'));
const dist = join(ROOT, 'dist');

function berlinNow() {
  const i = process.argv.indexOf('--date');
  if (i > 0) {
    const [y, m, d] = process.argv[i + 1].split('-').map(Number);
    return { y, m, d, h: 12 };
  }
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: cfg.timeZone, year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', hourCycle: 'h23',
    }).formatToParts(new Date()).map(p => [p.type, Number(p.value)]),
  );
  return { y: parts.year, m: parts.month, d: parts.day, h: parts.hour };
}

const now = berlinNow();
let released = 0;
if (now.y > cfg.year || (now.y === cfg.year && now.m === 12)) {
  released = now.y > cfg.year ? 24 : Math.min(24, now.h >= cfg.releaseHour ? now.d : now.d - 1);
}
const isToday = now.y === cfg.year && now.m === 12 && now.d === released;

const key = released > 0 ? loadKey() : null;
rmSync(dist, { recursive: true, force: true });
mkdirSync(join(dist, 'doors'), { recursive: true });

for (let day = 1; day <= released; day++) {
  const nn = String(day).padStart(2, '0');
  for (const f of [`${nn}.jpg`, `${nn}-thumb.jpg`]) {
    const enc = readFileSync(join(ROOT, 'encrypted', `${f}.enc`));
    writeFileSync(join(dist, 'doors', f), decrypt(key, enc));
  }
}

const data = { year: cfg.year, title: cfg.title, released, isToday, built: new Date().toISOString() };
const html = readFileSync(join(ROOT, 'site/index.html'), 'utf8').replace('/*DATA*/null', JSON.stringify(data));
writeFileSync(join(dist, 'index.html'), html);
writeFileSync(join(dist, 'robots.txt'), 'User-agent: *\nDisallow: /\n');

console.log(`Berlin ${now.y}-${now.m}-${now.d} ${now.h}h → ${released} Türchen veröffentlicht`);
