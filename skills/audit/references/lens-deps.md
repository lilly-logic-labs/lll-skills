# Lens: deps

Third-party code the project ships or builds with: known vulnerabilities, licences, packages nobody maintains, references that can change under you, and lockfiles that no longer match their manifests.

## Covers

- Known vulnerabilities in production and build-time dependencies, with reachability.
- Licences incompatible with how the project is distributed.
- Abandoned, deprecated or archived packages on important paths.
- Unpinned or mutable references: ranges in applications, `latest`, git branches, Docker tags without digests, GitHub Actions on branches or tags, `curl | sh`.
- Lockfile drift: missing lockfile, two package managers' lockfiles, lockfile out of date with the manifest.
- Runtime and base-image end of life (Node, Python, Java, .NET, Go, Ruby, PHP, distro images).
- Install-time code: lifecycle scripts in dependencies.

MCP server package pins are the agent-config lens. Whether a vulnerable function is exploitable through a real trust boundary is `lll:security`.

## Method

1. **List manifests and lockfiles** per package (monorepos: every workspace). One lockfile per package manager; a manifest without a lockfile in an application is a finding.
2. **Run the ecosystem audit** commands below for production dependencies, then for build and dev dependencies that run in CI or release jobs.
3. **Triage each advisory.** Is the version affected? Is the package used at runtime, at build time, or only in tests? Is the vulnerable function reachable from the project's code (Go's `govulncheck` reports this directly; elsewhere, grep for the imported module and the affected API)? Is a fixed version available within the current major?
4. **Pins and drift.** Check each mutable reference and run the lockfile consistency check for each manager.
5. **Health.** For direct dependencies on critical paths (auth, payments, crypto, parsing, database drivers): deprecated flag, archived repository, last release date, open security issues.
6. **Licences.** List licences of production dependencies; flag copyleft (GPL, AGPL, LGPL for static linking) in software that is distributed or offered over a network, and packages with no licence.
7. **Runtimes.** Compare `.nvmrc`, `.node-version`, `engines`, `.python-version`, `requires-python`, the `go` directive, `rust-toolchain.toml`, `global.json`, `.ruby-version`, Dockerfile `FROM` lines and CI matrices with end-of-life dates from endoflife.date.

## Commands

All read-only unless noted. Audits contact the registry or advisory database (a network read the lens allows). Never run `audit fix`, `update` or `install` during the read-only phase.

| Ecosystem | Vulnerabilities | Outdated and health | Lockfile consistency |
|---|---|---|---|
| npm | `npm audit --omit=dev` | `npm outdated`; `npm view <pkg> deprecated` | `npm ci --dry-run` (in the fix worktree) |
| pnpm | `pnpm audit --prod` | `pnpm outdated`; `pnpm why <pkg>` | `pnpm install --frozen-lockfile` (fix worktree) |
| Yarn 1 / Yarn 2+ | `yarn audit --groups dependencies` / `yarn npm audit --environment production --recursive` | `yarn outdated` / `yarn upgrade-interactive` (read the list, do not apply) | `yarn install --frozen-lockfile` / `yarn install --immutable` (fix worktree) |
| Bun | `bun audit` (recent Bun) | `bun outdated` | `bun install --frozen-lockfile` (fix worktree) |
| Python | `pip-audit -r requirements.txt`; for uv or Poetry, export a requirements file to a temp folder outside the repo first | `pip list --outdated` in the project env | `uv lock --check`; `poetry check --lock` |
| Go | `govulncheck ./...` | `go list -m -u all` | `go mod verify`; `go mod tidy -diff` (Go 1.23 and later) |
| Rust | `cargo audit`; `cargo deny check advisories` | `cargo outdated` if installed; `cargo tree -d` for duplicates | `cargo metadata --locked --format-version 1` |
| Ruby | `bundle-audit check --update` | `bundle outdated` | `bundle install --frozen` (fix worktree) |
| PHP | `composer audit` | `composer outdated --direct` | `composer validate` (reports a stale lock) |
| .NET | `dotnet list package --vulnerable --include-transitive` | `dotnet list package --outdated`; `--deprecated` | `dotnet restore --locked-mode` (fix worktree) |
| JVM | OWASP dependency-check or the build's own scanner, if configured | `./gradlew dependencyUpdates` (versions plugin) or `mvn versions:display-dependency-updates` | Gradle dependency locking or verification metadata, if used |
| Dart and Flutter | `osv-scanner` on `pubspec.lock` | `dart pub outdated` | `dart pub get --enforce-lockfile` (fix worktree) |
| Swift | Dependabot or `osv-scanner` where supported | `Package.resolved` pins versus `Package.swift` ranges | `swift package resolve` must not change `Package.resolved` |
| Any | `osv-scanner scan source -r .` from a pinned binary, offline database mode where available | | |

