# Pre-launch readiness

Run against staging, preview or the prepared production config, before DNS cutover or store submission. Nothing here writes to production. Each line ends pass, fail, unverified or not applicable, with evidence. The result is a verdict: GO, GO with conditions, NO-GO.

Contents: 1 Config and environments · 2 Secrets · 3 DNS and TLS · 4 Redirects and canonical host · 5 Crawling: robots and sitemap · 6 Analytics and tracking · 7 Legal and consent · 8 Error monitoring and alerts · 9 Data safety · 10 Rollback plan · 11 Load sanity · 12 Release content · 13 Store listing (apps) · 14 Go / no-go

## 1. Config and environments

- [ ] Every environment is named with its hostname and how it deploys (local, preview, staging, production). Production variables are listed in one place.
- [ ] Production env vars point at production services: live payment keys, production database, real email sender, production API base URLs. Grep the built output and env files for `localhost`, `127.0.0.1`, `staging`, `sandbox`, `test_`, `example.com`.
- [ ] No debug flags in production: `DEBUG`, verbose logging, dev toolbars, source-map upload to a public path, open admin or Swagger/GraphQL playground routes.
- [ ] Feature flags have a defined launch state, and anything half-built is off.
- [ ] Time zone and locale assumptions are explicit; scheduled jobs use the intended zone; dates render for the audience.
- [ ] Build is reproducible from a clean checkout with the documented command. The release candidate is one commit or tag, written down.
- [ ] Seed, demo and test data are absent from the production data set (test users, fake orders, `@example.com` addresses, lorem ipsum).

## 2. Secrets

- [ ] Production secrets live in the platform secret store (Worker secrets, host env settings, a vault), not in the repo, not in `vars`, not in the client bundle.
- [ ] Search the built client bundle and the repo for key patterns by name only: `sk_live`, `service_role`, `PRIVATE KEY`, `AKIA`, `ghp_`, `xoxb-`. Report location and type, never the value.
- [ ] Keys used in staging are not reused in production; any key that ever appeared in a log, chat or commit is rotated before launch.
- [ ] CI and deploy tokens are scoped to what they need; no global/root key in CI.
- [ ] Who can rotate each secret, and how, is written down.

## 3. DNS and TLS

- [ ] Registrar: auto-renew on, registrar lock on, renewal date and account owner recorded, two-factor on the registrar account.
- [ ] Records planned and diffed against current ones before the change: apex, `www`, app and API hosts, mail records (see the email checklist), verification TXT records you must not delete.
- [ ] TTL lowered 24 to 48 hours before cutover (to 300 s), and raised again a day after a clean launch.
- [ ] Certificate issues automatically for every hostname, including `www` and subdomains; renewal is automatic; the proxy/CDN TLS mode validates the origin certificate (for Cloudflare: Full (strict), never Flexible).
- [ ] CAA record, if used, allows the CA your host uses to issue.
- [ ] No dangling CNAME or A records pointing at deleted services (subdomain takeover).
- [ ] The old site or host stays reachable until the new one is verified, so rollback is a DNS change.

## 4. Redirects and canonical host

- [ ] One canonical origin chosen (apex or `www`, HTTPS). `http`, the other host and any old domains reach it in one hop with a 301.
- [ ] Old URLs from a previous site map to their new equivalents (a redirect map checked against the old sitemap or analytics top pages). Count 404s on those after launch.
- [ ] Trailing slash and case rules are consistent; no redirect loops; query strings survive redirects where needed (UTM, auth callbacks).
- [ ] A real 404 status for missing pages (not a 200 "soft 404"), with a useful 404 page.
- [ ] `www`/apex and `http`/`https` for every domain you own, including typo and legacy domains, are handled deliberately.

## 5. Crawling: robots and sitemap

- [ ] `robots.txt` on the production host allows crawling. Staging's `Disallow: /` is the most common launch mistake; staging itself should stay blocked or password protected.
- [ ] No `noindex` in meta tags or `X-Robots-Tag` on pages meant to rank. Preview and `*.pages.dev`, `*.workers.dev`, `*.vercel.app` style hosts are protected or `noindex`.
- [ ] `sitemap.xml` lists only canonical 200 URLs on the production host and is referenced from `robots.txt`.
- [ ] AI crawler policy is deliberate (allow or disallow each named crawler); `lll:seo` owns the strategy.
- [ ] Canonical tags are self-referencing on production URLs, not staging.

## 6. Analytics and tracking

- [ ] Analytics is configured for the production hostname only and does not count staging, localhost or your own traffic.
- [ ] Key events (sign-up, purchase, form submit, call or chat click) exist and fire once each; consent gating matches the legal setup below. `lll:analytics` owns the design.
- [ ] Search Console and Bing Webmaster properties are ready to verify; ad pixels use production IDs.
- [ ] UTM links exist for the launch posts, emails and ads.

## 7. Legal and consent

