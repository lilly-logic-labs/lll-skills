# Engineering lens ("eng review")

Challenge whether the plan will work, hold up and be testable. Review only. Ask for decisions one at a time, recommendation first, wait for each answer.

## Engineering preferences that guide every recommendation

- Reuse before building. Extract shared code only when at least two real callers share behaviour and extraction improves reliability or removes net code. Similar-looking code is not enough.
- Every behaviour has a test that would catch a real regression. No test without such a regression.
- Enough engineering: avoid fragile hacks and premature abstraction in the same breath.
- Explicit over clever. Smallest clear diff. Rewrite a broken foundation when it is the smaller total cost.
- Data shape follows its queries, integrity rules and update boundaries. Fields that are queried, constrained or updated alone get columns or tables. A JSON blob suits a document read and written whole.
- Boring technology by default. Spend novelty only where it buys something the user sees.
- Plan the partial deploy, the rollback and the flag. Design for the engineer who is tired at 3 am.
- Make the change easy first, then make the easy change: refactor in a separate step from behaviour.

## Step 0: scope challenge

Before the sections, do this once.
1. **What already solves each sub-problem?** Inspect helpers, libraries, callers and the platform. Cite `path:line`. Label proposed callers as proposals.
2. **Minimum change set.** Which work can be deferred without blocking the goal?
3. **Complexity count.** Count the changed files and the new classes, services or processes the plan creates. At 8 or more files, or 2 or more new classes or services, stop: explain the complexity, ask per proposed cut, then ask once whether a smaller arrangement of files keeps the same feature list. Under that, skip the questions.
4. **Built-in check.** For each new pattern (queue, cache, lock, scheduler, auth flow, state manager) check the framework and platform built-ins and current practice. Prefer what ships with the stack. Search the web only if the user allows; send the error class and library, never project text.
5. **Reality rows.** Verify before trusting the plan: each factual premise has a receipt; the work is not already done on the base branch (`git log <base>` for the topic); every command or flag the plan relies on exists in the pinned version (`--help`); decisions the user made earlier are not reversed by a default; counts and estimates have a basis; every item the issue asked for is in the plan or explicitly deferred; the number of PRs is stated.

## Section 1: architecture

- Component boundaries, dependencies, coupling. Draw the dependency graph (ASCII).
- Data flow, all four paths (happy, nil, empty, upstream error) for each new flow.
- State machines: diagram every new stateful object, including invalid transitions and what blocks them.
- Scaling: what breaks first at 10x and 100x. Single points of failure.
- Security boundaries: for each new endpoint or mutation, who can call it, what they get, what they can change.
- One realistic production failure per integration point and whether the plan handles it.
- Rollback posture: if this ships broken, the path and the time to undo it.
- **Two shapes before one.** For a new module, service or boundary, require a second, structurally different design (another owner of state, another split of responsibility). If the plan has one, sketch the other in five lines (types and signatures only). Prefer the shape that hides more behind a smaller interface.
- **Red flags to screen the chosen shape:** shallow module (big interface, little hidden); one decision spread over several modules; modules split by execution order instead of by knowledge; pass-through methods; two modules owning one piece of state; two ways to do one task; internals importable from outside; the same list maintained by hand in two places. Each flag is a finding with a file or symbol.
- Artifacts about the work (status reports, matrices, audit docs) must have a consumer and a retirement date; otherwise cut.

## Section 2: error and rescue map

For every new method, service or codepath that can fail:

```
CODEPATH            | WHAT CAN GO WRONG        | ERROR CLASS
--------------------|--------------------------|------------
Service.call        | upstream timeout         | TimeoutError
                    | 429                      | RateLimitError
                    | malformed JSON           | ParseError

ERROR CLASS         | HANDLED? | ACTION                | USER SEES
--------------------|----------|-----------------------|------------------
TimeoutError        | yes      | retry 2x, then raise  | temporary outage
ParseError          | NO (gap) | none                  | 500 (bad)
```

