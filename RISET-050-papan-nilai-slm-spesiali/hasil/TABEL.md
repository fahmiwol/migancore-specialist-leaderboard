| model | peran | MENGARANG ↓ | TOLAK-FAKTA ↓ | fakta benar ↑ | recall jebakan ↑ | fakta dikira jebakan ↓ | alat lulus ↑ | panggil benar ↑ | tak ada alat cocok ↑ | jangan memanggil ↑ |
|---|---|---|---|---|---|---|---|---|---|---|
| `migancore:0.4-qwen3` (penilai-jebakan) | spesialis | 42.9 [26.5–61.1] | 0 [0–0] | 31.3 [5–75] | 78.6 [62.1–92.9] | 0 [0–0] | 50 [31.3–68.8] | 91.7 [75–100] | 0 [0–0] | 10 [0–30] |
| `migancore:0.14` (penjawab-migancore) | spesialis | 55.4 [41.7–69.2] | 0 [0–0] | 37.5 [10–83.3] | 67.9 [48.1–85.3] | 0 [0–0] | 77.1 [60.4–91.7] | 66.7 [33.3–100] | 100 [100–100] | 100 [100–100] |
| `migancore:0.14-tool` (pemanggil-alat) | spesialis | 26.8 [15–40] | 12.5 [0–20] | 50 [25–83.3] | 78.6 [62.5–92.9] | 0 [0–0] | 64.6 [47.9–79.2] | 75 [58.3–91.7] | 75 [50–100] | 100 [100–100] |
| `qwen3:4b-instruct-2507-q4_K_M` (stok-qwen3-4b-instruct) | stok | 16.1 [5.4–28.6] | 12.5 [0–27.8] | 56.3 [31.3–85.7] | 78.6 [62.5–92.9] | 0 [0–0] | 68.8 [50–85.4] | 100 [100–100] | 0 [0–0] | 100 [100–100] |
| `qwen3.5:4b` (stok-qwen3.5-4b) | stok | 33.9 [19.6–50] | 25 [0–55.6] | 62.5 [37.5–85.7] | 92.9 [80.8–100] | 0 [0–0] | 77.1 [60.4–91.7] | 100 [100–100] | 12.5 [0–37.5] | 100 [100–100] |

| spesialis | sumbu | vonis | Δ vs qwen3:4b-instruct | Δ vs qwen3.5:4b | catatan |
|---|---|---|---|---|---|
| penilai-jebakan | probe | **LEBIH_BURUK** | 0 [-11.1–10.7] | -14.3 [-28–-3.4] |  |
| penjawab-migancore | jujur | **SAMA** | -39.3 [-50–-28] | -21.4 [-33.9–-8.6] | RAPUH_PENILAI (pesimis: LEBIH_BAIK) |
| pemanggil-alat | alat | **SAMA** | -4.2 [-25–16.7] | -12.5 [-33.3–8.3] |  |
