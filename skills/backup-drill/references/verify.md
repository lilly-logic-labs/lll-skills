# Verifying a restore

A restore that "completed without errors" has proven nothing yet. Verify in five layers and record the evidence. Never put row contents in chat, logs or the written report: counts, hashes, table names and timestamps only.

Contents: Layer 1 structure · Layer 2 counts · Layer 3 checksums · Layer 4 invariants and freshness · Layer 5 app smoke test · Making the comparison fair · Evidence to keep

## Layer 1: structure

- Schemas, tables, views, indexes, constraints, triggers, functions, sequences, extensions, roles and grants are all present. Compare lists against the source: Postgres `\dt+ \di+ \df \dx \du`, MySQL `show full tables; show triggers; show procedure status`, SQLite `.schema`, Mongo `getCollectionInfos()` and `getIndexes()`, Firestore collections and rules, object storage prefix list.
- Security objects came across: row level security policies, grants, bucket policies, security rules. A missing policy is an exposure, not a cosmetic gap.
- The migration table (`schema_migrations`, `_prisma_migrations`, `drizzle`, `alembic_version`, D1 migrations) matches the repo's latest migration.

## Layer 2: counts

Per table or collection, exact counts (not engine estimates) from both sides, written as `name<TAB>count[<TAB>checksum]`, then:

```
node scripts/drill.mjs compare source.tsv restored.tsv --lag
```

Statuses: `OK`, `LAG` (the source has more rows because of writes after the backup; acceptable and sized by the RPO), `COUNT_MISMATCH` (restored has fewer or more than the allowance, investigate), `CHECKSUM_MISMATCH`, `MISSING_IN_RESTORE`, `EXTRA_IN_RESTORE`. Anything but `OK` and `LAG` is a finding.

Count emitters: Postgres and MySQL loops are in the SQL notes; SQLite `for t in $(sqlite3 db "select name from sqlite_master where type='table' and name not like 'sqlite_%'"); do printf '%s\t%s\n' "$t" "$(sqlite3 db "select count(*) from \"$t\"")"; done`; MongoDB `db.getCollectionNames().forEach(n => print(n + "\t" + db[n].countDocuments({})))`; D1 via `wrangler d1 execute <db> --remote --command "select count(*) from <t>" --json`; object storage `aws s3 ls --recursive --summarize`.

## Layer 3: checksums

Counts miss corruption and partial rows. Pick the cheapest honest checksum per store:

| Store | Checksum |
|---|---|
| Postgres | `select md5(string_agg(md5(t::text), '' order by md5(t::text))) from <table> t` per table, or a hash of a sorted export of key columns for large tables |
| MySQL | `CHECKSUM TABLE <t>` |
| SQLite | `sqlite3 db .dump \| sha256sum` on both sides, or a hash of an ordered select |
| MongoDB | `db.runCommand({ dbHash: 1 })` on an idle copy |
| Firestore, DynamoDB, KV | no engine checksum: hash the sorted list of ids and a sample of documents |
| Object storage | `rclone check`, stored checksums, `sha256sum` on a sample |

Very large tables: sample by primary key ranges (first, last, and several random ranges) and say that it was a sample.

## Layer 4: invariants and freshness

- Foreign keys and uniqueness hold (`PRAGMA foreign_key_check`, `select ... left join ... where child.parent_id is null`).
- Business invariants that must always balance still do: ledger debits equal credits, invoice totals equal line sums, stock is not negative, every order has a user.
- Sequences and auto-increment counters are at or above the maximum id, so the next insert does not collide.
- Freshness: the newest timestamp in each hot table (`max(created_at)`, `max(updated_at)`). The newest value across the restored copy is the data point for the achieved RPO.
- Soft deletes and tombstones restored as deleted. A deleted record silently coming back is a critical bug (`../../../shared/findings.md`); check a known-deleted sample.
- Personal data handling: if the restore brings back users who were erased on request, the runbook must say how erasures are replayed after a restore.

## Layer 5: app smoke test

Point a local or scratch copy of the app at the restored store, with dummy secrets and no outbound side effects.

- Boot: the app starts, migrations report nothing to do (or only the expected ones).
- One read path per core feature: sign in as a test user, load the main list, open a record, load an attachment.
- One write path against the copy: create a record, update it, delete it, confirm it lands in the scratch store and not production (check the connection in the app's startup log).
- Background work is off or pointed at scratch: queues, cron, webhooks, email, payments, push.
- Search, caches and derived data rebuild, or are rebuilt and timed.
- Record pass or fail per step, with the time at which the last step passed. That time ends the RTO clock.

## Making the comparison fair

The source keeps changing after the backup was taken. Options, best first:

1. Take a fresh backup, record the source counts and checksums at that moment (same transaction or snapshot where the engine allows), then restore that backup.
2. Restore the existing latest backup and compare with `--lag`, treating source-greater counts as the RPO window. State the window.
3. Restore point-in-time to a chosen timestamp and compare with a source query bounded by `created_at <= <timestamp>`.

## Evidence to keep

Timestamps of each step, the commands run (secrets removed), the compare output, the checksum table, the smoke test steps and results, the restored size, the restore duration, the cleanup confirmation. Keep them with the written report under `docs/audits/<date>-backup-drill/` if the project stores evidence there.
