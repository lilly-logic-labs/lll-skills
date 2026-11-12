# Implementation plan

Write for an engineer who has not seen this codebase or the spec. They write idiomatic code once they know the exact interface and the exact test, and they will make a sensible choice wherever the plan leaves one open. What they cannot know is what you decided: which files, which names and signatures, which values, which test proves each task.

## Location

`docs/plans/YYYY-MM-DD-<feature>-plan.md`, or the project's plan folder. The user's preference wins. Link the spec from the header so the spec travels with the plan.

## Header

```markdown
# <Feature> implementation plan

**Goal:** <one sentence>
**Architecture:** <two or three sentences: the approach and why>
**Stack:** <languages, frameworks, test runner, versions that matter>
**Spec:** <path to the design document the plan argues from>
**Execution:** inline | subagents (set at handoff)

## Global constraints
<The spec's project-wide requirements, one line each, exact values copied verbatim:
version floors, dependency limits, naming and copy rules, platform support, performance
budgets. Every task implicitly includes this section.>

## Gates
<The project's commands for test, lint, typecheck, build, from `../../../shared/stack-detect.md`.>

## Review focus
<The five inputs or failure modes the spec implies but no task tests yet, most likely to
bite a real user first. One line each: the input or condition and the behaviour a
reasonable person expects. Then add the test that pins each to the task that owns the code.
An empty section means you checked and found none.>

---
```

## File structure

Before tasks, list the files created or modified and the one responsibility of each.
- One clear responsibility per file; files that change together live together; split by responsibility, not by layer.
- Follow established patterns. Do not restructure what the task does not need. If a file you must touch has grown unwieldy, a split can be a task of its own.
- Each task should leave the tree buildable and tested.

## Task

A task is the smallest unit that carries its own test cycle and is worth a fresh reviewer's attention. Fold setup, config, scaffolding and docs into the task whose deliverable needs them. Split only where a reviewer could reject one task and accept its neighbour. Every task ends with an independently testable deliverable.

````markdown
### Task N: <component>

**Files:**
- Create: `exact/path/new_file.ext`
- Modify: `exact/path/existing.ext` (function `name`, around line 120)
- Test: `exact/path/test_file.ext`

**Interfaces:**
- Consumes: <exact signatures from earlier tasks>
- Produces: <exact names, parameter types, return types later tasks rely on>

- [ ] **Step 1: Write the failing test** `test_name`
  Asserts: <inputs and exact expected outputs, including the failure path>
- [ ] **Step 2: Run it and see it fail**
  Run: `<exact command>`   Expected: FAIL with "<message>"
- [ ] **Step 3: Implement** `name(arg: Type) -> Result` in `exact/path/new_file.ext`
  <One line of approach if the signature and test leave a choice. Code only for an algorithm they do not determine.>
- [ ] **Step 4: Run it and see it pass**
  Run: `<exact command>`   Expected: PASS, <n> tests
- [ ] **Step 5: Run the gates**   Run: `<lint / typecheck / full test command>`
- [ ] **Step 6: Commit**   `git add <files>` then `git commit -m "<type>: <subject>"`
````

## What a step contains

A step is done when the implementer can write exactly one reasonable thing from it.
- **Test step:** the test name and its assertions as code, with the spec's exact values.
- **Code step:** exact signature (name, parameters, return type), the file, and the values the spec pins. The implementer writes the body. A body appears only for an algorithm the signature and tests do not determine, or for copy the spec fixes.
- **Verification step:** the command and the output that means pass.
- **Reference to another task:** that task's Interfaces block says what to use; do not repeat its code.

Placeholders to ban: "TBD", "TODO", "handle edge cases", "add appropriate validation", "write tests for the above", "similar to Task 3", a type or function no task defines. They decide nothing. The opposite failure is a step that transcribes a function body the signature and tests already determine.

## Self-review

