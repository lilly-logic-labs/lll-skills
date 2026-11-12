---
name: launch
description: Take a site or app live and check it. Covers pre-launch readiness, go-live smoke test, day 1, 7 and 14 audits, email and DNS (SPF, DKIM, DMARC). Use when about to launch, we're live, go-live checklist, is the site ready, emails go to spam, DNS cutover, day 7 check. Not for deploying a change (lll:ship), a security audit (lll:security) or mail-sending code (lll:cloudflare).
metadata:
  origin: lll
---

# Launch

Takes a site, web app, API or mobile app from "built" to "live and watched": a readiness check before go-live, a verified cutover, a canary watch, then short follow-ups on day 1, 7 and 14.
Every check ends as pass, fail, fixed, unverified or not applicable, with evidence. A 200 status alone is never evidence that the new release is live.

## When to use

- Before launch: "are we ready to go live", "launch checklist", store submission, DNS cutover, moving a domain.
- At launch: "we're live", "just launched", "went live", "is the site ready", "go-live audit".
- After launch: "day 1 / 7 / 14 check", "post-launch review", end of a client's free bug window.
- Mail problems on a new domain: "emails go to spam", "set up SPF DKIM DMARC", "transactional email not arriving".

## When not to use

- Shipping one change to an already-live product (verify, PR, deploy, canary of that change): `lll:ship`.
- A deep vulnerability review of the code or infrastructure: `lll:security`.
- Database health, dependency, performance or accessibility deep dives: `lll:audit`. Launch only checks the launch-critical slice of each.
- Ranking strategy, schema and content work: `lll:seo`. Launch only checks that the site is indexable.
- Analytics design and reading the numbers: `lll:analytics`. Launch only checks that tracking fires from production once.
- Backup restore proof: `lll:backup-drill`. Launch checks that backups exist and are scheduled.

## Modes

- **Guidance** (default): answer a launch question, say which stage applies and which checks matter for this product, or run one or two read-only probes (a header dump, a DNS lookup) and explain the result. Write no files, start no subagents.
- **Full**: only when asked for a full, whole, end-to-end or written launch run. Runs every check for the chosen stage, saves evidence, writes the report, fixes repo-side failures in a worktree and lists owner actions. Subagents are allowed (`../../shared/agents.md`); keep to one wide brief per area.

Read `../../shared/ground-rules.md` first. Production is read-only: a request to check the live site covers GET, HEAD and DNS lookups. Anything that writes (a form submit, sign-up, payment, restore, load test) needs an explicit OK in this conversation and clearly marked test data that is deleted afterwards.

## Steps

1. **Learn the target.** Follow `../../shared/stack-detect.md`. Find from the repo and conversation before asking: live and preview URLs (apex, `www`, app and API subdomains), deployed commit or version, host and stack, data stores and where their backups live, whether it has logins, payments, forms, email or personal data, and any store listing. Ask only for what is missing.
2. **Pick the stage.**

   | Situation | Stage | Checklist |
   |---|---|---|
   | Not live yet | pre-launch | `references/pre-launch.md` |
   | Cutover done or imminent | go-live (day 0) | `references/go-live.md`, then the watch in step 6 |
   | 1, 7 or 14 days after go-live | follow-up | `references/follow-up.md` |
   | Mail, SPF, DKIM, DMARC, deliverability | email and DNS | `references/email-dns.md` |

   An app takes a stage the same way; `references/platforms.md` holds per-host, desktop and mobile store notes. `references/legal-by-region.md` holds the legal and privacy pages to expect by jurisdiction.
3. **Decide what applies.** Skip a check only when it cannot apply, and say so in the report.

   | Product | Run | Usually skip |
   |---|---|---|
   | Static site | routes, redirects, TLS, headers, exposed files, SEO, a11y, monitoring | database, auth, payments |
   | Web app with accounts | everything | store listing |
   | Takes payments | add live-mode payment, webhook and refund-policy checks | none |
   | API or backend | health route, auth, rate limits, database, rollback, monitoring | SEO, a11y |
   | Mobile or desktop app | store or installer, signing, crash reporting, privacy forms, update path | DNS, SEO |
   | Sends email | `references/email-dns.md` | none |
4. **Run the checks and keep evidence.** Use `scripts/probe.mjs` for the repeatable web and mail probes (zero dependencies, Node 18 or later; read-only HEAD, GET and DNS):

   ```
   node scripts/probe.mjs web https://example.com
   node scripts/probe.mjs mail example.com --dkim selector1,selector2
   ```

   Use `curl -sI`, `dig` or `nslookup`, and `gh`/platform CLIs for the rest. For rendered pages, console errors, forms and 360 px phone width use `anthropic-skills:chrome-browser` or `anthropic-skills:built-in-browser`. Point to existing skills instead of redoing their work: `/security-review` for the code, `/code-review` on the commits that went live, `lll:seo` for indexing, `lll:audit` for performance and accessibility lenses. Save outputs with secrets and personal data removed. Full mode keeps them under `docs/audits/<date>-launch-<stage>/`.
5. **Classify.** Each failure is a finding in `../../shared/findings.md` format (lens `launch`). Severity: critical = site down, data exposed, card data stored, payments broken, site not indexable, mail from the domain rejected; high = no backup, no rollback, missing alerting, errors users will hit, security headers or TLS wrong; medium = SEO, performance or accessibility gaps; low = polish. Give the stage a verdict: **GO**, **GO with conditions** (list them) or **NO-GO**.
6. **Watch after cutover (go-live only).** Read `references/follow-up.md` section "Canary watch". Baseline before the release if possible. Poll key pages for 10 to 30 minutes with `node scripts/probe.mjs watch <urls> --every 60 --for 600`. Alert on change from baseline, not on absolute values; an alert needs two consecutive rounds. Prove the new revision is live with `--expect <commit-or-build-id>`. A confirmed critical alert means offer rollback; do not roll back without the owner.
7. **Fix and re-check.** Repo-side failures (a header, `robots.txt`, a redirect, a meta tag, an alert rule in code) follow `../../shared/fix-phase.md`. DNS, dashboards, secrets, registrar, store consoles, legal text and client decisions go to Owner actions with the exact blocker. After a fix, rerun the same check and replace the evidence.
8. **Write up.** Full mode writes `docs/audits/<date>-launch-<stage>.md` using `references/write-up-template.md` and `../../shared/report.md`. Name the next check and its date; offer to schedule it with the `schedule` skill.

## Rules that bite

- Staging leftovers are the classic launch bug: `Disallow: /` in `robots.txt`, `noindex`, test API keys, sandbox payment mode, staging URLs in emails and sitemaps, seed users. Check each one explicitly.
- Rolling code back does not roll back data. A launch is not ready until the rollback plan says what happens to a migration.
- Email on a new domain fails silently. Check SPF, DKIM and DMARC from a real received message, not only from DNS.
- Legal pages and consent rules vary by country and change; verify against the official source and flag text for the owner or counsel. Do not write legal text.
- Prices, plan limits and store rules change. When a check depends on a vendor limit, read the current vendor docs (context7 or the vendor's docs tool) rather than trusting memory.
- Do not run load tests, fuzzing or brute force against production. A "load sanity" check means a small, bounded request burst against staging, or reading the host's capacity limits.

## Output

- Chat summary: stage, verdict (GO / GO with conditions / NO-GO), counts of pass, fail, fixed, unverified and not applicable, critical and high items, owner actions, next check date.
- Full mode: the report at `docs/audits/<date>-launch-<stage>.md`, evidence under `docs/audits/<date>-launch-<stage>/`, and a fix branch and worktree when repo-side fixes were made.
