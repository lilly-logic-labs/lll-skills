# Managed and edge stores: Cloudflare D1, Supabase, Firestore

Vendor limits, retention windows and flags change. Check the vendor's current docs (context7 or the vendor docs tool) and `--help` of the installed CLI before quoting a number in a report.

Contents: Cloudflare D1 (and KV, R2, Durable Objects) · Supabase · Firebase Firestore

## Cloudflare D1

Mechanisms:

- **Time Travel**: automatic point-in-time recovery to any minute inside the retention window (30 days on paid plans per the current docs; the Free plan is shorter, confirm). `wrangler d1 time-travel info <db>` prints the current bookmark and the restorable range.
- **Restore is in place.** `wrangler d1 time-travel restore <db> --timestamp=<unix-or-iso>` (or `--bookmark=<id>`) overwrites that database and prints the previous bookmark so it can be undone. It must never be used as a drill on a production database.
- **Export**: `wrangler d1 export <db> --remote --output=backup.sql` (options include `--no-data` and `--no-schema`); a REST export API exists for scheduled backups, and a Workflows example saves exports to R2. Exports read the whole database: run them off-peak and get the owner's OK for a busy production database. Check the docs for unsupported items (virtual tables such as FTS) and size limits.
- **Undelete**: a deleted database can be undeleted through the API only for a short window (7 days at the time of writing).

Drill recipe, with the scratch database named `drill-<date>`:

1. `wrangler d1 create drill-<date>` (guard-check the name and database id).
2. Export production (a read; owner OK): `wrangler d1 export <prod-db> --remote --output=drill.sql`.
3. Import into the scratch database: `wrangler d1 execute drill-<date> --remote --file=drill.sql`. Cheaper alternative: `--local` into a local SQLite file under `.wrangler/state`.
4. Verify counts with `wrangler d1 execute drill-<date> --remote --command "select name from sqlite_master where type='table' and name not like '_cf_%' and name not like 'sqlite_%'" --json`, then `select count(*)` per table; compare with `node scripts/drill.mjs compare`.
5. Prove Time Travel on the scratch copy, not on production: note the bookmark, insert a marker row, wait a minute, restore to the earlier bookmark, confirm the marker is gone. This proves the mechanism and its timing, not production data.
6. Run the app against the scratch binding (a separate `--env` or a copy of the wrangler config with the scratch `database_id`) for the smoke test.
7. Delete: `wrangler d1 delete drill-<date>`.

Also in the Cloudflare family:

- **KV** has no point-in-time backup. A backup is a scheduled job that lists keys through the API and writes them elsewhere. Drill: restore a sample into a scratch namespace.
- **R2** protection options are bucket locks (retention rules by prefix) and a second copy in another bucket or provider (`rclone sync`, a scheduled Worker). Confirm in current docs whether versioning exists for your plan. See the object storage notes.
- **Durable Objects with SQLite storage** expose point-in-time bookmarks through the storage API; confirm the current API and retention in the docs before relying on it, and drill on a scratch object namespace.
- **Queues, Workflows, Vectorize, Analytics Engine**: ask whether the contents are rebuildable. If not, there needs to be a re-ingest path.
- Deployed code and config are restorable from git; secrets are not. Check that every Worker secret can be re-created from the secret store or password manager.

## Supabase

Mechanisms by plan: the Free plan has no managed backups (a scheduled `supabase db dump` or `pg_dump` is required); paid plans keep daily backups for a plan-dependent number of days; point-in-time recovery is an add-on with a much smaller RPO. Check the current plan table.

- Dashboard "restore" overwrites the project in place, so it is not a drill. Prefer "restore to a new project" where the plan offers it. Otherwise restore a downloaded daily backup or a CLI dump into a scratch project or a local stack (`supabase start` runs Postgres in Docker).
- Take the dump (a read of production; owner OK): `supabase db dump --db-url "<read-only url>" -f roles.sql --role-only`, then `-f schema.sql`, then `-f data.sql --data-only` (add `--use-copy`). Check which schemas the dump includes; `auth` and `storage` data need explicit schema flags.
- Restore into the scratch database: `psql --single-transaction --variable ON_ERROR_STOP=1 --file roles.sql --file schema.sql --command 'SET session_replication_role = replica' --file data.sql "<scratch url>"`.
- Not in database backups: **Storage objects** (files), Edge Function code and secrets, auth provider configuration and email templates, realtime and API settings. Each needs its own copy (`supabase storage cp` or an S3-compatible sync, the repo for functions and migrations, an exported settings checklist).
- Verify with the Postgres queries: counts, `pg_policies` count (row level security came across), `auth.users` count, a test sign-in against the scratch project with a test user. A restore that lands without RLS policies is a data leak, not a recovery.
- Local development resets (`supabase db reset`) are not backups.

## Firebase Firestore

Mechanisms:

- **Managed export**: `gcloud firestore export gs://<bucket>/<prefix> [--collection-ids=a,b]` (needs a billing-enabled project; the bucket should be in another project or region for resilience).
- **Scheduled backups**: `gcloud firestore backups schedules create --database=<db> --recurrence=daily --retention=7d`; restore creates a new database: `gcloud firestore databases restore --source-backup=<backup-resource> --destination-database=drill-<date>`.
- **Point-in-time recovery** (a recovery window of several days) when enabled on the database; read at a past time or restore into a new database. Confirm the exact commands with `gcloud firestore --help` for your CLI version.
- **Import** (`gcloud firestore import gs://...`) merges into the target database and overwrites documents with the same id, so the target must be a scratch database or a scratch project. Never import into the live one.

Drill recipe: create a scratch database (`gcloud firestore databases create --database=drill-<date> --location=<loc>`), restore or import into it, point a copy of the app or a script at it (Admin SDK with the database id), verify, then `gcloud firestore databases delete --database=drill-<date>`.

Verification: Firestore has no checksum. Compare per-collection counts with aggregation queries (`collection(...).count().get()`), compare document-id sets for a sample or for small collections, spot-check nested fields and timestamps. Security rules and indexes are not part of an export: confirm `firestore.rules` and `firestore.indexes.json` live in the repo and deploy to the scratch database. Firebase Auth users (`firebase auth:export users.json --project <p>`) and Cloud Storage files need their own backups. The local emulator imports emulator exports, not production exports, so it is not a drill target.
