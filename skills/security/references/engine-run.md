# Engine run notes

How this skill drives the vendored engine in full mode and turns its output into the pack's findings, fixes and report. The engine's own rules (`../engine/ENGINE.md` and its phase files) always win over these notes; nothing here relaxes them.

## Sandbox

The engine runs target code (builds, tests, harnesses, fixtures) only inside an OS-enforced sandbox with no external network, an empty allowlisted environment, a read-only target and toolchain, scratch-only writes and explicit CPU, memory, process, file-size, disk and time limits. Local evidence must also pass the artifact-promotion procedure in `../engine/ENGINE.md` "Write isolation".

Check before Phase 1 and record the answer in `run-metadata.json`:

| Host | Usually available | Check |
|---|---|---|
| Linux | bubblewrap, firejail, or a container runtime | `bwrap --version`, `docker info --format '{{.SecurityOptions}}'` |
| macOS | a container runtime (Docker Desktop, Colima, OrbStack) | `docker info` |
| Windows | Docker Desktop or WSL 2 with bubblewrap | `docker info`, `wsl -l -v` |
| Cloud or CI runner | container runtime, often without nested isolation | ask the owner which runner and what it isolates |

A container can meet the controls when it runs with `--network none`, `--read-only`, the source copy mounted read-only, one writable scratch mount, `--memory`, `--cpus`, `--pids-limit`, a `--ulimit fsize` value and a wall-clock timeout, and an `--env-file` holding only allowlisted dummy values. The parent still needs trusted promotion code for anything it keeps as evidence; on hosts without no-follow, directory-relative file APIs, promotion is unavailable.

**Windows hosts.** The vendored validators (`validate-findings.cjs`, `validate-coverage-ledger.cjs`) refuse to run on Windows ("OS no-follow and nonblocking input protection is unavailable"). Run them in a Linux container with no network, the run directory mounted read-only:

```
docker run --rm --network none -v "<skill-dir>/engine:/engine:ro" -v "<out>:/out:ro" node:24-bookworm-slim node /engine/validate-findings.cjs /out/findings.json
docker run --rm --network none -v "<skill-dir>/engine:/engine:ro" -v "<out>:/out:ro" node:24-bookworm-slim node /engine/validate-coverage-ledger.cjs /out/coverage-ledger.json
```

Pin the image by digest for repeat runs. Without Docker or WSL, the validators cannot run; the report says so and the run status is `incomplete`.

**Engine quirks seen in practice** (vendored files stay unmodified; handle them here):
- Hunter and critic prompts must carry long verbatim blocks (about 35k characters). Write each prompt to a file in the run directory and tell the subagent to read it, instead of pasting it into the call.
- Ledger starting paths must be repository-relative files, not directories. Expand a user scope like `routes/` into its files, and strip trailing slashes.
- Fingerprints: give every hunter one scheme, `<sink-file>:<function>:<class-slug>` (for example `routes/login.ts:login:sqli-email`), so duplicates across hunters merge by exact match.
- On a source-only run, batch verification per ledger unit (one verifier per unit, not per candidate) and use the mid tier for it. A Juice Shop test spent about 3.4M tokens on 47 per-candidate strongest-tier verifiers, more than all hunters combined.
- `quick` defers every gap the critic finds. Say so to the user before starting and, after the run, list the deferred classes and offer one targeted follow-up wave for them. In the Juice Shop test the deferred classes (XSS, CAPTCHA, client-trust) held about a quarter of the real vulnerabilities.
- Select the client-side companion (`../engine/CLIENT-SIDE.md`) whenever the target renders HTML, templates or user content, even for a server-side scope. Server-side output sinks (reflected XSS, JSONP, header injection) are otherwise missed.
- Reconnaissance line numbers can be wrong. Hunters re-read every cited `path:line` before relying on it.
- A hunter "hardening" note that names a trust boundary and a race or ordering problem goes to a verifier like a candidate, not straight into the hardening list.

If any control or promotion is unavailable:

- Run no target code during the audit. Static source review continues at full depth.
- Candidates that need an observed result stay `needs_validation`, with the blocker written exactly, for example `no OS-enforced sandbox on the audit host` or `artifact promotion unavailable on Windows host`.
- The report's first section states that the run was source-only.
- Do not improvise a weaker sandbox.

## Profile and budget

- `quick`: one hunter wave, one critic, one verifier per candidate. Good for small repos, re-runs and a first look. Always reported as partial coverage.
- `standard`: the default.
- `deep`: lifecycle-split units, critic waves to a clean pass, separate validation and record verification. For money, health data, many tenants or a pre-funding or pre-enterprise review.
- A budget is a cap on agent invocations. Apply the engine's pre-reconnaissance budget gate; if the budget cannot fund reconnaissance plus the critic and verifier reserves, launch nothing and ask for more budget, a narrower scope or a lighter profile.
- Model tiers follow `../../../shared/agents.md`: reconnaissance may use the mid tier; hunters, critics and verifiers use the strongest tier.

