# Verifying doc claims against code

Verify each claim by reading the code or running a read-only command, never from memory or from another doc. Record the evidence as `path:line` or the command and its decisive output line.

Contents: Claim types and how to check them · Mechanical sweep with drift.mjs · Searching for claims · Commands that are safe to run · Per-stack hints · Judgement calls

## Claim types and how to check them

| Claim in a doc | Check against | How |
|---|---|---|
| Install, build, run, test, lint commands | manifest scripts and task runners | read `package.json` `scripts`, `Makefile`, `justfile`, `pyproject.toml` scripts, `Taskfile`, CI workflow steps; run `--help` or a dry run if unsure |
| Required runtime or tool version | version pins | `.nvmrc`, `.node-version`, `engines`, `.tool-versions`, `go.mod`, `rust-toolchain`, `pyproject` requires-python, Dockerfile base image, CI matrix |
| File and folder paths, project tree | the file system | `git ls-files <path>`; regenerate the tree view and diff it with the doc |
| Env vars and config keys | code that reads them | `grep -rn "NAME"`; `.env.example`; config schema; deploy config. Name, default, required or optional, and who reads it |
| CLI commands, flags, subcommands | the parser | the argument-parser definition; the program's own `--help` output |
| HTTP routes, methods, params, status codes, auth | route definitions and handlers | router files, controllers, OpenAPI file, API tests; check request and response shape in the handler, not in the doc |
| Exports, function signatures, types | source | open the declaration; check optional versus required parameters, return type, thrown errors |
| Defaults, limits, timeouts, retry counts | constants and config | grep for the value; check it is the one actually used |
| Data model, tables, columns, enums | migrations and schema | latest migration, ORM schema, type definitions |
| Architecture description, flows, diagrams | module graph and call sites | trace one real request or job end to end; check every named module, service and queue still exists |
| Dependencies and integrations | lockfile and imports | the manifest and the places the library is imported; removed packages still named in docs |
| Feature lists and counts ("12 commands", "supports X, Y") | the registry or directory | count them from code; counts rot fastest |
| Error messages and codes quoted | source | grep the exact string |
| Permissions, roles, security behaviour | enforcement code | read the check, not the description; flag mismatches to the owner, do not smooth them over |
| Deploy and environment tables (hostnames, regions, domains) | deploy config, CI, IaC | read-only; hostnames in docs that differ from config are findings |
| Links and anchors | files and headings | `../scripts/drift.mjs` |
| Screenshots, GIFs, videos | the running UI | cannot be checked from code; mark unverifiable and list screens that changed |

## Mechanical sweep with drift.mjs

```
node scripts/drift.mjs --root .                 # all docs, history skipped
node scripts/drift.mjs --root . --docs README.md,docs/api
node scripts/drift.mjs --root . --json
```

It reports `link` and `anchor` (relative links and heading anchors that do not resolve), `path` (inline-code repo paths that do not exist where the first segment does exist), `script` and `make` (commands naming a script or target that is not defined), `env` (UPPER_SNAKE names in docs that appear nowhere in code or config) and `env-undocumented` (names in an example env file that no doc mentions). Every result is a lead: a path may be a generated output, a script may live in a workspace package the doc names in prose, an env name may belong to a third-party tool. Confirm in the code before editing. Exit code 1 when anything except `env-undocumented` is found.

It cannot see: behaviour claims, defaults, counts, diagrams, tables, API shapes, prose. Those are read by hand.

## Searching for claims

- Search the new and the old name of everything that was renamed, moved or removed. Search with and without extension and in `kebab`, `snake`, `camel` and `Pascal` spellings.
- Search for the old value of any changed default, port, limit, timeout, URL or version.
- Search by feature word, not just by symbol: a doc says "retries three times" without naming the constant.
- Search docs folders, root files, `.github/`, templates and issue forms, `CONTRIBUTING`, package `README`s, nested `CLAUDE.md` files, `docs` inside packages, the website source, example apps, notebooks, and code comments.
- Include tests that double as documentation (examples, doc-tests, snapshot of `--help` output).

## Commands that are safe to run while verifying

`--help`, `--version`, `list`, `status`, `show`, `describe`, `--dry-run`, `git ls-files`, `git grep`, a type-check or test run that writes nothing outside caches. Do not run deploys, migrations, installs, generators, seeders, payment or email commands. Where a documented command is destructive or remote, verify it by reading the code and say it was not run.

## Per-stack hints

- **JavaScript / TypeScript**: scripts in every workspace `package.json`; `exports` and `bin` fields; `tsconfig` paths; framework config (`next.config`, `vite.config`); env via `process.env` and `import.meta.env`.
- **Python**: `pyproject.toml` scripts and entry points, `argparse`/`click`/`typer` definitions, Django settings, `os.environ`, FastAPI route decorators and their generated OpenAPI.
- **Go**: `cmd/` main packages and `flag` definitions, `go.mod` version, build tags, `os.Getenv`, exported identifiers and their doc comments (`go doc ./...`).
- **Rust**: `Cargo.toml` features and bins, `clap` derive structs, `cargo doc` output, `std::env::var`.
- **JVM / Kotlin**: Gradle tasks (`./gradlew tasks`), Spring `application.yml` keys and `@Value`, Javadoc and KDoc on public API, Android manifest and `build.gradle` SDK levels.
- **Swift / Apple**: Xcode schemes and targets, `Info.plist` keys, SPM products, deployment target, entitlements.
- **PHP**: `composer.json` scripts and PHP version, framework routes and config files, `.env.example` keys.
- **Ruby**: `Gemfile` Ruby version, Rake tasks (`rake -T`), Rails routes (`bin/rails routes`) and credentials keys.
- **.NET**: `*.csproj` target frameworks, `launchSettings.json`, `appsettings*.json` keys, `dotnet` tool manifest.
- **Mobile / Expo**: `app.json` or `app.config.*`, permissions, EAS profiles, store listing assumptions.
- **Desktop**: installer config, auto-update channel, platform support lists.
- **Cloudflare Workers**: `wrangler` config bindings, routes, cron triggers, secrets (names only), compatibility date.

## Judgement calls

- When a doc states intent ("we use X because Y") and the code differs, the code is the fact but the intent may be a locked decision. Report it as a mismatch for the owner, do not rewrite the rationale.
- When two docs disagree and the code supports neither fully, fix to the code and note both.
- A stale statement in a place that cannot be edited (generated, vendored, third-party) goes to the summary with its source.
