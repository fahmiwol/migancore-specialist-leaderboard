# MiganCore specialist leaderboard

Do small fine-tuned models beat the stock model they came from? This repository holds an honest answer for three
4B specialists from the [MiganCore](https://github.com/fahmiwol/migancore) project, measured against two stock models
with every rule, threshold and forecast committed to git **before** the first answer was collected (those commits live in
the private working repository; see the limits below). It also holds a
second study that rebuilt the honesty grader so it no longer rewards or punishes answer length, and validated it
against human labels.

[Bahasa Indonesia](README.id.md) · Full leaderboard: [English](RISET-050-papan-nilai-slm-spesiali/papan-nilai/LEADERBOARD.en.md) ·
[Indonesia](RISET-050-papan-nilai-slm-spesiali/papan-nilai/PAPAN-NILAI.id.md) · [HTML page](RISET-050-papan-nilai-slm-spesiali/papan-nilai/index.html)

## Results in one table

| specialist | its task | verdict (locked rules) |
|---|---|---|
| `migancore:0.4-qwen3` | spot trap questions (classifier) | **worse than stock** (trap recall 78.6 vs 92.9 for qwen3.5:4b) |
| `migancore:0.14` | answer honestly, abstain when it should | pattern grader: **not distinguishable** (the two pattern graders disagree because of answer length). Validated length-robust judge: **worse than stock, single judge** — fabricates 41.1 % vs 21.4 % for qwen3:4b-instruct (Δ −19.6 [−34.5 … −5.6]); not distinguishable from qwen3.5:4b (Δ +8.9 [−7.7 … 26.8]) |
| `migancore:0.14-tool` | call tools correctly | **not distinguishable** from stock |

No specialist beat both stock models on its own task. The locked release recommendation is therefore **the harness
and this leaderboard, not the weights**.

Numbers are percentages with 95 % cluster-bootstrap intervals over question families. With 24–36 items per axis,
only differences of roughly 20 points or more are detectable; "not distinguishable" does not mean "equal".

## What is in here

| folder | what it is |
|---|---|
| [`RISET-050-papan-nilai-slm-spesiali/`](RISET-050-papan-nilai-slm-spesiali/) | The leaderboard study: pre-registration (`PRA-DAFTAR.json`), runner (`pelari.mjs`), scorer (`nilai.mjs`), page builder (`terbit.mjs`), frozen instruments (`instrumen/`), 780 raw answers (`hasil/mentah.jsonl`) and results (`hasil/HASIL.json`, `hasil/TABEL.md`). |
| [`RISET-052-penilai-kejujuran-tanpa/`](RISET-052-penilai-kejujuran-tanpa/) | The honesty-judge study: trap keys (`kunci-jebakan.mjs`), judge (`penilai.mjs`), validation and verdict tool (`analisis.mjs`), tests (`uji.mjs`), judge outputs, the 72 + 6 item validation sample, human labels, and results for round 1 and round 2 (`hasil/`, `hasil/putaran2/`). |

Code and file names are in Indonesian, because the project works in Indonesian. Short glossary: *riset* study,
*pra-daftar* pre-registration, *vonis* verdict, *mengarang* fabricates, *jebakan* trap, *penilai* grader, *juri*
judge, *hasil* results, *mentah* raw, *putaran* round, *kelompok* group, *pemilik* owner.

## How the honesty judge was validated (RISET-052)

- Every must-abstain question has one built-in trap whose truth is known from the question design. The judge only
  decides whether an answer states that trap as fact, anywhere in the text, and must quote the span; code checks the
  quote. Refusing and then fabricating still counts as fabricating. Length alone counts for nothing.
- The judge was validated against a panel of five AI-assisted labeling groups and against 78 independent labels by the
  project owner (no AI help, no judge output). Per the owner, the groups' people decided the labels while an AI
  summarised the model answers for them and compiled the files; three of the five files name an AI tool as the
  labeler, which the tools cannot verify.
- Gate, locked before any label: weighted agreement ≥ 0.85, hit rate per class ≥ 0.80, signed bias per length group
  and the long − short gap ≤ 0.12. Against the owner's labels the Claude judge passed (weighted agreement 0.904, gap
  0.109). Both pattern graders and an open-weights judge (gemma3:12b) failed.
- Limits: one independent labeler; 3 of 6 repeated items got the same label twice; before labeling, the owner had
  seen the round-1 results, had handled the group label files and had labeled 10 of the same items in round 1; the
  judge's length-bias gap passes the limit narrowly.
- The git commits that prove the order of events (rules before data; the round-2 registration two minutes before the
  first label) are in the private working repository. This copy starts a fresh history, so readers rely on the
  timestamps recorded in the files.

## Reproduce

Requirements: Node.js 22. Measuring again needs Ollama with the five models pulled (digests in the leaderboard).

```bash
cd RISET-050-papan-nilai-slm-spesiali
node nilai.mjs --uji                 # 20 tests, including instrument fingerprints
node nilai.mjs --keluar ./ulang      # recompute every number from hasil/mentah.jsonl
node terbit.mjs                      # rebuild the leaderboard pages
node pelari.mjs --host <ollama-url>  # measure again (hours on CPU)
cd ../RISET-052-penilai-kejujuran-tanpa
node uji.mjs                         # 95 tests for the judge and its statistics
```

`./ulang/HASIL.json` matches `hasil/HASIL.json` except the timestamp and the raw-file fingerprint (see below).

## Privacy and what was left out

This is a curated copy of folders from a private working repository, started with a fresh git history.

- **Redacted by rule, with a manifest.** Names of people and businesses, machine names, network names, local paths
  and the private repository name were replaced by neutral placeholders such as `[PEMILIK]` (owner), `[USAHA-A]`
  (a business), `[MESIN-UKUR]` (the measurement machine), `[JARINGAN-PRIVAT]`, `[PATH-LOKAL]`, `<ollama-url>`. The five
  human labeling groups are `kelompok-1` … `kelompok-5`. Each folder's `BERSIH.json` lists every changed file with its
  sha256 before → after and the count per placeholder. The match patterns themselves stay private.
- **Fingerprints.** Redaction changes file hashes. `nilai.mjs` accepts an instrument whose hash is the locked hash, or
  the "after" hash of a `BERSIH.json` entry whose "before" is the locked hash. Re-scoring the redacted copy gives the
  same numbers as the locked run.
- **Edited by hand in this copy only:** four passages in the two pre-registrations that quoted or narrated the
  owner's chat messages are now short summaries marked "diringkas, bukan kutipan", and one remark about a provider's
  quota was removed. The per-call cost field was removed from the Claude judge outputs (471 rows); the analysis checks
  answer hashes, not these files' hashes.
- **Not included:** three private questions about the owner's businesses (never measured; the block is empty in
  `instrumen/petak-jujur2.mjs`), the raw label sheets of the human groups, the labeling pages, development sets and
  run logs.
- **Checks before publishing:** the project's publication scanner over every file, the same scanner function over
  every `.jsonl` file, a name and address sweep, and a separate review by a second model. Remaining scanner hits are
  false positives: the loopback default `127.0.0.1`, object keys named `claude`, money and quota amounts inside the
  question texts and model answers, and hash strings that look like long numbers.

## License

Code: [MIT](LICENSE). Text and data (leaderboard pages, results, raw answers, labels): [CC BY 4.0](LICENSE-DATA.md).
Third-party works cited here keep their own licenses.

Compiled with AI assistance from my work notes and experiments; I reviewed it before publication. — Fahmi Ghani
