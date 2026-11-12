---
name: onboard
description: "Map an unfamiliar codebase fast: stack, how to run it, architecture, key flows traced end to end, risks, debt hot spots, a code tour and open questions. Use when taking over a client repo, joining a project, or asked to explain this repo, walk through the code, or where to start. Not for estimating work (lll:scope), a bug (lll:debug) or defect audits (lll:audit)."
metadata:
  origin: lll
---

# Onboard

Learn an unfamiliar codebase fast and leave a map the next person can use: what it is, how to run it, how it fits together, what is risky and what is still unknown.
Every claim carries a `path:line` anchor. Where docs and code disagree, the code is the fact.

## When to use

- Taking over a client repo, inheriting a project, joining a team, or opening a repo for the first time.
- "Explain this repo", "walk me through the code", "where do I start", "how does checkout work end to end", "who owns what".
- A new hire or contractor needs a ramp-up doc or a code tour.
- Before `lll:scope` or `lll:audit` on a repo nobody here knows yet.
- "What would changing X touch?" (blast radius, see [blast radius](references/blast-radius.md)).

## When not to use

- Estimating, quoting or proposing work: `lll:scope` (it calls this skill for a quick map first).
- A failing test, crash or wrong behaviour: `lll:debug`.
- Hunting defects, dependency, database or performance problems across the repo: `lll:audit`; security: `lll:security`.
- Closing out a project for the client: `lll:handover`. Updating README or CLAUDE.md after code changes: `lll:docs`.
- Reading a web page, video or someone else's GitHub project: `lll:research`.

## Modes

- **Guidance** (default): answer in chat in about 40 lines. Read only; the facts script and git read commands are fine; no files written, no installs, no builds, no running the app, no subagents. Cover: what it is, stack, the documented run command (marked unverified), architecture in five bullets, one flow traced with anchors, top five risks, five open questions.
- **Full**: only when the user asks for a full, whole-repo, written or end-to-end onboarding. Writes `docs/onboarding/<YYYY-MM-DD>.md` (add `-2` if taken) from [the template](references/onboarding-template.md). May run the app in a throwaway copy ([run it](references/run-it.md)), use subagents on large repos (`../../shared/agents.md`), write a code tour, and use graphify.

Follow `../../shared/ground-rules.md`. Onboarding is read-only against the target repository: the files this skill writes into it are the onboarding doc and, on request, a tour file. The app only ever runs in a copy, never in the shared checkout, and never against production data or live third-party accounts.

## Steps

