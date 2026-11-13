# Small specialist models vs stock: an honest leaderboard

Three fine-tuned 4B specialists from the MiganCore project, re-measured on today's instruments against two stock models, with the verdict rules locked before any data existed.

> Locked recommendation: no specialist beat both stock models on its own task, so the first public release is the harness and this leaderboard, not the weights. 

| specialist | task axis | verdict | Δ vs qwen3:4b-instruct | Δ vs qwen3.5:4b |
|---|---|---|---|---|
| `migancore:0.4-qwen3` (penilai-jebakan) | trap recall (question classifier) | **worse than stock** | 0 [-11.1–10.7] | -14.3 [-28–-3.4] |
| `migancore:0.14` (penjawab-migancore) | fabrication on must-abstain questions | **not distinguishable from stock** (grader-sensitive) | -39.3 [-50–-28] | -21.4 [-33.9–-8.6] |
| `migancore:0.14-tool` (pemanggil-alat) | tool-use held-out tests | **not distinguishable from stock** | -4.2 [-25–16.7] | -12.5 [-33.3–8.3] |

`migancore:0.14`: with the standard grader it fabricates clearly more than both stock models (worse than stock: Δ -39.3 [-50–-28] and -21.4 [-33.9–-8.6]). The pessimistic re-grade (any passing abstention longer than 600 characters counts as fabrication) reverses the sign (better than stock), because the stock models write long answers (mean length in characters: `migancore:0.14` 378 vs `qwen3:4b-instruct-2507-q4_K_M` 1710, `qwen3.5:4b` 2037). The locked rule requires both graders to agree, so the verdict is "not distinguishable". Neither grader alone is trustworthy here; a validated, length-robust judge re-grades this axis in the next section.

## Honesty axis re-graded with a validated judge (RISET-052)

A separate pre-registered study re-graded the same raw answers. Every must-abstain question has one built-in trap whose truth is known from the question design; the judge only decides whether the answer states that trap as fact anywhere in the text, and must quote the span (checked by code). Refusing first and then fabricating still counts as fabricating; length alone counts for nothing.

Validated against a panel of five AI-assisted labeling groups (per the project owner, people decided the labels while an AI summarised the model answers for them and compiled the files; three of the five files name an AI tool as the labeler, which the tools cannot verify) and against 78 independent labels by the project owner (no AI help, no judge output). The two label sets agree on 67 of 71 items (kappa 0.883). Gate, locked before any label: weighted agreement ≥ 0.85, hit rate per class ≥ 0.80, signed bias per length group and the long − short gap ≤ 0.12. Below: against the owner's independent labels.

| grader | weighted agreement | catches fabrication | catches non-fabrication | bias, short answers | bias, long answers | gap (long − short) | gate |
|---|---|---|---|---|---|---|---|
| standard pattern grader (above) | 0.817 | 0.815 | 0.81 | +0.113 | -0.055 | -0.168 | fail |
| pessimistic pattern re-grade | 0.51 | 1 | 0.286 | +0.113 | +0.684 | +0.571 | fail |
| open-weights judge (gemma3:12b) | 0.628 | 0.926 | 0.476 | +0.117 | +0.41 | +0.293 | fail |
| Claude judge (blind) | 0.904 | 0.926 | 0.905 | -0.038 | +0.071 | +0.109 | **pass** |

| model | role | Fabricates ↓ (Claude judge) |
|---|---|---|
| `migancore:0.14` | specialist | 41.1 [28.1–56] |
| `migancore:0.14-tool` | specialist | 42.9 [23.4–63.5] |
| `migancore:0.4-qwen3` | specialist | 46.4 [29.3–64.6] |
| `qwen3.5:4b` | stock | 50 [32.8–69.2] |
| `qwen3:4b-instruct-2507-q4_K_M` | stock | 21.4 [9.4–36.5] |

`migancore:0.14` vs stock with the validated judge: Δ -19.6 [-34.5–-5.6] vs qwen3:4b-instruct and 8.9 [-7.7–26.8] vs qwen3.5:4b (negative = the specialist fabricates more). Verdict under the original locked rules: **worse than stock, single judge**. The specialist still fabricates more than its own base model, but the gap is about half of what the pattern grader showed, and the 21-point gap to qwen3.5:4b disappears once its long answers are read to the end.

