# Recon checklist

How to map a repository without reading all of it. Use Glob and Grep first; open a file only when a signal is ambiguous. `node scripts/repo-facts.mjs <repo>` gives the first pass of everything below.

## Reading order (about 30 minutes)

1. `CLAUDE.md` / `AGENTS.md` / README: purpose, commands, rules, forbidden things.
2. Manifests and lockfiles: language, framework and library versions, scripts, engines.
3. CI files: the only commands proven to run on a clean machine.
4. Entry points: where a process starts (server, worker, CLI, app root, job runner).
5. Routing or screen registry: the list of things the product does.
6. Data schema and migrations: the list of things the product remembers.
7. Config and env names: what the product depends on outside itself.
8. One test file next to the code you traced: how the authors think behaviour should be checked.
9. Deploy files: where it runs and how it gets there.

## What to find, by layer

| Layer | Question | Evidence to anchor |
|---|---|---|
| Entry | What starts the process, and with what arguments? | `main`, `server`, `app` file; `scripts.start`; `Procfile`; `CMD` in the Dockerfile |
| Routing | What can a user or system ask this thing to do? | route table, controller folder, screen navigator, CLI command list, queue consumers, cron entries |
| Auth | Who is the caller and what may they do? | middleware, guards, session or token code, row-level security, role checks |
| Business logic | Where do the rules live? | services, use-cases, models; look for the largest and most changed files |
| Data | What is stored, by whom, with what constraints? | migrations, ORM schema, raw SQL, on-device store, cache keys |
| Integrations | What does it call or get called by? | SDK imports, HTTP clients, webhook handlers, queue producers, email and payment code |
| Background work | What runs when nobody is clicking? | cron, queue consumers, workflows, schedulers, startup tasks |
| Config | What changes between environments? | env names, feature flags, build variants, `wrangler`/compose/k8s files |
| Observability | How would anyone know it broke? | logger setup, error tracker init, health endpoint, metrics, alerts |
| Build and deploy | How does a commit become a running thing? | CI workflow, Dockerfile, deploy scripts, store release config |
| Tests | What is protected? | test folders by area, CI test command, coverage config, skipped tests |

## Signals by stack

| Stack | Entry and routing | Data | Config | Tests | Run |
|---|---|---|---|---|---|
| Next.js / React web | `app/` or `pages/`, `middleware.ts`, route handlers | Prisma, Drizzle, Supabase client | `.env*`, `next.config.*` | `*.test.ts(x)`, Playwright | `pnpm dev` (read scripts) |
| Express / Fastify / Nest / Hono | `server.ts`, `app.ts`, `main.ts`, module folders | ORM or query builder, `migrations/` | `process.env`, config module | `*.spec.ts`, supertest | `npm run dev` |
| Cloudflare Worker | `src/index.ts` `fetch`/`scheduled`/`queue` handlers, `wrangler.*` | D1, KV, R2, DO bindings, `migrations/` | `[vars]`, secrets, bindings | vitest pool workers | `wrangler dev --local` |
| Expo / React Native | `app/` (expo-router) or `App.tsx`, `app.json` | `expo-sqlite`, MMKV, AsyncStorage, remote API | `app.config.*`, `EXPO_PUBLIC_*`, EAS profiles | jest, Maestro, Detox | `npx expo start` |
| Python Django | `manage.py`, `urls.py`, `settings.py`, `wsgi.py` | `models.py`, `migrations/` | settings module, env | `tests/`, `pytest.ini` | `python manage.py runserver` |
| Python FastAPI / Flask | `main.py`, `app/__init__.py`, routers | SQLAlchemy, Alembic | pydantic settings | `tests/`, `conftest.py` | `uvicorn main:app --reload` |
| Go | `cmd/*/main.go`, `internal/`, router setup | `sqlc`, GORM, `migrations/` | env, flags, viper | `*_test.go` | `go run ./cmd/<name>` |
| Rust | `src/main.rs`, `src/lib.rs`, workspace members | sqlx, diesel, `migrations/` | env, `config` crate | `#[cfg(test)]`, `tests/` | `cargo run -p <crate>` |
| JVM Spring | `*Application.java` or `.kt`, `@RestController`, `application.yml` | JPA entities, Flyway/Liquibase | `application-*.yml`, env | `src/test` | `./gradlew bootRun` |
| Android (Kotlin) | `AndroidManifest.xml`, `MainActivity`, nav graph or Compose `NavHost` | Room, DataStore, Retrofit | `build.gradle*` flavors, `local.properties` | `src/test`, `src/androidTest` | `./gradlew assembleDebug` |
| iOS / macOS (Swift) | `@main` App struct, scene, coordinators | Core Data, SwiftData, GRDB | `*.xcconfig`, `Info.plist`, schemes | `*Tests` targets | open workspace, run scheme |
| PHP Laravel / Symfony / WordPress | `routes/*.php`, `public/index.php`, `functions.php`, `wp-content/` | Eloquent, Doctrine, `wp_options` | `.env`, `config/`, `wp-config.php` | PHPUnit, Pest | `php artisan serve` |
| Ruby on Rails | `config/routes.rb`, `app/controllers` | `db/schema.rb`, `db/migrate` | `config/`, credentials | RSpec, minitest | `bin/rails server` |
| .NET | `Program.cs`, `Startup.cs`, controllers, MAUI `MauiProgram.cs` | EF Core migrations | `appsettings*.json`, user-secrets | xUnit, NUnit | `dotnet run` |
| Flutter / Dart | `lib/main.dart`, router, `pubspec.yaml` | sqflite, drift, Hive | `--dart-define`, flavors | `test/`, `integration_test/` | `flutter run` |
| Electron / Tauri / Wails | main process file, `tauri.conf.json`, `wails.json` | local DB file, app data dir | build config, updater feed | unit and e2e | package script |

## By platform: what else to look for

- **Web**: rendering mode (static, server, client), caching and CDN rules, session or token storage, third-party scripts, SEO files (`robots.txt`, sitemap), cookie and consent handling.
- **Mobile**: bundle id, signing config and where keys live, store accounts, minimum OS, push provider, deep links, offline storage and sync, crash reporting, release channels (EAS, Fastlane, Play tracks).
- **Desktop**: auto-update feed and signing certificates, native modules, per-OS code paths, where user data lives on disk.
- **Backend and workers**: idempotency of handlers, retry and dead-letter behaviour, scheduled jobs and their overlap, migrations run at deploy or by hand, rate limits, tenant isolation.
- **Monorepo**: list packages and their owners; draw who imports whom; find the shared package that everything depends on (the riskiest place to change).

## Conventions to record

Detect from the code, not from style guides: file naming, error handling style (exceptions, result types, error codes), async pattern, dependency injection or direct imports, state management, test naming, lint and format config. Git conventions from `git log --format=%s -n 50` and `git branch -a` (commit prefix style, branch names, squash or merge). If the history is shallow or empty, write "git history too shallow to judge".

## Do not do

- Do not read every file. Hotspots and entry points first.
- Do not trust a framework guess from a config file if the code uses something else.
- Do not describe obvious folders (`src/`, `lib/`).
- Do not copy the README into the doc.
- Do not report an unknown as a fact: write "not determined" and say what would settle it.
