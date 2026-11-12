# Evals

An eval is a fixed set of inputs with a way to score outputs. It is the only way to know that a prompt, model or retrieval change helped. Build the smallest useful one before you iterate.

## Build the golden set

1. Start from real inputs: logs, tickets, support chats, user queries, documents. Anonymise personal data first.
2. 30 to 50 cases is a good start; grow to hundreds as the feature matures. Quality of cases beats quantity.
3. Cover: the common case, each branch or label, known past failures, adversarial inputs (injection, off-topic, empty, huge, other language), and cases where the right answer is "I do not know" or "refuse".
4. For each case store: id, input, tags, the expected output or the properties the output must have, and why.
5. Freeze it. Version it with the code. Add every production failure as a new case.
6. Hold out a part (say 20 percent) that you never use while tuning, to detect overfitting.

## Graders, cheapest first

| Grader | Use for | Notes |
|---|---|---|
| Code check | Format valid, schema passes, required fields, regex, exact match, numeric tolerance, "cites an id that exists", latency and token limits | Deterministic. Use whenever possible |
| Reference compare | Classification label, extracted values | Exact or fuzzy match against labelled expected output |
| LLM judge | Quality, helpfulness, faithfulness to sources, tone | Needs calibration (below) |
| Human review | Ground truth, judge calibration, new failure types | Sample, do not review everything |
| Production signals | Thumbs, edits, escalations, retries | Slow, noisy, real |

LLM judge rules

1. Judge with a rubric of specific yes/no questions ("Does every claim have a citation that supports it?"), not a vague 1 to 10 score.
2. Give the judge the input, the output, the sources and the rubric; ask for a short reason, then a verdict.
3. Use a judge at least as capable as the system under test, with a different prompt, ideally a different model family, to reduce self-preference.
4. Calibrate: human-label 30 or more outputs, compare, and fix the rubric until agreement is acceptable. Re-check when the judge model changes.
5. Randomise answer order in pairwise comparisons; watch for length bias.
6. Judge outputs can be wrong; spot-check failures and passes.

## Run and score

- Run each case more than once when sampling is non-deterministic (n of 3 to 5). Record pass or fail per run.
- Capability: pass@k = chance that at least one of k attempts passes. Reliability: pass^k = chance that all k pass. Use pass^k when users cannot retry (payments, safety).
- Record cost and latency per case, not just quality.
- Save raw outputs and the prompt version, model id and config so a score can be explained later.

Scoring helper (zero dependencies): write one JSON object per run per line, then run

```
node scripts/eval-gate.mjs results.jsonl --k 3 --min-pass 0.9 --baseline baseline.jsonl --max-drop 0.05 --must-pass safety
```

Line shape: `{"case":"refund-001","pass":true,"tags":["safety"],"cost":0.002,"latency_ms":840}`. It prints pass rate, pass@k, pass^k, p50 and p95 latency, mean cost, regressions against the baseline, and exits with 1 when the gate fails, so CI can block a merge. Run its self-check with `node scripts/eval-gate.mjs --selftest`.

## Gate regressions in CI

1. On every prompt, model, retrieval or tool change, run the golden set.
2. Fail when overall pass rate falls below the bar, when any case tagged `safety` or `must-pass` fails, or when a case drops more than the allowed amount against the stored baseline.
3. Store the baseline results with the code; update them only through a reviewed change that explains why.
4. Keep a fast subset (under a few minutes, low cost) for pull requests and the full set nightly.
5. Pin the model version for the gate; run a separate canary job against the provider's latest to see drift before you upgrade.

## Online evaluation

- Log inputs and outputs (redacted) with prompt version and model.
- Sample a fixed share for human or judge review each week; add failures to the golden set.
- Shadow mode: run the new version in parallel on live traffic without showing it; compare.
- A/B test only after the offline gate passes. Pick one primary metric in advance.
- Watch cost per successful outcome, not only cost per call.

## Regression tests for AI-written code

When a model writes and also reviews code, its blind spots repeat. Add checks that do not depend on the same judgement:

1. Write tests at the API or function boundary that run without the real database or network (in-memory store, fixtures). They run in CI before any AI review.
2. Assert on shape and fields, not only status codes: required keys present, types right, no extra sensitive fields, pagination fields set, error body shape.
3. Every bug found, by a person or a model, becomes a permanent test named for the bug before it is fixed.
4. Compare environments: the same request against sandbox and production-like data paths, to catch "works with the mock" bugs.
5. Have a second, independent pass (different model or a person) read the diff against the tests, and run `/code-review` for correctness.

## Comparing agents or models on repository tasks

To pick between coding agents, models or prompts:

1. Define 5 to 20 tasks from your own repository history, each with a starting commit, the instruction, and a check (a test command or a rubric).
2. Run each candidate in a clean worktree or container so runs cannot affect each other; same tools, same time and cost caps.
3. Score: task pass rate (with repeats), diff size, whether the tests still pass, cost, wall time, and a reviewer's score for maintainability.
4. Report variance, not one run. Prefer the candidate with the higher pass^k on your tasks over a public leaderboard.

## Pitfalls

- Tuning on the same cases you report. Keep a hold-out.
- A judge that rewards verbosity.
- Cases leaked into prompts as few-shot examples.
- Changing the model and the prompt together; you cannot tell which helped.
- Averages hiding a collapse on one important tag; report by tag.
- An eval that never fails. Add a deliberately bad variant once to prove it can fail.
