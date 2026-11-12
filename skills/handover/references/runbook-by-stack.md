# Runbook by stack

How to write section 3 (run, build, test, deploy, roll back) and section 9 (routine operations) for each kind of project, and what to confirm before calling it verified. Describe deploy and rollback exactly. Do not run them; the owner or the recipient does.

## What every runbook states

1. Prerequisites with exact versions, and where each is pinned.
2. Commands in the order a stranger would run them, each with where to run it and what success looks like.
3. Configuration: the names from the secrets register, which are required to start, which are optional.
4. First-run data: migrations, seed data, an admin user, how to create one.
5. The deploy path: who or what deploys, from where, what protects production (approval, branch rule), how long it takes, how to see which version is live.
6. The rollback path and its limit (what a rollback cannot undo, for instance a migration).
7. Health: a URL or command that says the system is alive, and what a healthy answer looks like.

Fail fast on bad configuration: if the app validates required variables at start (a schema check that throws), say so; if it does not, add that to known issues, since a silent missing variable is how a deploy goes half-live.

## Run, build, test, deploy by stack

| Stack | Run and test | Build | Deploy and roll back | Check before verified |
|---|---|---|---|---|
| Node web or API | `<pm> install --frozen-lockfile`, dev script, test script | build script; output folder | CI job, platform CLI or container; roll back to previous deployment or image tag | Node version pinned; lockfile committed |
| Next.js or similar on a platform | dev script; preview deploys per branch | platform build; env per environment | promote or revert a deployment in the platform | build env differs from runtime env; client-shipped variable names |
| Cloudflare Worker | `wrangler dev --local`; tests with the project runner | `wrangler deploy --dry-run` | `wrangler deploy`; `wrangler rollback` to a previous version; D1 migrations are forward only unless a down script exists | bindings listed; secrets set per environment; compatibility date |
| Python (Django, FastAPI, Flask) | venv from lock, test runner, dev server | wheels or container image | process manager or container; previous image tag | Python pinned; migrations command; static files step |
| Go | `go test ./...`, `go run ./cmd/<name>` | `go build` (static binary) | copy binary or image; previous tag | Go version in `go.mod`; build flags |
| Rust | `cargo test`, `cargo run` | `cargo build --release` | binary or image | toolchain file; system libraries |
| JVM (Spring, Ktor) | `./gradlew test bootRun` | `./gradlew build` | jar or image; previous version | JDK version; profile names |
| .NET | `dotnet test`, `dotnet run` | `dotnet publish -c Release` | platform deploy slot swap; previous artefact | SDK version in `global.json` |
| PHP (Laravel, Symfony, WordPress) | composer install, artisan or console, test runner | composer install --no-dev; asset build | upload or deploy tool; previous release folder | PHP version; writable paths; cron entry; `.env` provided by host |
| Ruby on Rails | bundle install, db setup, test runner | assets precompile | deploy tool; previous release | Ruby version; credentials key location |
| Expo or React Native | install, `npx expo start`, jest | EAS build profile per store | store submission, staged rollout, OTA update channel; you cannot withdraw an installed binary, only ship a fix or revert the OTA update | signing credentials location; bundle id; runtime version and update channel |
| Native Android | `./gradlew test`, emulator run | `./gradlew bundleRelease` signed | Play track and staged rollout; halt rollout | keystore location (not value); Play App Signing status; version code rules |
| Native iOS | `xcodebuild test`, simulator run | archive with the release scheme | TestFlight then App Store phased release; pause release | team id; certificates and profiles; push keys; build number rule |
| Flutter | `flutter test`, `flutter run` | `flutter build appbundle` or `ipa` | as Android and iOS | flavours; `--dart-define` names |
| Desktop (Electron, Tauri, Wails) | package dev script | installer per OS, signed and notarised | upload artefact and update the auto-update feed; point the feed back at the previous version | certificate expiry; update feed location |
| Static site | install, build | static output | CDN or host deploy; previous deployment | build command and output folder; redirects file |
| Containers and orchestration | compose up locally | image build with pinned base tags | rolling update, blue-green or canary; `rollout undo` or previous tag | non-root user; health check; resource limits; image tags, never `latest` |

## Deploy strategies, in one line each

- **Rolling**: replace instances gradually; two versions run together, so changes must be backward compatible.
- **Blue-green**: two environments, switch traffic atomically; instant rollback, double infrastructure during the switch.
- **Canary**: send a small share of traffic to the new version first; needs traffic splitting and monitoring.
- **Platforms with instant promote or revert** (Workers, Vercel, Netlify): rollback is a click or a command, but data changes are not rolled back by it.

State which one this project uses. If none (manual copy to a server), say that plainly and put it in known issues.

## Database changes and rollback

- Migrations run where and when: at deploy, by hand, by CI. Who runs them and how to see which ran.
- Compatible by design: a new column or table is added before code uses it, and removed only after nothing reads it. Destructive changes (drop, rename, type change) get two steps.
- Rollback of code does not roll back data. State what is reversible and what is not.
- A backup exists immediately before any destructive migration (restore steps in section 7).

## Health checks and monitoring hooks

- Simple health endpoint for uptime checks: returns a small success body and does not call slow dependencies.
- Optional detailed health for internal use: database, cache, queue, key external API; returns an error status when degraded; never exposes secrets or version details publicly.
- For containers: liveness, readiness and start-up probes, with a start-up allowance long enough for migrations.

## Production readiness at handover (tick or list as known issue)

**Application**: tests pass; no secrets in code or config files; errors handled at boundaries; structured logs without personal data; health endpoint meaningful.
**Infrastructure**: reproducible build with pinned versions; required variables documented and validated at start; resource limits set; scaling bounds known; TLS on every endpoint; certificates and domain renewal dates recorded.
**Monitoring**: request rate, latency and errors visible; alert on error rate and on uptime; logs searchable; alert recipients are the new owner.
**Security**: dependency scan run recently (`lll:audit` deps lens); CORS limited to known origins; rate limiting on public endpoints; authentication and authorisation checked (`lll:security`); security headers set.
**Operations**: rollback written and tested once; migrations tested on production-sized data; runbook for the three most likely failures; escalation path with real contacts.

Items not ticked go to section 10 with severity.

## Mobile and desktop specifics for the doc

- Store listing facts: app name, bundle or package id, account, privacy policy URL, data safety or privacy label state, support URL, age rating, current version and build number, review notes and demo account (name only; credentials in the vault).
- Release steps for each store, including the order of tasks and the typical review wait.
- Minimum supported OS and the date that will change (store API level deadlines).
- Where crash reports and analytics go, and the SDK keys' names.
- Desktop: auto-update feed location and signing certificate expiry.

## Verification

Follow the clean-copy rehearsal in the verification reference. A command is verified only after it ran from a clean copy. Commands copied from an old README that nobody ran stay unverified.
