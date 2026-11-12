# Debuggers and tools by stack

Pick the cheapest tool that answers the question. Detect the stack first (`../../../shared/stack-detect.md`). Use only tools the project already has or that are pinned and approved; do not install global tools without asking.

## Quick pick

| Question | Reach for |
|---|---|
| What is the value right now? | Debugger breakpoint or one targeted log |
| Who called this? | Stack capture at that point |
| Which commit broke it? | `git bisect run` in a worktree |
| Where does time go? | Sampling profiler, flame graph |
| What is waiting on what? | Thread, goroutine or task dump |
| Why does memory grow? | Heap snapshot diff |
| What did the network do? | HAR, `curl -v`, proxy, APM trace |
| What did the database do? | Query log, `EXPLAIN (ANALYZE)` |
| What happened on a device? | Platform log stream and crash report |

## By stack

| Stack | Debugger | Logs and traces | Profile and memory |
|---|---|---|---|
| JavaScript / TypeScript (Node) | `node --inspect-brk` with Chrome DevTools or the editor; `--enable-source-maps` | `DEBUG=*`, `pino`/`console` with levels, `--trace-warnings`, `--trace-uncaught` | `node --cpu-prof`, `--heap-prof`, Chrome heap snapshots, `clinic`, `0x` |
| Browser | DevTools Sources, breakpoints on DOM/XHR/exceptions | Console, Network (HAR), Application panel | Performance panel, Memory panel, Lighthouse, Web Vitals |
| Python | `breakpoint()` (pdb), `python -m pdb`, `pytest --pdb`, `-X dev`, `-W error` | `logging`, `faulthandler`, `traceback` | `cProfile` plus snakeviz, `py-spy`, `tracemalloc`, `memray` |
| Go | `dlv debug` / `dlv test` | `log/slog`, `GODEBUG=...`, `-race` | `pprof` (cpu, heap, goroutine, mutex, block), `go tool trace` |
| Rust | `rust-lldb` / `rust-gdb`, `RUST_BACKTRACE=1` (`full`) | `tracing` with `RUST_LOG`, `tokio-console` | `cargo flamegraph`, `perf`, `dhat`, `miri` for undefined behaviour |
| JVM (Java/Kotlin/Scala) | IDE debugger, `jdb`, remote debug agent | JFR events, structured logs, `-Xlog` | JFR, `async-profiler`, `jcmd GC.heap_dump`, Eclipse MAT, `jstack` |
| Swift / iOS / macOS | Xcode LLDB, `po`, symbolic breakpoints, view debugger | `os_log` plus Console.app, `log stream`, crash logs | Instruments (Time Profiler, Allocations, Leaks), MetricKit, Memory Graph |
| Android (Kotlin/Java) | Android Studio debugger, `adb` | `adb logcat -v time`, `StrictMode`, ANR traces in `/data/anr` | Android Studio Profiler, Perfetto, LeakCanary, `adb shell dumpsys meminfo` |
| Expo / React Native | React Native DevTools, Hermes debugger | Metro output, `adb logcat`, Xcode console, Sentry breadcrumbs | Hermes sampling profiler, React Profiler, Flashlight for Android perf |
| Flutter / Dart | DevTools debugger, `debugger()` | `debugPrint`, `flutter logs`, `dart:developer` log | DevTools Performance and Memory, `--profile` builds |
| .NET | VS/Rider debugger, `dotnet-dump` | `ILogger`, `dotnet-trace`, `dotnet-counters` | `dotnet-trace` plus speedscope, `dotnet-gcdump`, PerfView |
| PHP | Xdebug (step), `error_log`, Ray | Monolog, PHP-FPM slow log | Xdebug profiler, Blackfire, SPX |
| Ruby / Rails | `debug` gem (`binding.break`), `byebug` | `Rails.logger`, `ActiveSupport::Notifications` | `stackprof`, `rbspy`, `memory_profiler`, `rack-mini-profiler` |
| Cloudflare Workers / D1 / DO | `wrangler dev` (local, with inspector) | `wrangler tail`, Workers Logs and Observability, `console` | Workers traces, CPU time in analytics, D1 query `meta` timings |
| Native C/C++ | gdb / lldb, sanitizers (ASan, UBSan, TSan) | `-fsanitize=...` output | `perf`, Valgrind (massif, callgrind), Instruments |
| Databases | n/a | slow query log, `pg_stat_statements`, `EXPLAIN (ANALYZE, BUFFERS)` | index usage views, lock views (`pg_locks`) |
| Containers / infra | `docker logs`, `kubectl logs/describe/events`, `kubectl debug` | cloud logs and traces | `docker stats`, `kubectl top` |
| Network | `curl -v`, `curl -w` timing format, browser HAR | proxy (mitmproxy, Charles) for dev traffic only | `dig`, `traceroute`; packet capture only on systems you own |

## Habits that save time

- Read the first error, not the last. Later errors are often consequences.
- Turn on strictness before debugging: warnings as errors, strict mode, `-X dev`, `-race`, sanitizers, `StrictMode`, `--trace-warnings`. Many bugs announce themselves.
- Debug builds lie about performance, release builds lie about line numbers. Use symbols and source maps with release builds.
- Production debugging: logs, traces and metrics first. Attaching a debugger to production is a pause in service; do it only with owner approval and on a drained instance.
- Remove temporary logging and breakpoints before committing. A grep for the tag you used (`DEBUGTMP`) proves it.
- Log with a correlation id, never with secrets or personal data.
- On mobile, reproduce on the oldest supported OS and a low-end device, with the network throttled and offline.
- On Windows shells, quote paths with spaces, and watch for CRLF versus LF in scripts and test fixtures.
