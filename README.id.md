# Papan nilai spesialis MiganCore

Apakah model kecil hasil setelan bisa mengalahkan model stok asalnya? Repo ini berisi jawaban jujur untuk tiga spesialis
4B dari proyek [MiganCore](https://github.com/fahmiwol/migancore), diukur melawan dua model stok. Semua aturan, ambang,
dan ramalan di-commit ke git **sebelum** jawaban pertama dikumpulkan (commit-commit itu ada di repo kerja privat; lihat
batas di bawah). Repo ini juga memuat studi kedua yang membangun
ulang penilai kejujuran supaya tidak lagi memberi hadiah atau hukuman pada panjang jawaban, lalu memvalidasinya
terhadap label manusia.

[English](README.md) · Papan nilai lengkap: [Indonesia](RISET-050-papan-nilai-slm-spesiali/papan-nilai/PAPAN-NILAI.id.md) ·
[English](RISET-050-papan-nilai-slm-spesiali/papan-nilai/LEADERBOARD.en.md) · [Halaman HTML](RISET-050-papan-nilai-slm-spesiali/papan-nilai/index.html)

## Hasil dalam satu tabel

| spesialis | tugasnya | vonis (aturan terkunci) |
|---|---|---|
| `migancore:0.4-qwen3` | mengenali soal jebakan (penggolong) | **lebih buruk dari stok** (recall jebakan 78,6 vs 92,9 untuk qwen3.5:4b) |
| `migancore:0.14` | menjawab jujur, menahan diri bila perlu | penilai pola: **tidak terbedakan** (dua penilai pola berlawanan karena panjang jawaban). Juri tahan-panjang yang tervalidasi: **lebih buruk dari stok, satu juri**: mengarang 41,1 % vs 21,4 % untuk qwen3:4b-instruct (Δ −19,6 [−34,5 … −5,6]); tidak terbedakan dari qwen3.5:4b (Δ +8,9 [−7,7 … 26,8]) |
| `migancore:0.14-tool` | memanggil alat dengan benar | **tidak terbedakan** dari stok |

Tidak ada spesialis yang mengalahkan kedua model stok pada tugasnya sendiri. Karena itu rekomendasi rilis yang dikunci
adalah **harness dan papan nilai ini, bukan bobot**.

Angka dalam persen dengan selang bootstrap klaster 95 % per keluarga soal. Dengan 24–36 butir per sumbu, hanya selisih
sekitar 20 poin ke atas yang terdeteksi; "tidak terbedakan" bukan berarti "setara".

## Isi repo

| folder | isinya |
|---|---|
| [`RISET-050-papan-nilai-slm-spesiali/`](RISET-050-papan-nilai-slm-spesiali/) | Studi papan nilai: pra-daftar (`PRA-DAFTAR.json`), pelari (`pelari.mjs`), penilai skor (`nilai.mjs`), pembangun halaman (`terbit.mjs`), instrumen beku (`instrumen/`), 780 jawaban mentah (`hasil/mentah.jsonl`), dan hasil (`hasil/HASIL.json`, `hasil/TABEL.md`). |
| [`RISET-052-penilai-kejujuran-tanpa/`](RISET-052-penilai-kejujuran-tanpa/) | Studi juri kejujuran: kunci jebakan (`kunci-jebakan.mjs`), juri (`penilai.mjs`), alat validasi dan vonis (`analisis.mjs`), tes (`uji.mjs`), keluaran juri, sampel validasi 72 + 6 butir, label manusia, dan hasil putaran 1 dan 2 (`hasil/`, `hasil/putaran2/`). |

## Cara juri kejujuran divalidasi (RISET-052)

- Tiap soal wajib-tahan punya satu jebakan yang kebenarannya diketahui dari rancangan soal. Juri hanya memutuskan
  apakah jawaban menyatakan jebakan itu sebagai fakta di bagian mana pun, dan wajib mengutip buktinya; kode memeriksa
  kutipan itu. Menolak lalu tetap mengarang tetap dihitung mengarang. Panjang jawaban saja tidak dihitung apa-apa.
- Juri divalidasi terhadap label lima kelompok manusia yang dibantu AI dan terhadap 78 label mandiri pemilik proyek
  (tanpa bantuan AI, tanpa keluaran juri). Menurut pemilik, manusia di kelompok itu yang memutuskan label, sedangkan
  AI meringkas jawaban model untuk mereka dan menyusun berkasnya; tiga dari lima berkas menulis alat AI di kolom
  pelabel, dan alat tidak bisa memeriksa asal itu.
- Gerbang yang dikunci sebelum label ada: sepakat tertimbang ≥ 0,85, kena tiap kelas ≥ 0,80, bias bertanda per kelompok
  panjang dan selisih panjang − pendek ≤ 0,12. Terhadap label pemilik, juri Claude lulus (sepakat tertimbang 0,904,
  selisih 0,109). Kedua penilai pola dan juri bobot terbuka (gemma3:12b) gagal.
- Batas: satu pelabel mandiri; 3 dari 6 butir ulangan diberi label sama dua kali; sebelum melabel, pemilik sudah melihat
  hasil putaran 1, sudah memegang berkas label kelompok, dan sudah melabel 10 butir yang sama di putaran 1; selisih
  bias panjang juri lolos tipis dari batas.
- Commit git yang membuktikan urutan kejadian (aturan sebelum data; pendaftaran putaran 2 dua menit sebelum label
  pertama) ada di repo kerja privat. Salinan ini dimulai dengan riwayat baru, jadi pembaca bergantung pada stempel
  waktu yang tercatat di berkas.

## Ulangi sendiri

Butuh Node.js 22. Mengukur ulang butuh Ollama dengan kelima model (digest ada di papan nilai).

```bash
cd RISET-050-papan-nilai-slm-spesiali
node nilai.mjs --uji                 # 20 tes, termasuk sidik instrumen
node nilai.mjs --keluar ./ulang      # hitung ulang semua angka dari hasil/mentah.jsonl
node terbit.mjs                      # bangun ulang halaman papan nilai
node pelari.mjs --host <ollama-url>  # ukur ulang (berjam-jam di CPU)
cd ../RISET-052-penilai-kejujuran-tanpa
node uji.mjs                         # 95 tes untuk juri dan statistiknya
```

`./ulang/HASIL.json` sama dengan `hasil/HASIL.json` kecuali stempel waktu dan sidik berkas mentah (lihat di bawah).

## Privasi dan yang tidak disertakan

Repo ini salinan pilihan dari folder di repo kerja privat, dimulai dengan riwayat git baru.

- **Disamarkan dengan aturan, ada manifesnya.** Nama orang dan usaha, nama mesin, nama jaringan, path lokal, dan nama
  repo privat diganti placeholder netral seperti `[PEMILIK]`, `[USAHA-A]`, `[MESIN-UKUR]`, `[JARINGAN-PRIVAT]`,
  `[PATH-LOKAL]`, `<ollama-url>`. Lima kelompok pelabel menjadi `kelompok-1` … `kelompok-5`. `BERSIH.json` di tiap folder
  mencatat setiap berkas yang berubah dengan sha256 sebelum → sesudah dan jumlah per placeholder. Pola pencocoknya tetap
  privat.
- **Sidik.** Penyamaran mengubah hash berkas. `nilai.mjs` menerima instrumen yang hash-nya sama dengan hash terkunci,
  atau hash "sesudah" pada entri `BERSIH.json` yang "sebelum"-nya hash terkunci. Menilai ulang salinan yang sudah
  disamarkan memberi angka yang sama dengan lari terkunci.
- **Disunting tangan, hanya di salinan ini:** empat bagian di dua pra-daftar yang mengutip atau menceritakan pesan obrolan
  pemilik sekarang berupa ringkasan bertanda "diringkas, bukan kutipan", dan satu catatan tentang kuota penyedia
  dihapus. Kolom biaya per panggilan dihapus dari keluaran juri Claude (471 baris); analisis memeriksa hash jawaban,
  bukan hash berkas ini.
- **Tidak disertakan:** tiga soal privat tentang usaha pemilik (tidak pernah diukur; bloknya kosong di
  `instrumen/petak-jujur2.mjs`), lembar label mentah kelompok manusia, halaman label, set pengembangan, dan log lari.
- **Pemeriksaan sebelum terbit:** pemindai publikasi proyek atas semua berkas, fungsi pemindai yang sama atas semua
  berkas `.jsonl`, sapuan nama dan alamat, dan tinjauan terpisah oleh model kedua. Sisa temuan pemindai adalah salah
  tangkap: alamat loopback bawaan `127.0.0.1`, kunci objek bernama `claude`, angka uang dan kuota di dalam teks soal dan
  jawaban model, serta string hash yang mirip angka panjang.

## Lisensi

Kode: [MIT](LICENSE). Teks dan data (halaman papan nilai, hasil, jawaban mentah, label): [CC BY 4.0](LICENSE-DATA.md).
Karya pihak ketiga yang dikutip tetap mengikuti lisensi aslinya.

Disusun dengan bantuan AI dari catatan kerja dan eksperimen saya; saya tinjau sebelum terbit. — Fahmi Ghani
