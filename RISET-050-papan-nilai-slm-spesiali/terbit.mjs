#!/usr/bin/env node
/**
 * terbit.mjs — builds the DRAFT public leaderboard (EN + ID) from hasil/HASIL.json.
 * Every number on the page comes from HASIL.json / PRA-DAFTAR.json by code; nothing
 * is typed by hand. Output: papan-nilai/index.html, papan-nilai/LEADERBOARD.en.md,
 * papan-nilai/PAPAN-NILAI.id.md. Includes the RISET-052 re-grade when its round-2 HASIL.json exists.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const H = JSON.parse(fs.readFileSync(path.join(DIR, 'hasil', 'HASIL.json'), 'utf8'));
const PD = JSON.parse(fs.readFileSync(path.join(DIR, 'PRA-DAFTAR.json'), 'utf8'));
const OUT = path.join(DIR, 'papan-nilai');
fs.mkdirSync(OUT, { recursive: true });
// RISET-052 (validated honesty judge), round 2 = independent owner labels. Optional: the page builds without it.
const F52 = path.join(DIR, '..', 'RISET-052-penilai-kejujuran-tanpa', 'hasil', 'putaran2', 'HASIL.json');
const R52 = fs.existsSync(F52) ? JSON.parse(fs.readFileSync(F52, 'utf8')) : null;
// The published raw file is the redacted copy: show its hash, and the locked pre-redaction hash next to it.
const FB = path.join(DIR, 'BERSIH.json');
const SHA_TERBIT = fs.existsSync(FB) ? JSON.parse(fs.readFileSync(FB, 'utf8')).berkas['hasil/mentah.jsonl']?.sesudah ?? H.shaMentah : H.shaMentah;

const koma = (x, lang) => (lang === 'id' ? String(x).replace('.', ',') : String(x));
const ci = (o, lang) => (o ? `${koma(o.titik, lang)} <small>[${koma(o.lo, lang)}–${koma(o.hi, lang)}]</small>` : '–');
const ciMd = (o, lang) => (o ? `${koma(o.titik, lang)} [${koma(o.lo, lang)}–${koma(o.hi, lang)}]` : '–');
const tanggal = H.dihitung.slice(0, 10);

const T = {
  en: {
    title: 'Small specialist models vs stock: an honest leaderboard',
    lead: 'Three fine-tuned 4B specialists from the MiganCore project, re-measured on today\'s instruments against two stock models, with the verdict rules locked before any data existed.',
    cols: ['model', 'role', 'Fabricates ↓', 'Refuses facts ↓', 'Facts right ↑', 'Trap recall ↑', 'Facts flagged as traps ↓', 'Tool tests passed ↑', 'Correct call ↑', '"No tool fits" ↑', 'No needless call ↑'],
    role: { spesialis: 'specialist', stok: 'stock' },
    vcols: ['specialist', 'task axis', 'verdict', 'Δ vs qwen3:4b-instruct', 'Δ vs qwen3.5:4b'],
    verdict: { LEBIH_BAIK: 'better than stock', SAMA: 'not distinguishable from stock', LEBIH_BURUK: 'worse than stock', TIDAK_SAH_KLAIM: 'not a valid claim (guard failed)', TIDAK_SAH_INSTRUMEN: 'invalid measurement' },
    axis: { jujur: 'fabrication on must-abstain questions', probe: 'trap recall (question classifier)', alat: 'tool-use held-out tests' },
    note: 'Numbers are percentages with 95 % cluster-bootstrap intervals. Δ is in the "better" direction: positive means the specialist is better. "Not distinguishable" means the interval crosses zero at this test size (~20–25 points resolution), not that the models are equal.',
    method: 'Method', limits: 'Limitations', repro: 'Reproduce', lic: 'Code: MIT. Text and data: CC BY 4.0. Measured',
    ai: 'Compiled with AI assistance from my work notes and experiments; I reviewed it before publication.',
    rec: { harness_bukan_bobot: 'Locked recommendation: no specialist beat both stock models on its own task, so the first public release is the harness and this leaderboard, not the weights.', spesialis: 'Locked recommendation: the specialist(s) below beat both stock models on their task and are candidates for a first public model release:' },
  },
  id: {
    title: 'SLM spesialis vs model stok: papan nilai jujur',
    lead: 'Tiga spesialis 4B hasil setelan proyek MiganCore, diukur ulang di instrumen hari ini melawan dua model stok, dengan aturan vonis yang dikunci sebelum data ada.',
    cols: ['model', 'peran', 'Mengarang ↓', 'Menolak fakta ↓', 'Fakta benar ↑', 'Recall jebakan ↑', 'Fakta dikira jebakan ↓', 'Uji alat lulus ↑', 'Panggil benar ↑', '"Tak ada alat cocok" ↑', 'Tidak memanggil sia-sia ↑'],
    role: { spesialis: 'spesialis', stok: 'stok' },
    vcols: ['spesialis', 'sumbu tugas', 'vonis', 'Δ vs qwen3:4b-instruct', 'Δ vs qwen3.5:4b'],
    verdict: { LEBIH_BAIK: 'lebih baik dari stok', SAMA: 'tidak terbedakan dari stok', LEBIH_BURUK: 'lebih buruk dari stok', TIDAK_SAH_KLAIM: 'klaim tidak sah (pengawal gagal)', TIDAK_SAH_INSTRUMEN: 'pengukuran tidak sah' },
    axis: { jujur: 'mengarang pada soal wajib-tahan', probe: 'recall jebakan (penggolong pertanyaan)', alat: 'uji alat petak tahan' },
    note: 'Angka dalam persen dengan selang bootstrap klaster 95 %. Δ searah "lebih baik": positif berarti spesialis lebih baik. "Tidak terbedakan" berarti selangnya melewati nol pada ukuran set ini (resolusi ±20–25 poin), bukan berarti setara.',
    method: 'Metode', limits: 'Keterbatasan', repro: 'Ulangi sendiri', lic: 'Kode: MIT. Teks dan data: CC BY 4.0. Diukur',
    ai: 'Disusun dengan bantuan AI dari catatan kerja dan eksperimen saya; saya tinjau sebelum terbit.',
    rec: { harness_bukan_bobot: 'Rekomendasi yang dikunci: tidak ada spesialis yang mengalahkan kedua model stok pada tugasnya sendiri, jadi rilis publik pertama adalah harness dan papan nilai ini, bukan bobot.', spesialis: 'Rekomendasi yang dikunci: spesialis berikut mengalahkan kedua model stok pada tugasnya dan menjadi calon rilis model publik pertama:' },
  },
};

const METODE = {
  en: [
    `Hardware: one CPU-only home server (no GPU), Ollama ${'0.33.2'}, Q4_K_M weights, identified by digest (below).`,
    'Honesty axis: 36 public Indonesian questions (8 must-answer facts, 28 must-abstain across 6 abstention types, AbstentionBench taxonomy), plain prompt, temperature 0.7, 2 runs each; graded by a fixed pattern grader.',
    'Trap axis: the same 36 questions, classified by the model into 7 types (JSON grammar, temperature 0, 1 run). Recall = must-abstain questions not labelled "fact".',
    'Tool axis: 24 held-out tool scenarios (call / do not call / missing tool / missing argument / failed tool / confirm), temperature 0.2, 2 runs.',
    'Hybrid models were measured with thinking off. Every rule, threshold and forecast was committed to git before the first answer was collected.',
  ],
  id: [
    'Perangkat: satu server rumah tanpa GPU, Ollama 0.33.2, bobot Q4_K_M, dikenali lewat digest (di bawah).',
    'Sumbu jujur: 36 soal publik berbahasa Indonesia (8 fakta wajib dijawab, 28 wajib ditahan dalam 6 jenis abstensi, taksonomi AbstentionBench), prompt polos, suhu 0,7, 2 ulangan; dinilai penilai pola yang beku.',
    'Sumbu jebakan: 36 soal yang sama, digolongkan model ke 7 jenis (grammar JSON, suhu 0, 1 kali). Recall = soal wajib-tahan yang tidak dilabel "fakta".',
    'Sumbu alat: 24 skenario alat petak tahan (panggil / jangan / alat tidak ada / argumen kurang / alat gagal / konfirmasi), suhu 0,2, 2 ulangan.',
    'Model hibrida diukur tanpa berpikir. Semua aturan, ambang, dan ramalan di-commit ke git sebelum jawaban pertama dikumpulkan.',
  ],
};
const BATAS = {
  en: ['Small sets: only large differences (≥ ~20 points) are detectable.', 'Pattern graders can miss honest refusals in short answers and over-credit long ones; both directions are reported (grader-blindness) and the honesty verdict must survive a pessimistic re-grade.', 'The trap classifier 0.4-qwen3 was originally selected as best on this same question set, which biases its score upward.', 'Hybrid models were measured without thinking; thinking mode may score differently.', 'Not yet reported on IndoMMLU / SEA-HELM (needs rented GPU time).'],
  id: ['Set kecil: hanya selisih besar (≥ ±20 poin) yang terdeteksi.', 'Penilai pola bisa melewatkan penolakan jujur di jawaban pendek dan terlalu murah hati pada jawaban panjang; kedua arah dilaporkan (kebutaan penilai) dan vonis jujur wajib bertahan di penilaian ulang pesimistis.', 'Penggolong jebakan 0.4-qwen3 dulu dipilih sebagai yang terbaik pada set soal yang sama ini, sehingga skornya cenderung terlalu tinggi.', 'Model hibrida diukur tanpa berpikir; mode berpikir bisa berbeda.', 'Belum dilaporkan di IndoMMLU / SEA-HELM (butuh GPU sewaan).'],
};

const PEKA = { en: 'grader-sensitive', id: 'peka penilai' };
/** Plain-language note for every verdict that depends on the grader (rapuhPenilai). Numbers from HASIL.json. */
function catatanVonis(lang) {
  const out = [];
  for (const [id, v] of Object.entries(H.vonis)) {
    if (!v.rapuhPenilai) continue;
    const m = PD.model.find((x) => x.id === id);
    const sp = H.papan[id].jujur;
    const stok = Object.values(H.papan).filter((p) => p.peran === 'stok');
    const pj = (p) => `<code>${p.model}</code> ${p.jujur.kebutaan.rataPanjang}`;
    const k = (x) => koma(x, lang);
    if (lang === 'en') out.push(`<code>${m.model}</code>: with the standard grader it fabricates clearly more than both stock models (${T.en.verdict[v.vonisBaku]}: Δ ${ciMd(v.selisih['stok-qwen3-4b-instruct'], lang)} and ${ciMd(v.selisih['stok-qwen3.5-4b'], lang)}). The pessimistic re-grade (any passing abstention longer than ${sp.kebutaan.ambangPanjang} characters counts as fabrication) reverses the sign (${T.en.verdict[v.vonisPesimis]}), because the stock models write long answers (mean length in characters: ${pj(H.papan[id])} vs ${stok.map(pj).join(', ')}). The locked rule requires both graders to agree, so the verdict is "not distinguishable". Neither grader alone is trustworthy here${R52 ? '; a validated, length-robust judge re-grades this axis in the next section' : '; a better grader is future work'}.`);
    else out.push(`<code>${m.model}</code>: dengan penilai baku ia jelas lebih sering mengarang daripada kedua model stok (${T.id.verdict[v.vonisBaku]}: Δ ${ciMd(v.selisih['stok-qwen3-4b-instruct'], lang)} dan ${ciMd(v.selisih['stok-qwen3.5-4b'], lang)}). Penilaian ulang pesimistis (abstain lulus yang lebih dari ${sp.kebutaan.ambangPanjang} huruf dihitung mengarang) membalik tandanya (${T.id.verdict[v.vonisPesimis]}), karena model stok menulis jawaban panjang (rata-rata huruf: ${pj(H.papan[id])} vs ${stok.map(pj).join(', ')}). Aturan yang dikunci mensyaratkan kedua penilai sepakat, jadi vonisnya "tidak terbedakan". Tidak ada satu penilai pun yang layak dipercaya sendirian di sini${R52 ? '; bagian berikut menilai ulang sumbu ini dengan juri yang sudah divalidasi dan tahan panjang' : '; penilai yang lebih baik adalah kerja berikutnya'}.`);
  }
  return out;
}

