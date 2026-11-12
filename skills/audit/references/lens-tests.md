# Lens: tests

Whether the test suite would catch the bugs that matter. Not coverage percentage: the shape of what is untested, what is tested badly, and what fails at random.

## Covers

- Gaps: risky code with no test, and tested code whose failure paths are untested.
- Hollow tests: tests that cannot fail, assert nothing meaningful, or mock the thing they claim to test.
- Flaky tests: order, time, network, randomness or shared state dependence; retries that hide them.
- Hygiene: focused or skipped tests committed, tests outside the runner's pattern, suites CI never runs.
- The gates themselves: tests, typecheck and lint pass on the default branch and run before deploy.

## Method

1. **Baseline.** Run the suite once with the project's command. Record pass, fail and skip counts, duration, and any warnings about tests not collected. A red suite on the default branch is the first finding.
2. **Risk map.** List the risky modules: money, permissions and auth, migrations, sync and offline queues, parsers and importers, deletion, payments and webhooks, date and time math, anything with a past bug fix (`git log --oneline --grep -iE 'fix|bug' -- <path>`). For each, find its tests (`git grep -l <module or function name> -- <test globs>`).
3. **Gap check.** A risky module with no test is a finding. A tested module whose tests cover only the happy path (no invalid input, unauthorised caller, conflict, timeout, partial failure, retry) is a finding for the missing path.
4. **Hollow-test pass.** Shortlist mechanically, then read each candidate with the code it claims to test:
   - test files with no assertion keyword: `git ls-files <test globs> | xargs grep -L -E 'expect|assert|should|t\.(Error|Fatal|Fail)|require\.|XCTAssert|#expect|verify\('`
   - assertions that compare a value with itself, or with the stub's own return value
   - a test that stubs the function under test, or asserts only that a mock was called with what it was configured to receive
   - `toBeDefined()`, `toBeTruthy()` or snapshot-only checks on logic that has a concrete expected value
   - `try` blocks that swallow assertion errors; async tests that do not await
   - duplicate tests of the same contract in several places
5. **Hygiene pass.** Focused and skipped tests, tests the runner never collects (wrong file pattern, missing from the CI matrix), real network or real clock in unit tests.
6. **Flake pass.** Read CI history when the owner allows (`gh run list --status failure --limit 50`, then `gh run view <id> --log-failed`) for tests that fail and then pass on re-run. Re-run suspects locally many times (commands below). Read for `sleep`-based waits, shared fixtures mutated across tests, dependence on test order, current time, time zone, locale or unseeded randomness.
7. **CI gate.** Tests, typecheck and lint run on pull requests and before deploy; the deploy job depends on them; retries are not configured to hide failures.

A test that breaks under a behaviour-preserving refactor tests implementation. Rewrite it at the public boundary unless exact output is the declared contract (golden files, wire formats, generated code).

## Commands

Focused and skipped tests, then repeat runs for flake suspects:

- **JS and TS** (Jest, Vitest, Mocha, Playwright): `git grep -nE '\b(it|test|describe)\.(only|skip|todo)\(|\b(fit|fdescribe|xit|xdescribe|xtest)\('`. Repeat a suspect with a shell loop, Vitest's repeat option, or Playwright `--repeat-each 20`. Check `retries` in the runner config.
- **Python** (pytest, unittest): `git grep -nE '@pytest\.mark\.(skip|xfail)|@unittest\.skip|pytest\.skip\('`. Compare `pytest -p no:randomly` with random order; `pytest --count 20` with pytest-repeat if installed. Check `--reruns` in config.
- **Go:** `git grep -nE 't\.Skip\('`; `go test -count=20 -race -run <Name> ./pkg`.
- **Rust:** `git grep -nE '#\[ignore\]'`; `cargo test -- --test-threads=1` against the default to expose shared state.
- **JVM:** `git grep -nE '@(Disabled|Ignore)\b'`; Gradle `--rerun-tasks`; look for retry plugins.
- **Swift:** `git grep -nE 'XCTSkip|\.disabled\('`; `xcodebuild test -test-iterations 20 -run-tests-until-failure`.
- **.NET:** `git grep -nE 'Skip\s*=|\[Ignore'`; `dotnet test` in a loop.
- **PHP:** `git grep -nE 'markTestSkipped|->skip\('`.
- **Ruby:** `git grep -nE '\b(xit|xdescribe|skip|pending)\b' -- spec test`.

Coverage, when the project has it configured, is a map for step 3: open the uncovered lines in risky files, ignore the total.

## Fix rules

- Missing tests on risky paths: write them in the fix phase as regression-style tests that fail if the guarded behaviour breaks; prove each one fails by temporarily breaking the code in the worktree, then restore.
- Hollow tests: rewrite to assert the real contract. Deleting a test that guards a public, security, migration or wire contract goes to "Needs decision".
- Flaky tests: fix the cause (inject the clock, seed randomness, isolate fixtures, await the real condition). Quarantining or adding retries is not a fix.
- Focused tests committed: remove the focus; skipped tests without a reason or issue link: re-enable and fix, or "Needs decision".

## Severity calibration

- **critical:** the deploy path runs no tests, or tests are red on the default branch and deploys still go out; a committed `.only` or `fit` silently disables the rest of a suite that guards money or auth.
- **high:** a test that passes while the feature it names is broken in a core flow (mocked boundary, swallowed assertion); a flaky test retried in CI on a core path, so real failures are hidden.
- **medium:** no failure-path test on money, permissions, migrations or webhooks; a skipped test with no reason on a risky module; tests excluded from CI by a file-pattern mistake.
- **low:** missing test for a risky path that has no known bug; duplicate tests; slow tests without a reason.

## False-positive traps

- Integration and end-to-end suites may legitimately use a network, a database or real time; check they run in their own job.
- Snapshot and golden tests are right when exact output is the contract.
- A skip with a linked issue and a condition (platform, missing service) is deliberate.
- Low coverage in generated code, migrations-as-data or thin glue is not a gap.
- One assertion can be enough; count what is checked, not how many `expect` calls there are.
