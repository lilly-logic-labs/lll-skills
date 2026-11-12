---
name: backup-drill
description: Prove backups restore. Inventories every data store, restores into a non-production target, verifies counts and an app smoke test, measures RPO and RTO, writes a runbook. Use when asked to test backups, restore drill, disaster recovery, can we recover the database, is our backup real, D1 time travel restore. Not for database health or schema review (lll:audit) or a live outage (lll:debug).
metadata:
  origin: lll
---

# Backup drill

A backup nobody has restored is a hope, not a backup. This skill proves recovery: it finds every data store and its backup, restores a copy into a disposable non-production target, checks the copy against the source, times the recovery and leaves a runbook.
It never restores into production and never overwrites a live database.

## When to use

- "Test our backups", "restore drill", "disaster recovery", "can we recover the database", "is our backup real", "what is our RPO and RTO".
- Before a launch that holds user data, after changing database or hosting, before signing a service-level promise, or on a quarterly schedule.
- A client or auditor asks for proof of recoverability.

## When not to use

- Database health, indexes, migrations, query plans: `lll:audit` (db lens).
- A production data-loss incident happening now: `lll:debug` (incident mode). Come back here for the drill afterwards.
- Pre-launch or day-7 checklists that only need to know backups exist: `lll:launch`. It sends you here when a restore is unproven.
- Designing a new schema or storage: `lll:plan`.

## Modes

- **Guidance** (default): explain how to back up or restore a given store, review an existing backup setup against `references/`, or draft a plan and a runbook outline. Write no files, run no restores, start no subagents.
- **Full**: only when the user asks to run the drill. Inventories stores, restores into a scratch target, verifies, measures, cleans up and writes the runbook and report. Production reads (an export, a snapshot copy) need the owner's go-ahead in this conversation; subagents are allowed for independent stores (`../../shared/agents.md`, database work on the strongest model tier).

Read `../../shared/ground-rules.md` first. Two rules are absolute in this skill:

1. The restore target is a new, disposable instance, database, project, bucket or local container. Never a production target, never "restore in place" on a live database. Restore-in-place commands (for example D1 Time Travel `restore`, `pg_restore --clean`, `mongorestore --drop`, `redis` loading over a live data directory) are allowed only against a scratch copy created for the drill.
2. A restored copy holds real data. Treat it as production data: no logs, chat, reports or screenshots with row contents; delete it when the drill ends.

## Steps

1. **Fix the safety boundary.** List the production identifiers to protect: hostnames, database names, project ids, account ids, bucket names, connection-string fragments. Every target is checked before use:

   ```
   node scripts/drill.mjs guard --target "<target host, name or id>" --protect "<prod-host>,<prod-db>,<prod-project>"
   ```

   `BLOCK` means stop. The script never prints the target, so passwords in a connection string do not leak.
2. **Inventory data stores.** Use `../../shared/stack-detect.md` section 3 plus config, env examples, IaC and deploy files. For each store record: engine and version, host or provider, owner, size, what it holds (source of truth or rebuildable cache), personal data yes or no, and what depends on it. Include easy-to-forget stores: object storage, queues with durable messages, search indexes that cannot be rebuilt, secrets and encryption keys, on-device databases, files on a server disk, third-party SaaS data (payments, CRM, email lists).
3. **Find the backup mechanism per store.** Provider-managed (snapshots, point-in-time recovery), scheduled job, manual, or none. Evidence is a config path, a CLI listing or a console screenshot description, not a guess. Record schedule, retention, location (same account, region and provider as the primary or not), encryption and who holds the key, and whether a failed backup raises an alert. A store with no backup is a critical finding. Per-store commands are in `references/sql-stores.md`, `references/managed-and-edge.md`, `references/nosql-and-objects.md` and `references/mobile-on-device.md`.
4. **Set targets.** Find the stated RPO (how much data may be lost) and RTO (how long recovery may take) in docs, contracts or ADRs. If none exist, ask the owner for a number per store tier, or record "no target" as a finding. Pick the recovery point to restore: latest backup by default, plus a point-in-time target where the store supports it.
5. **Prepare the scratch target.** Create a new instance or local container with the same engine and major version, plus the extensions, roles and settings the app needs. Run the guard check. Disable side effects in the copy: outbound email, webhooks, queue consumers, cron, payment and notification keys, anything that would act on restored rows. Use dummy secrets.
6. **Restore, timed.** Record the start time and every manual step, including the ones that were slow to find (credentials, which backup, which flag). Use the store's recipe from `references/`. Stop the clock at "restored and reachable", then again at "app smoke test passes".
7. **Verify in layers** (`references/verify.md`): structure (schemas, tables, indexes, extensions, objects), counts and checksums against a source snapshot, invariants (foreign keys, uniqueness, totals that must balance), freshness (newest row timestamp, which gives the achieved RPO), then an app smoke test pointed at the copy (login, one read path per core feature, one write to the copy). Compare counts with:

   ```
   node scripts/drill.mjs compare source.tsv restored.tsv --lag
   ```
8. **Measure.** RPO achieved = failure time minus newest data in the restored copy. RTO achieved = end of smoke test minus decision to restore. Compare with targets:

   ```
   node scripts/drill.mjs timing --failure <iso> --backup-data <iso> --start <iso> --end <iso> --rpo-target 24h --rto-target 1h
   ```

   State what the number does not cover: restore size grows, humans were fast or slow on the day, the provider may queue large restores.
9. **Clean up.** Delete the scratch instance, downloaded dumps and temp credentials; confirm in the cloud console or CLI that nothing billable remains. Record what was deleted.
10. **Findings and runbook.** Turn gaps into findings (`../../shared/findings.md`, lens `backup`): no backup, backup never ran, backup unrestorable, restore slower than RTO, RPO over target, backup in the same failure domain as the primary, no alert on failed backups, keys not backed up, retention too short, blobs not covered. Write the runbook from `references/runbook-template.md`: someone who has never seen the system must be able to restore from it at 3 a.m. Fix repo-side gaps (backup job config, docs) via `../../shared/fix-phase.md`; dashboards, plans and credentials are Owner actions. Run `lll:docs` if the runbook changes documented procedures.

## What drills usually find

- The backup job has been failing for weeks and nobody was alerted.
- The backup is empty, truncated or from the wrong database.
- Roles, extensions, sequences, triggers, views or large objects were not in the dump.
- Object storage, uploaded files or the encryption key are not covered.
- The only backup sits in the same account or region as the primary, and one deleted account or bucket removes both.
- Restore takes ten times longer than the RTO claims, or needs a person who is on leave.
- Point-in-time recovery was never switched on, or the plan tier does not include it.
- The restored app boots but a migration or a hard-coded hostname points it back at production. The guard in step 1 and the side-effects list in step 5 exist for this.

## Output

- Chat summary: stores found, backed-up count, restored count, verification result per store, achieved RPO and RTO against targets, critical and high findings, owner actions, what was not drilled and why.
- Full mode: `docs/audits/<date>-backup-drill.md` per `../../shared/report.md`, the runbook at `docs/runbooks/restore-<store>.md` (or the project's existing runbook folder), and a record that scratch resources were deleted.
