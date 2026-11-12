# Execute a plan with subagents

A fresh implementer subagent per task, a task review (spec compliance, then code quality) after each, a broad whole-branch review at the end. Subagents never inherit your session: you build exactly the context each needs. This also keeps your own context for coordination.

Use when the plan is long, tasks are mostly independent, or a mistake is expensive. Costs a fresh context per task and per review. If the host has no subagents, use inline execution (the other execute file in the skill's route table); never fabricate a dispatch. Model choice and brief contents: `../../../shared/agents.md`.

## Setup

Same as inline execution: isolated workspace, read the plan and spec once, one todo per task, a ledger outside version control (`<repo>/.lll/build/<plan-basename>/progress.md`, excluded locally, first line `# Build ledger - plan: <path>`), pre-flight scan of tasks sharing files or interfaces with one ledger row per pair. A ledger and the plan can be handed between inline and subagent executors mid-flight.

Scan the plan for tasks that contradict each other or the Global Constraints, and for anything the plan mandates that the review rubric below treats as a defect (a test that asserts nothing, verbatim duplicated logic). Rule on each before dispatching Task 1.

## Rules

- Never run two implementers in parallel on one checkout (edit conflicts). Independent tasks in separate worktrees are the exception and come from `parallel-agents`.
- A dispatch describes one task. Never paste accumulated summaries of earlier tasks. The implementer needs its brief, the interfaces it touches and the global constraints.
- Hand artifacts over as files (brief, report, diff package), not pasted text. Everything pasted stays in your context and is re-read every turn.
- Name the model on every dispatch; an omitted model inherits the session's, usually the most expensive.
- The implementer never dispatches subagents, and never a reviewer. Review comes from you after the report. A worker-spawned reviewer duplicates a seat at full cost.
- Never fix findings in the controller session. Fixes by you skip review and fill your context.
- Do not stall: conflicts, ambiguities and plan defects are decided with a ruling in the ledger. Four things stop you: an irreversible or destructive action, a security-sensitive action, a side effect outside this workspace that norms say you ask about first, and a plan so broken every path is a guess.

## Model selection

Follow `../../../shared/agents.md`. For this job:
- Mechanical task, 1 to 2 files, complete spec: small and fast model. If the plan text holds the complete code, it is transcription plus testing.
- Multi-file integration or judgement: mid-tier.
- Architecture, security, money, migrations, the final whole-branch review: strongest.
- Fix rounds 4 and 5: at least one tier above the implementer that got stuck.
- Turn count beats token price: the cheapest models often take two to three times the turns on multi-step work. Use mid-tier as the floor for reviewers and for implementers working from prose.

## Per task

1. **Brief file.** Extract the task's text from the plan into a file; that file is the single source of requirements and exact values. Record BASE (`git rev-parse HEAD`) before dispatch.
2. **Dispatch the implementer** (template below) with: one line on where the task fits, the brief path, interfaces and decisions from earlier tasks the brief cannot know, your resolution of any ambiguity you noticed, and the report file path. Several small same-shape edits (the same one-line fix across files) go to one implementer in one batch, reviewed as one unit.
3. **Handle the status** the implementer returns:
   - `DONE`: package the diff and review.
   - `DONE_WITH_CONCERNS`: read the concerns. Correctness or scope concerns are addressed before review; observations ("file is getting large") are noted.
   - `NEEDS_CONTEXT`: supply it and re-dispatch.
   - `BLOCKED`: assess. Missing context: add it, same model. Needs more reasoning: more capable model. Task too large: split. Plan wrong: rule, ledger, re-dispatch with the ruling. Never retry the same model with nothing changed.
4. **Review package.** Write `git log --oneline BASE..HEAD`, `git diff --stat BASE..HEAD` and `git diff -U10 BASE..HEAD` into one uniquely named file. Never use `HEAD~1` (it drops all but the last commit of a multi-commit task). The reviewer reads the file; the diff never enters your context.
5. **Task review** (template below): both verdicts are required, spec compliance AND quality. The implementer's self-review never replaces it.
   - Give the reviewer: brief, report, diff package, and the Global Constraints that bind the task (copied verbatim: exact values, formats, stated relationships).
   - Do not pre-judge. A prompt containing "do not flag", "at most Minor", "the plan chose" is you sparing yourself a loop.
   - Items marked "cannot verify from diff" are yours to resolve with cross-task context. A real gap is a failed spec review.
6. **Fix loop** when spec fails or any Critical or Important finding stands. Minor findings go to the ledger (`Task N: minor (deferred): ...`) and never enter the loop. A finding that conflicts with plan text is a ruling first: weigh it against the plan, decide with the spec as authority, ledger it. Do not drop it because the plan mandates it.
   - Rounds 1 to 3: resume the original implementer with the open findings verbatim (if the host cannot message a live subagent, dispatch a fresh one with the brief, report path and findings).
   - Rounds 4 and 5: fresh implementer on a stronger model: "a prior implementer attempted this N times; you own it now; read the report file."
   - Every round: the implementer fixes, re-runs the tests covering the change, appends a fix report (what, covering tests, command, output). Then a scoped re-review (template below). Ledger: `Task N: fix round R/5 (X addressed, Y open; commits a..b)`.
   - Breaker at round 5: adjudicate each open finding yourself, once. Contestable or non-load-bearing: park it with a ruling. Load-bearing (a later task builds on it, or it reveals a plan defect): rule on the smallest change that unblocks, carry it into the next dispatch. Adjudicating earlier to end the loop is pre-judging.
7. **Complete.** `Task N: complete (commits a..b, review clean)` or `(.., K parked)`. Never start the next task with Critical or Important issues that are neither fixed nor parked with a ruling.

## Final whole-branch review

Package the range from `git merge-base <base> HEAD` to `HEAD` the same way as a task package. Dispatch the strongest model using the request-review brief from `lll:review`, with pointers to the ledger's deferred minors and parked lines. Findings: ONE fix dispatch with the complete list (per-finding fixers each rebuild context), then one scoped re-review, then adjudicate residuals. No second fix wave: residual load-bearing findings go to the user when the branch is finished.

## Finish

Final message lists every ledger `Ruling:` ("Rulings I made", with cost if wrong) and all deferred minors. Delete the ledger folder. Continue to `lll:ship`.

## Templates

### Implementer brief

```
You are implementing Task N: <name>.

Read your task brief first: <BRIEF_FILE>. It is your requirements, with the exact values to use verbatim.
Where this fits: <one line>.
Interfaces and decisions from earlier tasks: <exact signatures, rulings>.
Ambiguities resolved: <your answers>.
Work from: <directory>. Project gates: <commands>. Ground rules: <pasted lines from ground-rules>.

Before you begin: if the requirements, approach or dependencies are unclear, ask now. Do not guess.

Your job: implement exactly what the task specifies; write tests first (red, then green) and keep
the output pristine; run the focused test while iterating and the project suite once before you
commit; commit; self-review; report. Follow existing patterns. Do not restructure what the task
does not need. If a file you create is growing past the plan's intent, stop and report it.

You do not dispatch subagents. Do not spawn a reviewer: review is the controller's job.

Escalate with BLOCKED or NEEDS_CONTEXT when: the task needs an architectural decision, you cannot
find the code you need, you are unsure your approach is correct, or you have read file after file
without progress. Bad work is worse than no work.

Self-review before reporting: everything in the spec done? edge cases? names accurate? nothing
extra built? tests check behaviour, not mocks? output free of warnings?

Write the full report to <REPORT_FILE>: what you built, tests and results, RED command and failing
output, GREEN command and passing output, files changed, concerns. Reply with only:
Status (DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT), commits (sha + subject), a one-line
test summary, concerns, and the report path.
```

### Task reviewer brief (spec compliance, then quality)

```
Review one task: first whether it matches its requirements, then whether it is well built. This is
a task-scoped gate, not a merge review.

Requirements: read <BRIEF_FILE>. Binding constraints: <GLOBAL_CONSTRAINTS verbatim>.
Implementer's claims: read <REPORT_FILE>. Treat them as unverified; rationales ("kept simple per
YAGNI") are the author grading their own work and never lower a finding's severity.
Diff: read <DIFF_FILE> once (commit list, stat, full diff with context). Do not crawl the codebase;
inspect outside the diff only to check a concrete named risk (a changed contract, lock order,
shared state), and name the risk and the check in your report.
Read-only: do not change the tree, the index, HEAD or branches. Do not dispatch subagents.
Do not re-run the implementer's suite; run a focused test only to settle a specific doubt.
Warnings in the reported test output are findings.

Part 1, spec compliance: Missing (skipped or claimed but absent), Extra (unrequested, overbuilt),
Misunderstood (right feature, wrong way). For batched briefs, check every listed file has its hunk.
Requirements that cannot be verified from this diff go under "cannot verify from diff".

Part 2, quality: separation of concerns, error handling, DRY without premature abstraction, edge
cases, tests that verify real behaviour, one clear responsibility per file, files that grew large
because of this change.

Severity: Critical = data loss, security, broken behaviour. Important = this task cannot be trusted
until fixed: wrong or fragile behaviour, a missed requirement, swallowed errors, tests asserting
nothing, verbatim duplicated logic. Minor = polish. A plan-mandated defect is still Important,
labelled plan-mandated.

Output, starting directly with the verdict: Spec compliance (compliant | issues with file:line),
Cannot verify, Strengths, Issues by severity (file:line, what, why, fix), Task quality
(approved | needs fixes) with 1 to 2 sentences.
```

### Scoped re-review brief

```
Re-review one fix round. Verdict each finding and inspect the fix diff; nothing else.
Brief: <BRIEF_FILE>. Findings under verification: <verbatim list>. Report with fix reports appended:
<REPORT_FILE>. Fix diff: <DIFF_FILE> (from the head the previous review saw).
Read-only. No subagents. Do not re-review code the fix did not touch; report such things under
Out-of-scope observations (non-blocking).
Output: per finding ADDRESSED or NOT ADDRESSED with file:line ("attempted" is not addressed: the
defect must be gone); New breakage in the fix diff with severity; Out-of-scope observations;
Verdict: all addressed with no new Critical or Important breakage, or findings remain open.
```

## Rationalizations

| Excuse | Reality |
|---|---|
| "Close enough on spec compliance" | Spec gaps found means not done. Fix, or hit the cap and adjudicate. |
| "I will fix it myself, dispatching is overhead" | Controller fixes pollute your context and skip review. |
| "One more round will converge" | Past three, the failure is structural. Fresh eyes and a stronger model, then adjudicate at five. |
| "This finding is obviously wrong, I will drop it" | Adjudicate only at the cap, as a ledger entry. Silent discards are forbidden. |
| "The fix was small, skip the re-review" | Unreviewed fixes are how regressions land. |
| "Ledger bookkeeping is overhead" | The ledger survives compaction. Controllers without one have re-dispatched finished work. |
| "The implementer spawned its own reviewer, free assurance" | It is a duplicate seat on the same diff. Flag it as a defect. |
