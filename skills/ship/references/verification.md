# Verification before completion

Claiming work is complete without evidence is dishonesty, not efficiency. Evidence before claims, always.

## The gate

Before any statement that something works, is fixed, passes or is done, and before committing, opening a PR or moving to the next task:

1. **Identify**: which command proves this claim?
2. **Run**: the whole command, fresh, now (after your last edit).
3. **Read**: the full output. Check the exit code. Count failures, errors and warnings.
4. **Verify**: does the output confirm the claim?
   - No: state the actual status with the evidence.
   - Yes: state the claim with the evidence.
5. **Only then** make the claim.

Skipping any step is guessing.

## What proves what

| Claim | Requires | Not enough |
|---|---|---|
| Tests pass | Test command output: 0 failures, and the count looks right | Previous run; "should pass"; one file when asked for the suite |
| Types are fine | Type checker run: 0 errors | Editor squiggles; lint |
| Lint is clean | Linter run: 0 errors | Partial check; type checker |
| Build succeeds | Build command exit 0 (production build for release claims) | Lint passing; tests passing |
| Bug is fixed | The original reproduction now passes, and the regression test passes | Code changed; "looks right" |
| Regression test works | Red-green: fails without the fix, passes with it | Passes once |
| Requirements met | Line-by-line checklist against the plan or issue | Tests passing |
| A subagent completed it | The diff read by you, and the checks run by you | The agent's success message |
| UI works | Ran it: screenshots or interaction on the target device or browser, all states | Compiles; unit tests |
| Mobile works | Run on a device or emulator at the target OS; permission and offline paths | Simulator-only for hardware features |
| API works | Real request and response against the running service | Handler unit test alone |
| Migration is safe | Applied to a copy of realistic data, rolled back once, old code still works | The migration file reads correctly |
| Performance improved | Before and after numbers, same method | "Feels faster" |
| Deploy succeeded | Post-deploy checks against the live target (health, key flow) | CI green |
| Docs are right | Commands in the docs were run | Reading them |

## Regression test red-green

For a bug fix:
1. Write the test. Run it: passes (against the fix). 
2. Revert the fix (or comment it out). Run it: it must fail for the reported reason.
3. Restore the fix. Run it: passes.
If step 2 does not fail, the test proves nothing.

## Requirements check

1. Re-read the plan, issue or request. Do not work from memory.
2. List each requirement as a line.
3. For each, name the evidence: test name, command output, screenshot, file and line.
4. Anything without evidence is "not verified", and is said so.
5. Anything extra you built that was not requested: list it, and remove it or confirm it.

## Delegated work

Agents can report success while the diff is wrong. Read the diff (`git diff <base>..HEAD`), run the gates yourself, then report the facts. Trust, but verify the claim, not the confidence.

## Gate list for this repository

Take the commands from `../../../shared/stack-detect.md` (section 5) and the project's own docs, and run the ones that apply: unit tests, integration tests, type check, lint, format check, build, and for apps the run step. Run the narrow test first for speed, then the full suite before claiming done.

If a gate was already red before your change, say so, and fix it or name the exact blocker. Do not report it as someone else's problem.

## Reporting format

```
Verified:
- tests: <command> -> <N passed, 0 failed>  (exit 0)
- types: <command> -> 0 errors
- lint: <command> -> 0 errors
- build: <command> -> exit 0
- requirement 1: <evidence>
- requirement 2: <evidence>
Not verified: <what and why>
```

## Language to avoid before verification

"Should work", "probably fine", "seems to", "I believe", "looks correct", "great!", "done!", "all set". Replace with the evidence line or "not verified".

## Rationalizations

| Excuse | Reality |
|---|---|
| "Should work now" | Run the verification. |
| "I'm confident" | Confidence is not evidence. |
| "Just this once" | No exceptions. |
| "Linter passed" | Linter is not the compiler or the tests. |
| "The agent said success" | Verify independently. |
| "I'm tired" | Exhaustion is not an excuse. |
| "Partial check is enough" | Partial proves nothing about the rest. |
| "Different words, so the rule does not apply" | The spirit applies. |

## Red flags

Stop if you catch yourself: using hedging words before a result; expressing satisfaction before running anything; about to commit or push without a fresh run; relying on a partial run; thinking "just this once".
