# Canary: watch a deploy

Watch the live system after a deploy and alert on a change from how it behaved before, not on absolute thresholds. Read-only: it observes and reports; a person decides about rollback.

## Rules

- Read-only checks only. GET requests and reads of dashboards, logs and error trackers. No writes, no load, no login automation against production unless the owner approves that exact check.
- Production checks need the owner's go-ahead in this conversation (`../../../shared/ground-rules.md`).
- Alert on **change versus baseline**. A page that was slow before the deploy is not a regression.
- Alert only after the same problem appears on **two consecutive checks**. A single blip is logged, not alerted.
- Never print secrets, tokens or personal data from pages, logs or traces.
- The canary never rolls back by itself.

## 1. Baseline (before the deploy)

Capture, for each target, what normal looks like now:

| Signal | How |
|---|---|
| HTTP status of key URLs | `../scripts/canary.mjs baseline` |
| Latency (median and max of 5 samples) | same script |
| Expected content on key pages | `contains` text in the config |
| Error rate and error types | Error tracker or logs, last hour |
| Crash-free sessions (mobile) | Store console or crash reporter |
| Key business metric (sign-ups, checkouts per minute) | Analytics, same hour last week |
| Queue depth and job age | Queue dashboard |
| Browser console errors on key pages | Manual or browser tool |

Config file `canary.json` (kept outside the repository unless the project wants it):
```json
{"targets":[
  {"name":"home","url":"https://example.com/","contains":"Sign in"},
  {"name":"health","url":"https://example.com/health","expectStatus":200},
  {"name":"api-list","url":"https://example.com/api/items?limit=1"}
]}
```

```
node scripts/canary.mjs baseline --config canary.json --out baseline.json --samples 5
```

If a baseline target is unreachable, fix that or drop it before the deploy; you cannot compare against nothing.

## 2. Watch (after the deploy)

```
node scripts/canary.mjs watch --config canary.json --baseline baseline.json --interval 60 --rounds 10
```

- Each round makes one GET per target.
- Flags raised per target and round: `unreachable` (network error or timeout), `status` (differs from the baseline status or `expectStatus`), `content` (expected text missing), `slow` (slower than the larger of 2.5 times the baseline median or the baseline median plus 300 ms; tunable with `--latency-factor` and `--slack-ms`).
- An `ALERT` line appears when the same flag shows on `--confirm` consecutive rounds (default 2). Exit code 1 means at least one alert; 0 means none; 2 means setup error.
- Choose the window: 10 minutes for a small change, 30 to 60 for a risky one, longer when traffic is low and the signal is slow to appear.

Beyond the script, compare by hand at the same cadence:
- Error tracker: new issue types, error count against baseline, release tag filter.
- Logs: new exception classes, 5xx rate, timeouts.
- Metrics: latency percentiles, saturation (CPU, memory, connections), queue age.
- Mobile: crash-free rate and ANR rate from the staged rollout cohort versus the previous version.
- Business metric: conversion or throughput versus the same hour last week.

## 3. Severity and response

| Observation | Action |
|---|---|
| Core flow failing, data wrong, security exposure | Tell the user now. Recommend rollback. Treat as an incident (`lll:debug`) |
| Error rate or latency clearly above baseline for two checks | Tell the user. Recommend investigating, with rollback ready |
| One failing check, then clean | Log it. Keep watching |
| Slightly slower, within noise | Note it. Keep watching |
| New low-volume error type | Note it; open a follow-up |

When alerting, give: what changed, the numbers against baseline, since when, which checks confirmed it, and the options (roll back, investigate, accept) with a recommendation. The user decides.

## 4. Finish

- Window ends clean: say so, with the number of checks and the worst latency seen.
- Ramp the rollout up if staged.
- Record in the deploy notes: SHA, window, outcome.
- Remove temporary dashboards and silenced alerts you created.

## Report template

```
Canary: <environment>, deploy <sha>, window <start> to <end> UTC
Baseline: <targets with status and median ms>
Checks: <rounds> rounds, <alerts> alerts, worst latency <ms> (<target>)
Other signals: <error tracker, logs, business metric, crash-free>
Verdict: healthy | alert raised (<what>) | rolled back at <time> by <person>
Follow-ups: <list>
```
