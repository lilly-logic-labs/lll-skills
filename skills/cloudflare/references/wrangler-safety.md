# Wrangler safety

Applies to Wrangler and to the `cf` CLI alike. Always read the command's `--help` in the project's pinned version first; flags move.

## Classify before you run

| Class | Examples | Rule |
|---|---|---|
| **Local, safe** | `wrangler dev` (local simulation), `wrangler types`, `wrangler deploy --dry-run`, `wrangler d1 execute <db> --local`, `wrangler d1 migrations apply <db> --local`, `wrangler d1 migrations list <db> --local`, `wrangler --version`, `--help` | Run freely. Writes only to `.wrangler/` state. |
| **Remote read** | `wrangler whoami`, `wrangler d1 list`, `wrangler d1 info`, `wrangler d1 time-travel info`, `wrangler d1 execute --remote` with `SELECT` only, `wrangler kv key get`, `wrangler r2 object get`, `wrangler tail`, `wrangler versions list`, `wrangler deployments list` | Ask the owner first in this conversation. They can expose account details or user data. Never paste personal data into replies. |
| **Remote write** | `wrangler deploy`, `versions upload`, `versions deploy`, `rollback`, `secret put/delete/bulk`, `d1 execute --remote` with writes, `d1 migrations apply --remote`, `d1 time-travel restore`, `d1 delete`, `kv key put/delete`, `kv bulk`, `r2 object put/delete`, `r2 bucket delete`, `queues delete`, `queues purge`, `vectorize delete`, `delete` | Owner only. Prepare the exact command, the target (account, Worker, environment, resource), the expected effect and the undo. Do not run. |

`wrangler secret put` and `secret delete` create a version and deploy it at once. For a staged change use the `wrangler versions secret` workflow from the current docs.

## Default flags that keep you local

- D1 during work: always `--local`. `--remote` is the dangerous word. Without either flag the default differs by command and version, so pass the flag explicitly.
- Bindings with `remote: true` (or remote proxy sessions) make `wrangler dev` touch real resources. Read the config before any test that writes.
- Deploy checks: `wrangler deploy --dry-run --env <name>` (add `--outdir` to inspect the bundle). It proves the build and packaging only.

## Before any remote D1 migration (owner steps)

Hand the owner this sequence. Do not run it for them.

1. Confirm the target: `wrangler d1 list` and the `database_id` in the config for the intended environment. Staging first.
2. Record a point-in-time bookmark: `wrangler d1 time-travel info <db>` and keep the printed bookmark id in the change notes. Time Travel keeps a limited history window; confirm the window in the current docs.
3. For a portable copy also run `wrangler d1 export <db> --remote --output <file>` and store it outside the repository. It holds production data.
4. Rehearse on `--local` and on a staging database with a copy of the schema.
5. `wrangler d1 migrations list <db> --remote` to see what is pending.
6. `wrangler d1 migrations apply <db> --remote`.
7. Verify with a read-only query and the application's smoke test.
8. Undo path: `wrangler d1 time-travel restore <db> --bookmark=<id>`. Restore rewinds the database in place, so any writes after the bookmark are lost; the command prints a bookmark for the pre-restore state, which allows undoing the undo. Confirm exact behaviour in the current docs.

Rules for the migration files themselves:

- A new numbered file for every change. Never edit one that may have run anywhere.
- Make steps re-runnable where SQLite allows (`CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`).
- SQLite cannot drop or retype many columns in place; use the create-copy-swap pattern and check the current D1 notes on foreign keys.
- A migration that drops or rewrites data is a `critical` review item (`../../../shared/findings.md`).

For restore drills on a non-production database use `lll:backup-drill`.

## Secrets

- Set deployed secrets with `wrangler secret put NAME` (the value is typed or piped by the owner, never placed in an argument, a file in the repo, or chat).
- Local development: `.dev.vars` (or `.env`) listed in `.gitignore`. These files do not upload.
- `vars` in the config are public text. A key in `vars` is a finding.
- Declare required secrets (`secrets.required` in recent versions) so a missing one fails early. Check the current docs for the field.
- Shared account-level secrets: Secrets Store.
- Rotate by `put` then deploy, then revoke the old value at the provider.
- API tokens for CI: account-owned, narrowest scope, per environment. `wrangler login` OAuth cannot express granular scopes.

## Environments

- Most binding keys are not inherited from the top level into `[env.x]`. Repeat `d1_databases`, `kv_namespaces`, `r2_buckets`, `queues`, `durable_objects`, `services`, `vars`, routes and triggers per environment, with distinct resource ids for staging.
- Pass the same `--env` to every command in one change. Omitting it targets the top-level Worker.
- With the Cloudflare Vite plugin the environment is chosen at build time (`CLOUDFLARE_ENV`), not at deploy time.
- Verify with `wrangler deploy --dry-run --env <name>` and read the bindings it prints.
- Dashboard edits can be overwritten by the next deploy. Keep config in the repository the single source.

## Rollback

- `wrangler rollback` and version deployments move Worker code only. D1 rows, R2 objects, KV values, queue messages and Durable Object storage are not rolled back.
- A schema migration plus a code deploy needs a plan for both: backward-compatible migration first, code second, destructive cleanup last.
- Gradual deployments (`versions upload`, then `versions deploy` with percentages) let the owner watch error rates before 100 percent.

## Workers Previews and CI

- Previews need the project-local wrangler at or above the version the docs name; check, do not upgrade silently.
- Preview URLs are public unless protected; tell the owner.
- CI: `npm ci` (or the lockfile equivalent), typecheck, tests, `wrangler deploy --dry-run`; the real deploy runs in the owner's pipeline with a scoped token.

## When the user asks you to "just deploy"

Reply with: the command, the account and environment it targets, what changes, the rollback, and that the owner runs it (or approves it). If the project documents a deploy script, name that script instead of a raw command.
