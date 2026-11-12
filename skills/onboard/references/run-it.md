# Run it

Goal: prove how the project builds, starts and passes its checks on a clean machine, and record what it takes. Done only in full mode and only with the owner's go-ahead in this conversation, because installing and running writes files and may touch real services.

## Safety first

1. **Never in the shared checkout.** Make a throwaway copy outside the repository:
   - git repo: `git clone --local <repo> <scratch>/onboard-<name>` (writes nothing to the source repo; uncommitted changes are not copied, say so).
   - not git: copy the folder without `node_modules`, `.venv`, `target`, `build`, `dist`.
2. **Never against production.** Read the env example and config for hostnames first. If any URL, database or bucket looks like production, point it at a local or sandbox substitute or stop and ask.
3. **No live side effects.** Mail, SMS, payments, push, webhooks and analytics need sandbox keys or must be stubbed. A first run must not email real customers.
4. **Secrets.** Do not read `.env`, `.dev.vars` or key files. Work from the example file (names only). If the app cannot start without a real secret, record "needs `NAME` (sandbox is fine)" and ask the owner for a dev value; never print or store it in the doc.
5. **No deploys, remote migrations or store builds.** Local database only (`--local`, a container, an emulator).
6. **Pinned tools.** Use the versions the project pins (`.nvmrc`, `engines`, `rust-toolchain`, `go.mod`, `.tool-versions`, `pyproject`). Do not `curl | sh` a toolchain; ask.

## Procedure

1. Read the documented commands (README, CLAUDE.md, CI). The CI commands are the ones proven to work; prefer them.
2. Install from the lockfile only: `npm ci`, `pnpm install --frozen-lockfile`, `yarn install --immutable`, `bun install --frozen-lockfile`, `uv sync --frozen`, `poetry install --no-root` (or the documented form), `pip install -r requirements.txt` inside a venv, `go mod download`, `cargo fetch`, `bundle install`, `composer install`, `dotnet restore`, `flutter pub get`, `./gradlew --refresh-dependencies` only if needed.
3. Start required services locally (database, queue, emulator) with the project's own compose file or scripts.
4. Run, in this order, each once, and record the result: lint, typecheck, unit tests, build, start. Capture the decisive output line, not the whole log.
5. Hit the running app read-only: a health endpoint, the home page, one list view. Do not submit forms that write unless the data is clearly local test data.
6. Stop after 30 minutes on any single blocker. Record it and move on; a documented blocker is a finding.

## Per platform

| Platform | Run | Notes |
|---|---|---|
| Web (Node) | install, then the `dev` script; open the local URL | Check Node version first; a wrong major version causes most failures |
| Backend (any) | start DB with compose, run migrations locally, start server, call health | Migrations run against the local DB only |
| Cloudflare Worker | `wrangler dev --local`; D1 with `--local`; `wrangler deploy --dry-run` | Remote bindings can hit real resources; check bindings before writes |
| Expo / React Native | `npx expo-doctor`, `npx expo start`, Android emulator or iOS simulator | No EAS builds or store submissions; `expo-doctor` reads only |
| Native Android | `./gradlew assembleDebug`, `./gradlew test lint` | Needs SDK path in `local.properties` (do not commit) |
| Native iOS | `xcodebuild -list`, `xcodebuild build -scheme <s> -destination 'platform=iOS Simulator,name=<device>'` | macOS only; signing can block device builds |
| Flutter | `flutter doctor`, `flutter pub get`, `flutter test`, `flutter run` | |
| Desktop | the package's `dev` script (`tauri dev`, `wails dev`, `electron .`) | Do not build signed installers |
| Python | create a venv, install from lock, `pytest`, then the documented server command | Pin the interpreter version |
| Go / Rust / .NET / JVM | `go test ./...`, `cargo test`, `dotnet test`, `./gradlew test` | Build caches live outside the tree |

## Common blockers

| Symptom | Likely cause | Record |
|---|---|---|
| Install fails on a native module | wrong Node or Python version, missing compiler or system library | version and package names |
| Start fails on missing variable | secret not provided | the variable name, never a value |
| Port already in use | another service on the machine | port and the config key |
| Migrations fail | database version differs, extensions missing, order dependency | engine version and the failing migration |
| Tests pass locally, CI differs | hidden service, timezone, locale, clock, file-system case | the difference |
| Works only on one OS | shell scripts, path separators, Docker-only tooling | the OS requirement |
| Private registry or git dependency | credentials the run lacks | registry host and package name |

## What to write down

A table in the doc: step, exact command, result (works, fails, skipped), time taken, note. Then two lists: **works from the README as written** and **README is wrong or incomplete** (each with the fix that worked). Mark every command you did not run as unverified.

The built-in `run` skill can start the app and drive it once the install works; use it for the "hit the running app" step.

Clean up: leave the scratch copy for the owner to inspect and say where it is; deleting it is their call.
