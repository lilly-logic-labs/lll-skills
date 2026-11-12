---
name: review
description: Review a diff, branch, PR, commit message or issue and report severity-tagged findings with failure scenarios. Also request a review, answer review comments, or run an over-engineering pass. Use when asked to review, check my PR, look over this change, or reply to feedback. Not for security audits (lll:security) or whole-repo health checks (lll:audit).
metadata:
  origin: lll
---

# Review

Reads a change the way a careful owner would and reports only what can really go wrong, ranked by what happens to a user.
Read-only. Fixes happen only when the user asks, through `../../shared/fix-phase.md`.

## When to use

- "Review this diff / branch / PR / commit."
- "Is this ready to merge?" "Look over what I changed."
- Before opening a PR: get a review brief ready, or dispatch a reviewer.
- Review comments arrived and need an answer or a fix.
- "Is this over-engineered?"
- A commit message, PR description or issue needs checking.

## When not to use

- Exploitable-vulnerability hunting or a security assessment: `lll:security`.
- Whole-codebase health, dependency, database or drift audits: `lll:audit`.
- Making the change, or fixing what the review found: `lll:build`. Unknown cause of a failure: `lll:debug`.
- Verifying done, committing, opening the PR: `lll:ship`.

Built-in alternatives stay available. `/code-review` runs a deep correctness review at a chosen effort level and can post PR comments. `/security-review` reviews pending changes for security. `/simplify` applies cleanup fixes. Use them when the user wants exactly that. This skill is the house method: checklists, calibration, and the request and receive flows.

## Modes

- **Guidance** (default). Review in chat. Read the change and its surroundings, report findings, write no files, start no subagents.
- **Full**. Only when the user asks for a full, thorough, whole-branch or written review. Lens subagents per `../../shared/agents.md`, independent verification of findings per `../../shared/findings.md`, a report per `../../shared/report.md`, and the fix phase if the user asks for fixes.

Both follow `../../shared/ground-rules.md`. Learn the stack with `../../shared/stack-detect.md`.

## Route

| Task | Read |
|---|---|
| Review a change | the steps below, then `references/risk-checklists.md` and `references/stack-checklists.md` |
| Rate, verify, de-duplicate findings; what not to flag | `references/finding-calibration.md` |
| Get a change ready for review, or dispatch a reviewer | `references/request-review.md` |
| Respond to review comments | `references/receive-review.md` |
| Over-engineering pass | `references/overengineering-pass.md` |
| Commit messages, PR description, issue or ticket | `references/issue-and-commit-review.md` |

## Steps (review a change)

1. **Fix the target.**
   - Diff: `git merge-base <base> HEAD` to `HEAD`, plus uncommitted changes if the user means those. PR: `gh pr view` and `gh pr diff`. Files: the paths given.
   - Intent: the PR description, linked issue, plan or spec, commit messages. If none exists, say what you assumed the change is for.
   - Size: more than about 1500 changed lines or 30 files, say so and review in slices by area, highest risk first.
2. **Learn the rules.** `CLAUDE.md`, `AGENTS.md`, contributing guide, ADRs, lint and test config. Project rules are the spec. A broken rule is a finding. A rule that looks wrong is a question for the owner.
3. **Read the whole change before judging any of it.** Then read around it:
   - every caller and callee of each changed function;
   - the other side of each changed contract: API shape and client, schema and queries, type and its users, config and its readers;
   - the tests that changed and the tests that should have changed.
4. **Check the intent.** Does it do what was asked, all of it, and nothing extra? Missing parts and unrequested additions are findings.
5. **Walk the lenses**, using the checklists: correctness, data and state, contracts and compatibility, errors, concurrency, security basics, performance, tests, migrations and rollout, observability, accessibility, docs, over-engineering. Skip lenses the change cannot touch and say so.
6. **Sweep sideways.** For each defect pattern found, grep for the same pattern elsewhere in the repository. For each changed value, enum member, flag or route, find every consumer, including those outside the diff.
7. **Check gate integrity.** Did the change loosen a gate to get green: skipped or deleted tests, weakened assertions, lowered thresholds, disabled lint rules, added retries, `--no-verify`? That is a finding.
8. **Calibrate** (`references/finding-calibration.md`). Each finding needs a failure scenario, a severity, a confidence and evidence. No scenario: it is a question or a nit, not a finding. Drop anything on the suppression list.
9. **Verify.** Full mode: an independent verifier tries to disprove each finding. Guidance mode: re-read the code and callers once more before reporting, and label unverified items `needs_validation`.
10. **Report.** Verdict, findings by severity, questions, what was not reviewed, and an offer to fix.

CI results can stand in for running gates: read them with `gh pr checks`. Do not run builds or installs that write into the tree during a review. If the user wants gates run, do it in a worktree (`../../shared/fix-phase.md`, Setup).

## Verdict

| Verdict | When |
|---|---|
| Approve | No critical or high findings, medium findings acknowledged |
| Request changes | Any critical or high finding, or a missing piece of the stated intent |
| Comment | Only questions, nits, or findings needing the owner's decision |

## Red flags

| Thought | Reality |
|---|---|
| "Looks fine" after reading the diff only | Callers, contracts and tests are outside the diff. Read them. |
| "This could be a problem" | Write the scenario or drop it. |
| "Style nit" listed as high | Severity follows what happens to a user. |
| "I will fix it quickly while reviewing" | Review is read-only. Offer the fix. |
| "Tests pass, so it works" | Tests may not cover the changed path. Check which lines they exercise. |
| "Pre-existing, ignore" | Report it, or fix it on request. Say it is pre-existing. |
| "The author is senior" | The code decides, not the author. |
| "Many small findings, report all" | Rank. Ten nits bury the one real bug. |

## Output

- Chat: verdict line; counts by severity; findings as blocks per `../../shared/findings.md` (critical and high in full, medium and low as one line each if there are many); questions; not reviewed; unverified items.
- Full mode: the report at the path in `../../shared/report.md`, and the fix branch when fixes were requested.
- Always ends with the next step: fix on request, `lll:build` for larger changes, or `lll:ship` once clear.
