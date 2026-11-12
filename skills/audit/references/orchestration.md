# Full run orchestration

How a `full` run covers every tracked file with every lens plus `lll:security`, without gaps, duplicates or unverified claims. The hunt is read-only; one fix phase at the end.

```
0 Ground truth     stack, gates, known gaps, locked decisions, earlier reports
1 Inventory        mechanical candidate lists (small tier)
2 Coverage map     areas.json; every tracked file has exactly one owner
3 Threat model     actors, entry points, what stops each one; 4 to 8 traces
4 Hunt             area agents x per-file lenses | repo-wide lens agents | lll:security full
5 Merge            dedupe, re-brief unread files, cross-area hunts
6 Verify           strongest tier, a different agent, finding blocks only
7 Rerun diff       new, persisting, gone against the last full report
8 Fix              one fix phase for everything confirmed
9 Report           findings, coverage, threat model, traces
```

A small repository (one agent can read every file) skips areas: one hunt agent per lens group, then steps 5 to 9 as written.

## 0. Ground truth

- Run `../../../shared/stack-detect.md` and keep the block; every brief carries it.
- Run each gate once; a red gate is the first finding.
- **Known gaps:** what the repository already admits. Search the docs for "known issue", "limitation", "not yet", "workaround", "TODO"; read open issues (`gh issue list --state open --limit 100`) and open security alerts when the owner allows. Known gaps go into briefs so agents confirm or close them instead of rediscovering them.
- **Locked decisions:** ADRs and rule files. Paste the relevant ones into briefs; they are the spec (`../../../shared/ground-rules.md` "Authority").
- **Earlier reports** in `docs/audits/`: open findings become leads marked "previously reported"; rejected ones are listed in briefs so they are not reported again.

Keep every working file (areas, inventories, notes, drafts) in a scratch folder outside the repository. The hunt writes nothing into the tree.

## 1. Inventory

Cheap lists the small tier or the parent builds before the hunt. They are candidates, not findings, and they make briefs precise.