- One independent labeler; 3 of 6 repeated items got the same label twice. Before labeling, the owner had seen the round-1 results, had handled the group label files, and had labeled 10 of the same items in round 1.
- The git commits that prove the order of events (rules before data, the round-2 registration two minutes before the first label) are in the private working repository. This public copy starts a fresh history, so readers rely on the timestamps recorded in the files.
- The judge's length-bias gap (0.109) passes the 0.12 limit narrowly: it is slightly harsher on long answers.
- The open-weights judge passed all synthetic controls yet failed validation the same way the pessimistic grader does; the controls are too easy and are not evidence on their own.
- Passing the gate means the judge matches the owner's judgement at this resolution, not that it is proven right. A second independent labeler would strengthen it.

| model | role | Fabricates ↓ | Refuses facts ↓ | Facts right ↑ | Trap recall ↑ | Facts flagged as traps ↓ | Tool tests passed ↑ | Correct call ↑ | "No tool fits" ↑ | No needless call ↑ |
|---|---|---|---|---|---|---|---|---|---|---|
| `migancore:0.4-qwen3` `10a7c1e66d15` | specialist | 42.9 [26.5–61.1] | 0 [0–0] | 31.3 [5–75] | 78.6 [62.1–92.9] | 0 [0–0] | 50 [31.3–68.8] | 91.7 [75–100] | 0 [0–0] | 10 [0–30] |
| `migancore:0.14` `d334393c0815` | specialist | 55.4 [41.7–69.2] | 0 [0–0] | 37.5 [10–83.3] | 67.9 [48.1–85.3] | 0 [0–0] | 77.1 [60.4–91.7] | 66.7 [33.3–100] | 100 [100–100] | 100 [100–100] |
| `migancore:0.14-tool` `e08af0c6a7e7` | specialist | 26.8 [15–40] | 12.5 [0–20] | 50 [25–83.3] | 78.6 [62.5–92.9] | 0 [0–0] | 64.6 [47.9–79.2] | 75 [58.3–91.7] | 75 [50–100] | 100 [100–100] |
| `qwen3:4b-instruct-2507-q4_K_M` `0edcdef34593` | stock | 16.1 [5.4–28.6] | 12.5 [0–27.8] | 56.3 [31.3–85.7] | 78.6 [62.5–92.9] | 0 [0–0] | 68.8 [50–85.4] | 100 [100–100] | 0 [0–0] | 100 [100–100] |
| `qwen3.5:4b` `2a654d98e6fb` | stock | 33.9 [19.6–50] | 25 [0–55.6] | 62.5 [37.5–85.7] | 92.9 [80.8–100] | 0 [0–0] | 77.1 [60.4–91.7] | 100 [100–100] | 12.5 [0–37.5] | 100 [100–100] |

Numbers are percentages with 95 % cluster-bootstrap intervals. Δ is in the "better" direction: positive means the specialist is better. "Not distinguishable" means the interval crosses zero at this test size (~20–25 points resolution), not that the models are equal.

## Method
- Hardware: one CPU-only home server (no GPU), Ollama 0.33.2, Q4_K_M weights, identified by digest (below).
- Honesty axis: 36 public Indonesian questions (8 must-answer facts, 28 must-abstain across 6 abstention types, AbstentionBench taxonomy), plain prompt, temperature 0.7, 2 runs each; graded by a fixed pattern grader.
- Trap axis: the same 36 questions, classified by the model into 7 types (JSON grammar, temperature 0, 1 run). Recall = must-abstain questions not labelled "fact".
- Tool axis: 24 held-out tool scenarios (call / do not call / missing tool / missing argument / failed tool / confirm), temperature 0.2, 2 runs.
- Hybrid models were measured with thinking off. Every rule, threshold and forecast was committed to git before the first answer was collected.

## Limitations
- Small sets: only large differences (≥ ~20 points) are detectable.
- Pattern graders can miss honest refusals in short answers and over-credit long ones; both directions are reported (grader-blindness) and the honesty verdict must survive a pessimistic re-grade.
- The trap classifier 0.4-qwen3 was originally selected as best on this same question set, which biases its score upward.
- Hybrid models were measured without thinking; thinking mode may score differently.
- Not yet reported on IndoMMLU / SEA-HELM (needs rented GPU time).

Code: MIT. Text and data: CC BY 4.0. Measured 2026-11-13. sha256 raw (redacted copy): `3d4bd4f76a145bf531e413f5852a88fc6b835d4f0698085a8282f4d216516b91`.

_Compiled with AI assistance from my work notes and experiments; I reviewed it before publication._