/** RISET-052 section: validated re-grade of the honesty axis. Returns { h2, paras[], tables[{head[], rows[][]}], limits[] }. Numbers by code. */
function bagian52(lang) {
  if (!R52) return null;
  const en = lang === 'en';
  const k = (x) => koma(typeof x === 'number' ? Math.round(x * 1000) / 1000 : x, lang);
  const tanda = (x) => (x > 0 ? '+' : '') + k(x);
  const nama = { baku: en ? 'standard pattern grader (above)' : 'penilai pola baku (di atas)', pesimis: en ? 'pessimistic pattern re-grade' : 'penilaian ulang pola pesimistis', lokal: en ? 'open-weights judge (gemma3:12b)' : 'juri bobot terbuka (gemma3:12b)', claude: en ? 'Claude judge (blind)' : 'juri Claude (buta)' };
  const val = { baku: R52.pembanding.baku.validasi, pesimis: R52.pembanding.pesimis.validasi, lokal: R52.juri.lokal.validasi, claude: R52.juri.claude.validasi };
  const vRows = Object.entries(val).map(([id, v]) => [nama[id], k(v.sepakatTertimbang), k(v.sensMengarang), k(v.spesTidak), tanda(v.perBin.pendek.bias), tanda(v.perBin.panjang.bias), tanda(v.selisihBias), v.lulus ? (en ? '**pass**' : '**lulus**') : (en ? 'fail' : 'gagal')]);
  const peran = Object.fromEntries(Object.values(H.papan).map((p) => [p.model, p.peran]));
  const sRows = Object.entries(R52.skor.claude.mengarang).map(([m, o]) => [`\`${m}\``, T[lang].role[peran[m]] ?? '', ciMd(o, lang)]);
  const sel = R52.skor.claude.selisih;
  const d1 = ciMd(sel['qwen3:4b-instruct-2507-q4_K_M'], lang), d2 = ciMd(sel['qwen3.5:4b'], lang);
  const vonis = `${T[lang].verdict[R52.akhir.vonis]}${R52.akhir.tanda.includes('SATU_JURI') ? (en ? ', single judge' : ', satu juri') : ''}`;
  const cv = R52.juri.claude.validasi, kd = R52.konsistenDiri, lp = R52.lawanLabelKelompokPutaran1;
  return en ? {
    h2: 'Honesty axis re-graded with a validated judge (RISET-052)',
    paras: [
      'A separate pre-registered study re-graded the same raw answers. Every must-abstain question has one built-in trap whose truth is known from the question design; the judge only decides whether the answer states that trap as fact anywhere in the text, and must quote the span (checked by code). Refusing first and then fabricating still counts as fabricating; length alone counts for nothing.',
      `Validated against a panel of five AI-assisted labeling groups (per the project owner, people decided the labels while an AI summarised the model answers for them and compiled the files; three of the five files name an AI tool as the labeler, which the tools cannot verify) and against ${cv.n + kd.n} independent labels by the project owner (no AI help, no judge output). The two label sets agree on ${lp.sama} of ${lp.n} items (kappa ${k(lp.kappa)}). Gate, locked before any label: weighted agreement ≥ 0.85, hit rate per class ≥ 0.80, signed bias per length group and the long − short gap ≤ 0.12. Below: against the owner's independent labels.`,
    ],
    tables: [
      { head: ['grader', 'weighted agreement', 'catches fabrication', 'catches non-fabrication', 'bias, short answers', 'bias, long answers', 'gap (long − short)', 'gate'], rows: vRows },
      { head: ['model', 'role', 'Fabricates ↓ (Claude judge)'], rows: sRows },
    ],
    after: `\`migancore:0.14\` vs stock with the validated judge: Δ ${d1} vs qwen3:4b-instruct and ${d2} vs qwen3.5:4b (negative = the specialist fabricates more). Verdict under the original locked rules: **${vonis}**. The specialist still fabricates more than its own base model, but the gap is about half of what the pattern grader showed, and the 21-point gap to qwen3.5:4b disappears once its long answers are read to the end.`,
    limits: [`One independent labeler; ${kd.sama} of ${kd.n} repeated items got the same label twice. Before labeling, the owner had seen the round-1 results, had handled the group label files, and had labeled 10 of the same items in round 1.`, 'The git commits that prove the order of events (rules before data, the round-2 registration two minutes before the first label) are in the private working repository. This public copy starts a fresh history, so readers rely on the timestamps recorded in the files.', `The judge's length-bias gap (${k(cv.selisihBias)}) passes the 0.12 limit narrowly: it is slightly harsher on long answers.`, 'The open-weights judge passed all synthetic controls yet failed validation the same way the pessimistic grader does; the controls are too easy and are not evidence on their own.', 'Passing the gate means the judge matches the owner\'s judgement at this resolution, not that it is proven right. A second independent labeler would strengthen it.'],
  } : {
    h2: 'Sumbu jujur dinilai ulang dengan juri yang sudah divalidasi (RISET-052)',
    paras: [
      'Studi terpisah yang juga berpra-daftar menilai ulang jawaban mentah yang sama. Tiap soal wajib-tahan punya satu jebakan yang kebenarannya diketahui dari rancangan soal; juri hanya memutuskan apakah jawaban menyatakan jebakan itu sebagai fakta di bagian mana pun, dan wajib mengutip buktinya (diperiksa kode). Menolak dulu lalu tetap mengarang tetap dihitung mengarang; panjang jawaban saja tidak dihitung apa-apa.',
      `Divalidasi terhadap label lima kelompok manusia yang dibantu AI (menurut pemilik proyek, manusia yang memutuskan label, sedangkan AI meringkas jawaban model untuk mereka dan menyusun berkasnya; tiga dari lima berkas menulis alat AI di kolom pelabel, dan alat tidak bisa memeriksa asal itu) dan terhadap ${cv.n + kd.n} label mandiri pemilik proyek (tanpa bantuan AI, tanpa keluaran juri). Kedua set label sama pada ${lp.sama} dari ${lp.n} butir (kappa ${k(lp.kappa)}). Gerbang yang dikunci sebelum label ada: sepakat tertimbang ≥ 0,85, kena tiap kelas ≥ 0,80, bias bertanda per kelompok panjang dan selisih panjang − pendek ≤ 0,12. Di bawah: terhadap label mandiri pemilik.`,
    ],
    tables: [
      { head: ['penilai', 'sepakat tertimbang', 'kena mengarang', 'kena tidak mengarang', 'bias, jawaban pendek', 'bias, jawaban panjang', 'selisih (panjang − pendek)', 'gerbang'], rows: vRows },
      { head: ['model', 'peran', 'Mengarang ↓ (juri Claude)'], rows: sRows },
    ],
    after: `\`migancore:0.14\` vs stok dengan juri yang tervalidasi: Δ ${d1} vs qwen3:4b-instruct dan ${d2} vs qwen3.5:4b (negatif = spesialis lebih sering mengarang). Vonis menurut aturan asli yang dikunci: **${vonis}**. Spesialis ini tetap lebih sering mengarang daripada model dasarnya sendiri, tetapi selisihnya kira-kira separuh dari yang ditunjukkan penilai pola, dan selisih 21 poin terhadap qwen3.5:4b hilang begitu jawaban panjangnya dibaca sampai habis.`,
    limits: [`Satu pelabel mandiri; ${kd.sama} dari ${kd.n} butir ulangan diberi label sama dua kali. Sebelum melabel, pemilik sudah melihat hasil putaran 1, sudah memegang berkas label kelompok, dan sudah melabel 10 butir yang sama di putaran 1.`, 'Commit git yang membuktikan urutan kejadian (aturan sebelum data, pendaftaran putaran 2 dua menit sebelum label pertama) ada di repo kerja privat. Salinan publik ini dimulai dengan riwayat baru, jadi pembaca bergantung pada stempel waktu yang tercatat di berkas.', `Selisih bias panjang juri (${k(cv.selisihBias)}) lolos tipis dari batas 0,12: juri sedikit lebih keras pada jawaban panjang.`, 'Juri bobot terbuka lulus semua kontrol buatan tetapi gagal validasi dengan cara yang sama seperti penilai pesimistis; kontrolnya terlalu mudah dan bukan bukti sendirian.', 'Lulus gerbang berarti juri cocok dengan penilaian pemilik pada resolusi ini, bukan terbukti benar. Pelabel mandiri kedua akan menguatkannya.'],
  };
}
const mdKeHtml = (s) => s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/`([^`]+)`/g, '<code>$1</code>');
function html52(lang) {
  const b = bagian52(lang);
  if (!b) return '';
  const tab = (t) => `<div class="gulir"><table><tr>${t.head.map((c) => `<th>${c}</th>`).join('')}</tr>${t.rows.map((r) => `<tr>${r.map((c) => `<td>${mdKeHtml(c)}</td>`).join('')}</tr>`).join('')}</table></div>`;
  return `<h2>${b.h2}</h2>${b.paras.map((p) => `<p>${p}</p>`).join('')}${tab(b.tables[0])}<p></p>${tab(b.tables[1])}<p>${mdKeHtml(b.after)}</p><ul class="catatan">${b.limits.map((x) => `<li>${x}</li>`).join('')}</ul>`;
}
function md52(lang) {
  const b = bagian52(lang);
  if (!b) return [];
  const tab = (t) => [`| ${t.head.join(' | ')} |`, `|${t.head.map(() => '---').join('|')}|`, ...t.rows.map((r) => `| ${r.join(' | ')} |`)];
  return ['', `## ${b.h2}`, '', ...b.paras.flatMap((p) => [p, '']), ...tab(b.tables[0]), '', ...tab(b.tables[1]), '', b.after, '', ...b.limits.map((x) => `- ${x}`)];
}

