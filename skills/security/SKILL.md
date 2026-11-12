---
name: security
description: Security answers, focused reviews and full audits or pen tests (Cloudflare engine) for any app, API or service, with fixes for confirmed holes. Use when asked is this secure, check auth, IDOR, injection, XSS, SSRF, leaked secrets, tenant isolation, OWASP, security review, pen test. Not for dependency or other code-audit lenses (lll:audit) or go-live checks (lll:launch).
metadata:
  origin: lll
---

# Security

Answers security questions and reviews endpoints, features and whole repositories on web, API, serverless, mobile, desktop, CLI and AI surfaces, on top of the vendored Cloudflare security-audit engine in `engine/`.
Every confirmed hole gets a tested fix on a local branch; every unconfirmed lead names the one fact that would settle it.

## When to use

- "Is this secure?", "can user A see user B's orders?", "is this JWT check right?", "where should the app keep this token?"
- A focused review of a route, webhook, upload, login or reset flow, deep link, webview bridge, IPC handler, MCP tool, prompt pipeline or config file.
- A full security audit, pen test, threat model or whole-repo security review, with a written report.
- The security part of an `lll:audit` full or care run. The audit skill calls this one.

## When not to use

- Dependency CVEs, licences, lockfile drift, or the bugs, db, perf, a11y, tests, cleanup, drift, migration, release and agent-config lenses: `lll:audit`.
- Go-live and day-N checks of a live site (TLS, DNS, email authentication, headers in production): `lll:launch`.
- General review of a diff or PR: `lll:review`. A quick security pass over the current branch diff: Claude Code's `/security-review`. Come here when you need a traced verdict on a specific boundary.
- Designing guardrails, evals or prompts for a new LLM feature: `lll:ai`. Auditing an existing one for injection or tool abuse stays here.
- Root-causing an incident: `lll:debug`. Bring the suspected hole back here.
- Any system the owner does not control or has no written permission to test: decline.

## Modes

