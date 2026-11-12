# Launch write-up template

Path: `docs/audits/<YYYY-MM-DD>-launch-<stage>.md` (stage: pre-launch, day0, day1, day7, day14). Evidence folder next to it: `docs/audits/<YYYY-MM-DD>-launch-<stage>/` with `headers.txt`, `redirects.txt`, `dns.txt`, `mail-auth.txt`, `watch.json`, `console-errors.txt`, screenshots. Remove secrets and personal data from all evidence. Day 7 and 14 write-ups diff against the day 0 evidence.

```markdown
# Launch: <site or app> (<stage>, <YYYY-MM-DD>)

<stack-detect block from ../../shared/stack-detect.md>
URL: <origin(s)>   Release: <commit, version or build id>   Host: <platform>

## Summary
- Verdict: GO | GO with conditions | NO-GO   (pre-launch)   or   HEALTHY | DEGRADED | BROKEN   (watch)
- Checks: pass <n>, fixed <n>, fail <n>, unverified <n>, not applicable <n>
- Findings: critical <n>, high <n>, medium <n>, low <n>
- Next check: <stage> on <date>, look at: <items>

## Conditions and open items
| Id | Severity | Check | Evidence | Fix or blocker | Owner | Due |
|---|---|---|---|---|---|---|

## Findings
<finding blocks from ../../shared/findings.md, lens "launch", ranked by severity>

## Fixed during this run
| Check | What changed | Commit | Re-check evidence |
|---|---|---|---|

## All checks
### <Section, for example Smoke>
- [x] <check>: <evidence>
- [ ] <check>: FAIL <evidence>
- [~] <check>: unverified, <why>
- [-] <check>: not applicable, <why>

## Email and DNS
| Record | Value summary | Result |
|---|---|---|
| MX | | |
| SPF (lookups n/10) | | |
| DKIM (selectors) | | |
| DMARC (policy, rua) | | |
| Received test message | spf / dkim / dmarc | |

## Owner actions
<DNS, dashboards, secrets, store consoles, legal text, client decisions, one line each with the exact blocker>

## Needs decision
<question and options>

## Coverage
- Checked: <stages, pages, hosts, stores>
- Not checked, and why: <items>
- Commands run (read-only): <list>
```

Chat summary after writing: verdict, counts, critical and high items, owner actions, next check date, and the file path.
