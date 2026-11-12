# Risk checklists

Questions to ask of a change, grouped by the kind of damage they prevent. Each question is a lead: confirm it by reading the code and its callers, and report it only with a failure scenario. Per-stack pitfalls are in the stack checklist reference of this skill.

Two passes. Pass 1 covers the classes that cause data loss, wrong money or security failure; findings there are usually critical or high. Pass 2 covers the rest.

## Pass 1: critical classes

### Data safety
- Any query built from strings or templates with user input? Parameterise.
- Updates and deletes without a precise `WHERE` or a tenant/owner scope? Mass update risk.
- Read-then-write that can race (balance, stock, counters, uniqueness)? Needs an atomic operation, a lock or a constraint.
- Soft-delete or archive flags: do all reads filter them, and can a "deleted" record return?
- Writes bypassing the validation, hooks or audit log the normal path has (raw SQL, bulk update, direct table access)?
- Migrations: reversible, safe on large tables, old and new code compatible during rollout (see the migration lens of `lll:audit`).
- Money, quantities, dates: integer minor units or decimals, not floats; time zone and rounding rules stated.

### Authorisation and tenancy
- Every new endpoint, action, job, webhook and admin tool: who can call it, and is that enforced on the server?
- Object access by id: is ownership or tenant checked for each id, including nested and batch ids?
- Client-side hiding treated as permission?
- Caches, search indexes, exports and logs: do they mix tenants or leak other users' data?

### Untrusted input reaching a dangerous sink
- Shell, process spawn, `eval`, dynamic `import`, template rendering with user content.
- File paths from input (traversal), URLs fetched from input (SSRF), redirects from input (open redirect), deserialisation of untrusted data.
- HTML written without escaping, `dangerouslySetInnerHTML`, `innerHTML`, markdown rendering without sanitising.
- LLM output used as code, SQL, a command, a URL or a tool argument without validation: treat model output as untrusted input.

### Secrets and privacy
- Secrets, tokens, keys or personal data in code, fixtures, logs, error messages, URLs, analytics events or client bundles?
- New data collected: stated purpose, retention, consent, deletion path?

### Fails open
- On error, timeout or missing config, does the code grant access, skip a check, or return a default that looks valid? It should deny or fail loudly.
- Feature flags and kill switches: does the default match the safe state?

### Completeness of values
- A new enum member, status, role, plan, error code, route or flag: grep every switch, map, serializer, database check constraint, client and doc that lists the others. A missing branch is a finding even when it sits outside the diff.

## Pass 2: informational classes

### Correctness
- Off-by-one, inclusive vs exclusive ranges, empty and single-element inputs, null and undefined, zero, negative, very large, unicode, time zones, daylight saving.
- Conditions inverted, short-circuit side effects, comparison of different types, integer overflow, floating point equality.
- Loops that mutate what they iterate; shared references mutated by accident; shallow versus deep copies.
- Resource lifetime: files, sockets, transactions, locks, subscriptions, timers released on every path.

### Contracts and compatibility
- Changed function signatures, return shapes, error types or defaults: every caller still right?
- API, event and storage formats: backwards compatible for old clients, queued messages, cached data and mobile app versions in the field?
- Client and server updated together, or safely in either order?
- Public package or library surface: semver impact.

### Error handling
- Swallowed errors, empty catches, generic messages that lose the cause, retries on non-idempotent calls, missing timeouts, errors logged several times or never.
- User-facing failure states exist for loading, empty, error, offline, permission denied.

### Concurrency and async
- Missing `await`, fire-and-forget work without error handling, shared mutable state across requests or threads, lock ordering, blocking the main/event thread, unbounded parallelism.

### Performance
- N+1 queries, unbounded queries and lists, missing pagination or indexes for new filters/sorts, work in hot loops, large payloads, sequential awaits that could be parallel, memory growth (caches without bounds, listeners never removed).
- Mobile: main-thread work, image sizes, battery and network use, startup cost.

### Tests
- Does a test fail if the new logic is wrong? Look at assertions, not just coverage.
- Happy path only? Missing error paths, boundaries, permission cases, regression test for the bug being fixed.
- Tests tied to implementation detail, time, order, network or randomness (flaky by construction).
- Mocks that replace the thing under test, or that hide contract drift.
- Snapshot updates accepted without reading the diff.

### Observability and operations
- A failure here would be seen: logs with context, metrics, alerts, error reporting; no secrets in them.
- Rollout: flag, gradual exposure, rollback path, config and environment variables documented and present in every environment.
- Jobs and crons: idempotent, overlapping runs safe, dead-letter handling.

### Dependencies and build
- New dependency: needed (laziness ladder in `lll:build`), maintained, licence compatible, size, install scripts, pinned.
- Lockfile and manifest changed together; generated files regenerated, not hand-edited.
- CI and build config changes: gates not weakened.

### Accessibility and i18n
- Controls have names, roles, focus order and visible focus; contrast; touch target size; dynamic type; screen-reader labels; reduced motion.
- Strings externalised, plural and gender rules, right-to-left, date/number/currency formats.

### Docs and maintainability
- Changed behaviour documented (README, API docs, changelog, comments that are now false).
- Names say what things are; no dead code, commented-out code or stray debug output left behind.
- Complexity proportional to the need (over-engineering pass in this skill).

## How to use

1. Skip classes the change cannot touch. Say which ones.
2. Spend most time on pass 1 for changes that touch auth, money, data, migrations or user input.
3. Convert each real problem into a finding block with a failure scenario. Convert each unknown into a question for the author.
