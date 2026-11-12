# Risks and debt

Turn leads into a short, evidenced list of what could hurt the next owner. Findings that describe a concrete failure use `../../../shared/findings.md`. This file covers the onboarding view: where to look, how to rate, what to recommend.

## Where to look

### History and ownership (git)

Run `node scripts/repo-facts.mjs` first; these are the raw commands behind it.

| Signal | Command | Reading |
|---|---|---|
| Churn hot spots | `git log --since="12 months ago" --name-only --format= -- . ':!*lock*' \| sort \| uniq -c \| sort -rn \| head -20` | Files changed most often are where design changed under pressure |
| Size against churn | the hot-spot file's line count | big and busy is the classic debt centre |
| Single owner | `git shortlog -sn --since="12 months ago" -- <dir>` | one author owning an area is a bus-factor risk |
| Stale area | `git log -1 --format=%cs -- <dir>` | untouched for a year and still in the critical path: nobody knows it |
| Reverts and fix share | `git log --oneline --since="12 months ago" \| grep -ciE "revert\|fix\|hotfix"` | a high share points at instability |
| Largest commits | `git log --shortstat --format="%h %s" -n 300` | read the biggest insertion and deletion counts: big-bang rewrites and imports |
| Dead branches | `git branch -a --no-merged` | abandoned work that may hold lost context |

Use `--follow` only with a single file path. A shallow clone hides all of this: say so.

### Code and structure

- Files over about 800 lines or functions over about 80 lines that are also in the churn list.
- Logic duplicated between client and server, or between two services.
- A shared package that everything imports and nothing tests.
- TODO, FIXME, HACK, XXX density by area (the facts script counts them).
- Dead code: unreferenced exports, feature flags that are always on or off, commented-out blocks.
- Layering violations: UI importing the data layer, handlers building SQL.

### Safety nets

- Tests: which risky paths (money, auth, migrations, sync) have none. Skipped or `.only` tests. Does CI run them.
- CI: exists, green on the default branch, runs lint, types, tests, build.
- Error handling: swallowed errors, `catch {}`, generic 500s, no error tracker.
- Backups: where the data lives, whether a backup exists, whether a restore was ever tried (`lll:backup-drill`).
- Migrations: a folder with an order, rollback story, any edited-after-applied migrations.

### Dependencies and runtime

- End-of-life runtime or framework (Node, Python, Java, PHP, Rails, .NET, Android target SDK, iOS minimum): check the vendor's support dates with a current source, not memory.
- No lockfile, or lockfile ignored; unpinned `latest`; git or path dependencies; abandoned packages; copy-pasted vendored libraries in source folders.
- Licences that block the client's use (copyleft in a closed product): list, do not judge; `lll:audit` has the deps lens.

### Secrets and data (by name only)

- Tracked `.env`, key, keystore, service-account or database dump files (the facts script lists names and whether git tracks them).
- Variables with secret-like names in client-shipped config (`NEXT_PUBLIC_`, `EXPO_PUBLIC_`, `VITE_`).
- Real credentials in history: a content search is `lll:security`'s job (or `/security-review` on pending changes); here, note that nobody checked.

### Operations

- One environment only, or production deployed from a laptop.
- No health check, no alerting, no log retention, no uptime monitor.
- Manual deploy steps nobody wrote down; a deploy that needs a specific person.
- Third-party accounts in a personal name (domain, hosting, store, payment, email, analytics). Feeds `lll:handover`.

### Documents against code

Doc says X, code does Y. List each drift with both anchors. These are not bugs; they are the reason the next person loses a day.

## Missing day-one features

Compare the repo with what a careful first build would contain, and list what is absent for this kind of product: input validation at trust boundaries, authentication and authorisation tests, rate limiting, idempotency on writes that retry, migrations with a rollback path, structured logging without personal data, error tracking, backups and a restore note, accessibility basics, internationalisation where users are multilingual, user and developer docs, CI gates, a deploy and rollback note.

## Rating

Rate each risk by the failure scenario, as in `../../../shared/findings.md`: what happens, to whom, how often. Then add two fields that matter to a new owner:

- **Likelihood next 6 months**: low, medium or high, with the reason (area churn, upcoming runtime end of life, planned feature).
- **Effort to fix**: S (under a day), M (a few days), L (needs its own plan).

## Verdict per item

| Verdict | Use when |
|---|---|
| fix forward | the design is sound and the defect is local; repair in place |
| rewrite | the area is small enough to replace and it fights every change |
| leave documented | working, costly to change, low risk; record why so nobody reopens it |

A "leave documented" item must carry its reason. A silent one reopens the question for the next person.

## Gap register (optional, for deep onboarding of a slice)

When the user wants the follow-up planned, keep a table in the doc:

| ID | Axis | Gap | Evidence | Forward fix | Severity | Effort | Verdict |
|---|---|---|---|---|---|---|---|
| G-001 | practice | errors swallowed in the retry loop | `src/api/retry.ts:42` | propagate and map at the boundary | high | S | fix forward |

Axes: **thinking** (decisions never written down, invariants that live only in code), **practice** (code against the project's own conventions), **missing features** (the list above), **technology selection** (tech that fights the codebase, outdated or duplicated). Every row needs an evidence anchor; a gap you cannot point at is an opinion. Planning the fixes belongs to `lll:plan`; executing them to `lll:build`.

## Retro decision records

For each significant decision frozen into the code with no record (stack choice, data model, auth approach), list it under "undocumented decisions" and mark it `reconstructed`: observed from history, intent inferred, to be confirmed by the owner. Never present a reconstructed decision as one written at the time.

## Do not

- Do not call something a defect without a failure scenario; put it under Questions.
- Do not fix anything in this skill.
- Do not rate by how ugly the code looks.
- Do not claim a secret leak from a file name alone: say "a file named like a secret is tracked", and hand the content check to `lll:security`.