- Entry points: HTTP routes, RPC handlers, webhooks, queue consumers, scheduled jobs, CLI commands, deep links, IPC handlers (the route-inventory greps in `lll:security`'s quick checklist).
- Data: tables or collections, migrations, ORM models, on-device stores, caches.
- Outbound calls: HTTP clients, SDKs, email, payment, AI providers.
- Screens and components (UI projects), with the routes or calls behind each.
- Environment variables and secret names (the drift lens command), feature flags.
- Detector output from the lens files that can run read-only (vulnerability scanners, dead-code tools, linters already in the project).
- The deferral ledger (cleanup lens).

## 2. Coverage map

Split tracked files into areas small enough for one agent to read every file: roughly up to 100 source files or 10,000 lines, cut along the code's own seams (packages, apps, feature folders, layers). Write `areas.json` in the scratch folder:

```json
{
  "areas": [
    { "name": "api", "globs": ["apps/api/**", "packages/shared/src/**"] },
    { "name": "web", "globs": ["apps/web/**"] },
    { "name": "mobile", "globs": ["apps/mobile/**"] },
    { "name": "infra", "globs": [".github/**", "infra/**", "*.toml", "Dockerfile"] },
    { "name": "skip", "globs": ["**/*.snap", "docs/archive/**"] }
  ]
}
```

Run `node <skill-dir>/scripts/ledger.mjs map <areas.json>` from the repository root. It lists files per area, files claimed by two areas (the first area listed owns them) and unowned files; vendored, generated and lock files from the ground-rules skip list are left out. Adjust globs until nothing is unowned. Files in `skip` need a reason in the report's Coverage section.

## 3. Threat model and traces

**Actors.** One row each for those that apply: anonymous visitor, signed-in user, user of another tenant or household, low-privilege staff, admin, webhook or callback sender, other services on the network, a malicious contributor or pull request, a compromised dependency, someone holding an unlocked or stolen device, an operator with database access.

| Actor | Wants | Entry points | Stopped by |
|---|---|---|---|
| user of another tenant | read or change this tenant's records | record routes, exports, search | `path:line` of the check, or "nothing" |

Every "nothing" row is a lead for each area its entry points touch.

**Traces.** Pick the 4 to 8 flows that matter most (sign-up, sign-in, the main create or save, payment, sync, sharing, export, delete account, an admin action). For each, write the steps with the file that handles them, where data enters and leaves each area, the shape at every boundary (field names, ids, units, time zone, nullability), and where authorisation is checked. Each area brief gets the traces that cross it.

## 4. Hunt

| Agent | Scope | Lenses | Tier |
|---|---|---|---|
| one per area | the area's file list | bugs, tests, cleanup; db where the area touches data; perf; a11y where it has UI | mid; strongest for areas holding money, auth, migrations or sync |
| deps | manifests, lockfiles, container and CI files | deps | mid |
| drift | docs, contracts, environment config | drift | mid |
| migration | migrations and every reader of touched tables | migration | strongest |
| release | CI, deploy and store config, version sources | release | mid |
| agent-config | agent settings, hooks, MCP, instruction files | agent-config | mid |
| `lll:security` full | whole repository | security | its own; returns finding blocks and the engine output path, no fixes |

Tiers follow `../../../shared/agents.md`. Run agents in parallel where the host allows; with no subagents, run each brief in turn and keep notes in the scratch folder.

### Area brief

Paste this, filled in, as the whole brief. Subagents see nothing else.

```
Goal: find real defects in <area> through the lenses below. Read-only.
Scope: every file below; read each one, not only search hits.
<file list from: node <skill-dir>/scripts/ledger.mjs map <areas.json> --area <name>>
Stack: <stack-detect block>
Ground rules:
- Read-only: no edits, moves, installs, code generation, builds into the tree, git writes or remote writes.
- Every claim cites path:line and quotes the code, or quotes a command and its decisive output line.
- Search and tool hits are leads; confirm or discard each.
- Secrets by location and type only; never copy personal data.
- Project rules and locked decisions are the spec: <pasted rules>
- Outside tools only at pinned versions; network only for <listed calls or none>.
Lenses: <names>. For each, read Method, the stack section, Severity calibration and False-positive traps in <absolute path of each lens file>.
Threat model rows for this area: <rows>
Traces crossing this area: <steps and boundary shapes>
Known gaps and earlier findings here: <list>; rejected before, do not report: <list>
Already ruled out: <list>
Output:
- Finding blocks in this format, Verdict needs_validation: <pasted block format from shared/findings.md>
- Questions: items without a failure scenario yet
- Cut list lines (cleanup lens only)
- Last line: files read: <n>; unread in scope: <paths or none>
```

Repo-wide lens agents get the same brief with their scope and the full trace list.

## 5. Merge and cross-area hunts

1. Any agent reporting unread files gets a follow-up brief for exactly those files.
2. Dedupe: same root cause and location is one finding; keep the most specific location, list every lens, add "also:" locations.
3. **Cross-area hunts** (the parent, or one strongest-tier agent with all merged blocks, the inventories and the traces). Bugs that live between areas:
   - **Contract, handler, UI:** for each field on each boundary, what the server writes, what the client parses and what the UI shows; units, nullability, enum values, error shapes.
   - **Route, authorisation, screen:** every route has its check; every button hidden on a screen has a server check behind it.
   - **Migration and readers:** every changed column against every reader, including jobs, reports and app versions in the field.
   - **Docs and code:** drift claims against area findings.
   - **Platform parity:** the same rule (validation, rounding, limits, time zones) on web, mobile, desktop and server.
   - **Trace joins:** walk each trace end to end with the area findings at hand; look for the break at each boundary.
   - **Threat table:** close every "nothing" row with a finding or the line that stops the actor.
   - **Copies:** duplicated helpers and constants across areas.
4. Merge `lll:security`'s mapped blocks. Overlaps with area findings keep the security id and list the other lens.

## 6. Verify

Per `../../../shared/findings.md`: a strongest-tier agent that found nothing in this run receives finding blocks only and tries to disprove each. Batch by area, about 10 to 15 per verifier; every critical and high gets its own careful pass. A finding that changes materially is verified once more.

## 7. Rerun diff

`node <skill-dir>/scripts/ledger.mjs diff <last full report> <draft report>` lists ids as new, persisting and gone. Before calling a finding gone, confirm the fixing line exists; if its area was not covered this run, mark it "not checked", not gone.

## 8. Fix

One fix phase per `../../../shared/fix-phase.md` for every confirmed finding, security ones included, batched by file overlap. Security findings follow `lll:security`'s rules for confirming during the fix phase.

## 9. Report

`docs/audits/<YYYY-MM-DD>-audit-full.md` per `../../../shared/report.md`, with these additions:

- **Coverage:** a table of areas with files, files read and files unread; lenses run per area; the `lll:security` artifacts path; skipped paths with reasons; inventories used.
- **Threat model:** the actor table with every row closed.
- **Traces:** one line per trace and its result.
- **Assumptions:** one line each, for decisions taken without the owner.

## Budget

When the run cannot cover everything, cover in this order and list what was cut in Coverage: ground truth and gates; `lll:security`; areas holding money, auth, personal data, migrations or sync; deps and migration; the remaining areas; the remaining repo-wide lenses. Never sample silently: every unread file is listed.

## Unattended runs

With nobody to ask (scheduled, cloud or overnight runs): decide, record each decision under Assumptions, and keep going. Never push to the default branch, merge, deploy or touch remote systems. Push the fix branch only when the host needs it to return the work and the owner's instructions allow it. Stop when every area is read, every finding has a verdict, and gates are green or the blocker is named.
