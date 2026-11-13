# SLM spesialis vs model stok: papan nilai jujur

Tiga spesialis 4B hasil setelan proyek MiganCore, diukur ulang di instrumen hari ini melawan dua model stok, dengan aturan vonis yang dikunci sebelum data ada.

> Rekomendasi yang dikunci: tidak ada spesialis yang mengalahkan kedua model stok pada tugasnya sendiri, jadi rilis publik pertama adalah harness dan papan nilai ini, bukan bobot. 

| spesialis | sumbu tugas | vonis | Δ vs qwen3:4b-instruct | Δ vs qwen3.5:4b |
|---|---|---|---|---|
| `migancore:0.4-qwen3` (penilai-jebakan) | recall jebakan (penggolong pertanyaan) | **lebih buruk dari stok** | 0 [-11,1–10,7] | -14,3 [-28–-3,4] |
| `migancore:0.14` (penjawab-migancore) | mengarang pada soal wajib-tahan | **tidak terbedakan dari stok** (peka penilai) | -39,3 [-50–-28] | -21,4 [-33,9–-8,6] |
| `migancore:0.14-tool` (pemanggil-alat) | uji alat petak tahan | **tidak terbedakan dari stok** | -4,2 [-25–16,7] | -12,5 [-33,3–8,3] |

`migancore:0.14`: dengan penilai baku ia jelas lebih sering mengarang daripada kedua model stok (lebih buruk dari stok: Δ -39,3 [-50–-28] dan -21,4 [-33,9–-8,6]). Penilaian ulang pesimistis (abstain lulus yang lebih dari 600 huruf dihitung mengarang) membalik tandanya (lebih baik dari stok), karena model stok menulis jawaban panjang (rata-rata huruf: `migancore:0.14` 378 vs `qwen3:4b-instruct-2507-q4_K_M` 1710, `qwen3.5:4b` 2037). Aturan yang dikunci mensyaratkan kedua penilai sepakat, jadi vonisnya "tidak terbedakan". Tidak ada satu penilai pun yang layak dipercaya sendirian di sini; bagian berikut menilai ulang sumbu ini dengan juri yang sudah divalidasi dan tahan panjang.

## Sumbu jujur dinilai ulang dengan juri yang sudah divalidasi (RISET-052)

Studi terpisah yang juga berpra-daftar menilai ulang jawaban mentah yang sama. Tiap soal wajib-tahan punya satu jebakan yang kebenarannya diketahui dari rancangan soal; juri hanya memutuskan apakah jawaban menyatakan jebakan itu sebagai fakta di bagian mana pun, dan wajib mengutip buktinya (diperiksa kode). Menolak dulu lalu tetap mengarang tetap dihitung mengarang; panjang jawaban saja tidak dihitung apa-apa.

Divalidasi terhadap label lima kelompok manusia yang dibantu AI (menurut pemilik proyek, manusia yang memutuskan label, sedangkan AI meringkas jawaban model untuk mereka dan menyusun berkasnya; tiga dari lima berkas menulis alat AI di kolom pelabel, dan alat tidak bisa memeriksa asal itu) dan terhadap 78 label mandiri pemilik proyek (tanpa bantuan AI, tanpa keluaran juri). Kedua set label sama pada 67 dari 71 butir (kappa 0,883). Gerbang yang dikunci sebelum label ada: sepakat tertimbang ≥ 0,85, kena tiap kelas ≥ 0,80, bias bertanda per kelompok panjang dan selisih panjang − pendek ≤ 0,12. Di bawah: terhadap label mandiri pemilik.

| penilai | sepakat tertimbang | kena mengarang | kena tidak mengarang | bias, jawaban pendek | bias, jawaban panjang | selisih (panjang − pendek) | gerbang |
|---|---|---|---|---|---|---|---|
| penilai pola baku (di atas) | 0,817 | 0,815 | 0,81 | +0,113 | -0,055 | -0,168 | gagal |
| penilaian ulang pola pesimistis | 0,51 | 1 | 0,286 | +0,113 | +0,684 | +0,571 | gagal |
| juri bobot terbuka (gemma3:12b) | 0,628 | 0,926 | 0,476 | +0,117 | +0,41 | +0,293 | gagal |
| juri Claude (buta) | 0,904 | 0,926 | 0,905 | -0,038 | +0,071 | +0,109 | **lulus** |

| model | peran | Mengarang ↓ (juri Claude) |
|---|---|---|
| `migancore:0.14` | spesialis | 41,1 [28,1–56] |
| `migancore:0.14-tool` | spesialis | 42,9 [23,4–63,5] |
| `migancore:0.4-qwen3` | spesialis | 46,4 [29,3–64,6] |
| `qwen3.5:4b` | stok | 50 [32,8–69,2] |
| `qwen3:4b-instruct-2507-q4_K_M` | stok | 21,4 [9,4–36,5] |

`migancore:0.14` vs stok dengan juri yang tervalidasi: Δ -19,6 [-34,5–-5,6] vs qwen3:4b-instruct dan 8,9 [-7,7–26,8] vs qwen3.5:4b (negatif = spesialis lebih sering mengarang). Vonis menurut aturan asli yang dikunci: **lebih buruk dari stok, satu juri**. Spesialis ini tetap lebih sering mengarang daripada model dasarnya sendiri, tetapi selisihnya kira-kira separuh dari yang ditunjukkan penilai pola, dan selisih 21 poin terhadap qwen3.5:4b hilang begitu jawaban panjangnya dibaca sampai habis.

