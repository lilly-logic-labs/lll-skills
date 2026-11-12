# Stack checklists

Pitfalls that recur per stack. Use only the sections that match the detected stack (`../../../shared/stack-detect.md`). Each item is a lead to verify, not a finding by itself.

## JavaScript / TypeScript (Node and browser)
- Floating promises, missing `await` in loops, `forEach` with async callbacks, `Promise.all` hiding partial failure.
- `any`, `as` casts and `!` non-null assertions where input is untrusted; `JSON.parse` result used without validation.
- `==`, truthiness checks that treat `0` or `""` as missing; `parseInt` without radix; array `sort` without comparator on numbers.
- Mutated function arguments and shared module-level state; stale closures; `Date` and time zone handling.
- Dependency array mistakes in React hooks; state set during render; keys from array index on reorderable lists; effects without cleanup; fetches without abort.
- Server code: unvalidated `req.body`, missing auth middleware on new routes, CORS wildcard with credentials, secrets in client bundles (`NEXT_PUBLIC_`, `VITE_`, `EXPO_PUBLIC_` prefixed values are public).
- Bundle: large new imports, dynamic import needed, side-effectful imports.

## Python
- Mutable default arguments; late-binding closures in loops; bare `except`; exceptions swallowed in threads and tasks.
- Blocking calls in `async` code; missing `await` on coroutines; event loop misuse.
- `datetime` naive versus aware; `==` on floats; `is` on literals.
- `subprocess` with `shell=True` and input; `pickle`/`yaml.load` on untrusted data; `assert` used for validation (stripped under `-O`).
- Django/Flask/FastAPI: queries in loops (use `select_related`/`prefetch_related`), missing permission classes, raw SQL formatting, `DEBUG=True` paths, CSRF exemptions, migrations that lock large tables.
- Type hints that lie; Pydantic models allowing extra fields where not wanted.

## Go
- Ignored errors (`_ = err`), `err` shadowed in inner scope, nil-interface-versus-nil-pointer traps.
- Goroutine leaks (no exit path, unbuffered channel with no receiver), missing `context` propagation and cancellation, `WaitGroup` misuse, closing a channel twice, data races on maps.
- Loop variable captured by goroutine (check Go version semantics), `defer` in loops, `time.After` in loops.
- `http.Client` without timeout; response bodies not closed; `sql.Rows` not closed or `Err()` not checked.
- Large copies of structs; slices aliasing the same backing array after `append`.

## Rust
- `unwrap`/`expect` on fallible runtime input; panics in library code; `as` casts that truncate.
- `unsafe` blocks without a stated invariant; `Send`/`Sync` impls; `mem::forget`; unchecked indexing.
- Holding a `Mutex` guard across `.await`; blocking calls in async tasks; unbounded channels.
- Error types that lose context; `Drop` that can panic; integer overflow in release builds (wraps) versus debug (panics).

## JVM (Java, Kotlin, Scala)
- Null handling: platform types from Java in Kotlin, `!!`, `lateinit` read before init, Optional misuse.
- Checked exceptions swallowed; `catch (Exception)`; resources without try-with-resources / `use`.
- Threading: shared mutable state, `synchronized` scope, `ConcurrentModificationException`, blocking in coroutine dispatchers (`Dispatchers.Main`/`Default`), `GlobalScope`, unstructured concurrency.
- Spring/JPA: lazy loading outside the transaction, N+1, `@Transactional` self-invocation, equals/hashCode on entities, open-in-view surprises, `@Autowired` field injection hiding cycles.
- Serialization: default values and unknown properties on Jackson/kotlinx; `BigDecimal` equality and scale.

## Swift / iOS / macOS
- Force unwraps and `try!`; retain cycles in closures (`[weak self]`); delegate references not weak.
- UI updates off the main actor; `Task` lifetime and cancellation; actor reentrancy; `@MainActor` missing on view models.
- SwiftUI: state ownership (`@State` vs `@StateObject` vs `@Observable`), identity of `ForEach`, heavy work in `body`.
- Keychain versus UserDefaults for secrets; ATS exceptions; privacy manifest and usage descriptions for new APIs; background modes.
- Core Data / SwiftData threading and migration; `Codable` keys and defaults across app versions.

