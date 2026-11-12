# Test-driven development

Write the test first. Watch it fail. Write the minimum code to pass. If you did not watch the test fail, you do not know it tests the right thing. Violating the letter of these rules violates the spirit.

## Iron law

No production behaviour without a failing test first. Wrote code before the test? Delete it and start from the test. Do not keep it as "reference", do not adapt it while writing tests. Deleting is cheaper than trusting code you cannot prove.

Exceptions, only with the user's word: throwaway spikes (labelled, deleted or re-planned), generated code, pure configuration. When a behaviour cannot be unit tested (platform glue, a native permission dialog), say why in the commit body and cover it with the nearest honest check (integration test, a scripted run, a device smoke test).

## The cycle

1. **RED.** One test, one behaviour, a name that states it, real code (mocks only when unavoidable). Run it.
2. **Verify RED.** Mandatory. It must fail (not error), with the expected message, because the feature is missing (not a typo or import error). Passing means it tests existing behaviour: fix the test. Erroring means fix the error and re-run until it fails correctly.
3. **GREEN.** The simplest code that passes. No options, no generality, no neighbours cleaned up.
4. **Verify GREEN.** The test passes, the rest of the suite passes, the output is clean (no warnings or stray logs). "Other tests" means the project's suite, not your file: run the project's test command before calling it done, even when the task named one file. A red test you watched scroll by and did not mention is a falsified report.
5. **REFACTOR.** Only on green: remove duplication, improve names, extract helpers. Keep the tests green. Add no behaviour.
6. Repeat with the next failing test.

Bug fix: write the test that reproduces the bug first, watch it fail, fix, watch it pass. Never fix a bug without a test. If the bug is a regression, prove the test is real by reverting the fix and watching it fail again, then restoring it.

## Writing good tests

Two principles: every test names the break it catches, and every test exercises the real thing.

**Name the break.** Before writing the body, say which production change should make this test fail, and whether that change is a bug or a decision.
- Derive expected values independently: literals and hand-checked fixtures. An expected value computed by the code under test passes whatever the code does. Table-driven tests with literal `want` values are the preferred shape.
- No change detectors: a test that only fails when someone changes a constant or message wording fires on redesign and sleeps through bugs. Test the behaviour that depends on the decision ("a failing call is retried 5 times and the sixth attempt never happens"), not `MAX_RETRIES == 5`.
- Behaviour, not text: do not assert that a script contains a line. Run it on controlled input and assert outputs, side effects or exit codes.
- Your code, not the framework: test the contract at your boundaries (the route you register, the query you emit), not upstream mechanics. If upstream surprised you, one narrow characterisation test naming the assumption.
- Constructors, getters and trivial forwarding earn tests only when they validate, normalise, default, derive, enforce or cause side effects.

**Exercise the real thing.**
- A mock assertion passes when the mock is present and fails when it is absent; it says nothing about the component. If the mock is what you are checking, unmock or delete the assertion.
- Mock at the right level: learn the side effects of the real method, mock only the slow or external operation below them, keep what the test depends on real.
- Make doubles specific. When arguments, call counts or order are part of the contract, assert them. Give each branch (success, error, malformed) its own fixture.
- Mirror real data completely: partial mocks pass while integration breaks on the omitted field.
- Production classes carry production methods only. Test-only cleanup lives in test utilities.
- When mock setup outgrows the test, switch to an integration test with real components.

**Mutation check.** Before finishing, mutate the code in your head: wrong constant, wrong branch, missing side effect, empty return, missing validation for zero/empty/null/unauthorised input. Each realistic mutation should fail at least one test. One that nothing catches is unprotected behaviour or a tautological test.

Warning signs: setup and assertion share one object; the test can only fail by crashing; expected values hide behind loops or builders; a method is called only from tests; the test exists for coverage and checks no outcome; mocking "just to be safe".

## When stuck

