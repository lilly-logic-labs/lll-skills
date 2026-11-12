---
name: debug
description: Find the root cause of a bug, failing test, crash, flaky test, slow regression or production incident before fixing it, then fix and prove it. Use when something is broken, intermittent, slow or down, or a fix did not work. Not for reviewing code that works (lll:review), deep audits (lll:audit) or Cloudflare platform errors (lll:cloudflare).
metadata:
  origin: lll
---

# Debug

Finds why something is wrong, fixes that cause once, and proves the fix with a test that failed first.
Iron law: no fix without a stated cause and a reproduction.

## When to use

- A bug, error, crash, wrong output, failing build or failing test.
- A test that fails sometimes, fails only in the full suite, or fails only on CI.
- A hang, duplicate, lost update or "only under load" problem.
- Something got slower, or memory, CPU or cost climbed.
- A production incident or outage, with users affected now.
- A fix that did not work, or a bug that came back.
- The agent itself is repeating a failing attempt.

## When not to use

- The cause is known and the fix is small: `lll:build` (surgical patch route).
- Code that works and needs an opinion: `lll:review`. Broad health checks: `lll:audit`. Exploit work: `lll:security`.
- Deciding what to build: `lll:plan`. Declaring done, committing, deploying: `lll:ship`.

## Modes

- **Guidance** (default). Investigate in place. Stay read-only until the cause is stated, then fix inline in the working tree with a regression test. No report file, no subagents.
- **Full**. Only when the user asks for a full investigation, an incident run or a postmortem. Adds a written timeline, parallel hypothesis subagents (`../../shared/agents.md`) and a report at the path in `../../shared/report.md`.

Both follow `../../shared/ground-rules.md`. Learn the stack with `../../shared/stack-detect.md`.

## Route by symptom

| Symptom | Read |
|---|---|
| Deterministic bug, error or stack trace | `references/root-cause-tracing.md` |
| Passes alone, fails in the suite; fails sometimes; fails on CI only | `references/flaky-and-order-dependent.md` |
| Hang, deadlock, duplicate, lost update, wrong only under load | `references/races-and-concurrency.md` |
| Slower than before; memory, CPU or bill up | `references/performance-regression.md` |
| Users affected now | `references/incident-mode.md` |
| Fix is in; make the bug class impossible; error handling design | `references/defense-in-depth.md` |
| Which debugger, profiler or log tool to use here | `references/stack-tools.md` |
| The agent is looping, or the bug is inside an LLM or agent system | `references/agent-loops.md` |

## Steps

1. **Scope and safety.**
   - Read `CLAUDE.md`, `AGENTS.md` and the README. Note forbidden commands.
   - Production and shared systems are read-only unless the owner says otherwise in this conversation. Never print secret values.
   - Users hurt right now: go to `references/incident-mode.md` and mitigate first. Mitigation is not the fix; come back to step 2.
   - Other people may share the checkout. Do not stash, reset, clean or switch branches there. Run bisects in a worktree.
2. **Read the evidence in full.** Every error message, stack frame, exit code, warning above the error, and log line near the time. Quote the decisive line. Do not skim.
3. **Reproduce.**
   - Write the exact command, input, environment and expected versus actual.
   - Make it deterministic: smallest input, fixed seed, frozen clock, one thread.
   - Capture it as a failing test where the code allows.
   - Cannot reproduce: do not guess. Add instrumentation (step 5), record how often and under what conditions, and say the cause is unconfirmed.
4. **Check what changed.** `git log` and `git diff` since the last known good state, plus dependency bumps, config, data, environment and deploys. With a known good commit, bisect (`references/root-cause-tracing.md`).
5. **Instrument the boundaries.** In a system with several components, log what enters and leaves each one, run once, and read where the data first goes wrong. Investigate that component only.
6. **Trace backward.** Ask where the bad value came from, then where that came from, until you reach the origin. The cause is where it originates, not where it fails.
7. **Compare with something that works.** A similar path, an older version, another environment. List every difference, including small ones. Do not assume a difference cannot matter.
8. **One hypothesis at a time.**
   - Write it: "X is the cause because Y".
   - Run the smallest probe that could prove it wrong. Change one thing.
   - Confirmed: go to step 9. Wrong: record it under ruled out, form the next hypothesis from the new evidence, never stack changes.
9. **Fix.**
   - The reproduction becomes the regression test. Watch it fail for the reported reason.
   - One change at the origin. No refactor, no bundled cleanups.
   - Run the focused test, then the project gates (`../../shared/stack-detect.md` section 5).
10. **Blast radius.** Grep for the same pattern elsewhere. List data already damaged (backfill: `lll:build` migration route), other tenants, other callers, other platforms. Fix the siblings or list them.
11. **Defend.** If the bug class is bad data getting through, add the cheapest validation at the layers it crossed (`references/defense-in-depth.md`).
12. **Prove and report.** The original reproduction passes, the regression test passes, gates pass. Give the real output lines.

## Three strikes

- Three failed hypotheses or three failed fixes: stop editing.
- Write down what all attempts assumed and test that assumption.
- If each fix exposes a new problem in another place, the design is the cause. Say so, name the options, and ask the owner.
- Same command or same edit twice with the same result: you are looping (`references/agent-loops.md`).

## Red flags

| Thought | Reality |
|---|---|
| "Quick fix now, investigate later" | A symptom fix is a second bug. |
| "Just try changing X and see" | That is guessing. State the hypothesis first. |
| "It is probably flaky" | Flaky has causes. Measure the rate, then find them. |
| "I will add a retry or a sleep" | You are hiding the cause. Wait on a condition instead. |
| "Several changes at once will save time" | You will not know which one worked. |
| "It works on my machine" | Diff the environments. |
| "One more attempt" after two failures | Stop. Test the assumption. |
| "The test is wrong" | Prove it from the spec, not from the failure. |
| "Pre-existing, not mine" | Fix it or name the exact blocker. |

## Output

- **Cause**: one paragraph, with `path:line` and the decisive evidence.
- **Fix**: files changed, plus the regression test and how it failed first.
- **Proof**: commands run with the real result lines.
- **Ruled out**: hypotheses tested and why they were wrong.
- **Blast radius**: siblings fixed or listed, data to repair, owner actions.
- **Not verified**: anything that could not be reproduced or tested.
- **Next**: `lll:review` then `lll:ship`; or the follow-up items.
- Full mode: the report from `../../shared/report.md`; incidents add the postmortem from `references/incident-mode.md`.
