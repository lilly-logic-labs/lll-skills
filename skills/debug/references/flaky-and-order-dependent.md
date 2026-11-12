# Flaky and order-dependent tests

A test that sometimes fails has a cause. Measure it, classify it, remove the cause. Retries and sleeps do not remove it.

## 1. Measure

1. Run the single test alone N times (N = 50 to 200 for fast tests) and count failures. Record the rate.
2. Run it with its whole file, then with the whole suite, same N or fewer. Compare rates.
3. Run it on the failing environment (CI image, device, region) if different.

| Result | Meaning |
|---|---|
| Fails alone | Not order dependent. Timing, randomness, environment or a real bug. |
| Passes alone, fails with others | Order dependent. Shared state leaks between tests. |
| Fails only in parallel | Shared resource: port, file, database, temp dir, global. |
| Fails only on CI | Environment: CPU speed, timezone, locale, missing service, file system case. |
| Fails at certain times | Clock: midnight, month end, DST, leap day, timezone. |

Repeat flags by runner:

| Runner | Repeat | Order and parallelism |
|---|---|---|
| Jest | loop in shell | `--runInBand`, `--randomize`, `--seed N` |
| Vitest | `--retry 0` plus loop | `--no-file-parallelism`, `--sequence.shuffle`, `--sequence.seed N` |
| pytest | `pytest-repeat` `--count N` | `-p no:randomly` or `-p randomly -p "randomly_seed=N"`, `-x` |
| Go | `go test -count=N` | `-shuffle=on` (prints the seed), `-p 1`, `-race` |
| Rust | loop in shell | `cargo test -- --test-threads=1` |
| JUnit / Gradle | `--rerun-tasks` plus loop | `junit.jupiter.execution.parallel.enabled=false`, random method order extension |
| RSpec | loop in shell | `--order random --seed N`, `--bisect` finds the minimal failing set |
| PHPUnit | loop in shell | `--order-by=random --random-order-seed=N`, `--process-isolation` |
| .NET | loop in shell | `-- RunConfiguration.MaxCpuCount=1`, `[assembly: CollectionBehavior(DisableTestParallelization = true)]` for xUnit |
| Swift / XCTest | `-test-iterations N` | `-parallel-testing-enabled NO`, `-test-repetition-mode` |
| Android | `-Pandroid.testInstrumentationRunnerArguments.numShards` off | one device, `--no-parallel`, animations off |

Record the seed whenever the runner prints one. A seed turns "sometimes" into "always".

## 2. Classify by cause

| Cause | Tells | Fix |
|---|---|---|
| Shared mutable state | Fails after specific tests; pass alone | Reset in setup/teardown; no module-level state; fresh fixtures |
| Test order | Seed-dependent | Make each test arrange its own world |
| Time | Fails near boundaries; uses `now()` | Inject a clock; freeze time; avoid real sleeps |
| Async races | `sleep` or timeouts in the test; unawaited promises | Wait on a condition (below); await everything; flush queues |
| Resource collision | Fixed ports, temp paths, shared DB rows | Port 0 or random, unique temp dirs, per-test schema or transaction rollback |
| Randomness | Random data in fixtures | Seed it and print the seed; property tests keep the failing case |
| Environment | Locale, timezone, filesystem order, env vars | Pin them in the test setup |
| Network | Calls real services | Fake at the boundary; record/replay; no internet in unit tests |
| Concurrency in product code | Real race | It is a bug, not a flake. the races guide of this skill |
| Leaked resources | Slow growth, "too many open files" | Close handles in teardown; assert zero leaks |
| UI timing | Element not ready; animation | Wait for the element state; disable animations in tests |
| Test is the bug | Asserts on incidental detail (order of a map, a timestamp) | Assert on the contract |

## 3. Find the polluter

Order-dependent symptoms: target passes alone, fails after others.

1. Make the order deterministic: disable parallelism and shuffling, or use the failing seed.
2. Run the bisect script:
   `node scripts/bisect-polluter.mjs --cmd "<runner> {files}" --target path/to/target.test --list candidates.txt`
   `candidates.txt` holds the test files that run before the target, one per line, in run order. The script confirms the target passes alone and fails after the candidates, then removes files until the minimal polluter set is left.
3. Read what the polluter leaves behind: globals, env vars, singletons, mocks not restored, timers, open handles, files, database rows, cached modules, feature flags, locale.
4. Fix the leak at the polluter (restore in teardown) and make the victim robust (arrange its own state). Both, because either can regress.
5. For a single test file, bisect test names the same way (split by `-k`, `--grep`, `--filter`).

RSpec `--bisect` and Go `-shuffle` with the printed seed do part of this natively; use them first when present.

## 4. Wait on conditions, not on time

Arbitrary sleeps guess at timing; they pass on a fast machine and fail on a loaded one.

```
waitFor(condition, description, timeoutMs = 5000, pollMs = 10)
  start = now()
  loop:
    result = condition()
    if result: return result
    if now() - start > timeoutMs: fail("timed out after {timeoutMs}ms waiting for {description}")
    sleep(pollMs)           // short, only between polls
```

Rules:
- Wait for the state you need (event received, row exists, element visible), not for an interval.
- Poll every 10 to 50 ms. Slower polling wastes time, faster burns CPU.
- Always a timeout with a clear message that says what was awaited.
- Read fresh state each poll; do not cache the value outside the loop.
- A fixed delay is correct only when testing time-based behaviour (debounce, throttle, animation), after the triggering event has been awaited, and with a comment saying why that number.

Built-ins: Testing Library `waitFor`/`findBy*`, Playwright auto-waiting and `expect.poll`, Cypress retries, `await eventually` in Kotlin/Awaitility, `pytest` with `tenacity`/`anyio` events, Go `require.Eventually`, XCTest `XCTWaiter`/expectations, Espresso idling resources.

## 5. Quarantine only with a ticket

If the cause cannot be fixed today:
- Mark it skipped or quarantined with a link to the issue, the observed rate and the date.
- Keep it running in a non-blocking job so the rate stays visible.
- Never leave retry-until-green as the default for the suite; it hides regressions that also fail sometimes.

## 6. Prove the fix

- Same N runs as step 1, zero failures. For a rate of 1 in 20, run at least 200 to reach reasonable confidence.
- Run the full suite shuffled with the original failing seed and two new seeds.
- Run under CPU stress or with a throttled core (`taskset`, `cpulimit`, Docker `--cpus`) if the cause was timing.