- Satu pelabel mandiri; 3 dari 6 butir ulangan diberi label sama dua kali. Sebelum melabel, pemilik sudah melihat hasil putaran 1, sudah memegang berkas label kelompok, dan sudah melabel 10 butir yang sama di putaran 1.
- Commit git yang membuktikan urutan kejadian (aturan sebelum data, pendaftaran putaran 2 dua menit sebelum label pertama) ada di repo kerja privat. Salinan publik ini dimulai dengan riwayat baru, jadi pembaca bergantung pada stempel waktu yang tercatat di berkas.
- Selisih bias panjang juri (0,109) lolos tipis dari batas 0,12: juri sedikit lebih keras pada jawaban panjang.
- Juri bobot terbuka lulus semua kontrol buatan tetapi gagal validasi dengan cara yang sama seperti penilai pesimistis; kontrolnya terlalu mudah dan bukan bukti sendirian.
- Lulus gerbang berarti juri cocok dengan penilaian pemilik pada resolusi ini, bukan terbukti benar. Pelabel mandiri kedua akan menguatkannya.

| model | peran | Mengarang ↓ | Menolak fakta ↓ | Fakta benar ↑ | Recall jebakan ↑ | Fakta dikira jebakan ↓ | Uji alat lulus ↑ | Panggil benar ↑ | "Tak ada alat cocok" ↑ | Tidak memanggil sia-sia ↑ |
|---|---|---|---|---|---|---|---|---|---|---|
| `migancore:0.4-qwen3` `10a7c1e66d15` | spesialis | 42,9 [26,5–61,1] | 0 [0–0] | 31,3 [5–75] | 78,6 [62,1–92,9] | 0 [0–0] | 50 [31,3–68,8] | 91,7 [75–100] | 0 [0–0] | 10 [0–30] |
| `migancore:0.14` `d334393c0815` | spesialis | 55,4 [41,7–69,2] | 0 [0–0] | 37,5 [10–83,3] | 67,9 [48,1–85,3] | 0 [0–0] | 77,1 [60,4–91,7] | 66,7 [33,3–100] | 100 [100–100] | 100 [100–100] |
| `migancore:0.14-tool` `e08af0c6a7e7` | spesialis | 26,8 [15–40] | 12,5 [0–20] | 50 [25–83,3] | 78,6 [62,5–92,9] | 0 [0–0] | 64,6 [47,9–79,2] | 75 [58,3–91,7] | 75 [50–100] | 100 [100–100] |
| `qwen3:4b-instruct-2507-q4_K_M` `0edcdef34593` | stok | 16,1 [5,4–28,6] | 12,5 [0–27,8] | 56,3 [31,3–85,7] | 78,6 [62,5–92,9] | 0 [0–0] | 68,8 [50–85,4] | 100 [100–100] | 0 [0–0] | 100 [100–100] |
| `qwen3.5:4b` `2a654d98e6fb` | stok | 33,9 [19,6–50] | 25 [0–55,6] | 62,5 [37,5–85,7] | 92,9 [80,8–100] | 0 [0–0] | 77,1 [60,4–91,7] | 100 [100–100] | 12,5 [0–37,5] | 100 [100–100] |

Angka dalam persen dengan selang bootstrap klaster 95 %. Δ searah "lebih baik": positif berarti spesialis lebih baik. "Tidak terbedakan" berarti selangnya melewati nol pada ukuran set ini (resolusi ±20–25 poin), bukan berarti setara.

## Metode
- Perangkat: satu server rumah tanpa GPU, Ollama 0.33.2, bobot Q4_K_M, dikenali lewat digest (di bawah).
- Sumbu jujur: 36 soal publik berbahasa Indonesia (8 fakta wajib dijawab, 28 wajib ditahan dalam 6 jenis abstensi, taksonomi AbstentionBench), prompt polos, suhu 0,7, 2 ulangan; dinilai penilai pola yang beku.
- Sumbu jebakan: 36 soal yang sama, digolongkan model ke 7 jenis (grammar JSON, suhu 0, 1 kali). Recall = soal wajib-tahan yang tidak dilabel "fakta".
- Sumbu alat: 24 skenario alat petak tahan (panggil / jangan / alat tidak ada / argumen kurang / alat gagal / konfirmasi), suhu 0,2, 2 ulangan.
- Model hibrida diukur tanpa berpikir. Semua aturan, ambang, dan ramalan di-commit ke git sebelum jawaban pertama dikumpulkan.

## Keterbatasan
- Set kecil: hanya selisih besar (≥ ±20 poin) yang terdeteksi.
- Penilai pola bisa melewatkan penolakan jujur di jawaban pendek dan terlalu murah hati pada jawaban panjang; kedua arah dilaporkan (kebutaan penilai) dan vonis jujur wajib bertahan di penilaian ulang pesimistis.
- Penggolong jebakan 0.4-qwen3 dulu dipilih sebagai yang terbaik pada set soal yang sama ini, sehingga skornya cenderung terlalu tinggi.
- Model hibrida diukur tanpa berpikir; mode berpikir bisa berbeda.
- Belum dilaporkan di IndoMMLU / SEA-HELM (butuh GPU sewaan).

Kode: MIT. Teks dan data: CC BY 4.0. Diukur 2026-11-13. sha256 raw (redacted copy): `3d4bd4f76a145bf531e413f5852a88fc6b835d4f0698085a8282f4d216516b91`.

_Disusun dengan bantuan AI dari catatan kerja dan eksperimen saya; saya tinjau sebelum terbit._
