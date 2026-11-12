# Execute a plan inline

You implement every task yourself in this session. No implementer subagent, no reviewer per task. One fresh-context review of the whole branch at the end.

What this gives up: a fresh context per task and a second pair of eyes per task. What replaces them: the brief is the spec, the ledger is your memory, TDD is the per-task gate, and the final reviewer is the second pair of eyes. Use it for short or tightly coupled plans, or when no subagents exist. Prefer subagents (`execute-subagents`, named in the skill's route table) when the user wants a gate per task or the plan is long enough that late tasks would run on a compacted context.

The plan already did the thinking. Execute it exactly, prove each step with a test you watched fail and then pass, and leave a record that survives your own forgetting.

## Setup

1. Isolated workspace, not `main`. Record BASE (`git rev-parse HEAD`).
2. Read the plan once. Note its Global Constraints, Gates and Review focus. Read the spec it names; the spec is the authority and the plan is its argument. No reachable spec: note it in the ledger; rulings made without one are provisional.
3. Make one todo per task in the host's task list.
4. Create the **ledger**, a scratch file outside version control, because conversation memory does not survive compaction. A controller that loses its place re-implements tasks whose commits already exist.
   - Location: `<repo>/.lll/build/<plan-basename>/progress.md`, with the folder excluded locally: `echo '/.lll/' >> "$(git rev-parse --git-path info/exclude)"`. Or any scratch folder outside the repository.
   - First line: `# Build ledger - plan: <plan path>`. A ledger whose first line names another plan belongs to that plan: leave it, start your own.
   - After compaction, trust the ledger and `git log` over your recollection. Lines `Task N: complete` mean done; resume at the first task without one.
5. Read the TDD rules (contract item 4 of the skill) before Task 1. A plan whose steps say "write the failing test first" does not exempt you from them.
6. **Pre-flight scan.** For every pair of tasks that share a file or interface, write one ledger row: the two tasks, what one produces against what the other consumes, what you found. Rule on each conflict with the spec as authority and record the ruling beside the row. Tasks that share nothing get the single line `Pre-flight: no shared interfaces`.

## The task loop

Narrate at most one short line between tool calls; the ledger and tool output carry the record. Every tool call re-reads your whole context, so keep long output in a file and read its tail, and append the ledger in the same call as the commit.

1. **Take the task.** Re-read its brief in the plan: exact values, signatures, test cases, `Expected:` lines. Mark the todo in progress. Note BASE for the task.
2. **Work the steps in order**, red-green. A test step's code is written first and run first. Watching it fail is a step, not a formality: a test that passes before the implementation exists is a finding about the test.
3. **Compare every `Expected:` line** with the real output. Three outcomes:
   - Matches: next step.
   - The code is wrong: debug the cause (`lll:debug`). Never patch the symptom to make the step's output match.
   - The plan is wrong: rule on the smallest change that satisfies the spec and ledger it as `Task N: Ruling: <finding> - <decision and why> - <cost if wrong>`. Later tasks that touch the same interface read the ruling from the ledger.
4. **Commit** as the plan's steps say. A task spanning several commits is fine; the task's review range is cut from BASE, never `HEAD~1`.
5. **Completion contract.** Before the ledger line, all of these hold, with evidence from this session:
   - every test the task names exists and ran, and you read the output;
   - the final test run for the task passed;
   - every `Expected:` was compared with real output;
   - every deviation has a `Ruling:` line.
   If any item is missing the task is not complete: finish it.
6. **Ledger line:** `Task N: complete (commits <base7>..<head7>, tests: <command> -> <result>)`. Mark the todo complete. Next task. Do not pause for a check-in.

## Final review

Package the branch diff (`git log --oneline <merge-base>..HEAD`, `git diff --stat`, full diff with context) into one file and review from the file.

- **With subagents:** dispatch a reviewer on the most capable model (name the model explicitly; an omitted model inherits the session's), using the brief in `lll:review` (request-review). Hand it the diff file, the plan and spec paths, the plan's Review focus verbatim, and a pointer to the ledger's `Ruling:` lines. This is the one fresh context the run buys. Do not skip it, and do not replace it with your own read of the diff.
- **Without subagents:** do the review yourself as a separate pass after the last ledger line. Write `Final review: self-review (no subagent)` to the ledger and say so in your final message. A self-review by the author is weaker; the user decides whether it is enough.

Sort the findings before acting. Reviewer severity labels are advice; the gate is yours. Re-grade by effect: what does a reasonable person using this software get if it ships? A finding the spec is silent about is still a finding.
- **Critical and important:** one fix pass. For each: write the test that reproduces it, watch it fail, fix, run the whole suite. Ledger: `Final: fixed <finding> - <test> RED->GREEN, suite N/N`. A fix with no failing test first is unverified. Do not dispatch a re-review of the fix pass; the covering tests answer "addressed" and the suite answers "broke nothing".
- **Minor:** ledger `Final: minor (deferred): <one line>` and list under "Deferred minors" in the final message. Never fix minors in the pass.
- A finding you decide not to fix is a ruling: `Final: Ruling: <finding> - <why the code stands> - <cost if wrong>`.

## Finish

Collect every ledger line with `Ruling:` into the final message under "Rulings I made", in order, each with its cost if wrong; and every deferred minor under "Deferred minors". Both lists are exhaustive: the final message is the only place decisions taken on the user's behalf reach them. Then delete this plan's ledger folder; git history is the record. Continue to `lll:ship`.

## Rationalizations

| Excuse | Reality |
|---|---|
| "The plan's code is right, skip watching the test fail" | A test you never saw fail proves nothing. It is one step. |
| "I will run the full suite at the end instead of per step" | Per-step runs show which step broke it. The end-of-task run is the contract, not a substitute. |
| "I will write ledger lines after a few tasks" | Compaction does not wait. One line per task, with the commit. |
| "Let me check in before the next task" | The user chose inline to spend less. Only the stop conditions stop you. |
| "I read my diff carefully, the final reviewer is redundant" | Same author, same blind spots. It is the only fresh context. |
| "The reviewer said Minor, so it is Minor" | The label may have graded the spec's silence. Grade the effect. |
| "I will fix the minors while I am in there" | Each is a test, a fix and a suite run nobody asked for. Ledger them. |
