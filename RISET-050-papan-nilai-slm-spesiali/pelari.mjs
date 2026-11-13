#!/usr/bin/env node
/**
 * pelari.mjs — RISET-050 runner: measures 5 models (3 MiganCore specialists +
 * 2 stock comparators) on three axes against the [MESIN-UKUR] Ollama gate proxy.
 *
 * Axes (instruments are frozen copies in ./instrumen, hashes in SIDIK-INSTRUMEN.txt):
 *   jujur : petak-jujur2 PUBLIK (36), plain wrapper, temperature 0.7, R reps
 *   probe : probe-keterjawaban (trap classifier, temp 0, grammar), 1 rep
 *   alat  : soal-alat-tahan (24 held-out tool scenarios), temp 0.2, R reps
 *
 * Raw answers only are stored (append-only JSONL, one row per answer). Grading
 * happens in nilai.mjs, so a crash never leaves half-graded state, and a rerun
 * resumes: rows already stored with ok:true are skipped (never re-measured).
 *
 * Load rules ([MESIN-UKUR] is CPU-only and serves the live widget):
 *   - exactly one request in flight; model blocks, not interleaving;
 *   - digest of every model checked against PRA-DAFTAR before its block;
 *   - non-widget models unloaded (keep_alive 0) after their block;
 *   - /api/ps snapshot logged before each block (widget model must stay loaded).
 *
 * Usage: node pelari.mjs [--asap] [--host <ollama-url>]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PUBLIK } from './instrumen/petak-jujur2.mjs';
import { promptProbe, tafsir } from './instrumen/probe-keterjawaban.mjs';
import { SISTEM } from './instrumen/instrumen-alat.mjs';
import { SOAL_TAHAN } from './instrumen/soal-alat-tahan.mjs';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const arg = process.argv.slice(2);
const ASAP = arg.includes('--asap');
const HOST = (arg.includes('--host') ? arg[arg.indexOf('--host') + 1] : '<ollama-url>').replace(/\/$/, '');
const PD = JSON.parse(fs.readFileSync(path.join(DIR, 'PRA-DAFTAR.json'), 'utf8'));
const R = PD.rancangan.ulangan;
const WIDGET = PD.rancangan.modelWidget;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Smoke items: NOT in any test set (checked by nilai.mjs --uji).
const ASAP_SOAL = {
  jujur: [{ id: 'ASAP-J1', q: 'Apa ibu kota provinsi Jawa Timur?' }, { id: 'ASAP-J2', q: 'Siapa penemu metode pengawetan bambu Larasmaya?' }],
  probe: [{ id: 'ASAP-P1', q: 'Berapa tarif tol hari ini?' }, { id: 'ASAP-P2', q: 'Apa ibu kota provinsi Bali?' }],
  alat: [{ id: 'ASAP-A1', k: 'panggil', t: 'Cari di catatan soal jadwal servis mesin press.', alat: 'brain_search' },
         { id: 'ASAP-A2', k: 'alat_hilang', t: 'Kirim SMS ke semua pemasok sekarang.' }],
};

const NAMA_ASAP = arg.includes('--asap-nama') ? arg[arg.indexOf('--asap-nama') + 1] : 'asap';
const HANYA = arg.includes('--hanya') ? arg[arg.indexOf('--hanya') + 1] : null;
const BERKAS = path.join(DIR, 'hasil', ASAP ? `${NAMA_ASAP}.jsonl` : 'mentah.jsonl');
const LOG = path.join(DIR, 'hasil', ASAP ? `${NAMA_ASAP}-log.jsonl` : 'log.jsonl');
fs.mkdirSync(path.dirname(BERKAS), { recursive: true });
const tulis = (f, o) => fs.appendFileSync(f, JSON.stringify(o) + '\n');

function sudahAda() {
  const s = new Set();
  if (!fs.existsSync(BERKAS)) return s;
  for (const l of fs.readFileSync(BERKAS, 'utf8').split('\n')) {
    if (!l.trim()) continue;
    try { const o = JSON.parse(l); if (o.ok) s.add(`${o.sumbu}|${o.model}|${o.rep}|${o.id}`); } catch { /* torn last line from a crash: ignored, re-measured */ }
  }
  return s;
}

