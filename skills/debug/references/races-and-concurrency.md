# Races, deadlocks and concurrency bugs

Bugs that depend on interleaving: wrong only under load, once in a thousand, only in production, gone when you add a log line.

## Signs

- Fails under load or on a faster/slower machine; vanishes under a debugger.
- Duplicate rows, double charges, double sends, lost updates, negative stock.
- Hangs with no CPU use (deadlock) or full CPU use (livelock, spin).
- Works single-user, breaks with two tabs, two devices, two workers or a retry.
- A value read twice returns different results within one request.

## Patterns to look for

| Pattern | Example | Fix direction |
|---|---|---|
| Check then act | `if not exists: insert` | Unique constraint plus handle the conflict; or atomic upsert |
| Read-modify-write | `n = get(); set(n+1)` | Atomic increment; transaction with row lock; optimistic version column |
| Double submit | button clicked twice, client retry, webhook redelivery | Idempotency key stored with a unique index; disable control while pending |
| Lost update | two editors save the same record | Version or `updated_at` precondition; merge or reject with 409 |
| Stale read after write | read replica or cache behind | Read from primary after write; cache invalidation on write |
| Unawaited async | missing `await`, fire-and-forget | Await it, or handle its error and lifetime explicitly |
| Shared mutable state | module global used per request | Per-request state; immutable data; confinement to one owner |
| Lock ordering | A takes L1 then L2, B takes L2 then L1 | One global lock order; or one lock |
| Lock held across I/O | holding a lock while calling the network | Narrow the critical section |
| Check-use gap (TOCTOU) | check file/permission then use it | Do the operation and handle the failure |
| Event order assumption | message B assumed to arrive after A | Carry sequence numbers; make handlers order-tolerant |
| Resource exhaustion | pool of 10 connections, 11 waiters holding one each | Bound concurrency; timeouts; never wait for a resource while holding one |
| Cancellation/timeouts | half-finished work after caller gave up | Make steps idempotent; compensate or roll back |
| Clock assumptions | `now()` differs across nodes | Use the database or a monotonic source for ordering |

## Method

1. **Write the interleaving.** Draw two timelines (threads, requests, workers) and the exact order of reads and writes that produces the bad state. If you cannot draw one, you do not have the cause yet.
2. **Make it likely.** Force the order rather than hoping:
   - Insert a controlled pause (a latch, a barrier, a test hook) at the critical point.
   - Run N parallel callers against one resource (`Promise.all`, `errgroup`, threads, `xargs -P`, k6, `hey`).
   - Shrink buffers, pool sizes and timeouts to widen the window.
   - Run the race detector (below).
3. **Instrument without disturbing.** Log thread/request id, a monotonic timestamp and the lock or version observed, to a buffer or structured log. Heavy logging can hide the race; compare rates with and without.
4. **Fix the invariant, not the timing.** Decide the rule that must always hold (one row per key, balance never negative, one handler per message), and enforce it where it cannot be bypassed: the database constraint, the atomic operation, the single writer. A sleep or a retry moves the window; it does not close it.
5. **Prove with the forcing harness.** The same forced interleaving and the N-parallel test must pass, many times. Keep the test.

## Fix toolbox, strongest first

1. Remove sharing: pure functions, immutable values, per-request state.
2. One owner: a single writer, actor, queue consumer or partition key that serialises access.
3. Let the datastore decide: unique index, `INSERT ... ON CONFLICT`, conditional write, compare-and-swap, `SELECT ... FOR UPDATE`, serializable transaction.
4. Idempotency: a key per logical operation, stored atomically with the effect.
5. Locks: smallest scope, fixed ordering, timeouts, never across network calls.
6. Retries with backoff and jitter only on idempotent operations.

## Deadlocks and hangs

- Capture where everything is waiting: thread dump or goroutine dump, async task dump, `pg_stat_activity` and lock views.
- Cycle in the wait graph is a deadlock: break it with lock ordering or a timeout.
- Everyone waiting on a pool or queue that nobody drains: bound concurrency and find who holds without releasing.
- Event-loop runtimes: one blocking call stalls everything; look for sync I/O or CPU loops on the loop thread.

## Tools

| Stack | Detect | Inspect a hang |
|---|---|---|
| Go | `go test -race`, `go run -race` | `kill -QUIT <pid>` or `pprof` goroutine profile |
| Rust | `loom`, `miri`, TSan nightly (`-Zsanitizer=thread`) | `tokio-console`, `gdb`/`lldb` `thread backtrace all` |
| C/C++/Swift/Obj-C | ThreadSanitizer | Xcode thread sanitizer, `lldb` `bt all` |
| JVM/Kotlin | JCStress, `-ea`, review `synchronized` scopes | `jstack <pid>`, `jcmd <pid> Thread.print`, JFR |
| Python | `threading` stress tests, `asyncio` debug mode (`PYTHONASYNCIODEBUG=1`, `-X dev`) | `faulthandler.dump_traceback_later`, `py-spy dump --pid` |
| Node/JS | lint for floating promises; `--trace-warnings` | `node --inspect`, `process._getActiveHandles()`, `why-is-node-running` |
| .NET | analyzers for async misuse, concurrency visualizer | `dotnet-dump analyze` then `clrstack -all`, `dotnet-stack` |
| Ruby | stress with threads | `Thread.list.map(&:backtrace)`, `rbspy` |
| PHP | rare in-process; look at DB and queues | slow query log, lock waits |
| Databases | isolation level review | Postgres `pg_locks`, `pg_stat_activity`; MySQL `SHOW ENGINE INNODB STATUS` |
| Mobile | main-thread checker, StrictMode | ANR traces, `adb shell dumpsys`, Instruments Time Profiler |
| Cloudflare Workers / Durable Objects | single-threaded per object; races come from `await` points between read and write | `wrangler tail`, check input/output gates and storage transactions |

## Reporting

State the interleaving in two timelines, the invariant that was violated, where it is now enforced, and the test that forces the order. Say how many repeated runs passed.
