# Performance regression

Something got slower, or uses more memory, CPU, bandwidth or money. Measure first, change one thing at a time, prove with numbers.

## 1. Define the problem as a number

- Metric: latency (p50, p95, p99), throughput, time to interactive, startup, frame time, build time, memory peak, CPU, egress, cost per request.
- Baseline: the number before (from monitoring, a benchmark, a prior release). No baseline: build one by measuring the last good commit.
- Target: the number that counts as fixed. Without it you will optimise forever.
- Scope: which endpoint, screen, job, device class or data size. Performance bugs often depend on data volume, so record input size.

## 2. Reproduce under controlled conditions

- Same data shape and size as the slow case. Production-sized data beats toy data.
- Warm and cold runs are different numbers; record both.
- Run at least 5 to 10 times; report median and spread. Ignore the first warm-up run unless cold start is the complaint.
- Quiet machine, fixed CPU governor, no other work. On mobile, use a release build on a real mid-range device, never a debug build on an emulator.
- Web: Lighthouse and the Performance panel with CPU throttling; field data (RUM, Web Vitals) when available.

## 3. Find the change

- Known good and bad versions: bisect with the benchmark as the oracle (the root-cause tracing guide of this skill, bisect in a worktree). Threshold the oracle (fail if over X ms) so noise does not flip it.
- Not a code change: look at data growth, a new tenant, a traffic mix change, a dependency or runtime upgrade, config, feature flag, infra size, noisy neighbour, cache hit rate falling.

## 4. Find where time goes

Profile before guessing. The slow part is almost never where intuition says.

| Question | Tool class |
|---|---|
| Which function burns CPU? | Sampling profiler with flame graph |
| Where does wall time go (waiting, I/O, locks)? | Tracing, off-CPU or wall-clock profile, spans |
| Which allocation grows? | Heap profile, allocation tracking, leak snapshots diffed over time |
| Which query is slow? | Query log, `EXPLAIN (ANALYZE)`, slow query log, ORM query count per request |
| Which network call? | Waterfall (browser or APM), `curl -w` timings |
| Which render or frame? | Frame profiler (browser Performance, Instruments, Android GPU/Systrace, Flutter DevTools) |

Per stack tools are in the stack tools guide of this skill.

Common culprits, in order of how often they are the answer:
1. N+1 queries and missing indexes; unbounded `SELECT`; missing pagination.
2. Work repeated on every call or render that could be cached or hoisted.
3. Sequential awaits that could run concurrently (or the reverse: unbounded concurrency).
4. Large payloads, no compression, no caching headers, oversized images.
5. Synchronous work on the main/event-loop/UI thread.
6. Accidental quadratic behaviour (nested loops, repeated `array.includes`, string concatenation in loops).
7. Allocation churn and unbounded caches or listeners that are never removed (leaks).
8. Lock contention and pool starvation.
9. Cold starts, bundle size, too many dependencies loaded eagerly.
10. Logging or serialisation at hot paths.

## 5. Change one thing

- One hypothesis, one change, re-measure with the same method.
- Record each try in a table: change, metric before, metric after, kept or reverted.
- Keep a change only if the number moves beyond the noise. A change that does not help is reverted, not left in "just in case".
- Do not trade correctness for speed. Caches need invalidation rules; concurrency needs the race review (the races guide of this skill).

## 6. Memory leaks

1. Reproduce growth: run the operation repeatedly and plot memory after forcing a collection. A staircase that never drops is a leak.
2. Take two heap snapshots a fixed number of operations apart. Diff them. Look at retained size by type and the retainer path to a root.
3. Usual roots: global caches without bounds, event listeners and subscriptions never removed, timers, closures holding large objects, singletons holding request data, unclosed handles/streams, detached UI nodes, growing logs or metrics label cardinality.
4. Fix by bounding (LRU, TTL, size cap), unsubscribing in teardown, or scoping lifetime. Re-run the repeat test and show the flat line.

## 7. Prove and guard

- Report before and after for the same scenario: median, p95, sample size, environment.
- Add a guard where practical: a benchmark test with a generous threshold, a query-count assertion in the request test, a bundle size budget, an alert on the production metric.
- Say what you did not measure (other devices, other data sizes).

## Output template

```
Metric: <name>, scenario <...>, data size <...>
Before: <median / p95>   After: <median / p95>   Runs: <n>   Env: <...>
Cause: <what, where (path:line), why it regressed>
Change: <commits>   Guard: <test or alert>
Not measured: <...>
```