- [ ] Privacy policy, terms and cookie/consent notice are live, linked in the footer, and name the real legal entity, address and contact. The legal reference (linked from SKILL.md) lists what each region expects.
- [ ] Consent is collected before non-essential tracking where the law requires it.
- [ ] A named contact exists for privacy requests, complaints and security reports (`/.well-known/security.txt`).
- [ ] Refund, cancellation, shipping and returns policies are live if the product sells anything; payment providers usually require them.
- [ ] Image, font, icon and code licences are cleared for every asset shipped.
- [ ] Text that needs a lawyer or the owner is flagged; the agent does not author it.

## 8. Error monitoring and alerts

- [ ] Error tracking receives a deliberate test error from the production build (server and client).
- [ ] Uptime monitor on the home page and one health route, alerting to a channel someone reads.
- [ ] Alerts exist for error-rate spikes, failed jobs/queues/crons, certificate expiry, domain expiry, and database or plan limits.
- [ ] Billing alerts and a hard cap on pay-per-use services (AI APIs, email, SMS, serverless) so a bug or abuse cannot run up a bill.
- [ ] Logs are retained for the period the owner or regulator needs, with secrets and personal data scrubbed.
- [ ] An incident contact and a first-response runbook exist, with a message template for users or the client.

## 9. Data safety

- [ ] Every data store has a backup that runs on a schedule, with retention stated. Where the backup lives is a different account, region or provider from the primary when possible.
- [ ] Point-in-time recovery is on if the plan offers it; the plan tier that provides backups is the one in use (free tiers often have none).
- [ ] At least one restore has been proven in a non-production target: run `lll:backup-drill`. If not proven, the verdict is GO with conditions at best.
- [ ] Migrations match the repo on the production database; the migration for this release has a tested way back or is additive only.
- [ ] Least-privilege database role for the app; row-level security or tenancy checks tested with a normal user's credentials.
- [ ] Uploaded files and object storage have their own backup or versioning; they are usually not part of database backups.

## 10. Rollback plan

- [ ] The previous working version is identified (tag, version id, deployment id) and the exact rollback command or console path is written down.
- [ ] Someone has rehearsed it once on staging or preview.
- [ ] Database changes in this release are additive or reversible; destructive migrations wait until after the rollback window.
- [ ] A maintenance page or kill switch (feature flag) is ready.
- [ ] The decision rule is written: which signals trigger rollback, who decides, how long to wait.
- [ ] DNS rollback: old target recorded, TTL low, old host still serving.

## 11. Load sanity

- [ ] Expected launch traffic is estimated (announcement size, campaign spend, mailing list) and compared with the host's limits: requests, concurrency, database connections, rate limits of third-party APIs, email-per-day caps.
- [ ] Caching and CDN rules are on for static assets and cacheable pages.
- [ ] If a load test is wanted, it targets staging, is bounded, and uses the project's own tool. No load tests against production.
- [ ] Expensive endpoints (search, export, AI calls, signup, password reset, OTP) have rate limits and bot protection.

## 12. Release content

- [ ] Placeholder copy, test banners, broken links, missing images and "coming soon" sections are gone; the crawl of staging shows no internal 404s or mixed content.
- [ ] Forms deliver to the right inbox and a human knows to read it; auto-replies work; spam protection is on.
- [ ] Accessibility basics pass on the key pages (keyboard, focus, contrast, labels); deeper review is `lll:audit`.
- [ ] Open Graph and Twitter card tags and the 1200 by 630 share image exist; titles and descriptions are unique.
- [ ] Favicon, app icons, manifest and theme colour are set.

## 13. Store listing (apps)

Apple App Store, Google Play, Microsoft Store, Mac App Store, direct download. Per-platform detail is in the platforms reference linked from SKILL.md.

- [ ] Listing text, screenshots for every required device size, preview video, icon, category, age rating and support URL are complete.
- [ ] Privacy policy URL, data-safety (Play) and privacy nutrition label (Apple) answers match what the app and its SDKs actually collect.
- [ ] Test account and review notes are supplied if the app needs a login or special hardware.
- [ ] Release is signed with the production key; the key and its backup are held by the owner; upload keys and signing keys are known apart.
- [ ] Staged rollout or phased release is chosen; the crash-free target and the halt rule are written.
- [ ] Crash reporting and analytics are on in the release build and receive a test event.
- [ ] Minimum OS/API level, permissions requested and background modes are justified in the listing.
- [ ] Update path tested: install the previous build, update to the new one, data survives.

## 14. Go / no-go

- NO-GO if any critical finding is open: staging config in production, no backup, no rollback, mail from the domain would be rejected, site blocked from crawling, secrets in the client bundle, or a payment flow not proven in live mode on a test order.
- GO with conditions when high items have an owner, a date and a mitigation.
- GO when the rest is pass, fixed or not applicable with a reason.
- Record the cutover time, who is watching, and the channel for updates before the switch.