| Problem | Move |
|---|---|
| Do not know how to test it | Write the API you wish existed. Write the assertion first. |
| Test is too complicated | The design is too complicated. Simplify the interface. |
| Everything must be mocked | The code is too coupled. Inject the dependency. |
| Setup is huge | Extract helpers. Still huge: simplify the design. |
| Timing-dependent | Wait for a condition, not a duration; inject a clock. |
| Needs a real service | Use a fake at the boundary plus one integration test in CI. |

## Rationalizations

| Excuse | Reality |
|---|---|
| "Too simple to test" | Simple code breaks. The test takes thirty seconds. |
| "I will test after" | Tests written after pass immediately, which proves nothing; they cover what you remembered. |
| "Tests after reach the same goal" | After-tests answer "what does this do"; first-tests answer "what should this do". |
| "I already tested it by hand" | No record, cannot re-run, easy to forget cases. |
| "Deleting hours of work is wasteful" | Sunk cost. Keeping code you cannot trust is the waste. |
| "I need to explore first" | Fine. Throw the exploration away, then start with the test. |
| "TDD is slower" | Not once you count debugging and regressions. |
| "Existing code has no tests" | You are improving it. Add tests around what you touch. |

Red flags that mean delete and restart: code before the test; test passes immediately; cannot explain why it failed; tests added "later"; "just this once".

## Per stack

Run the narrowest test first, then the suite. Confirm the command from the project's manifest and docs; these are typical.

| Stack | One test | Suite and gates | Notes |
|---|---|---|---|
| JS/TS (Vitest, Jest) | `pnpm vitest run path -t "name"` / `npx jest path -t name` | `pnpm test`, `pnpm lint`, `pnpm tsc --noEmit` | Fake timers for time; Testing Library queries by role, not test id |
| Python | `pytest path::test_name -x -q` | `pytest`, `ruff check`, `mypy` | `freezegun`/injected clock; `pytest.mark.parametrize` tables |
| Go | `go test ./pkg -run TestName -v` | `go test ./...`, `go vet ./...` | Table tests with `t.Run`; `-race` for concurrency; `t.Cleanup` |
| Rust | `cargo test name` | `cargo test`, `cargo clippy -- -D warnings` | Unit tests beside code in `#[cfg(test)]`; integration in `tests/` |
| JVM / Kotlin | `./gradlew test --tests 'Class.method'` | `./gradlew check` | JUnit 5; coroutine test dispatcher for suspend code |
| Swift | `swift test --filter Suite/test` or `xcodebuild test -only-testing:` | same | XCTest or Swift Testing; inject `Clock`; UI via XCUITest sparingly |
| .NET | `dotnet test --filter FullyQualifiedName~Name` | `dotnet test`, `dotnet build -warnaserror` | `TimeProvider` for time; xUnit theories for tables |
| PHP | `../vendor/bin/phpunit --filter name` | `composer test`, `phpstan` | Data providers for tables |
| Ruby | `bundle exec rspec path:LINE` | `bundle exec rspec`, `rubocop` | `travel_to` for time |
| Android | `./gradlew testDebugUnitTest --tests ...` | plus `connectedCheck` on an emulator | Robolectric or pure JVM first; Compose UI tests with semantics |
| Expo / React Native | `pnpm jest path -t name` | package scripts, `npx expo-doctor` | Mock native modules at the module boundary only; device behaviour needs a device run |
| Flutter | `flutter test path --plain-name name` | `flutter test`, `dart analyze` | Widget tests with `pumpAndSettle` sparingly |
| Cloudflare Workers | Vitest with the Workers pool, `vitest run path` | package scripts | Test with real bindings in Miniflare, not hand-rolled fakes (`lll:cloudflare`) |

UI and visual behaviour: component tests for logic and states; a real browser or device run for layout (`lll:ui`, `lll:research` browser QA).
LLM features: deterministic tests for parsing and guards; evals for prompt quality (`lll:ai`).