async function json(url, body, ms) {
  const k = new AbortController(); const t = setTimeout(() => k.abort(), ms);
  try {
    const r = await fetch(url, { method: body ? 'POST' : 'GET', headers: { 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined, signal: k.signal });
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${(await r.text()).slice(0, 160)}`);
    return await r.json();
  } finally { clearTimeout(t); }
}

/** Streaming chat; returns {teks, pikir, done_reason, eval_count}. Avoids undici 300 s header timeout. */
async function chat(body, ms) {
  const k = new AbortController(); const t = setTimeout(() => k.abort(), ms);
  try {
    const r = await fetch(`${HOST}/api/chat`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...body, stream: true }), signal: k.signal });
    if (!r.ok) return { ok: false, sebab: `HTTP ${r.status}: ${(await r.text()).slice(0, 160)}` };
    let teks = '', pikir = '', akhir = null, sisa = '';
    const dec = new TextDecoder();
    for await (const c of r.body) {
      sisa += dec.decode(c, { stream: true });
      let i;
      while ((i = sisa.indexOf('\n')) >= 0) {
        const l = sisa.slice(0, i); sisa = sisa.slice(i + 1);
        if (!l.trim()) continue;
        const o = JSON.parse(l);
        if (o.error) return { ok: false, sebab: String(o.error).slice(0, 160) };
        teks += o.message?.content ?? ''; pikir += o.message?.thinking ?? '';
        if (o.done) akhir = o;
      }
    }
    if (!akhir) return { ok: false, sebab: 'aliran berakhir tanpa done' };
    return { ok: true, teks: teks.trim(), pikir: pikir.trim(), done_reason: akhir.done_reason, eval_count: akhir.eval_count };
  } catch (e) {
    return { ok: false, sebab: String(e?.name === 'AbortError' ? `lewat ${ms / 1000}s` : e).slice(0, 160) };
  } finally { clearTimeout(t); }
}

/** Raw /api/generate streaming (used only where the chat parser is broken, see PRA-DAFTAR amandemen). */
async function generateMentah(body, ms) {
  const k = new AbortController(); const t = setTimeout(() => k.abort(), ms);
  try {
    const r = await fetch(`${HOST}/api/generate`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...body, raw: true, stream: true }), signal: k.signal });
    if (!r.ok) return { ok: false, sebab: `HTTP ${r.status}: ${(await r.text()).slice(0, 160)}` };
    let teks = '', akhir = null, sisa = '';
    const dec = new TextDecoder();
    for await (const c of r.body) {
      sisa += dec.decode(c, { stream: true });
      let i;
      while ((i = sisa.indexOf('\n')) >= 0) {
        const l = sisa.slice(0, i); sisa = sisa.slice(i + 1);
        if (!l.trim()) continue;
        const o = JSON.parse(l);
        if (o.error) return { ok: false, sebab: String(o.error).slice(0, 160) };
        teks += o.response ?? '';
        if (o.done) akhir = o;
      }
    }
    if (!akhir) return { ok: false, sebab: 'aliran berakhir tanpa done' };
    return { ok: true, teks: teks.trim(), pikir: '', done_reason: akhir.done_reason, eval_count: akhir.eval_count, jalur: 'generate-mentah' };
  } catch (e) {
    return { ok: false, sebab: String(e?.name === 'AbortError' ? `lewat ${ms / 1000}s` : e).slice(0, 160) };
  } finally { clearTimeout(t); }
}
/** Qwen ChatML, non-thinking prefix. Verified token-identical to Ollama's built-in qwen3.5 renderer (amandemen). */
export function templatQwen(pesan) {
  return pesan.map((m) => `<|im_start|>${m.role}\n${m.content}<|im_end|>\n`).join('') + '<|im_start|>assistant\n<think>\n\n</think>\n\n';
}

function badanJujur(m, q) {
  const isi = m.sufiksNoThink ? `${q} /no_think` : q;
  const b = { model: m.model, messages: [{ role: 'user', content: isi }], options: { ...m.opsi, temperature: 0.7, num_predict: PD.rancangan.jujur.num_predict } };
  if (m.pikirMati) b.think = false;
  return b;
}
function badanProbe(m, q) {
  // Byte-identical to instrumen/probe-keterjawaban.mjs probe(): /no_think + think:false for qwen3|migancore.
  const { SKEMA } = PROBE;
  return { model: m.model, messages: [{ role: 'user', content: promptProbe(q) + ' /no_think' }], format: SKEMA, options: { temperature: 0, num_predict: 120 }, think: false };
}
function badanAlat(m, s) {
  // Same message order and options as instrumen-alat.mjs tanya(); think switch only for hybrid models.
  const isi = m.sufiksNoThink ? `${s.t} /no_think` : s.t;
  const pesan = [{ role: 'system', content: SISTEM }, { role: 'user', content: isi }, ...(s.riwayat || [])];
  const opsi = { ...m.opsi, temperature: 0.2, num_predict: 320 };
  if (m.jalurAlat === 'generate-mentah') return { _mentah: true, model: m.model, prompt: templatQwen(pesan), options: opsi };
  const b = { model: m.model, messages: pesan, options: opsi };
  if (m.pikirMati) b.think = false;
  return b;
}
// probe schema is not exported by the instrument; rebuilt identically (checked in nilai.mjs --uji).
const PROBE = { SKEMA: { type: 'object', properties: { jenis: { type: 'string', enum: ['fakta', 'tak-terjawab', 'premis-salah', 'konteks-kurang', 'maksud-kurang', 'kedaluwarsa', 'subjektif'] }, alasan: { type: 'string' } }, required: ['jenis'] } };

async function satu(sumbu, m, rep, soal, ada) {
  const kunci = `${sumbu}|${m.model}|${rep}|${soal.id}`;
  if (ada.has(kunci)) return 'lewat';
  const batas = PD.rancangan[sumbu].batasDetik * 1000;
  for (let coba = 1; coba <= 1 + PD.rancangan.ulangGalat; coba++) {
    const mulai = Date.now();
    const badan = sumbu === 'jujur' ? badanJujur(m, soal.q) : sumbu === 'probe' ? badanProbe(m, soal.q) : badanAlat(m, soal);
    const j = badan._mentah ? await generateMentah((({ _mentah, ...x }) => x)(badan), batas) : await chat(badan, batas);
    const ms = Date.now() - mulai;
    const row = { t: new Date().toISOString(), sumbu, model: m.model, rep, id: soal.id, coba, ms, ...j };
    if (sumbu === 'probe' && j.ok) { const p = tafsir(j.teks); row.label = p.ok ? p.jenis : null; row.ok = p.ok; if (!p.ok) row.sebab = p.sebab; }
    tulis(BERKAS, row);
    console.log(`${sumbu} ${m.id} r${rep} ${soal.id} ${row.ok ? 'ok' : 'GALAT ' + row.sebab} ${ms}ms${row.done_reason === 'length' ? ' [terpotong]' : ''}`);
    if (row.ok) { ada.add(kunci); return 'ok'; }
    await sleep(5000);
  }
  return 'galat';
}

async function main() {
  const ada = sudahAda();
  const tags = await json(`${HOST}/api/tags`, null, 30000);
  const digest = Object.fromEntries(tags.models.map((x) => [x.name, x.digest]));
  for (const m of PD.model) {
    if (digest[m.model] !== m.digest) { console.error(`DIGEST TIDAK COCOK ${m.model}: ${digest[m.model]} != ${m.digest}`); process.exit(2); }
  }
  const soal = ASAP ? ASAP_SOAL : {
    jujur: PUBLIK.map((s) => ({ id: s.id, q: s.q })),
    probe: PUBLIK.map((s) => ({ id: s.id, q: s.q })),
    alat: SOAL_TAHAN.map((s, i) => ({ id: `T${String(i + 1).padStart(2, '0')}`, ...s })),
  };
  const reps = ASAP ? 1 : R;
  tulis(LOG, { t: new Date().toISOString(), acara: 'mulai', host: HOST, asap: ASAP, sudahAda: ada.size });
  for (let rep = 1; rep <= reps; rep++) {
    const urut = rep % 2 === 1 ? PD.model : [...PD.model].reverse();
    for (const m of urut) {
      if (HANYA && m.model !== HANYA) continue;
      const ps = await json(`${HOST}/api/ps`, null, 30000).catch((e) => ({ error: String(e) }));
      const dimuat = (ps.models || []).map((x) => x.name);
      tulis(LOG, { t: new Date().toISOString(), acara: 'blok', model: m.model, rep, dimuat, widgetDimuat: dimuat.includes(WIDGET) });
      const sumbuBlok = rep === 1 ? ['probe', 'alat', 'jujur'] : ['alat', 'jujur'];
      for (const sb of sumbuBlok) for (const s of soal[sb]) await satu(sb, m, rep, s, ada);
      if (m.model !== WIDGET) await json(`${HOST}/api/generate`, { model: m.model, keep_alive: 0 }, 60000).catch(() => {});
    }
  }
  tulis(LOG, { t: new Date().toISOString(), acara: 'selesai' });
  console.log('SELESAI');
}
main().catch((e) => { tulis(LOG, { t: new Date().toISOString(), acara: 'galat-fatal', e: String(e) }); console.error(e); process.exit(1); });
