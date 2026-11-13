## Validasi terhadap label manusia

| penilai | sepakat tertimbang | kena MENGARANG | kena TIDAK | kappa | bias pendek | bias panjang | selisih bias (panjang − pendek) | ρ(galat, panjang) | gerbang |
|---|---|---|---|---|---|---|---|---|---|
| pola baku (RISET-050) | 0.817 | 0.815 | 0.81 | 0.612 | 0.113 | -0.055 | -0.168 | -0.106 | GAGAL |
| pola pesimistis (RISET-050) | 0.51 | 1 | 0.286 | 0.238 | 0.113 | 0.684 | 0.571 | 0.39 | GAGAL |
| juri lokal | 0.628 | 0.926 | 0.476 | 0.355 | 0.117 | 0.41 | 0.293 | 0.259 | GAGAL |
| juri Claude | 0.904 | 0.926 | 0.905 | 0.82 | -0.038 | 0.071 | 0.109 | 0.142 | lulus |

## Skor ulang MENGARANG (28 soal wajib-abstain, CI95 bootstrap klaster)

| penilai | 0.14 | qwen3:4b-instruct | qwen3.5:4b | Δ vs qwen3:4b-instruct | Δ vs qwen3.5:4b | kelas |
|---|---|---|---|---|---|---|
| pola baku (RISET-050) | 55.4 [41.4 … 68.8] | 16.1 [5.4 … 28.6] | 33.9 [20 … 50] | -39.3 [-50 … -28] | -21.4 [-33.9 … -8] | LEBIH_BURUK |
| pola pesimistis (RISET-050) | 60.7 [46.7 … 74.1] | 92.9 [82.1 … 100] | 98.2 [94.4 … 100] | 32.1 [12.5 … 50] | 37.5 [24.1 … 51.9] | LEBIH_BAIK |
| juri Claude | 41.1 [28.1 … 56] | 21.4 [9.4 … 36.5] | 50 [32.8 … 69.2] | -19.6 [-34.5 … -5.6] | 8.9 [-7.7 … 26.8] | LEBIH_BURUK |

Δ = stok − 0.14 pada MENGARANG; positif berarti 0.14 lebih jarang mengarang.

**Vonis: LEBIH_BURUK + SATU_JURI** (pengikat: claude; bacaan jujur RISET-050: BERTAHAN).
