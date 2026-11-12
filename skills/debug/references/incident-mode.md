# Incident mode

Production is hurting users now. Order of work: stop the damage, understand it, fix it, learn from it. Mitigation is not the fix, and the fix is not the postmortem.

## Rules

- Production is read-only for investigation unless the owner approves a specific change in this conversation. Rollbacks, flag flips, scaling and failovers are production writes: ask, with the exact command and its undo, then act.
- Never delete evidence. Snapshot logs, metrics and a database state (read-only dump of affected rows' shape, not personal data) before restarting anything.
- Secrets and personal data stay out of chat, tickets and the report. Describe shapes and counts.
- One person coordinates. Everyone else investigates or communicates. Do not do all three alone if there are others.
- Stay calm and write things down with timestamps.

## 1. Declare and size it (first 5 minutes)

Answer in one line each:
- **What** is broken, in user terms ("checkout returns 500 for card payments")?
- **Since when**? First bad log line, first alert, first user report. Use UTC.
- **Who**: all users, one tenant, one region, one app version, one device class?
- **How bad**: severity.

| Severity | Meaning |
|---|---|
| SEV1 | Core flow down or data loss, security exposure, money wrong, most users |
| SEV2 | Core flow degraded, large minority, workaround exists |
| SEV3 | Minor feature, small group, no data risk |

Security exposure or possible data leak: tell the owner immediately; handing it to `lll:security` is part of the response.

## 2. Mitigate first

Pick the safest action that stops the harm, in this order:

1. **Roll back** the last deploy, migration-compatible only (see migration-safe rules in `lll:build`; a rollback that the data cannot survive is not a mitigation).
2. **Turn off** the feature flag or the failing integration; degrade gracefully.
3. **Shed load**: rate limit, queue, pause the job, put the feature behind maintenance.
4. **Scale or fail over**: only if the cause is capacity, not a bug that scales with it.
5. **Hotfix forward**: only when rollback is impossible and the fix is understood and small.

After the action, verify with the same signal that showed the problem (error rate, synthetic check). If it did not move, undo it and say so; the cause is something else.

## 3. Find the cause

Same method as ordinary debugging, with a time bias:

1. **What changed** near the start time: deploys, config, flags, migrations, dependency or runtime updates, certificates and tokens expiring, traffic spikes, third-party status pages, cron jobs, data size thresholds, DNS, quota limits.
2. **Compare** healthy and unhealthy instances, users or tenants. The common difference is the suspect list.
3. **Follow one failing request** end to end by correlation id: edge, app, queue, database, third party.
4. **Hypothesis log** with timestamps (see `root-cause-tracing`'s template idea: claim, probe, result).
5. Use the **blast radius** recipe below before declaring it understood.

### Blast radius recipe

Run these checks after you think you know the cause, and again after the fix.

1. **Who else is affected?** Query by the cause's signature (error string, version, tenant, code path), not by the first complaint. Count users, tenants, requests, records.
2. **What else calls the same code?** Grep callers, jobs, scripts, webhooks, mobile versions in the field, admin tools.
3. **What data is wrong now?** Rows written during the window with bad values, duplicates, missing side effects (emails not sent, payments not captured). List them by id range and time window. Repair is a separate, reviewed change (backfill under migration-safe rules), with a backup first.
4. **What else could break the same way?** Other places with the same pattern; other environments (staging, other regions); same bug in the sibling platform (web vs mobile).
5. **What did the mitigation affect?** Rolled-back features, disabled flags, queued work that now needs replay.

## 4. Fix

- Reproduce in staging or locally from the evidence. Write the regression test first.
- Smallest correct change at the origin. Ship through the normal gates (`lll:ship`); incident pressure is not a reason to skip tests.
- Roll out gradually if the system allows, watching the same signal as in mitigation.
- Confirm recovery: error rate back to baseline for at least one full normal cycle, queues drained, affected records repaired, customers who were told get an all-clear.

## 5. Communicate

Short updates at a fixed cadence (every 30 minutes for SEV1, every hour for SEV2), even when nothing changed.

```
[HH:MM UTC] Status: investigating | mitigated | resolved
Impact: <who, what, how many>
Cause: <known | suspected | unknown>
Action: <what is being done>   Next update: <HH:MM UTC>
```

No speculation presented as fact. No blame. No secrets.

## 6. Timeline

Keep as you go (this becomes the postmortem):

```
HH:MM  detected by <alert | user | monitoring>
HH:MM  declared SEV<n>, <coordinator>
HH:MM  hypothesis: <...>  result: <...>
HH:MM  mitigation: <action>  effect: <...>
HH:MM  root cause identified
HH:MM  fix deployed
HH:MM  recovery confirmed
```

## 7. Postmortem

Within a few working days, while memory is fresh. Blameless: describe how the system allowed it, not who made the change. Save as `docs/audits/<YYYY-MM-DD>-debug-<slug>.md` (see `../../../shared/report.md`) or where the project keeps incident notes.

```markdown
# Postmortem: <title> (<YYYY-MM-DD>)

## Summary
<Two or three sentences: what broke, for whom, for how long, how it was fixed.>

## Impact
- Duration: <start> to <end> UTC (<minutes>)
- Users / tenants / requests affected: <numbers>
- Data or money impact: <numbers, repair status>
- Severity: SEV<n>

## Timeline (UTC)
<From section 6.>

## Root cause
<The mechanism, with path:line, in plain language. Include the triggering condition.>

## Why it was not caught
<Missing test, missing alert, review gap, config difference between staging and production, untested rollback, etc.>

## What went well
- <detection, tooling, response>

## What went badly
- <slow detection, unclear ownership, missing runbook>

## Where we got lucky
- <things that could have made it worse>

## Actions
| Action | Type (prevent / detect / mitigate / process) | Owner | Due | Ticket |
|---|---|---|---|---|

## Supporting data
<Queries, graphs, links. Shapes and counts only; no personal data or secrets.>
```

Good actions are specific and small ("add an alert on checkout 5xx over 2 percent for 5 minutes"), have an owner and a date, and cover all four types. "Be more careful" is not an action.

## Close

Resolved means: users fine, signal at baseline, data repaired or queued for repair, postmortem scheduled, actions ticketed, temporary mitigations either made permanent or removed with a ticket to do so.