Containers: a pinned `trivy image <image>` or `docker scout cves <image>` for the built image; `FROM` lines pinned by digest for reproducible builds.

GitHub alerts, owner go-ahead: `gh api repos/{owner}/{repo}/dependabot/alerts --jq '.[] | select(.state=="open") | [.security_advisory.severity, .dependency.package.name] | @tsv'`.

Licences: `pnpm licenses list --prod`, `cargo deny check licenses`, `go-licenses report ./...`, a pinned `pip-licenses`, `license_finder`, or osv-scanner's licence summary.

Install-time code: `npm query ':attr(scripts, [postinstall])'` lists dependencies with `postinstall` scripts; pnpm 10 and later blocks dependency build scripts unless allowed in `onlyBuiltDependencies`.

## Pins and mutable references

- Applications pin exact versions through a committed lockfile; ranges in the manifest are fine when the lockfile is committed and installs are frozen in CI.
- Findings: `"*"` or `"latest"`; git dependencies on a branch instead of a commit; Docker `FROM` with `:latest` or no tag; `uses: owner/action@v3` or `@main` for third-party actions (pin to a full commit SHA with the version in a comment); `curl ... | sh` or `wget ... | bash` in scripts, Dockerfiles or CI; `npx <pkg>` without a version in scripts the project runs.
- Two lockfiles for different managers in one package (for example `package-lock.json` and `yarn.lock`) means installs differ between machines.

## Fix rules

- Patch and minor security updates are allowed in the fix phase, one package per commit, with gates green (`../../../shared/fix-phase.md`).
- Major upgrades, upgrades that rewrite large parts of a lockfile, and replacements of abandoned packages go to "Needs decision" with the advisory, the fixed version and the expected breaking changes.
- A vulnerable transitive dependency with no fixed parent release: use the manager's override mechanism (`overrides`, `pnpm.overrides`, `resolutions`, `constraints`, `[patch]`) only when the owner agrees; otherwise "Needs decision".

## Severity calibration

- **critical:** a known-exploited or remote-code-execution advisory in a production dependency whose vulnerable path is reachable from an entry point; a dependency or base image pulled by a mutable reference into a release job that holds signing or deploy credentials.
- **high:** a high-severity advisory in a reachable production dependency with a fixed version available; a runtime already past end of life in production; no lockfile for a deployed application.
- **medium:** a vulnerable dependency whose affected function is not reachable or needs an unusual configuration; a licence conflict for distributed software; an abandoned package on a critical path with open security issues.
- **low:** dev-only advisories that never run in CI with secrets; outdated majors with no advisory; duplicate versions of a small package.

## False-positive traps

- "Outdated" alone is not a finding. It becomes one with an advisory, an end-of-life date, or a blocked required upgrade.
- Advisories for server-side code in a package that is only bundled for the browser, or build tools that never see untrusted input, are usually low.
- The same advisory listed under several ids (GHSA, CVE, OSV) is one finding.
- Dev dependencies are not automatically harmless: anything that runs in CI with secrets or in the release build is in scope.
- `npm audit` severities are the advisory's, not the project's. Re-rate by reachability and exposure.
- A major version behind on a stable library with no advisories is a planning note, not a defect.
