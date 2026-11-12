# Lens: release

Whether the next release can go out safely and come back safely: gates, versions, config and secrets in the target environment, flags, rollback, migrations order, store builds and the signals that will show a bad deploy.

## Covers

- Gates: tests, typecheck, lint and build pass on the release commit, and the deploy path cannot skip them.
- Versioning and changelog: versions bumped consistently, tags match, user-visible changes recorded.
- Config and secrets per environment: everything the release needs exists in the target environment, validated at startup.
- Feature flags: risky changes behind flags, defaults safe, kill switches for external integrations.
- Rollback: a documented, tested way back for code, config and data.
- Build hygiene: pinned toolchains, frozen installs, no debug switches or bypasses in release builds.
- Observability: errors, logs and health checks ready to show a bad release.
- Store and desktop builds: signing, version codes, platform requirements, privacy declarations, update channels.

Executing the release is `lll:ship`. Checking the live site after go-live is `lll:launch`. Data-safety of pending migrations is the migration lens; this lens checks they are ordered with the deploy.

## Method

1. **Define the release.** The commit or tag, the target environments, what changed since the last release (`git log --oneline <last-tag>..HEAD`), and the deploy mechanism (CI job, platform, store, OTA channel).
2. **Gates.** Run every gate on the release commit. Read the CI workflow: the deploy job `needs` the test jobs; deploys come only from the protected branch or tags; no path deploys with failing checks (`continue-on-error`, `--force`, manual jobs without gates). Branch protection and required checks are owner-observed (`gh api repos/{owner}/{repo}/branches/<branch>/protection`, owner go-ahead).
3. **Versions.** All version sources agree and moved forward: `package.json`, `app.json` or `app.config.*` (`version`, `android.versionCode`, `ios.buildNumber`), `build.gradle` (`versionCode`, `versionName`), `Info.plist` or the Xcode build settings (`CFBundleShortVersionString`, `CFBundleVersion`), `Cargo.toml`, `pyproject.toml`, `*.csproj`, desktop app manifests. Breaking API changes get a major version or a versioned route.
4. **Changelog.** Every user-visible change since the last tag has an entry (CHANGELOG, release notes, store "What's new"). Writing it is `lll:docs`.
5. **Config and secrets.** List what the new code reads (the drift lens's environment table). Each item exists in the target environment by name (owner go-ahead for platform listings, names only). Startup validates required config and fails fast (schema-validated env, settings classes) rather than failing on first use.
6. **Flags.** New risky behaviour is behind a flag, off by default in production, with the flag's owner and removal plan; flags at 100 % for more than a release are cleanup items; external integrations (payments, AI, email, SMS) have a kill switch.
7. **Rollback.** Write down the command or click path for each layer: code (`wrangler rollback`, `vercel rollback`, `kubectl rollout undo`, redeploy the previous tag), config (previous values recorded), data (migrations backward compatible, or a restore point), mobile (halt the staged rollout; OTA rollback or republish the previous update), desktop (updater channel rollback). A release whose migrations make the previous code unusable has no code rollback: say so.
8. **Build hygiene.** Frozen installs in CI; pinned runtimes (`.nvmrc`, `.tool-versions`, `rust-toolchain.toml`, `global.json`, `go` directive); production mode (`NODE_ENV=production`, release build types); no debug flags, test bypass headers, verbose logging of personal data or public source maps unless intended.
9. **Observability.** Error reporting with the release version tagged; a health endpoint that checks dependencies; alerts on error rate and latency; deploy markers. Post-deploy watching is `lll:ship` canary.
10. **Store and desktop specifics** below.

## Store and desktop checks

- **Android:** release signing config (not the debug key; Play App Signing enrolled), `versionCode` increased, `targetSdkVersion` meets the current Play requirement (check the current deadline), R8 mapping uploaded for crash symbolication, permissions declared in the Play Console match the manifest, Data safety form matches what the code collects.
- **iOS:** build number increased, privacy manifest (`PrivacyInfo.xcprivacy`) covers required-reason APIs and SDKs, `ITSAppUsesNonExemptEncryption` set, entitlements match the provisioning profile, usage-description strings present for every permission requested.
- **Expo and EAS:** `eas.json` production profile, channel and `runtimeVersion` policy; native dependency changes bump `runtimeVersion` so OTA updates do not reach incompatible binaries; `npx expo-doctor` clean (read-only).
- **Flutter:** `version: x.y.z+build` bumped; obfuscation symbols kept for crash reports.
- **Desktop:** code signing and notarisation (macOS), Authenticode (Windows), updater feed signed and served over HTTPS, previous version can update to this one.
- **Libraries and CLIs:** package contents (`npm pack --dry-run`, `cargo package --list`, `python -m build` then list the archive) exclude secrets and tests; provenance or signing if the project uses it.

## Commands

| Need | Command |
|---|---|
| Changes since last release | `git describe --tags --abbrev=0`; `git log --oneline <tag>..HEAD` |
| Gates on the release commit | the project's documented gates (`../../../shared/stack-detect.md` step 5) |
| Deploy dry runs | `wrangler deploy --dry-run --outdir <temp dir outside the repo>`; `terraform plan` (read-only, owner go-ahead for remote state); `helm template`; `kubectl diff` (owner go-ahead) |
| Recent CI on the release branch | `gh run list --branch <branch> --limit 10` |
| Package contents | `npm pack --dry-run`; `cargo package --list` |
| Expo | `npx expo-doctor` (project-declared version) |

## Severity calibration

- **critical:** the release build ships a test bypass, debug backdoor or verbose logging of secrets; a migration in the release makes rollback impossible and no backup or forward fix exists; deploy runs without tests.
- **high:** a secret or variable the new code requires is missing in production; no rollback path documented for a high-impact release; the mobile OTA update targets binaries without the native code it needs.
- **medium:** versions not bumped (store upload rejected, wrong release in error reports); breaking API change without versioning while old clients exist; no error reporting tagged with the release; changelog missing for a breaking change.
- **low:** changelog gaps for minor changes; flags at 100 % left in code; health check that does not test dependencies.

## False-positive traps

- Continuous deployment from main with automatic rollback can replace a written rollback doc; check the platform does it.
- Libraries without users yet, or internal tools, may not need store-style ceremony; scale the checks to the release's blast radius.
- Platform requirements (Play target SDK, Xcode versions, privacy manifest rules) change; confirm the current rule before reporting.
