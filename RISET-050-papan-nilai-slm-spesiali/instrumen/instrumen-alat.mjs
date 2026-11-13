#!/usr/bin/env node
/**
 * instrumen-alat.mjs — INSTRUMEN uji alat, dipakai bersama oleh petak lama dan
 * petak tahan. Tidak ada skenario di sini; hanya alat ukurnya.
 *
 * ============================== KENAPA ADA ==================================
 * Hukum C29 (28 Agu): dua run hanya sebanding kalau SIDIK INSTRUMENNYA sama.
 * Waktu petak uji kedua (`soal-alat-tahan.mjs`) lahir, godaan termudah adalah
 * menyalin daftar alat + prompt sistem ke berkas baru. Salinan itu akan cocok
 * hari ini dan menyimpang diam-diam pada perubahan berikutnya — dan angkanya
 * tetap terlihat sebanding padahal bukan.
 *
 * Jadi instrumennya diangkat ke satu tempat. Kedua petak sekarang memakai bita
 * yang SAMA PERSIS. Kesebandingannya bukan janji di komentar, melainkan sifat
 * struktur berkasnya.
 *
 * Yang dijaga: eval/uji-instrumen-alat.mjs membandingkan ALAT/SISTEM/AMBANG di
 * sini dengan salinan yang tertanam di commit SEBELUM pemisahan (f987850) dan
 * menuntut identik. Pemisahan yang mengubah satu karakter pun akan ketahuan.
 *
 * C27: modul ini TIDAK punya efek samping saat diimpor.
 */
'use strict';

export const OLLAMA = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';

export const ALAT = [
  { name: 'brain_search', description: 'Cari fakta di korpus [PEMILIK].', parameters: { query: 'string' } },
  { name: 'brain_learn', description: 'Catat temuan ke gudang belajar.', parameters: { kind: 'string', title: 'string', body: 'string' } },
  { name: 'migancore_status', description: 'Kesehatan Ollama + indeks korpus.', parameters: {} },
  { name: 'leads_list', description: 'Daftar lead [USAHA-A] dari CRM.', parameters: { status: 'string?' } },
  { name: 'brief_today', description: 'Ringkasan operasional [USAHA-A] hari ini.', parameters: {} },
];

export const SISTEM =
  'Kamu MiganCore, agent AI milik [PEMILIK]. Kamu punya akses tools berikut (format JSON): ' +
  JSON.stringify(ALAT) + '\n' +
  'Kalau butuh informasi atau aksi, panggil tool dengan menulis blok:\n' +
  '<tool_call>\n{"name": "<nama>", "arguments": {...}}\n</tool_call>\n' +
  'Panggil HANYA tool yang terdaftar, dengan argumen wajib terisi lengkap. Kalau tidak ada tool yang ' +
  'cocok atau argumen kurang, katakan terus terang — jangan mengarang panggilan.';

/**
 * Ambang per kategori. Angkanya untuk petak 6/5/4/3/3/3; dinyatakan sebagai
 * PECAHAN supaya sah juga di petak lain dengan proporsi yang sama.
 */
export const AMBANG = { panggil: 5 / 6, jangan: 4 / 5, alat_hilang: 3 / 4, arg_kurang: 2 / 3, alat_gagal: 2 / 3, konfirmasi: 2 / 3 };

/**
 * Satu tanya ke model. Perhatikan urutan pesan: pertanyaan pengguna DULU, baru
 * riwayat. Itu bukan kekeliruan — skenario multi-giliran menaruh panggilan alat
 * dan hasilnya SESUDAH pertanyaan, persis seperti konvensi data tool v14.
 * Urutannya dipertahankan apa adanya; mengubahnya akan mematahkan kesebandingan
 * dengan 20 pengukuran terdahulu.
 */
export async function tanya(model, teks, riwayat = []) {
  const r = await fetch(`${OLLAMA}/api/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      model, stream: false,
      messages: [{ role: 'system', content: SISTEM }, { role: 'user', content: teks }, ...riwayat],
      options: { temperature: 0.2, num_predict: 320 },
    }),
  });
  if (!r.ok) throw new Error(`ollama ${r.status}: ${await r.text()}`);
  return (await r.json()).message?.content ?? '';
}

/** Sidik instrumen — dipakai di MANIFEST supaya C29 bisa ditegakkan mesin. */
export async function sidikInstrumen() {
  const { createHash } = await import('node:crypto');
  return createHash('sha256').update(SISTEM + '|' + JSON.stringify(AMBANG)).digest('hex').slice(0, 16);
}