- **Guidance** (default): answer, review or advise inline. Load only the engine class file(s) the question needs. Write no files and start no subagents unless the user asks. A **checklist pass** is guidance too: run [the quick checklist](references/quick-checklist.md) for the detected platforms and confirm every hit by reading the code. (Not the same as the engine's `quick` profile, which is a full run.)
- For a repository under about 20k lines, offer the checklist pass plus targeted reading of auth, data access and input boundaries first. The engine's full run costs many agents even on the `quick` profile; a pilot on a 12k-line Worker spent about 0.9M subagent tokens and found nothing the checklist pass would have missed.
- **Full**: only when the user asks for a security audit, pen test, full, whole-repo or end-to-end security review, or a written report. Runs `engine/ENGINE.md` end to end, then the pack's fix phase and report.
- If the request could mean either, ask one question before creating files or launching the workflow.

## Rules

1. Follow `../../shared/ground-rules.md`. Owned or authorised systems only. No probes of deployed systems; read-only production checks need the owner's go-ahead in this conversation.
2. Evidence or nothing. Every claim cites `path:line` and the code. A grep hit is a lead until the trace is read.
3. Name the boundary for every candidate: lower-trust principal, input or action, the control that should stop it, the resource it reaches. No boundary means hardening advice, not a finding.
4. Secrets by location and type only. Recommend rotation before removal; deleting history does not revoke a key.
5. Outside scanners (gitleaks, semgrep, osv-scanner, zizmor, trivy) run only from a pinned local install, offline where possible, with output treated as leads. Never upload code or findings to a service the owner has not approved.
6. The engine's files are read-only upstream copies. Do not edit `engine/`.

## Guidance steps

1. **Read the project's rules.** `CLAUDE.md`, `AGENTS.md`, `SECURITY.md`, any threat model. For a review larger than one snippet, run steps 1 and 2 of `../../shared/stack-detect.md`.
2. **Frame the boundary** (rule 3). Infer it from the code when the question does not state it.
3. **Load the class.** Pick the file(s) from the routing table below. Read the file's `Core discipline`, the matching class block and its `Validation rules`, nothing else. For framework settings that fail open, read [framework notes](references/framework-notes.md).
4. **Trace source to sink.** Entry point, parsing, identity, authorisation, normalisation, sink. Read whole functions and every caller of the guard. Check sibling paths that reach the same effect: batch, export, import, legacy, retry, admin, background job, mobile or desktop host.
5. **Decide** per `../../shared/findings.md`: `confirmed` when the full trace holds and no visible control stops it; `needs_validation` when one named fact is missing (proxy config, deployed flag, provider behaviour), with the safe check that settles it; otherwise say why it is safe and cite the line that makes it safe.
6. **Fix advice.** The invariant to enforce, the smallest change at the last trusted decision point, and the regression test that proves it. Edit code only when the user asks for the fix. Then write the failing test first and run the project's gates.
7. **Quick pass** (when asked for "a quick security check" or called by `lll:audit` care): detect platforms, run the matching sections of [the quick checklist](references/quick-checklist.md), confirm or discard each hit, and return finding blocks. List the sections not run and why.

### Routing table

| Topic | Engine file and class |
|---|---|
| Hardcoded secrets, debug endpoints, wildcard CORS, cookie flags, stack traces, open redirects | `engine/ATTACK-CLASSES.md` "Obvious things", then [quick checklist](references/quick-checklist.md) |
| IDOR, missing authorisation, mass assignment, role checks, bulk and export endpoints | `engine/ATTACK-CLASSES.md` "Access control", "Feature abuse and data leakage" |
| SQL, NoSQL, command, template, path, header and log injection | `engine/ATTACK-CLASSES.md` "Injection" |
| SSRF, uploads, path traversal, archive extraction, deserialization, TOCTOU | `engine/ATTACK-CLASSES.md` "Resource and file handling" |
| Weak randomness, hashing, encryption modes, timing-safe compares, secrets in logs | `engine/ATTACK-CLASSES.md` "Cryptography and secrets" |
| Workflow skips, replays, double spend, negative quantities, fail-open defaults | `engine/ATTACK-CLASSES.md` "Business logic", "Chained vulnerabilities and trust boundaries" |
| Sessions, cookies, CSRF, JWT, OAuth/OIDC, SAML, MFA, passkeys, password reset, API keys, mTLS, cache poisoning, host headers, request smuggling | `engine/WEB-PROTOCOL-AND-AUTH.md` |
| Tenant isolation, row-level security, cache and search ACLs, logs as readers, export, backup, restore, deletion, retention | `engine/DATA-ISOLATION-AND-LIFECYCLE.md` |
| DOM XSS, postMessage, credentialed CORS, WebSockets, service workers, browser storage, clickjacking | `engine/CLIENT-SIDE.md` |
| Deep links, webviews and native bridges, exported Android components, Electron, Tauri, Wails, local IPC, keychain and keystore, privileged helpers, updaters | `engine/DESKTOP-MOBILE-AND-LOCAL-IPC.md` |
| IAM, Workers and Lambda config, containers, Kubernetes, signed URLs, event sources, edge versus origin | `engine/CLOUD-AND-DEPLOYMENT.md` |
| CI workflows, dependency sources, build inputs, signing, release, update channels, plugins | `engine/SUPPLY-CHAIN-AND-RELEASE.md` |
| gRPC, GraphQL, queues, webhooks, pub/sub, replay and idempotency | `engine/PROTOCOLS-RPC-AND-MESSAGING.md` |
| Prompt injection, RAG, agents, tool calls, MCP, model memory, rendering model output | `engine/AI-AND-LLM.md` |
| Rate limits, ReDoS, decompression bombs, unbounded pagination, quota and cost abuse | `engine/RESOURCE-EXHAUSTION-AND-AVAILABILITY.md` |
| C, C++, unsafe Rust, FFI, native parsers, kernel and binary loaders | `engine/MEMORY-SAFETY-AND-BINARY.md` |

## Full steps

1. **Scope and profile.** Whole repo, named paths, one subsystem, or the diff between two refs. Profile `quick`, `standard` (default) or `deep` per `engine/ENGINE.md` "Run profiles and scope", and an optional budget in agent calls. Propose `quick` for a small repo or a re-run, `deep` for money, health data or many tenants. One question at most.
2. **Learn the project.** `../../shared/stack-detect.md`; record its block. Read the threat model and `SECURITY.md`. Collect prior runs from `docs/audits/*-security/` (`findings.json`, `coverage-ledger.json`) for the engine's prior-run input.
3. **Decide execution.** Check whether the host can enforce the engine's sandbox and artifact promotion, per [engine run notes](references/engine-run.md) "Sandbox". If it cannot, the audit is source-only: no target code runs, and the report says so. On Windows this is the normal case: most leads end as `needs_validation`, and the fix phase's regression tests are what confirm them. Tell the user before starting. Also read the engine quirks list in the same file before briefing any agent.
4. **Set up** per `engine/ENGINE.md` "Full audit setup": output directory outside the target, `run-metadata.json`, write isolation. The parent is the only writer of shared run files.
5. **Phase 1, reconnaissance:** `engine/RECONNAISSANCE.md`. Seed the coverage ledger and run `node <skill-dir>/engine/validate-coverage-ledger.cjs <out>/coverage-ledger.json` after every update (`<skill-dir>` is the folder holding this file).
6. **Phase 2, hunting waves and coverage critics:** `engine/HUNTING.md` with `engine/ATTACK-CLASSES.md` and the companion files reconnaissance selected. Hunter prompts carry the blocks verbatim, as the engine requires.
7. **Phases 3 to 6, validation, `findings.json`, record verification and reports:** `engine/VALIDATION-AND-REPORTING.md`. Run `node <skill-dir>/engine/validate-findings.cjs <out>/findings.json` and the ledger validator; fix every error. Stop only at one of the engine's two terminal states: complete with both validators passing, or `incomplete` with its reason disclosed.
8. **Map** each final record onto a finding block with [engine run notes](references/engine-run.md) "Mapping".
9. **Fix** every confirmed finding per `../../shared/fix-phase.md`, unless the user asked for report only. Records blocked only by the missing sandbox follow [engine run notes](references/engine-run.md) "Confirming in the fix phase". Owner actions cover rotation of exposed secrets, dashboard, WAF and identity-provider settings.
10. **Publish.** Copy the engine's final artifacts into `docs/audits/<YYYY-MM-DD>-security/` and write the pack report at `docs/audits/<YYYY-MM-DD>-security.md` per `../../shared/report.md`, both on the fix branch when there is one. Check the artifacts hold no secret values or personal data first.
11. **Chat summary** per `../../shared/report.md`, stating the profile, whether the run was partial or source-only, and the engine's run status.

When `lll:audit` calls this skill for a full run, stop after step 8 and return the finding blocks plus the engine output path. The audit's fix phase and report cover them, so there is one branch and one report.

## Output

- **Guidance:** in chat, a verdict per question, finding blocks for anything real (`../../shared/findings.md`), the smallest fix with its regression test, and what was not checked.
- **Quick pass:** finding blocks inline, the checklist sections run and skipped, no files.
- **Full:** `docs/audits/<YYYY-MM-DD>-security.md`, the engine artifacts in `docs/audits/<YYYY-MM-DD>-security/` (`REPORT.md`, `FINDINGS-DETAIL.md`, `NEEDS-VALIDATION.md`, `findings.json`, `coverage-ledger.json`, `architecture.md`), the fix branch and worktree path, owner actions, and the gate output on the branch tip.