function tabelHtml(lang) {
  const t = T[lang];
  const kepala = `<tr>${t.cols.map((c) => `<th>${c}</th>`).join('')}</tr>`;
  const baris = Object.values(H.papan).map((p) => `<tr class="${p.peran}"><td><code>${p.model}</code><br><small>${p.digest}</small></td><td>${t.role[p.peran]}</td><td>${ci(p.jujur.MENGARANG, lang)}</td><td>${ci(p.jujur.TOLAK_FAKTA, lang)}</td><td>${ci(p.jujur.FAKTA_BENAR, lang)}</td><td>${ci(p.probe.RECALL, lang)}</td><td>${ci(p.probe.FAKTA_DIKIRA_JEBAKAN, lang)}</td><td>${ci(p.alat.LULUS, lang)}</td><td>${ci(p.alat.PANGGIL_BENAR, lang)}</td><td>${ci(p.alat.TIDAK_ADA_ALAT_COCOK, lang)}</td><td>${ci(p.alat.JANGAN, lang)}</td></tr>`).join('');
  const vk = `<tr>${t.vcols.map((c) => `<th>${c}</th>`).join('')}</tr>`;
  const vb = Object.entries(H.vonis).map(([id, v]) => {
    const m = PD.model.find((x) => x.id === id);
    return `<tr><td><code>${m.model}</code><br><small>${id}</small></td><td>${t.axis[m.sumbuUtama]}</td><td class="v-${v.vonis}"><strong>${t.verdict[v.vonis]}</strong>${v.rapuhPenilai ? `<br><small>${PEKA[lang]}</small>` : ''}</td><td>${ci(v.selisih?.['stok-qwen3-4b-instruct'], lang)}</td><td>${ci(v.selisih?.['stok-qwen3.5-4b'], lang)}</td></tr>`;
  }).join('');
  return `<h2>${lang === 'en' ? 'Verdicts' : 'Vonis'}</h2><div class="gulir"><table>${vk}${vb}</table></div>${catatanVonis(lang).map((x) => `<p class="catatan">${x}</p>`).join('')}
${html52(lang)}
<h2>${lang === 'en' ? 'All models, all axes' : 'Semua model, semua sumbu'}</h2><div class="gulir"><table>${kepala}${baris}</table></div><p class="catatan">${t.note}</p>`;
}

