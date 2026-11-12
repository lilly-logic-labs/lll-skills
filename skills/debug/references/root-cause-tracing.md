# Root-cause tracing

Method for a deterministic bug: narrow it, trace the bad value back to where it began, and fix it there.

## 1. Narrow the search space

Shrink before you theorise.

- **Input**: cut the failing input in halves until the smallest one that still fails remains. Delete fields, rows, lines, options.
- **Code**: comment out or stub half of a pipeline; the failure is in the half that still fails.
- **Time**: find the last good state (a tag, a deploy, yesterday's build) and bisect.
- **Environment**: same code, different machine, OS, runtime version, locale, timezone, env vars, data. The difference is the suspect list.

### Bisect a regression

Bisecting moves HEAD, so never do it in a shared checkout. Use a worktree.

```
git worktree add ../bisect-wt <bad-commit>
cd ../bisect-wt
git bisect start <bad> <good>
git bisect run <command that exits 0 on good, non-zero on bad, 125 to skip>
git bisect reset
```

The command must be a real reproduction (the regression test, a script). If a commit does not build, exit 125 so bisect skips it. Remove the worktree afterwards (`git worktree remove`).

No known good commit: walk back by release or by date until one is found, then bisect.

## 2. Instrument the boundaries

For anything that crosses components (client, API, queue, worker, database; build, sign, upload; layout, state, render), add one temporary log at each boundary showing what enters and what leaves. Run once. The first boundary where the output is wrong tells you which component to open.

- Log values and shapes, not secrets or personal data.
- Include a correlation id so you can follow one request.
- Remove the logging before you commit, or keep it at debug level if it earns its place.

## 3. Trace backward

Start at the symptom and ask "who gave this value to me?". Repeat.

Worked example (stack-neutral): `git init` runs in the wrong directory.

1. Symptom: a repository appears in the source tree during tests.
2. Direct cause: `git init` runs with `cwd = ""`.
3. Who passed `""`? `createWorkspace(projectDir)` was called with an empty `projectDir`.
4. Who passed that? The test helper read `context.tempDir` before the `beforeEach` that sets it had run.
5. Origin: a top-level constant evaluated at import time. Fix there (make it lazy), then add a guard in the function that refuses an empty path.

Rules:
- Fixing at step 2 hides the bug. The origin is the first place where the value became wrong.
- When you cannot trace by reading, capture the call stack at the point of failure:

| Stack | Capture |
|---|---|
| JS/TS | `console.error(new Error('trace').stack)` |
| Python | `import traceback; traceback.print_stack()` |
| Go | `debug.PrintStack()` or `runtime.Stack` |
| Rust | `std::backtrace::Backtrace::force_capture()` |
| JVM | `new Throwable().printStackTrace()` |
| Swift | `Thread.callStackSymbols` |
| .NET | `Environment.StackTrace` |
| PHP | `debug_print_backtrace()` |
| Ruby | `caller` |

- In tests, log before the dangerous operation, not after it fails, and use `console.error` or stderr because test loggers may swallow stdout.
- When something pollutes state and you do not know which test, use `../scripts/bisect-polluter.mjs` (run it with no arguments for usage) and the flaky-test guide of this skill.

## 4. Compare with a working case

- Find working code of the same kind in the repository or the docs. Read the reference implementation fully, not a skim.
- List every difference. Do not decide a difference is irrelevant yet.
- Note dependencies, config, assumptions and ordering the working case relies on.

## 5. Form and test one hypothesis

Template (keep it in the conversation or a scratch file):

```
H1: <X> is the cause because <Y>.
Predicts: <what else must then be true>.
Probe: <smallest check that could prove it wrong>.
Result: <observed>.  Verdict: confirmed | ruled out.
```

- A good hypothesis predicts something you have not looked at yet. Check that prediction.
- Do not stack changes. If the probe changes two things, you learn nothing.
- If you do not understand something, say "I do not understand X" and go read about X.

## 6. Done tracing when

- You can explain the bug in two sentences without "somehow" or "maybe".
- You can name an input that triggers it and one that does not, and the code explains the difference.
- A change at the origin makes the reproduction pass, and reverting it makes it fail again.

## When the trace dead-ends

- Evidence is missing: add instrumentation, not a fix.
- The origin is in a dependency: reproduce with a minimal case against the dependency, read its source and issue tracker, then decide between a workaround at your boundary and an upgrade. Record why.
- The origin is the design (two modules disagree about a contract): stop and take it to the owner with the options.
