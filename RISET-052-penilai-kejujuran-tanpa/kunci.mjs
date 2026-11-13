#!/usr/bin/env node
/**
 * kunci.mjs — lock tool for RISET-052. Writes the `sidik` block into PRA-DAFTAR.json:
 * UTC time from the clock, the commit the code was read from, and LF-normalised
 * sha256 of the instrument files as stored in git (`git show HEAD:<path>`), plus
 * the raw-answer file. Inserted surgically before the closing brace (no line of
 * the pre-registration is rewritten). Refuses when already locked, when the
 * instrument files differ from HEAD, or when any result already exists.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const BERKAS = ['kunci-jebakan.mjs', 'penilai.mjs', 'analisis.mjs'];
const MENTAH = path.join(DIR, '..', 'RISET-050-papan-nilai-slm-spesiali', 'hasil', 'mentah.jsonl');
const git = (...a) => execFileSync('git', a, { cwd: DIR, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const sha = (t) => crypto.createHash('sha256').update(t.replace(/\r\n/g, '\n')).digest('hex');

const f = path.join(DIR, 'PRA-DAFTAR.json');
const isi = fs.readFileSync(f, 'utf8');
if (JSON.parse(isi).sidik) { console.error('MENOLAK: sudah dikunci'); process.exit(2); }
for (const n of ['hasil/juri-claude-populasi.jsonl', 'hasil/juri-lokal-populasi.jsonl', 'hasil/juri-claude-kontrol.jsonl', 'hasil/juri-lokal-kontrol.jsonl', 'validasi/kunci-sampel.json', 'validasi/label-manusia.json']) {
  if (fs.existsSync(path.join(DIR, n))) { console.error(`MENOLAK: ${n} sudah ada sebelum kunci`); process.exit(2); }
}
const akar = git('rev-parse', '--show-toplevel').trim();
const rel = (p) => path.relative(akar, p).replace(/\\/g, '/');
const berkas = {};
for (const n of BERKAS) {
  const diGit = git('show', `HEAD:${rel(path.join(DIR, n))}`);
  const diCakram = fs.readFileSync(path.join(DIR, n), 'utf8');
  if (sha(diGit) !== sha(diCakram)) { console.error(`MENOLAK: ${n} di cakram berbeda dari HEAD (commit dulu)`); process.exit(2); }
  berkas[n] = sha(diGit);
}
const sidik = { dikunci: new Date().toISOString(), commitKode: git('rev-parse', 'HEAD').trim(), berkas, mentah: sha(fs.readFileSync(MENTAH, 'utf8')) };
const i = isi.lastIndexOf('}');
const blok = `,\n  "sidik": ${JSON.stringify(sidik, null, 2).replace(/\n/g, '\n  ')}\n`;
fs.writeFileSync(f, isi.slice(0, i).replace(/\s+$/, '') + blok + '}\n');
JSON.parse(fs.readFileSync(f, 'utf8'));
console.log('dikunci', sidik);
