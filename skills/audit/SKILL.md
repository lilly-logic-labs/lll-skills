---
name: audit
description: Audit a codebase by lens (bugs, db, deps, perf, a11y, tests, dead code, drift, migrations, release, agent config) and fix what is confirmed; presets full (whole repo plus security) and care (monthly check). Use when asked to audit, check db health, scan deps, find dead code, a11y audit, find everything wrong. Not for security holes (lll:security), one diff (lll:review) or go-live (lll:launch).
metadata:
  origin: lll
---

# Audit

Finds real defects in a codebase and its config through named lenses, verifies each one with a second reader, and fixes the confirmed ones on a local branch.
One lens, several lenses, the whole repository (`full`), or a monthly client check (`care`); always the same evidence bar, finding format and report.

## When to use

- "Check the db health", "any N+1s or missing indexes?", "audit our deps", "find dead code", "is the app accessible?", "are the tests any good?", "are the docs still true?", "is this migration safe to run?", "are we ready to release?", "check our Claude/MCP config".
- "Audit the whole codebase", "find everything wrong", "bug hunt", a pre-release or post-merge sweep (`full`).
- The monthly retainer check of a client's app (`care`).
- A question about one query, migration, test, config file or component through one of the lenses (guidance).

## When not to use

- Vulnerabilities, pen tests, auth or tenant-isolation questions: `lll:security`. A `full` or `care` run calls it for you.
- Reviewing one diff, branch or PR: `lll:review` (or Claude Code's `/code-review`); cleanup of a diff: `/simplify`.
- Root-causing a known bug or incident: `lll:debug`. Learning an unfamiliar repo: `lll:onboard`.
- Live-site go-live checks (TLS, DNS, email, headers in production): `lll:launch`. Shipping the release: `lll:ship`.
- Rewriting docs: `lll:docs` (this skill finds drift; `lll:docs` fixes it). Restore rehearsal: `lll:backup-drill`.
- Token and context cost of CLAUDE.md, skills or MCP servers: `lll:tokens`. Building or polishing UI: `lll:ui`.

## Modes

- **Guidance** (default): one snippet, query, file or config through one lens. Answer inline from the lens file. No files, no subagents.
- **Full**: a run that writes a report and fixes confirmed findings. Three shapes:
  - **Lens run**: the user names one or more lenses ("check db health", "audit deps and tests"). Scope is those lenses over the repository or the paths named.
  - **`full` preset**: every lens plus `lll:security` full, over every tracked file. Method: [orchestration](references/orchestration.md).
  - **`care` preset**: the monthly client check. Method: [care](references/care.md).
- "Report only" or "don't change anything" skips the fix phase. If it is unclear whether the user wants a run or an answer, answer first and offer the run in one line.

## Lenses

| Lens | Covers | File |
|---|---|---|
| bugs | logic errors, crashes, races, error handling, UI click paths that undo themselves | [bugs](references/lens-bugs.md) |
| db | schema, constraints, indexes, N+1, transactions, pools, backups; per engine | [db](references/lens-db.md) |
| deps | vulnerabilities, licences, abandoned or unpinned packages, lockfile drift, runtime end of life | [deps](references/lens-deps.md) |
| perf | backend latency, caching, Core Web Vitals, bundle size, mobile startup and jank, memory | [perf](references/lens-perf.md) |
| a11y | WCAG 2.2 AA on web, TalkBack, VoiceOver; automated plus manual | [a11y](references/lens-a11y.md) |
| tests | gaps on risky paths, flaky tests, assertions that test nothing, missing failure paths | [tests](references/lens-tests.md) |
| cleanup | dead code, unused exports, deps and files, duplicate helpers, deferred shortcuts | [cleanup](references/lens-cleanup.md) |
| drift | docs versus code, client and server contracts, config across environments | [drift](references/lens-drift.md) |
| migration | expand-contract, reversibility, locks, backfills, deploy ordering, data loss | [migration](references/lens-migration.md) |
| release | readiness, rollback, config and secrets per environment, flags, versioning, store builds | [release](references/lens-release.md) |
| agent-config | `.claude` settings, hooks, MCP servers, CLAUDE.md and AGENTS.md, skills and plugins | [agent-config](references/lens-agent-config.md) |

Map the user's words to lenses: "db health" is db plus the migration checks on pending migrations; "code health" or "quality" is bugs, tests and cleanup; "is it ready to ship" is release plus migration plus the tests baseline.

## Guidance steps

1. Read the lens file's **Covers** and **Method** for the question's lens and the stack section that applies.
2. Read the code or config in question and its callers. Answer with the finding block format of `../../shared/findings.md` for anything real, or say what makes it safe with the line that does.
3. Offer a lens run in one line when the snippet suggests the problem repeats elsewhere.

## Lens run steps

1. **Learn the project** with `../../shared/stack-detect.md` and record its block. Read the project's rules and locked decisions; they are the spec (`../../shared/ground-rules.md` "Authority").
2. **Baseline.** Read the latest CI result if there is one. The gate baseline itself runs once, in the fix worktree after install (`../../shared/fix-phase.md` step 4); a gate that already fails there is the first finding (lens `tests` or `release`).
3. **Leads.** Read the newest reports in `docs/audits/` for these lenses. Carry their open findings as leads marked "previously reported".
4. **Read-only audit.** Follow each lens file's Method and its stack section. Run only the read-only commands it lists; anything that installs, builds into the tree or touches a remote system waits for the fix worktree or the owner. Every tool hit and grep hit is a lead: confirm it by reading the code or discard it.
5. **Write findings** as blocks per `../../shared/findings.md`. No failure scenario, no finding: it goes to Questions. The finder marks every block `Verdict: needs_validation`; only the verifier sets `confirmed` or `rejected`. Calibrate severity with the lens file's examples. Large repositories: split by area and use subagents per `../../shared/agents.md` with the brief in [orchestration](references/orchestration.md) "Area brief".
6. **Verify.** A different agent than the finder (strongest tier) receives the finding blocks only and tries to disprove each one: re-read the code, every caller, both sides of any contract, config and tests. Verdicts `confirmed`, `needs_validation`, `rejected`.
7. **Merge and diff.** Dedupe across lenses (keep the most specific location, list both lenses). If an earlier report exists, mark `new`, `persisting` and `gone` with `node <skill-dir>/scripts/ledger.mjs diff <old-report> <new-report>` (`<skill-dir>` is the folder holding this file).
8. **Fix** every confirmed finding per `../../shared/fix-phase.md`, unless report only. Doc-drift fixes go through `lll:docs` in the fix worktree.
9. **Report** at `docs/audits/<YYYY-MM-DD>-audit-<lens or preset>.md` per `../../shared/report.md`, then the chat summary it describes.

## `full` preset steps

Follow [orchestration](references/orchestration.md) end to end. In short:

1. Ground truth: stack, gates, known gaps the repo already admits, locked decisions.
2. Coverage map: `git ls-files` split into areas so every tracked file has an owner (`node <skill-dir>/scripts/ledger.mjs map <areas.json>` lists unowned files).
3. One subagent per area for the per-file lenses (bugs, db, perf, a11y, tests, cleanup) and one per repo-wide lens (deps, drift, migration, release, agent-config), each with the threat model and the end-to-end traces that cross it.
4. `lll:security` in full mode at the same time, returning finding blocks instead of fixing.
5. Merge, cross-area hunts, independent verification, rerun diff, one fix phase for everything, one report.

## `care` preset steps

Follow [care](references/care.md): deps lens, `lll:security` quick pass, backup status through `lll:backup-drill`, uptime, TLS and domain expiry, error-log scan where access exists, open issues and alerts, then a report with a plain-language section for the client.

## Output

- **Guidance:** the answer in chat with finding blocks or the safe line cited.
- **Lens run and `full`:** `docs/audits/<YYYY-MM-DD>-audit-<lens or full>.md` per `../../shared/report.md` with new, persisting and gone marks; a local fix branch and worktree with one commit per finding and green gates; owner actions; the chat summary.
- **`care`:** `docs/audits/<YYYY-MM-DD>-audit-care.md` that opens with the client section, plus fixes as above.
