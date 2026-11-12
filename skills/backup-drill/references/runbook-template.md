# Runbook and drill record templates

## Restore runbook

One runbook per store, or one per system with a section per store. Path: `docs/runbooks/restore-<store>.md` unless the project has a runbook folder. Write it so that someone who has never seen the system can follow it at 3 a.m. with only the runbook and their own access. Every command must be copy-pasteable and every placeholder named.

```markdown
# Restore: <store name>

Last drilled: <YYYY-MM-DD>   Drilled by: <name or agent>   Next drill due: <date>
Targets: RPO <duration>, RTO <duration>   Achieved at last drill: RPO <d>, RTO <d>

## When to use this
<The situations: data deleted, corruption, region loss, bad migration, ransomware. And when NOT to: do not restore over a live database to "try"; ask for approval first.>

## Who and what you need
- Decision maker: <role>   Backup operator: <role>   Contact: <channel>
- Access: <account, role, console path>, held by <where credentials are kept, not the credentials>
- Tools and versions: <pg_restore 16, wrangler 4.x, gcloud ...>
- Time and disk: restore of <size> took <duration> at the last drill; scratch host needs <resources>

## Where the backups are
| Backup | Location | Schedule | Retention | Encrypted with | How to list |
|---|---|---|---|---|---|

## Decide the recovery point
<How to choose the latest good backup or a point-in-time. How to find the time of the bad event. What data will be lost between that time and the recovery point.>

## Steps: restore into a new target first
1. <Create the new target: command.>
2. <Fetch the backup: command.>
3. <Restore: command.>
4. <Verify: queries and expected results, smoke test.>
5. <Decide: cut over or copy back.>

## Cut over (production, with approval)
<The exact way production is pointed at the restored target or the data is copied back, what is paused first, how long the write freeze lasts, how to roll this back.>

## After
- Re-enable jobs, queues and webhooks in this order: <list>
- Replay user erasure requests since the recovery point
- Tell: <who>; record the incident and the data window lost
- Delete the old or scratch resources after <n> days

## Known problems
<Everything the last drill taught: slow steps, missing roles, extension versions, flags that failed.>
```

## Drill record

Added to the written report (`../../../shared/report.md`) as its own section, one row per store.

```markdown
## Drill record
| Store | Backup used (id, time) | Method | Target (scratch, guarded) | Restore time | Smoke test passed at | RPO achieved / target | RTO achieved / target | Verification | Cleaned up |
|---|---|---|---|---|---|---|---|---|---|

### Inventory
| Store | Engine and version | Holds | Personal data | Backup mechanism | Alerts on failure | Same failure domain as primary |
|---|---|---|---|---|---|---|

### Not drilled
<Stores skipped and why, with the risk that leaves.>

### Scratch resources deleted
<List with time and how it was confirmed.>
```

Findings use lens `backup` with the failure scenario spelled out, for example: "The only database backup is the provider's daily snapshot in the same account; a deleted account or a billing suspension loses both the database and its backups."
