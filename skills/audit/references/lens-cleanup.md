# Lens: cleanup

Code, files and dependencies the project carries but does not use, copies that should be one, and deliberate shortcuts that are quietly becoming permanent.

## Covers

- Dead code: unreachable branches, unused functions, exports, classes, components, routes, screens, styles.
- Unused files and assets: images, fonts, fixtures, scripts, configs nothing references.
- Unused or misplaced dependencies: declared but never imported, imported but undeclared, runtime deps that are only used in tests.
- Duplicate helpers: the same date, money, slug, retry or validation logic written more than once, especially copies that have drifted apart.
- Stale switches: feature flags fixed on or off, config keys nobody reads, compatibility layers for versions no longer supported.
- Leftovers: commented-out blocks, debug logging, test-only exports kept alive in production code, `TODO` and `FIXME` without an owner or issue, deferral markers with no trigger.
- Over-building: an interface with one implementation, a factory with one product, a wrapper that only delegates, config nobody sets, hand-rolled code the standard library or platform already provides.

## Method

1. **Run the detectors** below that the project has or that can run from a pinned version. Their output is a candidate list.
2. **Confirm each candidate has no reference,** including the ones tools miss: string-based imports and dynamic `import()`, reflection and dependency-injection containers, framework conventions (file-based routes, Django apps listed in settings, Rails autoloading, Android manifest and layout references, Storybook stories), CI and package scripts, public library APIs consumed by other repositories, code generation inputs, and plugins loaded by name.
3. **Duplicates.** Search for helpers by role, not only by name: `git grep -nE '(function|def|func|fn|fun)\s+\w*(format|parse)(Date|Time|Money|Currency|Amount|Price)|slugify|retry|debounce|throttle|clamp|chunk|sleep'`. Compare copies line by line. A copy that has drifted from the others (different rounding, time zone or validation) is a bugs or drift finding, not just cleanup.
4. **Deferral ledger.** Collect markers with `git grep -nE '(#|//|--|/\*)\s*(TODO|FIXME|HACK|XXX|ponytail:)'`. Group them by file. Each needs an owner or issue and a trigger to revisit; a marker that names a known limit (`ponytail: global lock, per-account locks if throughput matters`) is a tracked decision, while one with no trigger is the kind that rots. Use `git blame -L <line>,<line> -- <file>` for the author and age when the owner wants it.
5. **Over-building pass.** For each abstraction with a single implementation or caller, each dependency doing what the standard library or platform already does, and each config option with one value everywhere, write one line: tag, what to cut, the replacement, the path. Tags: `delete` (nothing replaces it), `stdlib` (name the function), `native` (name the platform feature), `yagni` (unused flexibility), `shrink` (same logic, fewer lines).
6. **Rank by size of the cut.** Recommend at most three extractions of shared code, and only those that delete more lines than they add across their callers.

## Detectors

| Ecosystem | Dead code and exports | Dependencies |
|---|---|---|
| JS and TS | `knip` (pinned or the project's own); `tsc --noEmit --noUnusedLocals --noUnusedParameters`; ESLint `no-unused-vars` | `knip` dependency report; `depcheck` |
| Python | `vulture` (pinned); `ruff check --select F401,F811,F841,ERA` | `deptry` |
| Go | `staticcheck ./...` (U1000); `deadcode ./...` from `golang.org/x/tools` | `go mod tidy -diff` |
| Rust | compiler `dead_code` warnings; `cargo clippy` | `cargo machete` or `cargo udeps` |
| JVM and Android | IDE inspections; `detekt` unused rules; Android lint `UnusedResources`; R8 `-printusage` | Gradle dependency analysis plugin if configured |
| Swift | `periphery scan` | `Package.swift` targets versus imports |
| PHP | PHPStan or Psalm unused-code checks | `composer-unused` |
| Ruby | `debride` | `bundle exec` with unused-gem tools if configured |
| .NET | analyzers IDE0051, IDE0052, CA1823 | `dotnet list package` versus `using` directives |
| CSS and assets | PurgeCSS report; Tailwind content config | unreferenced files: for each asset, `git grep -q <basename>` |

`/simplify` covers simplification of a single diff; this lens covers the whole tree.

## Reporting

Two outputs:

- **Findings** (`../../../shared/findings.md` format) for items with a concrete failure scenario: a dead branch that people believe is active (a dead permission check, an unused validator), a drifted duplicate that gives a different answer, an unused dependency that ships in the production bundle or carries an advisory, a flag fixed on that hides a broken code path, debug logging of personal data.
- **Cut list** for everything else, ranked biggest cut first, one line each: `<tag> <what to cut>. <replacement>. [path]`, ending with `net: -<N> lines, -<M> deps possible`. These have no severity and are not auto-fixed except confirmed-unused code and dependencies whose removal keeps every gate green.

## Fix rules

- Delete confirmed-unused code, files and dependencies in the fix phase, one logical removal per commit, gates green. Lockfile changes from removing a dependency are expected.
- Do not delete public API of a published library, migration files, or anything referenced from outside the repository (deployed configs, other services, scheduled jobs). Those go to "Needs decision".
- Extracting a shared helper is a refactor: one commit per extraction, every caller switched, tests proving identical behaviour.

## Severity calibration

- **medium:** a duplicate money or date helper that has drifted and is used on a user-facing path; an unused production dependency with a known advisory; a flag permanently on that bypasses a check people think is active.
- **low:** misleading dead code; unused exports; unused assets in the shipped bundle; `TODO` markers on risky paths without an owner.
- Items with no failure scenario are cut-list lines, not findings.

## False-positive traps

- Tools miss dynamic use; a symbol unused in the repository may be used by a framework, a plugin loader, reflection or another repository.
- Code used only by tests is not dead if it is the test seam the project chose; it is a cut-list line if the seam exists only to keep a test alive.
- Feature flags off in production may be on in staging or for a cohort; check the flag service before calling them dead.
- Generated code and vendored code are out of scope.
- Two similar functions may serve different contracts (display rounding versus ledger rounding); merging them can be the bug.