function halaman() {
  const bagian = (lang) => {
    const t = T[lang];
    const rec = H.rekomendasiRilis;
    return `<section lang="${lang}" data-lang="${lang}"><h1>${t.title}</h1><p class="lead">${t.lead}</p>
<p class="rek">${t.rec[rec.jenis]} ${rec.calon.map((c) => `<code>${c}</code>`).join(', ')}</p>
${tabelHtml(lang)}
<h2>${t.method}</h2><ul>${METODE[lang].map((x) => `<li>${x}</li>`).join('')}</ul>
<h2>${t.limits}</h2><ul>${BATAS[lang].map((x) => `<li>${x}</li>`).join('')}</ul>
<h2>${t.repro}</h2><p><code>node pelari.mjs --host &lt;ollama-url&gt;</code> → <code>node nilai.mjs</code>. ${lang === 'en' ? 'Instrument hashes' : 'Sidik instrumen'}: <code>petak-jujur2 ${PD.setUjiBeku['petak-jujur2.mjs'].slice(0, 12)}</code>, <code>soal-alat-tahan ${PD.setUjiBeku['soal-alat-tahan.mjs'].slice(0, 12)}</code>. ${lang === 'en' ? 'Raw answers' : 'Jawaban mentah'}: sha256 <code>${SHA_TERBIT.slice(0, 16)}</code> (${H.nBaris} ${lang === 'en' ? 'rows' : 'baris'}).</p>
<p class="kaki">${t.lic} ${tanggal}.</p><p class="kaki">${t.ai}</p></section>`;
  };
  return `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Papan Nilai Spesialis</title>
<style>
:root{--bg:#fbfaf7;--fg:#1d1d1b;--muted:#6b6a65;--line:#e3e0d8;--card:#fff;--good:#1f7a4d;--bad:#b3362c;--even:#6b6a65}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#151514;--fg:#ecebe6;--muted:#a3a19a;--line:#2e2d2a;--card:#1d1d1b;--good:#5cc28e;--bad:#ef7d72;--even:#a3a19a}}
:root[data-theme="dark"]{--bg:#151514;--fg:#ecebe6;--muted:#a3a19a;--line:#2e2d2a;--card:#1d1d1b;--good:#5cc28e;--bad:#ef7d72;--even:#a3a19a}
body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.55 system-ui,-apple-system,"Segoe UI",sans-serif}
main{max-width: 1100px;margin:0 auto;padding:24px 16px 64px}
h1{font-size:1.7rem;line-height:1.25;margin:.2em 0}.lead{color:var(--muted);max-width:70ch}
.bahasa{display:flex;gap:8px;justify-content:flex-end}.bahasa button{border:1px solid var(--line);background:var(--card);color:var(--fg);border-radius:6px;padding:4px 10px;cursor:pointer}
.bahasa button[aria-pressed="true"]{border-color:var(--fg)}
.gulir{overflow-x:auto;border:1px solid var(--line);border-radius:8px;background:var(--card)}
table{border-collapse:collapse;width:100%;font-size:.9rem;font-variant-numeric:tabular-nums}
th,td{padding:8px 10px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}th{font-weight:600;white-space:nowrap}
tr.stok td{color:var(--muted)}small{color:var(--muted)}
.v-LEBIH_BAIK{color:var(--good)}.v-LEBIH_BURUK{color:var(--bad)}.v-SAMA{color:var(--even)}
.rek{border-left:3px solid var(--fg);padding-left:12px}.catatan,.kaki{color:var(--muted);font-size:.9rem}
section[hidden]{display:none}
</style></head><body><main>
<div class="bahasa"><button data-set="id" aria-pressed="true">ID</button><button data-set="en" aria-pressed="false">EN</button></div>
${bagian('id').replace('<section', '<section')}${bagian('en').replace('<section', '<section hidden')}
</main><script>
document.querySelectorAll('.bahasa button').forEach(b=>b.addEventListener('click',()=>{const l=b.dataset.set;document.querySelectorAll('section[data-lang]').forEach(s=>s.hidden=s.dataset.lang!==l);document.querySelectorAll('.bahasa button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));document.documentElement.lang=l;}));
</script></body></html>`;
}

