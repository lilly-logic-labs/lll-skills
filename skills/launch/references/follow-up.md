# Follow-up checks and canary watch

Contents: Canary watch · Alert rules · Day 1 · Day 7 · Day 14 · Deploy patterns and rollback · Comparing with day 0

## Canary watch

Right after cutover, watch the live site for 10 to 30 minutes. This is a health check; a baseline makes it a comparison.

1. **Baseline** (before the release if possible): for each key page record status, response time, a title or content marker, console error messages and broken links. `node scripts/probe.mjs watch <urls> --write-baseline docs/audits/<date>-launch-day0/baseline.json --for 0` saves status, latency and content fingerprint; the browser skills add console errors and screenshots.
2. **Pick pages**: home, the main conversion page, sign-in, one authenticated page, one API/health route. Skip anything with side effects (logout, delete, unsubscribe links).
3. **Prove the revision**: pass the commit, build id or version string with `--expect <text>`. A reachable URL does not prove the new release is live; platforms with auto-deploy need the deployment record for the release commit, not a time delay.
4. **Poll**: `node scripts/probe.mjs watch https://example.com/,https://example.com/pricing --every 60 --for 600 --baseline <file> --expect <build-id> --out watch.json`.
5. **Decide**: see alert rules. Exit code 0 healthy, 1 degraded, 2 broken.
6. **Browser pass** once at the start and once at the end: console errors on each key page at desktop and 360 px (`anthropic-skills:chrome-browser` or `anthropic-skills:built-in-browser`), plus a screenshot per page as evidence.
7. **Update the baseline** only after a healthy run, and only with the owner's agreement; never overwrite it while monitoring.

## Alert rules

- Alert on change from baseline, not on absolute numbers. Three console errors in the baseline are fine if there are still three; one new error is an alert.
- Do not cry wolf: a pattern must persist for two consecutive rounds before it is confirmed. The first sighting is "pending".
- Severities: **critical** page unreachable, 5xx, wrong revision after the deploy settled; **high** new console error, status code changed, expected content missing; **medium** latency more than 2 times the baseline (1.5 times is normal variance); **low** new broken link.
- Overall status: BROKEN if any confirmed critical; DEGRADED if any other confirmed alert; otherwise HEALTHY. Resolved incidents are listed, not erased.
- A confirmed critical or high alert goes to the owner with the evidence and three options: investigate, keep watching, roll back. Never roll back or revert without the owner.

## Day 1

Re-run: routes and forms (go-live section 1), bugs and errors (4), performance (5), monitoring (8). Then:

- [ ] Error logs and console errors from real traffic read; top error groups triaged.
- [ ] Forms and transactional email delivered for real users; bounce and complaint rates within limits; DMARC reports begin to arrive.
- [ ] Search Console shows the sitemap read; coverage has no blanket "blocked by robots" or "noindex" errors.
- [ ] Alerts fired at least once in a test and reached a human.
- [ ] Redirect map: 404 log checked for old URLs that matter.
- [ ] Billing so far matches the expectation; no runaway usage.
- [ ] Mobile apps: crash-free sessions in the first day, review feedback, staged-rollout decision.

## Day 7

- [ ] Search Console coverage and crawl errors; indexing of key pages.
- [ ] Core Web Vitals from real users if traffic is enough; otherwise lab values again.
- [ ] A backup ran on schedule and a restore was proven in a non-production target (`lll:backup-drill`) if not done.
- [ ] Spend against the plan; limit alerts tested.
- [ ] DMARC reports reviewed: unknown senders, alignment failures; plan the move from `p=none` to `quarantine`.
- [ ] Support inbox, form entries and review comments triaged into bugs, with owners.
- [ ] Dependency and security advisories since launch checked.
- [ ] Analytics sanity: sessions plausible, conversion events firing once, internal traffic excluded.

## Day 14

- [ ] Every open item from earlier reports is closed or moved to a ticket with an owner.
- [ ] For client work, the free bug window closes today: bugs that do not work as agreed are fixed free; new requests become scoped work. Hand over the final report and credentials list (`lll:handover`).
- [ ] TTLs, temporary rules, test accounts and launch-only flags are cleaned up; HSTS max-age is raised if it was started low.
- [ ] Decide the long-term cadence: monthly dependency and certificate review, quarterly restore drill, DMARC tightened.

## Deploy patterns and rollback

Choose the pattern before launch; the rollback differs.

| Pattern | Use when | Rollback |
|---|---|---|
| Atomic swap / immutable deploy (Workers, Vercel, Netlify, container image) | most web apps | redeploy the previous version id or image tag |
| Blue/green | two full environments, instant switch | flip the router or DNS back |
| Rolling | many instances, tolerates mixed versions | halt and roll the previous image |
| Canary / staged rollout | risk is high or traffic is large; app stores | stop the rollout, shift traffic to the old version, halt the store release |
| Feature flag | code ships dark | turn the flag off |

Rules that hold across patterns:

- Rolling code back does not undo data. Ship additive migrations first (expand), switch code, then remove old columns later (contract).
- Health checks gate promotion: the instance must pass a readiness route that exercises its dependencies.
- Known rollback commands: Workers `wrangler versions list` then `wrangler rollback <version-id>`; Vercel `vercel rollback`; Netlify restore a previous deploy in the dashboard or API; containers redeploy the previous tag; Kubernetes `kubectl rollout undo deployment/<name>`; otherwise revert the commit and redeploy. Run these only with the owner's approval in this conversation.
- A revert commit is a new deploy: monitor it like a launch. Record the original release id in the report.

## Comparing with day 0

Day 7 and 14 reports diff their evidence against day 0 (headers, redirect chains, DNS records, route statuses, vitals). Anything that changed without a release is a finding: a certificate swap, a CDN rule edit, a DNS record changed by another service.