Rules: a catch-all handler is a smell; name the classes. Logging must say what was attempted, with which identifiers. Every handled error must retry with backoff, degrade with a visible message, or re-raise with context. "Swallow and continue" is almost never acceptable. For LLM calls treat malformed, empty and refused output as separate failure modes (`lll:ai`).

## Section 3: security and threat model

Attack surface added; validation of every new input (empty, wrong type, too long, unicode, markup); authorisation and object-reference checks; secrets and rotation; dependency risk; data classification; injection (SQL, command, template, prompt); audit trail for sensitive actions. Per finding: threat, likelihood, impact, mitigated or not. Deep audits are `lll:security`.

## Section 4: data flow and interaction edge cases

For each flow: `INPUT -> VALIDATE -> TRANSFORM -> PERSIST -> OUTPUT` with shadow paths for nil/empty/wrong type, too long, timeout/out of memory, conflict/duplicate/lock, stale/partial/encoding. What happens at each node and is it tested?

Async ordering: where operations share mutable state, state the invariant, show both completion orders at each await, name the mechanism that prevents the violating one (atomic update, lock with owner, unique constraint), and specify a test with controlled pause points.

Interaction table: `INTERACTION | EDGE CASE | HANDLED? | HOW`. Include double submit, navigate away, timeout and retry, zero/huge/changing lists, duplicate or backlogged jobs.

## Section 5: code quality

Fit with existing patterns; duplicated behaviour (name file and line); naming by what a thing does; methods that branch more than five times; over-engineering (abstraction for a problem that does not exist) and under-engineering (happy-path fragility); stale diagrams and comments near touched code.

## Section 6: tests

Draw the coverage diagram: every new flow, codepath, job, integration and error path, each marked with the test type that covers it (unit, integration, end-to-end, eval) or `GAP`.

```
CODE PATHS                                  USER FLOWS
[+] billing/charge                          [+] checkout
  |- charge() happy, declined, timeout        |- [TESTED] complete purchase (e2e)
  |- [GAP] currency invalid                   |- [GAP][e2e] double click submit
  `- refund() [TESTED] full, [GAP] partial    `- [GAP] navigate away mid payment
COVERAGE: 4/9 paths   GAPS: 5 (2 e2e)
```

Choose the test type: end-to-end for flows spanning three or more components, for integrations where a mock hides real failure, and for auth, payment and destructive flows. Eval for LLM prompts, templates and tool definitions (`lll:ai`). Unit for pure functions and single-function edge cases.

**Regression rule.** When a change puts existing behaviour at risk, regression coverage is mandatory. Name the behaviour to preserve and the intentional differences. Ask how to cover it, never whether to skip it.

Ambition check: the test that lets you ship at 2 am on a Friday, the test a hostile QA engineer would write, the chaos test. Flag tests that depend on time, randomness, external services or order. Name tests the change makes obsolete.

## Section 7: performance

N+1 queries; unbounded queries or caches; missing indexes for every new query; whole-file loads; blocking calls without timeouts; connection pool pressure; background job size and retry behaviour; the three slowest new paths with scale (rows, requests per second, bytes) or "unknown". Never invent benchmarks.

## Section 8: observability and rollout

Structured logs at entry, exit and significant branches; the metric that says it works and the one that says it is broken; trace ids across services; alerts; can a bug reported three weeks later be reconstructed from logs alone? Migration safety (backward compatible, locks, compatibility window, `lll:build` migration mode); feature flag; rollout order (migrate then deploy); deploy-time window where old and new code run together; smoke tests and first-hour checks (`lll:ship`).

## Outputs

Add under `## Engineering review` once decisions are settled:
- **Not in scope**, **What already exists**.
- Architecture diagram and the chosen shape with the rejected one.
- Error and rescue map with every gap closed or accepted.
- Coverage diagram and the test list added to the plan, each test naming its file and assertion.
- **Failure modes registry:** per new path one realistic production failure, its test or handler, and whether users would see it. A row with no test, no handler and a silent failure is a **critical gap**.
- Parallelisation: lanes by module, or "sequential".
- Unresolved decisions; verdict (proceed, proceed after changes, rework).
