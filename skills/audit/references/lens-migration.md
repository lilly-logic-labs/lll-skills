# Lens: migration

Whether pending and recent schema and data migrations can run in production without losing data, locking users out, or breaking the code versions that will run alongside them.

## Covers

- Destructive changes: drops, renames, type changes, new `NOT NULL` or `UNIQUE` constraints on existing data.
- Expand-contract ordering across deploys, and compatibility with every code version that runs during the rollout (old servers, workers, queued jobs, mobile apps in the field).
- Reversibility: down migrations or a written forward fix, and backups before data-destroying steps.
- Locks and duration on large tables.
- Backfills: batching, idempotency, resumability, throttling, separation from schema changes.
- History integrity: migrations edited after they ran, duplicate numbers, multiple heads, checksum mismatches.
- On-device migrations from every shipped schema version.

## Method

1. **List the migrations in scope.** Pending ones (the tool's status command against a local or staging database) and those added since the last release (`git diff --name-only <last-release-tag>..HEAD -- <migrations dir>`).
2. **Classify each statement:** additive (new table, nullable column, new index built online), destructive, constraint-tightening, data-changing (`UPDATE`, `DELETE`, backfill), or lock-heavy.
3. **Who runs against it.** List every code version that reads or writes the touched tables during the rollout: the old and new server versions during a rolling deploy, background workers and queued jobs serialised with the old shape, mobile and desktop clients that update slowly, other services and reports. A rename or drop that any of them still uses breaks them.
4. **Expand-contract check.** A rename or type change ships as: add the new column or table; write both; backfill; read the new; stop writing the old; drop the old in a later release. Flag any migration that does two of these steps at once.
5. **Locks and time.** Get row counts from the owner or from statistics (`pg_class.reltuples`, `information_schema.tables.table_rows`). Apply the per-engine rules below.
6. **Backfills.** In batches by key range, idempotent (safe to re-run), resumable, outside a transaction that holds schema locks, throttled, and separate from the schema change.
7. **Rollback.** For each migration: a down migration, or a forward fix written down, and whether rolling back the code is still possible after it runs. Data-destroying steps need a backup or export first.
8. **History integrity.** `git log --follow --oneline -- <migration file>`: more than one commit on a migration that may have run anywhere is a finding. Check numbering for gaps and duplicates and the tool's own consistency check.
9. **Prove it** in the fix worktree: apply all migrations to a fresh local database and to a copy at the previous release's schema with representative data, then run the tests. Compare schema dumps when the tool allows.

## Per engine

**PostgreSQL**
- `CREATE INDEX` on a populated table without `CONCURRENTLY` blocks writes for the build; `CONCURRENTLY` cannot run inside a transaction, so the migration tool must allow it.
- `ADD COLUMN ... DEFAULT <constant>` is fast on PostgreSQL 11 and later; a volatile default (`now()`, `gen_random_uuid()`) rewrites the table.
- `ALTER COLUMN ... TYPE` usually rewrites the table; `SET NOT NULL` scans it (on 12 and later, add a `CHECK (col IS NOT NULL) NOT VALID`, `VALIDATE` it, then `SET NOT NULL` skips the scan).
- New foreign keys and checks: `ADD CONSTRAINT ... NOT VALID`, then `VALIDATE CONSTRAINT` separately.
- Set `lock_timeout` (and a `statement_timeout`) for migration sessions so a blocked `ALTER` fails instead of queueing every query behind it.

**MySQL and MariaDB**
- Prefer `ALGORITHM=INSTANT` or `ALGORITHM=INPLACE, LOCK=NONE` and let the statement fail if unsupported; large tables may need `gh-ost` or `pt-online-schema-change`.
- Long-running queries block DDL through metadata locks; DDL then blocks everything behind it.

**SQLite and Cloudflare D1**
- `ALTER TABLE` supports adding columns and renames only; other changes use the rebuild pattern (create new table, copy, drop, rename) inside one migration, with `PRAGMA defer_foreign_keys = true` on D1 while it runs.
- D1 migrations apply with `wrangler d1 migrations apply <db> --local` locally; `--remote` is the owner's command. Each migration file runs as a unit; very large data rewrites belong in a batched Worker or script, not one migration.
- Back up first: D1 Time Travel covers a restore window; an export (`wrangler d1 export`, owner's command for remote) gives a file.

**MongoDB**
- Index builds on large collections (rolling builds on replica sets); schema-validation changes that reject existing documents; backfills as batched, resumable scripts.

**Framework tooling**
- Rails: `strong_migrations` rules; `disable_ddl_transaction!` for concurrent indexes.
- Django: `SeparateDatabaseAndState` for renames, `RunPython` with a reverse function, `makemigrations --check` for conflicts.
- Alembic: `alembic heads` must show one head; autogenerate output reviewed for drops.
- Prisma: read the generated SQL for `DROP` and type changes; `migrate dev` may propose a reset on drift, which is never acceptable for shared databases.
- Flyway or Liquibase: `validate` reports edited or checksum-mismatched migrations.
- EF Core: review `Up` and `Down`; `migrationBuilder.Sql` for data steps.

**On-device**
- Room: a migration or auto-migration spec for every version step, tested with `MigrationTestHelper`; `fallbackToDestructiveMigration()` in release deletes user data.
- Core Data: a new model version per change, lightweight migration or a mapping model; tested by opening a store from the previous release.
- SQLite with `user_version` and Realm `schemaVersion`: every step from every shipped version, each step atomic; app downgrade behaviour defined.

## Severity calibration

- **critical:** a migration or code path that loses user data (dropping a column still read, a destructive on-device fallback, a backfill that overwrites without a guard); a migration edited after it ran in production, so environments now differ.
- **high:** a blocking lock on a large production table for more than a few seconds; a rename or drop in the same release as the code change while old versions still run; no way back after a data-destroying step and no backup.
- **medium:** a backfill in one transaction on a medium table; no down migration or written forward fix for a risky change; a non-concurrent index on a growing table.
- **low:** numbering gaps; a migration mixing schema and data on a small table; missing comments on irreversible steps.

## False-positive traps

- Small tables lock for milliseconds; get the row count before reporting a lock.
- A project with no production data yet (check deploy docs and the owner) can be less strict; say so instead of reporting.
- Tools that already enforce safe patterns (`strong_migrations`, linters in CI) may make a pattern impossible; check their config.
- A drop that follows an earlier release which removed all reads is the contract step done right.