## Android (Kotlin/Java)
- Lifecycle: work tied to the wrong scope (`lifecycleScope` vs `viewModelScope` vs application), configuration change state loss, leaked `Context`/`Activity`.
- Main-thread disk or network work; ANR risk; `StateFlow` collection without lifecycle awareness.
- Permissions requested without rationale or denied path; exported components without protection; intent extras trusted; WebView JavaScript bridges.
- Room migrations; ProGuard/R8 rules for reflection and serialization; `targetSdk` behaviour changes.
- Compose: unstable parameters causing recomposition, side effects outside `LaunchedEffect`, `remember` keys.

## Expo / React Native
- Native module or config plugin changes that require a new build, not an OTA update; app config and permissions strings.
- OTA update compatibility with the installed native runtime version; schema changes breaking old app versions.
- Secrets in `EXPO_PUBLIC_*` variables; deep link handling and auth callbacks; storage choice (`SecureStore` for secrets).
- Lists: `FlatList` keys and virtualisation, inline functions in renderItem; image sizes; Hermes-specific behaviour; Android back button and keyboard handling; safe areas.

## Flutter / Dart
- `setState` after dispose, missing `mounted` checks after `await`, controllers and streams not disposed.
- `BuildContext` used across async gaps; heavy work in `build`; missing `const`; unbounded `ListView` children.
- Platform channels error handling; null-safety bypasses (`!`, `late`); `Future` errors unhandled in `unawaited` calls.

## PHP / Laravel
- Raw queries with concatenation; mass assignment (`$fillable`/`$guarded`); missing authorization policies on new routes; unescaped Blade output (`{!! !!}`).
- N+1 (`with()` missing); queue jobs not idempotent; transactions around external calls; env access outside config (`env()` in code breaks cached config).
- Type juggling and loose comparisons; file upload validation; session fixation; `unserialize` on input.

## Ruby / Rails
- `html_safe`/`raw` on user content; `params` without strong parameters; `find_by_sql` interpolation; callbacks with side effects; default scopes.
- N+1 (`includes`); validations without DB constraints; `update_all`/`delete_all` skipping callbacks; migrations with data changes on large tables; background jobs not idempotent.
- Monkey patches; `rescue => e` swallowing; time zone handling (`Time.now` vs `Time.current`).

## .NET (C#)
- `async void`; blocking on tasks (`.Result`, `.Wait()`); missing `ConfigureAwait` decisions in libraries; `CancellationToken` not propagated.
- `IDisposable` not disposed; `HttpClient` created per request; static mutable state; `DateTime` kind and `DateTimeOffset`.
- EF Core: tracking and lazy loading surprises, N+1, client-side evaluation, migrations; model binding over-posting; missing `[Authorize]`; nullable reference warnings suppressed.

## SQL and databases
- Missing indexes for new filters/sorts/joins; implicit casts that prevent index use; `SELECT *` into code that breaks when columns change.
- `NOT NULL`/unique/foreign key additions on populated tables; long locks; destructive changes in the same release as the code change.
- Transaction scope too wide or too narrow; isolation assumptions; deadlock risk from lock ordering; time zone columns.
- Row Level Security / tenant filters on every new table and view.

## Cloudflare Workers, serverless and edge
- CPU time, subrequest and memory limits; unbounded `await` chains; work after response without `waitUntil`.
- Bindings (KV, D1, R2, Queues, Durable Objects) declared in every environment; secrets via `wrangler secret`, not in `vars`; compatibility date and flags changes.
- KV eventual consistency assumed strong; D1 batch and transaction semantics; Durable Object storage and `await` gaps between read and write; Queue consumers idempotent with retries and dead letter.
- CORS and cache headers on new routes; request body size; streaming responses and cancellation.

## Shell, CI and infrastructure as code
- Unquoted variables, `set -euo pipefail` missing, `rm -rf` with a variable path, `curl | sh`, unpinned tool versions and actions (pin by SHA), `pull_request_target` with untrusted code, secrets echoed to logs, permissions broader than needed (`contents: write` default).
- Windows versus POSIX paths and line endings in scripts; `PATH` assumptions.
- Terraform/Pulumi/CloudFormation: destroy-and-recreate on rename, state drift, wide IAM (`*`), public buckets, missing deletion protection, no backup on stateful resources; read the plan output, not just the diff.
- Docker: root user, secrets in layers, unpinned base images, `latest` tags, missing healthcheck, large context copied.

## LLM and agent code
- Prompt assembly with untrusted text in the instruction channel; missing output schema validation; unbounded retries or tool loops; no spend or step cap; secrets in prompts or logs; model id hard-coded without a fallback plan; no evals for the changed prompt.