Run these yourself after writing; this is a checklist, not a subagent job.
1. **Spec coverage.** Point to a task for each spec requirement and acceptance criterion. Add a task for each gap.
2. **Step scan.** Every step lets the implementer write exactly one reasonable thing. Fix lines that decide nothing and bodies that decide everything.
3. **Name consistency.** A function called `clearLayers()` in Task 3 and `clearFullLayers()` in Task 7 is a bug. Grep the plan for each name.
4. **Review focus.** Each input class has a test in the owning task.
5. **Proportion.** A plan several times longer than its spec, or mostly code blocks, is a transcript. Replace bodies with signatures, test names and assertions.
6. **Order.** No task consumes something a later task produces. Independent tasks are marked so `lll:build` can parallelise them.
7. **Lint.** `node scripts/plan-lint.mjs <plan.md>`. It flags missing Files blocks, tasks with no checkbox steps or no Run/Expected, placeholder phrases, duplicate or skipped task numbers and plans that are mostly code.

## Parallelisation note (optional)

Only when two or more workstreams touch disjoint modules, add a table by module, not by file:

| Step | Modules touched | Depends on |
|---|---|---|

Name the lanes ("Lane A: tasks 1, 2. Lane B: task 3"), the launch and merge points, and any module two lanes share (those run in sequence). Otherwise write "Sequential, no parallel lanes."

## Worked example (small, two stacks)

Feature: reject the 6th login attempt per minute per IP with HTTP 429.

```markdown
### Task 1: Rate limiter

**Files:**
- Create: `src/auth/rate_limit.py`
- Test: `tests/auth/test_rate_limit.py`

**Interfaces:**
- Produces: `allow(ip: str, now: float) -> bool`. 5 calls per 60 s window per ip; the 6th within the window returns False; the window slides.

- [ ] Step 1: failing test `test_sixth_call_in_window_is_denied`
  Asserts: five `allow("1.2.3.4", t)` calls at t=0..4 return True, the sixth at t=5 returns False, a call at t=61 returns True.
- [ ] Step 2: Run `pytest tests/auth/test_rate_limit.py -v`   Expected: FAIL, "No module named rate_limit"
- [ ] Step 3: Implement `allow(ip: str, now: float) -> bool` in `src/auth/rate_limit.py`. Sliding window over a dict of deques; no new dependency.
- [ ] Step 4: Run the same command   Expected: PASS, 1 test
- [ ] Step 5: Run `ruff check . && mypy src && pytest -q`   Expected: no errors, all pass
- [ ] Step 6: Commit `feat(auth): add per-ip login rate limiter`

### Task 2: Wire into the login route

**Files:**
- Modify: `src/auth/routes.py` (function `login`)
- Test: `tests/auth/test_login_route.py`

**Interfaces:**
- Consumes: `allow(ip: str, now: float) -> bool` from Task 1
- Produces: `POST /login` returns 429 with header `Retry-After: 60` when `allow` is False; the body is unchanged otherwise.

- [ ] Step 1: failing test `test_login_returns_429_after_five_attempts` (six posts from one IP; assert the sixth is 429 and carries `Retry-After`)
...
```

The same shape in TypeScript names `src/auth/rateLimit.ts`, `allow(ip: string, now: number): boolean`, runs `pnpm vitest run src/auth/rateLimit.test.ts` and gates `pnpm lint && pnpm tsc --noEmit && pnpm test`. Go uses `go test ./auth -run TestSixthCall -v` and `go vet ./...`; Rust `cargo test rate_limit` and `cargo clippy -- -D warnings`; Kotlin `./gradlew test --tests RateLimiterTest`; Swift `swift test --filter RateLimiterTests`; .NET `dotnet test --filter RateLimiterTests`.

Decisions the plan does not leave to the implementer here: the window (sliding, not fixed), the limit (5), the response (429 plus header), the storage (in memory, single process). If the service runs several instances, the plan must say where the counter lives; "in memory" there is a spec error to raise before building.
