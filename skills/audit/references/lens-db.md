# Lens: db

The health of every data store the project owns: is the data constrained, are the queries indexed and bounded, are writes atomic, are connections sane, and is there a backup.

## Covers

- Schema integrity: keys, foreign keys, `NOT NULL`, `UNIQUE`, `CHECK`, types for money and time.
- Query paths: N+1, missing indexes, unbounded reads, over-fetching, deep pagination, scans hidden by functions or leading wildcards.
- Transactions: multi-write atomicity, check-then-act races, isolation assumptions, long transactions, retry on conflict, idempotency.
- Connections: pool sizing, serverless connection storms, timeouts, leaks on error paths.
- Lifecycle: soft-delete filters, cascades, orphans, retention.
- Backups: present, recent, restorable (status only).

Rollout safety of pending migrations is the migration lens. Tenant isolation as a security boundary is `lll:security`.

## Method

1. **Inventory.** Engines, ORMs or query builders, the schema source of truth (migrations folder or schema file), connection setup, replicas, caches (`../../../shared/stack-detect.md` step 3).
2. **Schema pass.** For each table or collection: every reference has a foreign key or a documented reason; columns the code assumes present are `NOT NULL`; every dedupe the code performs (email, external id, idempotency key, slug) has a `UNIQUE` constraint; enums and ranges have `CHECK`s or equivalent; money is integer minor units or exact decimal, never float; timestamps carry a time zone or are UTC by rule.
3. **Query pass.** For list, search, dashboard, export and hot endpoints, find each query and ask: is there a query inside a loop or a lazy relation inside a serializer or template (N+1)? Is there an index for the `WHERE`, `JOIN` and `ORDER BY`? Is there a `LIMIT`? Does it select only what it uses? Does pagination use keyset rather than a deep `OFFSET`? Does a function or `LIKE '%x'` defeat the index?
4. **Write pass.** Each operation that writes more than one row or table runs in one transaction or batch. Read-then-write logic has a constraint, a row lock or an atomic update behind it. No transaction stays open across a network call. Serialization and deadlock errors are retried with the same idempotency key.
5. **Connections.** Pool size times instance count stays under the server's connection limit; serverless and edge runtimes use a pooler (PgBouncer, Supabase pooler, RDS Proxy, Hyperdrive); statement and idle-in-transaction timeouts exist; connections are released on every error path.
6. **Lifecycle.** Soft-deleted rows are excluded from every read, count, search, export and uniqueness check; cascades delete what the product promises and nothing more; orphans are cleaned up; retention rules are implemented.
7. **Backups.** Automated backups or point-in-time recovery are on, recent, retained long enough, and a restore was tested. Report status only; a rehearsal is `lll:backup-drill`.
8. **Live statistics** (only against a local or staging copy, or production read-only with the owner's go-ahead): run the engine queries below and attach the decisive rows as evidence.

## Per engine

### PostgreSQL

- Unindexed foreign keys:
  ```sql
  SELECT c.conrelid::regclass AS tbl, a.attname AS col
  FROM pg_constraint c JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
  WHERE c.contype = 'f' AND NOT EXISTS (
    SELECT 1 FROM pg_index i WHERE i.indrelid = c.conrelid AND a.attnum = i.indkey[0]);
  ```
- Slowest statements (needs `pg_stat_statements`): `SELECT query, calls, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 20;`
- Tables read by sequential scan: `SELECT relname, seq_scan, idx_scan, n_live_tup FROM pg_stat_user_tables ORDER BY seq_scan DESC LIMIT 20;`
- Unused indexes (write cost, no benefit): `SELECT relname, indexrelname, idx_scan FROM pg_stat_user_indexes WHERE idx_scan = 0;` Check the stats reset date before trusting zeros.
- Dead tuples and vacuum: `n_dead_tup`, `last_autovacuum` in `pg_stat_user_tables`.
- Open transactions and connections: `SELECT state, count(*) FROM pg_stat_activity GROUP BY state;` long `idle in transaction` sessions are a leak.
- Settings: `statement_timeout`, `idle_in_transaction_session_timeout`, `lock_timeout` set per role or per app connection.
- `EXPLAIN (ANALYZE, BUFFERS)` executes the statement: only on a copy or replica.
- Types: `timestamp` without time zone holding instants; `float8` or `real` for money; `serial` versus identity is style.

### MySQL and MariaDB

- `utf8mb4` everywhere (`utf8` is the 3-byte variant and truncates emoji); InnoDB tables.
- `sql_mode` includes `STRICT_TRANS_TABLES`, otherwise invalid values are silently truncated.
- `sys.statements_with_full_table_scans`, `sys.schema_unused_indexes`, `sys.schema_redundant_indexes`; the slow query log in a controlled environment.
- Default isolation is `REPEATABLE READ`: gap locks on range updates can deadlock under load.
- Pool `maxLifetime` or recycle shorter than `wait_timeout`; replica reads after writes pinned to the primary.
- Application user without `SUPER` or DDL grants in production.

### SQLite and Cloudflare D1

- Local SQLite: `PRAGMA foreign_keys = ON` per connection (off by default); WAL mode for concurrent readers; `STRICT` tables or `CHECK`s, because column affinity accepts any type.
- D1 enforces foreign keys by default; migrations that rebuild a table use `PRAGMA defer_foreign_keys = true` for the duration.
- D1 has no interactive transactions: multi-statement writes must use `batch()`, which is atomic. A read, then a decision in Worker code, then a write is a race unless a constraint or a conditional `UPDATE ... WHERE` guards it.
- Query plans: `EXPLAIN QUERY PLAN <query>`; `SCAN <table>` on a large table means a missing index; `SEARCH ... USING INDEX` is the goal. D1 bills and limits by rows read, so a scan is a cost bug as well as a latency bug.
- Locally: `wrangler d1 execute <db> --local --command "EXPLAIN QUERY PLAN ..."`. Remote reads, including `wrangler d1 insights` where the installed wrangler has it, need the owner's go-ahead.
- Backups: Time Travel retention (`wrangler d1 time-travel info <db>`, read-only) and any export job. Size and row limits: check the current docs.

### MongoDB

- Every frequent query shape has an index: `db.<coll>.find(<filter>).explain("executionStats")` showing `COLLSCAN` on a large collection is a finding.
- Schema validation (`$jsonSchema`) on collections the code treats as structured.
- Arrays that grow without bound inside a document (document size limit, slow updates).
- Write concern for critical writes; multi-document transactions require a replica set.
- TTL indexes for expiring data; request bodies passed straight into filters (`$ne`, `$gt`) is a security lead for `lll:security`.

### Supabase

- Row-level security on every table in exposed schemas, with policies per verb (the security half goes to `lll:security`).
- Columns used in policies (`user_id`, `org_id`) are indexed; policies calling functions per row are a common slow path.
- `supabase db lint` against the local database; the dashboard's security and performance advisors (owner-observed).
- Pooler mode: transaction mode does not support session features such as prepared statements in some drivers.

### Firestore

- Composite indexes in `firestore.indexes.json` match the queries the code makes; missing ones fail at runtime.
- Sustained writes to one document beyond roughly one per second (counters, "last updated" docs) contend; use sharded counters.
- Unbounded collection reads without cursors; fan-out writes multiplying cost; reads inside security rules counting against limits.

### Redis

- Every cache key has a TTL; no `KEYS *` or `FLUSHALL` in application code (use `SCAN` and scoped deletes).
- `maxmemory-policy` matches the use: an eviction policy for caches, `noeviction` for queues and locks.
- Cache invalidated on every write path that changes the source; stampede protection on hot keys.
- Locks set with `SET key token NX PX <ms>` and released only by the holder (compare token, then delete, atomically).
- Pub/sub is fire-and-forget: anything that must not be lost uses Streams with consumer groups.
- Persistence (RDB or AOF) on when Redis holds data that is not a cache.

### On-device stores (SQLite, Room, Core Data, Realm)

- Every shipped schema version migrates to the current one: Room `MigrationTestHelper` tests, Core Data model versions with mapping or lightweight migration, SQLite `user_version` steps, Realm `schemaVersion`.
- `fallbackToDestructiveMigration()` in a release build deletes user data on upgrade: critical.
- No queries on the main thread (Room `allowMainThreadQueries()`); multi-row writes in one transaction.
- Sensitive data encrypted at rest where the threat model asks (SQLCipher, file protection classes); backup inclusion or exclusion is deliberate.

## ORM and framework commands

| Stack | Read-only checks | N+1 detection |
|---|---|---|
| Prisma | `prisma validate`; `prisma migrate status` (reads the database) | `log: ['query']` in a local run |
| Drizzle | `drizzle-kit check` | query logging |
| Django | `python manage.py makemigrations --check --dry-run`; `sqlmigrate` | `assertNumQueries`, `nplusone`, debug toolbar |
| SQLAlchemy and Alembic | `alembic check`; `alembic heads` | `lazy="raise"` on relationships in tests |
| Rails | `bin/rails db:migrate:status` | `bullet` or `prosopite` |
| Laravel | `php artisan migrate:status` | `Model::preventLazyLoading()` in non-production |
| Hibernate and Spring Data | `spring.jpa.properties.hibernate.generate_statistics=true` locally | statement counts per request |
| EF Core | `dotnet ef migrations has-pending-model-changes` (EF Core 8 and later) | `LogTo` with command counts |
| Go (`database/sql`, sqlx, GORM) | `migrate version` for golang-migrate | query logging around handlers |

Several of these import project code or connect to a database. Run them in the fix worktree or against a local database.

## Severity calibration

- **critical:** money stored as float in the ledger; a missing `UNIQUE` on an idempotency key lets a retry double-charge; a migration path or `fallbackToDestructiveMigration` that deletes user data; soft-deleted records returned to other users.
- **high:** a list endpoint with N+1 that times out at realistic data size; no index behind the main dashboard query on a table that grows daily; a multi-step write without a transaction that leaves half-written orders on error; serverless functions opening a connection per request against a capped server.
- **medium:** deep `OFFSET` pagination on an admin export; missing `CHECK` on a status column the code switches on; a pool size that exceeds the server limit only at peak.
- **low:** an unused index on a small table; a nullable column that is always set; a missing foreign key on a write-once audit table.

## False-positive traps

- Small, bounded tables do not need indexes; a sequential scan of 200 rows is fine.
- An N+1 over a fixed, small N (three settings rows) is not a finding.
- Some platforms or teams omit foreign keys deliberately (sharded stores, Vitess-based hosts); look for a documented decision before reporting.
- `idx_scan = 0` right after a stats reset or on a new table means nothing yet.
- ORM eager-loading may already batch the "loop" query; check the emitted SQL, not the code shape.
- Staging statistics may not reflect production data skew; say which environment the numbers came from.
