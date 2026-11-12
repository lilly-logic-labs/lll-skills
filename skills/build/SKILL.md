---
name: build
description: Implement a change or execute a plan, inline or with a fresh subagent per task and review. Covers TDD, lean builds, surgical patches, safe refactors and reversible migrations. Use when asked to build, implement, execute the plan, add a feature, refactor or migrate. Not for bugs of unknown cause (lll:debug), ideas not yet designed (lll:plan) or review, commit and PR (lll:review, lll:ship).
metadata:
  origin: lll
---

# Build

Turns a request or an approved plan into working, tested code that does what was asked and nothing more.
One contract for every route: understand first, smallest change that works, proof before claims, stop when acceptance passes.

## When to use

- A written plan exists (from `lll:plan` or the user) and needs executing.
- The user asks to add a feature, change behaviour, refactor, migrate, or fix a bug whose cause is already known.
- Several independent tasks or failures can be worked in parallel.

## When not to use

- Idea still fuzzy, or the work is big and unplanned: `lll:plan` first.
- A failure whose cause is not known yet: `lll:debug`, then come back with the cause.
- Reviewing a diff or answering review comments: `lll:review`.
- Verifying "done", committing, opening a PR, deploying: `lll:ship`.
- Whole-codebase cleanup or dependency hygiene audits: `lll:audit`.

## Modes

- **Guidance** (default). Do the work yourself in this session, task by task. No subagents. Edit only the files the task names. Progress lives in the host's todo list; no report files.
- **Full**. Only when the user asks for subagent execution, parallel agents, "run the whole plan" or an end-to-end run. Fresh implementer per task, spec review then quality review, a progress ledger outside the tree, a whole-branch review. Subagent rules: `../../shared/agents.md`.

Both follow `../../shared/ground-rules.md`. Learn gates, stack and rules with `../../shared/stack-detect.md`.

## Choose the route

| Situation | Route | Detail |
|---|---|---|
| Written plan, work in this session | execute inline | `references/execute-inline.md` |
| Written plan, long or high-stakes, user wants a gate per task | execute with subagents | `references/execute-subagents.md` |
| Two or more independent problems with no shared state | parallel agents | `references/parallel-agents.md` |
| Bug whose location and cause are known | surgical patch | `references/surgical-patch.md` |
| Restructure with behaviour unchanged | safe refactor | `references/safe-refactor.md` |
| New behaviour, small to medium, no plan | lean build | `references/lean-build.md` |
| Schema, data, API, protocol, config or dependency transition | migration-safe change | `references/migration-safe.md` |

If the work grows past the route (more files, new decisions, a second subsystem), stop, say so, and step up to `lll:plan`.

## The build contract (every route)

1. **Understand first.** Read the task and the code it touches. Trace the real flow end to end. Grep every caller of anything you will change. The ladder shortens the solution, never the reading.
2. **Climb the laziness ladder** before writing code (`references/laziness-ladder.md`): need it at all, already in this codebase, stdlib, platform feature, installed dependency, one line, only then new code.
3. **Fence the scope.** Before the first edit write three lines: acceptance (observable), non-goals, stop condition. Stop when acceptance passes. Report omissions, do not smuggle them in.
4. **Test first.** No production behaviour without a failing test that you watched fail (`references/tdd.md`). Exceptions (throwaway spike, generated code, pure config) need the user's word.
5. **Follow the codebase.** Existing patterns, naming, error style. No new dependency, config knob, abstraction or file layout that the task does not force.
6. **Never trade away** input validation at trust boundaries, handling that prevents data loss, security, or accessibility basics.
7. **Evidence before claims.** A task is done when its tests and gates ran in this session and you read the output. Not "should pass".
8. **Fix what you find.** A failing gate or bug in your path is fixed, including pre-existing ones, or the exact blocker is named.
9. **Do not touch other people's work.** Other agents or people may share the checkout. No stash, reset, clean or branch switch there.

## Steps

1. **Preconditions.**
   - Read `CLAUDE.md`, `AGENTS.md`, README and the plan with its spec. Note forbidden commands and locked decisions.
   - Run each gate once for a baseline (`../../shared/stack-detect.md` section 5). A gate already red is fixed first or reported as the blocker.
   - Work in an isolated workspace (worktree or branch) when the checkout is shared or on the default branch. Never start on `main`/`master` without the user's consent. Setup: `lll:ship`, worktrees section.
   - Record the base commit: `git rev-parse HEAD`.
2. **Fence the scope** (contract item 3). For a plan, the plan is the fence; list its Global Constraints.
3. **Take the route** from the table and follow its reference. Keep reading the route's reference as you go, not only at the start.
4. **Per task loop** (all routes):
   1. Read the task brief fully, with exact values.
   2. RED: write the test, run it, confirm it fails for the right reason.
   3. GREEN: the minimum code to pass. Run the focused test.
   4. REFACTOR on green only. No behaviour change.
   5. Run the gates the task names, then the project suite before claiming done.
   6. Commit as the plan says (one logical change, tests with the code).
   7. Compare each plan `Expected:` with real output. Record a deviation as a ruling (below).
5. **Plan wrong or code wrong?** Output does not match the plan. If the code is wrong, use `lll:debug` for the cause; never patch the symptom to make output match. If the plan is wrong (contradicts the spec, an interface mismatch, a command that cannot work), choose the smallest change that satisfies the spec and record: `Ruling: <what> - <why> - <cost if wrong>`. Unrecorded deviation is a decision made in secret.
6. **When to stop and ask.** Only for: an irreversible or destructive operation; a security-sensitive action; a side effect outside this workspace that norms say you ask about first (merge, push to a shared branch, publish, production change); a plan so broken every path forward is a guess. Otherwise decide, record the ruling, keep going. Do not ask "should I continue?" between tasks.
7. **Finish.**
   - Run the whole-branch review: `lll:review` (request-review brief), on the most capable model available when the host has subagents. Without subagents, do it yourself as a separate pass and say it was a self-review.
   - Grade findings by effect on a real user, not by whether the spec mentions the trigger. Critical and important go to one fix pass (each fix: failing test, fix, full suite). Minor goes to a deferred list.
   - If documented behaviour changed, `lll:docs`. Then `lll:ship` to verify, commit and finish the branch.

## Red flags

| Thought | Reality |
|---|---|
| "I remember what task N says" | You remember a summary. The brief has the exact values. Read it. |
| "The test passes first time" | Then it tests existing behaviour or nothing. Fix the test. |
| "I will add a config option for later" | Later scaffolds for itself. Delete it. |
| "I will clean up this neighbour while I am here" | Out of scope. Note it, do not do it. |
| "Tests after is the same thing" | Tests after answer what the code does, not what it should do. |
| "The plan is wrong, I will just do the right thing" | Do it and record the ruling. |
| "I will fix this symptom and investigate later" | Route to `lll:debug`. Symptom fixes are second bugs. |
| "The subagent said it passed" | Check the diff and run the tests yourself. |
| "Ask the user again to be safe" | Only the four stop conditions stop you. |

## Output

- Chat summary: what changed (files, commits), proof (commands run with the real result lines), deviations as rulings, deferred minors, and what was not verified.
- Guidance mode: edits and commits in the working tree; nothing pushed, merged or deployed.
- Full mode: the same, plus the ledger summary and review outcomes. Delete the ledger when the review is clean; git history is the record.
- Always ends with the next step: `lll:review` or `lll:ship`.
