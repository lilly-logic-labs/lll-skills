# Defense in depth and error handling

After the root cause is fixed, ask how the same class of bug becomes impossible, or at least loud. One check is a fix; several layers are a guarantee. Do not add checks everywhere: add the cheapest check at each layer the bad data actually crossed.

## The four layers

| Layer | Question | Examples |
|---|---|---|
| 1. Entry point | Can bad input be refused where it enters? | Schema validation at the API edge, type and range checks, parse don't validate, required fields, size limits, allow-lists, form constraints |
| 2. Business logic | Does the operation make sense for this data? | Preconditions and invariants in the function that owns the rule; state-machine transitions; money in integer minor units; non-empty ids |
| 3. Environment guard | In this context, is this operation allowed? | Refuse destructive actions outside a temp dir under test; refuse production writes from a dev build; feature flags default off; sandbox network |
| 4. Instrumentation | If it still happens, can we see it? | Structured log with context before the risky call; assertion that logs the stack; alert on the counter; error report with release and user-scope tags |

Worked example: an empty directory string reached `git init` and created a repository in the source tree.
1. Entry: the workspace creator rejects an empty or non-existent path.
2. Logic: the function that initialises refuses to run unless the path is inside the expected root.
3. Environment: under test, refuses any path outside the OS temp directory.
4. Instrumentation: before the call, log the path and the stack.

Method: trace the data path from the fix, list every place the bad value passed through, add a check at each layer that makes sense, then try to bypass each layer with a test (a mock, a different code path, a refactor). Keep the layers that caught a bypass.

## Error handling principles

1. **Fail fast and loud at the origin.** An invalid state should stop the operation near where it arose, with a message that names the broken expectation and the value (not a secret). Never return a plausible default that lets wrong data travel on.
2. **Never swallow.** An empty `catch`, `except: pass`, `_ = err`, `.ok()` that discards, `unwrap_or_default` on a failure that matters: each hides a future bug. Handle it, rethrow it with context, or log it once at the boundary that owns it, with a reason.
3. **Add context when crossing a boundary.** Wrap, don't replace: what was being done, which id, which input class. Keep the original cause attached (`cause`, `%w`, `from`, `with_context`, inner exception).
4. **Typed or coded errors for callers, messages for humans.** Callers branch on an error kind or code, never on message text.
5. **Separate expected from unexpected.** Expected failures (validation, not found, conflict, rate limit) get specific results and statuses. Unexpected ones become a 500 or crash report with full detail in logs and none in the user-facing message.
6. **One place logs each error.** Log where it is handled, not at every layer it passes through. Include a request or correlation id.
7. **User-facing messages say what happened and what to do next.** No stack traces, ids that identify other users, or internals. Never expose secrets or SQL.
8. **Timeouts on every external call.** Network, database, subprocess, lock acquire. A missing timeout is a hang waiting to happen. Set an overall deadline and propagate it (context, cancellation token, abort signal).
9. **Retry only what is safe.** Idempotent operations or those with an idempotency key; exponential backoff with jitter; a cap on attempts and total time; retry only transient errors (timeouts, 429, 503), not validation errors. Surface the final failure.
10. **Bound everything.** Queue lengths, concurrency, payload size, recursion depth, memory per request, log volume.
11. **Clean up on every path.** `finally`, `defer`, context managers, `using`, RAII, `use {}`; release locks, files, connections, temp files, subscriptions.
12. **Partial failure is a state.** For multi-step operations, make each step idempotent or add compensation, and record progress so a retry resumes rather than repeats.
13. **Degrade deliberately.** Decide what the product does when a dependency is down (cached data, read-only mode, queue and retry, clear message), and test that path.
14. **Crash on corrupted invariants.** If the process cannot trust its own state, restart cleanly (supervisor) rather than limping on.

## By platform

| Platform | Boundary to guard | Pattern |
|---|---|---|
| Web backend | Request handler | Validate input at the edge, map domain errors to statuses in one handler, global error middleware, request id |
| Web frontend | Network, rendering | Error boundary per route/section, typed fetch wrapper, loading/empty/error states, report to monitoring |
| Mobile (iOS/Android/Expo/Flutter) | Network, storage, permissions, lifecycle | Offline states, permission denied path, crash reporter with breadcrumbs, no silent catch in async tasks |
| Workers / serverless | Handler, bindings | Handle binding errors, idempotent handlers, `waitUntil` for work after response with error capture, retries via queues |
| Jobs / pipelines | Each step | Idempotent steps, dead-letter queue, alert on age of the oldest message |
| CLI / desktop | Exit codes, user messages | Non-zero exit on failure, stderr for errors, actionable message, no partial output left behind |
| LLM / agent features | Model output, tool calls | Schema-validate output, bounded retries, tool errors fed back with limits, spend caps (see the agent-loops guide of this skill) |

## Checklist after a fix

1. The regression test fails without the fix and passes with it.
2. Which layers did the bad value cross? Is each guarded or deliberately not?
3. Is a failure now loud (error, log with context, metric), not silent?
4. Are cleanup and timeouts right on every exit path of the code you touched?
5. Can a caller still get a plausible-but-wrong default from this code? Remove it.
6. Did you add anything that only protects against what cannot happen? Remove it; defence needs a real path to defend.
