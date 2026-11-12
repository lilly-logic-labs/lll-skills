# Lens: bugs

Wrong results, crashes and lost work that a user or operator would hit, found by reading code paths end to end.

## Covers

- Logic errors: wrong branch, wrong comparison, off-by-one, inverted condition, wrong unit (cents and units, seconds and milliseconds, UTC and local).
- Crashes on realistic input: null or undefined, empty collections, unexpected enum values, malformed external data.
- Error handling: swallowed errors, errors that lose user work, retries that duplicate effects, partial failure without rollback.
- Concurrency: check-then-act races, lost updates, double submit, out-of-order async results, unbounded parallelism.
- State bugs in UIs: handlers whose calls cancel each other, stale closures, effects that undo actions, optimistic updates without rollback.
- Time, money and numbers: time zones and day boundaries, daylight saving, float arithmetic on money, overflow, rounding.
- Resource leaks: listeners, timers, subscriptions, file handles and connections not released on every path.

Not here: security boundaries (`lll:security`), query performance (db and perf lenses), style.

## Method

1. **Map entry points.** Routes, handlers, jobs, queue consumers, CLI commands, screens and their buttons. Bugs cluster at entry points and at hand-offs between components.
2. **Rank paths by cost of failure.** Money, sign-in and sign-up, data sync, deletion, imports and exports, scheduling and date math, anything retried. Read those first, then the rest of the scope.
3. **Read whole functions and their callers.** For each path ask the sad-path questions where the interface accepts them: empty, null, zero, negative, maximum, duplicate, concurrent, retried, partially failed, cancelled, offline, time-zone boundary, very long or non-ASCII input.
4. **Follow errors.** Every `catch` either handles, rethrows or reports. Every promise or task is awaited or deliberately detached with its own error handling. A failure after a write either rolls back or leaves a state the next run can repair.
5. **Click paths** (any UI with shared state):
   1. Map each store or context action: which fields it sets and which it resets as a side effect.
   2. For each button, form and toggle, list the handler's calls in order with what each reads and writes.
   3. Flag: a later call that resets what an earlier one set; async calls whose resolution order changes the final state; callbacks capturing stale state; a label promising an action the handler never performs; a condition that is always false at that point; an effect that reverts the change.
   4. Check the final state matches what the control's label promises.
6. **Prove it.** Run the existing test that should catch it, or write a throwaway test or script in a scratch folder outside the repository and run it. Record the command and the decisive output line as evidence. If it cannot be reproduced, say what was tried and lower the confidence.

## Checks by stack

- **JavaScript and TypeScript:** floating promises and `forEach(async ...)`; `||` where `??` was meant (drops `0` and `""`); `sort()` without a comparator on numbers; `new Date("YYYY-MM-DD")` parsed as UTC; `toISOString().slice(0, 10)` shifting the day; month index starting at 0; `JSON.parse` on external data without a guard; floating-point money; `parseInt` on user input without validation.
- **React and React Native:** missing effect dependencies; state set after unmount; `key={index}` on lists that reorder; context values recreated each render causing reset loops; double submit on save, pay and delete buttons; optimistic updates without rollback; error state set while stale data stays on screen.
- **Python:** mutable default arguments; naive and aware datetimes mixed; `except Exception: pass`; float money instead of `Decimal`; blocking calls inside `async def`; generators consumed twice.
- **Go:** ignored errors (`_ =`); writes to a nil map; goroutines without cancellation; `defer` inside loops; slices aliased by `append`; loop-variable capture before Go 1.22; data races.
- **Rust:** `unwrap()` and `expect()` on external input in request paths; `as` casts that truncate; integer overflow that wraps in release builds; blocking calls in async tasks.
- **Java and Kotlin:** `!!` and `Optional.get()` on absent values; `==` on boxed numbers; `BigDecimal.equals` versus `compareTo`; shared `SimpleDateFormat`; `GlobalScope` coroutines that outlive their screen.
- **Swift:** force unwraps and `try!` on external data; UI updates off the main actor; retain cycles in escaping closures; tasks not cancelled when views disappear.
- **PHP:** loose `==` comparisons with strings and `0`; `strpos` returning `0`; default time zone assumptions.
- **Ruby:** broad `rescue` swallowing errors; `Time.now` versus `Time.zone.now`; `nil` propagating through method chains.
- **.NET:** `async void`; `.Result` or `.Wait()` deadlocks; `DateTime.Now` where UTC is stored; `IDisposable` not disposed; `double` for money.
- **SQL in code:** `BETWEEN` on timestamps including the end instant; `NULL` comparisons with `=`; `COUNT(column)` skipping nulls; updates without a `WHERE` guard on concurrent state.
- **Mobile:** state lost on process death; back navigation into a finished flow; permission-denied and offline paths; resume from a notification into a screen that assumes earlier setup.

## Commands

Run what the project already has configured or installed. Never install a tool for this lens during the read-only phase.

| Ecosystem | Bug-finding commands |
|---|---|
| TypeScript | `tsc --noEmit`; ESLint with `@typescript-eslint/no-floating-promises`, `no-misused-promises`, `react-hooks/exhaustive-deps` if configured |
| Python | `ruff check --select B,BLE,DTZ,PLE,RUF` ; `mypy` or `pyright` |
| Go | `go vet ./...`; `staticcheck ./...`; `go test -race ./...` |
| Rust | `cargo clippy -- -W clippy::unwrap_used -W clippy::cast_possible_truncation` |
| JVM | `./gradlew lint detekt` or `spotbugs` if configured |
| Swift | `swiftlint` if configured; Xcode static analyzer |
| PHP | `phpstan analyse` at the project's level |
| Ruby | `rubocop --only Lint` |
| .NET | `dotnet build -warnaserror` with nullable reference types enabled |

Linter output is a lead list. A rule hit becomes a finding only with a failure scenario.

## Severity calibration

- **critical:** totals shown to users are wrong by arithmetic (float money, wrong sign on refunds); a retry double-charges or double-ships; a sync path silently drops or resurrects records.
- **high:** sign-in fails for users in a time zone east of UTC between midnight and the offset; saving a form loses the draft on any server error; a crash on an empty list in a core screen.
- **medium:** an edge case such as a leap day or a 31st-of-month schedule produces a wrong date; a rare race double-submits a comment; an error toast hides which field failed.
- **low:** a listener leak on a rarely opened screen; a misleading log line; an unreachable branch with wrong logic.

## False-positive traps

- The guard is ten lines above the grep hit, in the caller, or in middleware. Read the whole function and one level out.
- The framework already handles it: ORM parameterisation, React batching, a database constraint, a schema validator at the boundary.
- A type, a `NOT NULL` column or a validated schema makes the "possible null" impossible.
- The behaviour is a locked decision in an ADR or the project rules. Report non-compliance, not disagreement.
- Test-only, example or dead code: report it under cleanup, not as a user-facing bug.
- A theoretical race with no realistic interleaving (single-threaded runtime, serialised queue). Name the interleaving or drop it.
