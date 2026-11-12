# Laziness ladder and anti-overbuild rules

Lazy means efficient, not careless. The best code is code never written. The ladder runs after you understand the problem, not instead of it: read the task and the code it touches, trace the flow end to end, then climb.

## The ladder

Stop at the first rung that holds.

1. **Does it need to exist at all?** A speculative need is skipped, with one line saying so. Ask what happens if it is not built.
2. **Already in this codebase?** A helper, type, hook, component or pattern a few files away. Search before writing: `grep` the verb and the noun, check `utils`, `lib`, `shared`, `common`, similar features. Re-implementing what exists is the most common slop.
3. **Standard library?** Use it.
4. **Native platform feature?** Over a library or custom code: an HTML date input over a picker library, CSS over JavaScript, a database constraint over application code, the OS permission and share sheets, `Intl` for formats, platform keychain over home-made secret storage.
5. **Already-installed dependency?** Use it. Never add a dependency for what a few lines do. A new one needs a reason the user can read: maintenance, size, licence, security record.
6. **Can it be one line?** One line.
7. **Only then:** the minimum new code that works, with the one check that fails if it breaks.

When two rungs work, take the higher one and move on.

## Examples per stack

| Need | Reach for first |
|---|---|
| Debounce, retry, memo | language or framework helper already in the project, then a few lines; not a library |
| JS/TS: group, dedupe, clone | `Map`, `Set`, `structuredClone`, `Object.groupBy` where supported |
| Python: cache, paths, dates | `functools.lru_cache`, `pathlib`, `datetime` / `zoneinfo` |
| Go: concurrency limits, retries | `errgroup`, `context` deadlines, `sync.Once` |
| Rust: errors, iteration | `thiserror`/`anyhow` if already present, iterator adaptors |
| JVM / Kotlin: collections, time | stdlib collection functions, `java.time` |
| Swift: formatting, persistence | `Formatter`s, `Codable`, `@AppStorage`/Keychain |
| .NET: options, http | `IOptions`, `HttpClientFactory` |
| Web UI: modal, tooltip, accordion | `<dialog>`, `popover`, `<details>` |
| Mobile: pickers, sheets, haptics | the platform component the design system already wraps |
| Backend: queue, cron, idempotency | the platform's queue and scheduler, a unique constraint, an idempotency key column |

## Rules against overbuilding

- No abstraction without a second user: no interface with one implementation, no factory for one product, no config for a value that never changes, no plugin system for one plugin.
- No scaffolding "for later". Later can scaffold for itself.
- No unrequested features, modes, providers, flags or "nice to haves".
- Deletion over addition. Boring over clever; clever is what someone decodes at 3 am.
- Fewest files. The shortest diff wins, but only once you understand the problem. The smallest change in the wrong place is a second bug.
- Surface only what acceptance needs. Add a surface (endpoint, table, service, config, migration) only for the lifecycle the design needs, and say what the trade-off is.
- A complex request with a lazier equivalent: build the lazy version and question it in the same reply ("Did X; Y covers it. Need full X? Say so."). Never stall on a question you can default.
- Two options of equal size: take the one correct on edge cases. Lazy is less code, not a flimsier algorithm.
- Mark a deliberate simplification that cuts a real corner with a known ceiling in a comment naming the ceiling and the upgrade path, e.g. `ponytail: global lock; per-account locks if throughput matters`.

## Bug fixes

A report names a symptom. Before editing, grep every caller of the function you will touch. The lazy fix is the root-cause fix: one guard in the shared function is a smaller diff than a guard in every caller, and patching only the path named in the ticket leaves sibling callers broken. Fix it once, where all callers route through.

## When not to be lazy

Never simplify away: input validation at trust boundaries; handling that prevents data loss; security measures; accessibility basics; anything the user explicitly asked for. If the user insists on the full version, build it without re-arguing.

Never be lazy about understanding. Laziness that skips comprehension to ship a small diff is the dangerous kind: it looks like efficiency and ships a confident wrong fix.

Real systems are not ideal. Clocks drift, sensors read off, networks drop and retry. Leave the calibration knob or the retry policy where the physical world needs tuning.

Lazy code without its check is unfinished. Non-trivial logic (a branch, a loop, a parser, a money or security path) leaves one runnable check behind: the smallest test that fails if the logic breaks. No frameworks, no fixtures, no per-function suites unless asked. Trivial one-liners need no test.

## Self-check before you hand over

1. Did I add anything the request did not require? Remove it.
2. Did I write something that exists elsewhere in the repo or stdlib? Replace it.
3. Did I add a dependency, config key, file or abstraction? Justify each in one line or delete it.
4. Does one runnable check fail if the logic breaks?
5. Did I keep every validation, error path and accessibility basic the change touches?

An over-engineering pass on a finished diff (delete, stdlib, native, yagni, shrink tags) is part of `lll:review`.