1. **Frame the ask.** Find out who reads the result (the user, a new hire, a client, `lll:scope`), what decision it feeds and how deep to go: `quick` (10 minutes: what it is, run command, one flow), `standard` (default), `deep` (every module, history, tour). If the user names a module, feature or pain point, onboard that slice: record its paths, entry points and callers, and say what lies outside. Ask only when the answer changes the work.
2. **Read the project's own words.** `../../shared/stack-detect.md` section 1: `CLAUDE.md`, `AGENTS.md`, README, CONTRIBUTING, ADRs, deploy notes. Note what they claim; check it in step 6.
3. **Fingerprint the repo.** Run `node scripts/repo-facts.mjs <repo>` (read-only; add `--json` to feed other tools, `--days 90` for a shorter churn window). It gives size by kind (own code against vendored, generated and lockfiles), languages, areas, manifests, CI, deploy files, version pins, npm scripts, entry-point candidates, data-layer hints, churn hot spots, ownership, stale areas, largest files, TODO density and risky file names. Treat every line as a lead. No Node: use the manual commands in [graphify and history](references/graphify-and-history.md). Then fill the stack-detect record (`../../shared/stack-detect.md` sections 2 to 6).
4. **Look up what you do not know.** For a framework or library you are unsure of at the version in the lockfile, read current docs before guessing: the Context7 MCP tools `resolve-library-id` then `query-docs` if configured (three calls per question at most; strip secrets and client names from the query), else the vendor docs. Say which version you looked up.
5. **Run it (full mode, owner's go-ahead).** [Run it](references/run-it.md): throwaway copy, install from the lockfile, sandbox keys, record exact commands, what works, what breaks, how long each blocker took. Guidance mode reports the documented commands and marks them unverified. Once the copy builds, the built-in `run` skill can launch and drive the app. To see the live product, browse it through `lll:research` instead of guessing the UI from code.
6. **Map the architecture.** [Recon checklist](references/recon-checklist.md): entry points, modules and who depends on whom, request and job paths, data stores and ownership of each table, external services (outbound calls, webhooks, queues, cron, email, payments, auth provider), config and secrets (names only), build and deploy path, environments. Confirm each doc claim against code; log drift. If `graphify-out/graph.json` exists or the owner agrees to build one, use graphify for "what connects to what" questions ([graphify and history](references/graphify-and-history.md)).
7. **Trace two or three key flows end to end.** [Trace a flow](references/trace-a-flow.md). Pick by value, not ease: the money or main user action, sign-in and permissions, one background job or integration. Each hop gets an anchor.
8. **Find risks and debt hot spots.** [Risks and debt](references/risks-and-debt.md): churn against size, single-owner areas, untested risky paths, secrets and data files by name, end-of-life runtimes, fragile deploys, missing backups, docs drift. Rate each by failure scenario (severity as in `../../shared/findings.md`) and give a verdict: fix forward, rewrite, or leave documented. Defects found here are reported, not fixed: hand them to `lll:audit`, `lll:debug` or `lll:security` (`/security-review` for a quick pass on pending changes).
9. **Code tour.** 5 to 18 stops in reading order with anchors ([code tour](references/code-tour.md)): a section of the doc by default, a `.tours/*.tour` file for VS Code CodeTour only if the user wants it.
10. **Open questions.** Everything unverified, ambiguous or undocumented, with who can answer (owner, previous developer, hosting dashboard). A convention you could not detect is "unknown", never a guess.
11. **Write up and check.** Full mode: fill [the template](references/onboarding-template.md), then run `node scripts/check-anchors.mjs docs/onboarding/<date>.md --root <repo>` and fix every bad anchor; for a tour run it on the `.tour` file too. Guidance mode: answer in chat, same anchors.

## Rules for the write-up

- Scannable in two minutes: top sections first, detail in tables. No pasted README, no list of every dependency, no tour of obvious folder names.
- Name only the dependencies that shape how code is written (framework, ORM, auth, payments, queue, UI kit).
- Secrets: variable names and where they live, never values. Personal data: describe the shape.
- Separate three things in every section: observed (anchored), inferred (say why), unknown.
- If the repo has no `CLAUDE.md`, offer a draft of 100 lines or fewer (commands, layout, conventions, gotchas) built from the findings; do not write it unasked. If one exists, propose a diff. The built-in `/init` does the first pass; this skill supplies the evidence.
- The project's locked decisions are the spec. "ADR 7 is not honoured in `path:line`" is a finding; "ADR 7 is wrong" is a question for the owner.

## Output

- **Guidance**: the chat answer described under Modes, with anchors.
- **Full**: `docs/onboarding/<YYYY-MM-DD>.md`; optional `.tours/<persona>-<focus>.tour`; a chat summary of five lines (what it is, how to run it, top three risks, biggest unknown, doc path) plus anything skipped or unverified. If the run step was skipped, say so.
- Optional: a PDF of the doc via `anthropic-skills:pdf`, a shared editable copy via `anthropic-skills:docs`, an architecture picture via the artifact tools (keep the text version in the doc).
- Hand-offs: estimate from the map with `lll:scope`, ask for a deeper defect pass with `lll:audit`, turn the doc into client delivery material with `lll:handover`, keep it current with `lll:docs`.
