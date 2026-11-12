# Migration-safe changes

Schema, data, API, protocol, configuration and dependency transitions that can be rolled back, survive a rollout where old and new code run side by side, and never lose data. Review for this class of change belongs to the migration lens of `lll:audit`.

## Principles

- Every step has a forward path and a rollback path, written before the first edit.
- Existing data is preserved. Destructive steps are explicit and authorised separately by the owner.
- Mixed-version operation is safe wherever rollout overlaps (rolling deploys, app versions in the wild, caches, queued jobs, mobile clients that do not update).
- Sequence: **expand, migrate, verify, contract.** Never contract in the same release as expand.
- Retries are idempotent. Partial failure is observable and resumable.
- Do only the requested stage. Do not perform a later destructive contraction implicitly.

## Procedure

1. **Map the current state.** Who reads and who writes the thing: code paths, services, jobs, reports, exports, clients, third parties. The data shape and size. The compatibility window: how long old readers or writers can exist. Who owns it.
2. **Write the plan** in the PR or plan file: stages, what ships when, what runs when, the rollback for each stage, how success is checked, who is told.
3. **Expand** (additive, compatible with old code):
   - Add the new column, table, field, endpoint or setting as nullable or optional with a safe default. No rename, no type change in place, no drop.
   - Make new code tolerant: read new, fall back to old; accept both shapes on input.
   - Dual-write when both must stay in sync, behind a flag where possible.
4. **Migrate** (data and traffic):
   - Backfill in bounded batches with a resume cursor, throttled, off-peak, idempotent (`WHERE new IS NULL`). Measure lock time and replication lag on a copy of realistic size first.
   - Take a verified backup or snapshot before any transformation of existing data (`lll:backup-drill` for restore proof).
   - Switch reads to the new shape behind a flag; ramp gradually.
5. **Verify** with old and new paths at each stage: row counts and checksums between old and new, spot checks of real records, error rate and latency, a read through every consumer found in step 1. Keep the verification query in the PR.
6. **Contract** (separate release, after the window and a successful verify): stop dual-writes, remove old reads, then drop the old column, endpoint or setting. This is the destructive step: separate owner approval, a fresh backup, a rollback note ("restore from backup X; code revert Y").
7. **Stop** after the requested stage passes. Report what remains and when it is safe.

## By kind

| Kind | Safe pattern | Danger to check |
|---|---|---|
| Add column | nullable or default; no table rewrite on large tables | locks (some engines rewrite for non-null default); ORM that selects all columns |
| Rename column or table | add new, dual-write, backfill, switch reads, drop old later | any reader of the old name: reports, BI, triggers, raw SQL |
| Change type | add new column of new type, copy with cast, switch, drop | lossy casts; timezone and encoding shifts |
| Drop column | stop reading, stop writing, release, wait, then drop | rollback needs the data; backup first |
| Add NOT NULL / unique / FK | backfill first, add as unvalidated or concurrently, validate separately | existing violations; long locks |
| Index | build concurrently or online | write amplification; planner changes |
| API change | additive fields; version new behaviour; deprecate with dates and telemetry | clients that fail on unknown fields; mobile app versions in use |
| Event or queue message | new field optional; consumers first, producers second | in-flight messages in the old shape |
| Config or env | support both names for a release; default to old | missing value in one environment |
| Feature flag removal | flip to final state in prod for a window first | code paths only the old flag exercised |
| Dependency upgrade | one major at a time; read the changelog; lockfile diff; run the suite and a smoke test | transitive changes, peer ranges, platform minimums |
| Mobile local database | forward-only migration shipped with the app; handle skipped versions; keep a downgrade story or refuse it | users jump versions; a failed migration must not brick launch |
| Search index / cache | build the new index alongside, swap an alias, delete the old one later | double write cost, stale reads |

## Datastore notes

- PostgreSQL / MySQL: use online DDL options of your version; set statement and lock timeouts; avoid long transactions in backfills.
- SQLite / D1 / Turso: limited `ALTER`; table rebuild patterns need a transaction and a copy; check size limits and the platform's migration tooling (`lll:cloudflare` for D1).
- MongoDB / Firestore / DynamoDB: schema is in the code; version documents with a `schemaVersion` field and migrate lazily on read or by a batch job; update security rules and indexes in step with code.
- ORMs: never edit a migration that has run anywhere. Add a new one. Check the generated SQL, not just the model diff.

## Rollback rules

- Rollback is tested, not assumed. For each stage write the exact command or revert, and run it once on a copy.
- Code rollback must work with the data as it is after the migration step. If it does not, the step is not backward compatible; split it.
- When a step is a one-way door, say so plainly and get approval.

## Deliverable

Plan with stages and rollbacks; migration files; verification queries or scripts; the PR note listing which stage this change is, what is next, and what must wait for the window. Nothing destructive ships without owner sign-off in this conversation.