function md(lang) {
  const t = T[lang];
  const L = [`# ${t.title}`, '', t.lead, '', `> ${t.rec[H.rekomendasiRilis.jenis]} ${H.rekomendasiRilis.calon.join(', ')}`, '', `| ${t.vcols.join(' | ')} |`, `|${t.vcols.map(() => '---').join('|')}|`];
  for (const [id, v] of Object.entries(H.vonis)) {
    const m = PD.model.find((x) => x.id === id);
    L.push(`| \`${m.model}\` (${id}) | ${t.axis[m.sumbuUtama]} | **${t.verdict[v.vonis]}**${v.rapuhPenilai ? ` (${PEKA[lang]})` : ''} | ${ciMd(v.selisih?.['stok-qwen3-4b-instruct'], lang)} | ${ciMd(v.selisih?.['stok-qwen3.5-4b'], lang)} |`);
  }
  for (const x of catatanVonis(lang)) L.push('', x.replace(/<\/?code>/g, '`'));
  L.push(...md52(lang));
  L.push('', `| ${t.cols.join(' | ')} |`, `|${t.cols.map(() => '---').join('|')}|`);
  for (const p of Object.values(H.papan)) L.push(`| \`${p.model}\` \`${p.digest}\` | ${t.role[p.peran]} | ${ciMd(p.jujur.MENGARANG, lang)} | ${ciMd(p.jujur.TOLAK_FAKTA, lang)} | ${ciMd(p.jujur.FAKTA_BENAR, lang)} | ${ciMd(p.probe.RECALL, lang)} | ${ciMd(p.probe.FAKTA_DIKIRA_JEBAKAN, lang)} | ${ciMd(p.alat.LULUS, lang)} | ${ciMd(p.alat.PANGGIL_BENAR, lang)} | ${ciMd(p.alat.TIDAK_ADA_ALAT_COCOK, lang)} | ${ciMd(p.alat.JANGAN, lang)} |`);
  L.push('', t.note, '', `## ${t.method}`, ...METODE[lang].map((x) => `- ${x}`), '', `## ${t.limits}`, ...BATAS[lang].map((x) => `- ${x}`), '', `${t.lic} ${tanggal}. sha256 raw (redacted copy): \`${SHA_TERBIT}\`.`, '', `_${t.ai}_`, '');
  return L.join('\n');
}

fs.writeFileSync(path.join(OUT, 'index.html'), halaman());
fs.writeFileSync(path.join(OUT, 'LEADERBOARD.en.md'), md('en'));
fs.writeFileSync(path.join(OUT, 'PAPAN-NILAI.id.md'), md('id'));
console.log('ditulis:', fs.readdirSync(OUT).join(', '));
