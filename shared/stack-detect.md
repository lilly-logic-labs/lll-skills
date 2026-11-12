# Stack detection

Learn the project before acting. Do this once per run, record the result at the top of any report, and reuse it in every subagent brief.

## 1. Read the project's own instructions

In this order, if present: `CLAUDE.md`, `AGENTS.md`, `.cursor/rules/`, `CONTRIBUTING.md`, `README.md`, `docs/` index, ADR folder (`docs/adr/`, `adr/`, `docs/decisions/`), threat model (`docs/THREAT_MODEL.md`, `SECURITY.md`), deploy and release docs. Nested `CLAUDE.md` files apply to their folder.

Take from them: install, build, test, lint and typecheck commands; forbidden commands; deployed environments and hostnames; locked decisions.

## 2. Detect the stack from manifests

| File | Stack | Typical gates |
|---|---|---|
| `package.json` + `pnpm-lock.yaml` / `yarn.lock` / `bun.lockb` / `package-lock.json` | JavaScript / TypeScript (pnpm / yarn / bun / npm) | the `scripts` entries: `test`, `lint`, `typecheck` or `tsc --noEmit`, `build` |
| `deno.json` | Deno | `deno test`, `deno lint`, `deno check` |
| `pyproject.toml`, `requirements*.txt`, `uv.lock`, `poetry.lock` | Python | `pytest`, `ruff check`, `mypy` or `pyright` |
| `go.mod` | Go | `go test ./...`, `go vet ./...`, `golangci-lint run` |
| `Cargo.toml` | Rust | `cargo test`, `cargo clippy -- -D warnings`, `cargo fmt --check` |
| `build.gradle(.kts)`, `pom.xml` | JVM / Android | `./gradlew test lint`, `mvn verify` |
| `*.xcodeproj`, `Package.swift` | Apple platforms | `xcodebuild test`, `swift test` |
| `*.csproj`, `*.sln` | .NET | `dotnet test`, `dotnet build -warnaserror` |
| `composer.json` | PHP | `composer test`, `phpstan`, `phpunit` |
| `Gemfile` | Ruby | `bundle exec rspec`, `rubocop` |
| `pubspec.yaml` | Dart / Flutter | `flutter test`, `dart analyze` |
| `app.json` / `app.config.*` with `expo` | Expo / React Native | the package scripts plus `npx expo-doctor` (read-only) |
| `wrangler.toml` / `wrangler.json(c)` | Cloudflare Workers | package scripts; `wrangler deploy --dry-run` only |
| `Dockerfile`, `docker-compose*.yml`, `k8s/`, `*.tf`, `serverless.yml`, `vercel.json`, `netlify.toml`, `firebase.json`, `supabase/` | Deploy surface | read only |
| `wails.json`, `electron-builder.*`, `tauri.conf.json` | Desktop app | package scripts |

Monorepos (`pnpm-workspace.yaml`, `turbo.json`, `nx.json`, `go.work`, Cargo workspaces): list each package and its own gates.

## 3. Detect data stores

Look for migrations folders, ORM schemas and connection config: `migrations/`, `prisma/schema.prisma`, `drizzle/`, `alembic/`, `db/migrate/`, `*.sql`, `knexfile`, `typeorm`, `sequelize`, `gorm`, `sqlx`, `ent/`, D1 bindings in wrangler config, `supabase/migrations`, Firestore rules, Mongo models, Redis clients, on-device SQLite (`expo-sqlite`, Room, Core Data, GRDB).

## 4. Detect deploy targets and environments

From docs, CI files (`.github/workflows/`, `.gitlab-ci.yml`, `bitbucket-pipelines.yml`, `azure-pipelines.yml`), and platform config. Name each environment (local, preview, staging, production), its hostname, and how it is deployed. Production is read-only unless the owner says otherwise.

## 5. Gates

Gates are the commands that must pass before and after any fix. Use the project's documented commands. If none are documented, use the manifest scripts. If a gate needs a service that is not running (database, emulator), say so and run what can run.

Do not run gates during read-only work if they install, build into the tree or write caches there. The baseline runs once, in the fix worktree after install (`fix-phase.md` step 4). Read-only work may read the latest CI results instead. A gate that already fails is a finding like any other.

## 6. Record

Write this block at the top of the report or the chat summary:

```
Project: <name>   Commit: <short sha> on <branch>
Stack: <languages, frameworks, platforms>
Data: <stores>
Deploy: <targets and environments>
Gates: <command list>
Project rules read: <files>
```
