#!/usr/bin/env node
/**
 * bersihkan.mjs — privacy redaction of the RISET-050 folder before it can be published.
 *
 * What it does (deterministic, re-runnable):
 *   1. instrumen/petak-jujur2.mjs: the PRIVAT question block (never measured; nilai.mjs uses
 *      PUBLIK only) is replaced by an empty export.
 *   2. Every text file in this folder: names and private addresses are replaced by neutral,
 *      consistent placeholders ([PEMILIK], [USAHA-A], [INDUK], [HOST-LAN], ...).
 *   3. Writes BERSIH.json: per changed file the sha256 (LF-normalised) before → after, the
 *      count per placeholder, and the placeholder legend. No original name is written.
 *
 * The match patterns live OUTSIDE the repo (a private rules file), so this script and the
 * manifest never carry the names they remove.
 *
 *   node bersihkan.mjs --aturan <rules.json>            dry run: what would change
 *   node bersihkan.mjs --aturan <rules.json> --tulis    apply + write BERSIH.json
 *   node bersihkan.mjs --aturan <rules.json> --cek      exit 1 if any pattern still matches
 *
 * This is a redaction, not a data change: verdicts stay as locked. nilai.mjs accepts an
 * instrument hash only if it is the locked hash, or the "after" hash of a BERSIH.json entry
 * whose "before" is the locked hash.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const TEKS = /\.(mjs|js|json|jsonl|md|txt|html)$/;
const LEWATI = new Set(['BERSIH.json']);

export const sha = (s) => crypto.createHash('sha256').update(s.replace(/\r\n/g, '\n')).digest('hex');

export function buangPrivat(isi) {
  const awal = isi.indexOf('export const PRIVAT = [');
  if (awal < 0 || isi.startsWith('export const PRIVAT = [];', awal)) return isi; // already clean
  const doc = isi.lastIndexOf('/**', awal);
  const mulai = doc >= 0 && isi.slice(doc, awal).includes('*/') && !isi.slice(isi.indexOf('*/', doc) + 2, awal).trim() ? doc : awal;
  const akhir = isi.indexOf('\n];', awal);
  if (akhir < 0) throw new Error('blok PRIVAT tidak tertutup');
  return isi.slice(0, mulai) + '/** PETAK PRIVAT dikeluarkan dari salinan terbit (tidak pernah diukur; lihat BERSIH.json). */\nexport const PRIVAT = [];' + isi.slice(akhir + 3);
}

export function terapkan(isi, aturan) {
  const hitung = {};
  let out = isi;
  for (const a of aturan) {
    const re = new RegExp(a.pola, a.bendera);
    out = out.replace(re, () => { hitung[a.jadi] = (hitung[a.jadi] || 0) + 1; return a.jadi; });
  }
  return { out, hitung };
}

function semuaBerkas(d = DIR, acc = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) semuaBerkas(p, acc);
    else if (TEKS.test(e.name) && !LEWATI.has(e.name)) acc.push(p);
  }
  return acc.sort();
}

const LANGSUNG = process.argv[1] && fs.realpathSync(path.resolve(process.argv[1])) === fs.realpathSync(fileURLToPath(import.meta.url));
if (LANGSUNG) {
  const i = process.argv.indexOf('--aturan');
  if (i < 0) { console.error('perlu --aturan <rules.json> (berkas privat, di luar repo)'); process.exit(2); }
  const aturan = JSON.parse(fs.readFileSync(process.argv[i + 1], 'utf8')).ganti;
  const tulis = process.argv.includes('--tulis');
  const cek = process.argv.includes('--cek');
  const manifes = { dibuat: new Date().toISOString(), aturan: 'pola di berkas aturan privat (tidak di repo); hanya placeholder dicatat', placeholder: [...new Set(aturan.map((a) => a.jadi))], privat: 'instrumen/petak-jujur2.mjs: blok PRIVAT (3 soal, tidak pernah diukur) diganti `export const PRIVAT = []`', berkas: {} };
  const fm = path.join(DIR, 'BERSIH.json');
  const lama = fs.existsSync(fm) ? JSON.parse(fs.readFileSync(fm, 'utf8')) : { berkas: {} };
  let sisa = 0;
  for (const p of semuaBerkas()) {
    const rel = path.relative(DIR, p).replace(/\\/g, '/');
    const asli = fs.readFileSync(p, 'utf8');
    let baru = rel === 'instrumen/petak-jujur2.mjs' ? buangPrivat(asli) : asli;
    const { out, hitung } = terapkan(baru, aturan);
    baru = out;
    if (cek) { const n = Object.values(hitung).reduce((x, y) => x + y, 0) + (/export const PRIVAT = \[\s*\{/.test(asli) ? 1 : 0); if (n) { sisa += n; console.log(`MASIH ADA ${n}: ${rel}`); } continue; }
    if (baru === asli) continue;
    const gantiLama = lama.berkas[rel]?.ganti ?? {};
    for (const [k, v] of Object.entries(gantiLama)) hitung[k] = (hitung[k] || 0) + v; // counts add up across passes
    manifes.berkas[rel] = { sebelum: lama.berkas[rel]?.sebelum ?? sha(asli), sesudah: sha(baru), ganti: hitung };
    console.log(`${tulis ? 'ditulis' : 'akan diubah'}: ${rel} ${JSON.stringify(hitung)}`);
    if (tulis) fs.writeFileSync(p, baru);
  }
  if (cek) { console.log(sisa ? `GAGAL: ${sisa} kecocokan tersisa` : 'BERSIH: 0 kecocokan'); process.exit(sisa ? 1 : 0); }
  if (tulis) {
    for (const [k, v] of Object.entries(lama.berkas)) if (!manifes.berkas[k]) manifes.berkas[k] = v; // re-run keeps the first before-hash
    manifes.placeholder = [...new Set([...(lama.placeholder ?? []), ...manifes.placeholder])]; // legend of every pass
    if (lama.dibuat) manifes.putaran = [...(lama.putaran ?? [lama.dibuat]), manifes.dibuat];
    fs.writeFileSync(fm, JSON.stringify(manifes, null, 2) + '\n');
  }
}