## Output location

- The engine's run directory stays outside the target: the default is `~/security-audit-skill/<repo-name>/run-<N>`. Never use a folder inside the repository as the run directory, even an ignored one; only the copied files below enter the repository. Its `agents/` scratch folders hold target-controlled output and never enter the repository.
- After both validators pass and the run reaches a terminal state, copy only these parent-written files into `docs/audits/<YYYY-MM-DD>-security/`: `REPORT.md`, `FINDINGS-DETAIL.md`, `NEEDS-VALIDATION.md`, `findings.json`, `coverage-ledger.json`, `architecture.md`, `run-metadata.json`. Never copy `agents/`.
- Before copying, search the files for secret values and personal data (`../../../shared/ground-rules.md` "Secrets and personal data"). Replace any value with its location and type.
- On a re-run, point the engine at the previous `docs/audits/*-security/` folders as prior-run input.

## Mapping

Each final engine record becomes one block in `../../../shared/findings.md` format.

| Finding block field | Taken from the engine record |
|---|---|
| Title | `title` |
| Id | `security-` plus `fingerprint`, lowercased, every character outside `a-z 0-9 -` replaced by `-` |
| Lens | `security`, plus the attack-class block from the linked ledger unit, for example `security (Access control)` |
| Location | the last `trace` entry (`sink`) as `file:line`; `also:` the `entrypoint` and each other `evidence` location |
| Evidence | the code at the sink line, re-read from the current source, plus the first `evidence` description |
| Failure scenario | confirmed: `execution.attacker_perspective` and `execution.observed_result`; needs_validation: `claimed_root_cause` and what follows if the blocker resolves the bad way |
| Fix | `remediation.strategy`; `code_changes` are a hint, not a patch to paste |
| Confidence | `confidence.score` |
| Verdict | `verdict` |

Severity:

- `needs_validation` and `rejected` records carry no severity, in the engine and in the pack.
- A confirmed record takes the engine's `severity.overall_severity`. When `../../../shared/findings.md` ranks the same outcome higher (cross-tenant read or write, authentication bypass, exposed secret, remote code execution are critical there), use the pack's rank and keep the engine's in brackets: `critical (engine: high)`. This keeps security findings sorted correctly against other lenses in a merged `lll:audit` report.
- `informational` records are not finding blocks. List them with the engine's hardening notes, which stay in the copied `REPORT.md`; the pack report links to it from its Coverage section.

Rejected records go to the report's Rejected section, one line each with the engine's `reason`.

A `quick`, scoped, budget-limited, source-only or `incomplete` run says so in the report's Summary "Result" line and lists every unvalidated fingerprint under Coverage "Not covered".

## Confirming in the fix phase

The engine marks a record `confirmed` only with a bounded local observation. On a source-only run, sound leads therefore arrive as `needs_validation`. The fix phase may settle them, because it already runs the project's own gates in a worktree on code the owner controls.

A `needs_validation` record qualifies only when all of these hold:

1. Every entry in `blockers` is about local observation (no sandbox, no promotion). None is a deployment, provider, proxy or identity fact.
2. `validation_plan.local` describes a test or harness in the project's own test framework, with dummy principals and data.
3. The test needs no network, real credential, production data or deployed service.

For each qualifying record, a fixer that did not hunt or verify it:

1. Writes `validation_plan.local` as a failing regression test in the fix worktree and runs it with the project's test command.
2. If it fails for the predicted reason, marks the pack verdict `confirmed` with Evidence `regression test <path> fails at base <sha>: <decisive line>`, assigns severity from what the test demonstrates, and fixes it per `../../../shared/fix-phase.md`.
3. If it passes, leaves the record `needs_validation` and adds the test result to its line in "Needs validation". The test is not committed.

The engine's `findings.json` is never edited after the run; the pack report records the fix-phase confirmation.

Records whose blockers are deployment facts go to "Needs validation" with the engine's `validation_plan.deployment` as the owner's check, and to "Owner actions" when the owner must change a setting.

## Report additions

In the pack report written per `../../../shared/report.md`:

- Summary "Result": profile, scope, run status, and `source-only` when it applies.
- Findings: the mapped blocks, ranked by severity then confidence.
- Coverage: ledger counts (covered, candidate, blocked, deferred, out of scope), the final critic result, the path to the copied engine artifacts, and the hardening notes link.
