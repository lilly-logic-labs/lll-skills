# Go-live checks (day 0)

Run on the real domain right after cutover. `$U` is the live origin, for example `https://example.com`. Everything here is a GET, HEAD or DNS lookup; steps that write need the owner's OK and marked test data. `node scripts/probe.mjs web $U` covers sections 1, 2 (headers, TLS, exposed files) and 6 in one run.

Contents: 1 Smoke · 2 Security · 3 Database and backups · 4 Bugs and errors · 5 Performance · 6 SEO · 7 Accessibility · 8 Monitoring and operations · 9 Analytics · 10 Rollback and handover · 11 Mobile and desktop apps

## 1. Smoke

- [ ] Key routes return 200 on the production domain: `curl -s -o /dev/null -w "%{http_code} %{url_effective}\n" $U/<route>`.
- [ ] `http://`, `www` and bare host all reach one canonical HTTPS URL in one hop: `curl -sIL http://example.com | grep -iE "^(HTTP|location)"`.
- [ ] A missing page returns a real 404 status with the custom page.
- [ ] The deployed revision is the intended one: compare a version endpoint, build id in the page source, asset hash or deployment id with the release commit. A 200 proves reachability only.
- [ ] Forms submit end to end and the message reaches the right inbox, not spam (test entry, then delete).
- [ ] Sign-up, sign-in, password reset and sign-out work if there are accounts. Reset and verification emails link to the production domain.
- [ ] One live-mode payment succeeds if the site sells; the webhook arrives and its signature verifies. A live refund moves real money and needs the owner's OK.
- [ ] Transactional emails send from the production domain with working links (no `localhost`, no staging host).
- [ ] No staging leftovers: test banners, lorem ipsum, debug toolbars, seed users, test products, sandbox keys.
- [ ] Scheduled jobs fire at the intended local time.

## 2. Security

Headers from `curl -sI $U`; Mozilla Observatory or securityheaders.com gives a one-line summary as extra evidence.

- [ ] `Strict-Transport-Security` with `max-age` of at least 31536000. Add `includeSubDomains` only when every subdomain is HTTPS; add `preload` only on purpose. On a first rollout start low (86400) and raise it.
- [ ] `Content-Security-Policy` set, avoiding `unsafe-inline` for scripts where possible; `frame-ancestors` in it, or `X-Frame-Options`.
- [ ] `X-Content-Type-Options: nosniff`; `Referrer-Policy: strict-origin-when-cross-origin` or stricter; `Permissions-Policy` limits camera, microphone and geolocation to what the site uses.
- [ ] No `Server` or `X-Powered-By` header naming versions.
- [ ] Certificate valid, auto-renewing, covers every hostname; TLS 1.2 or higher only.

Exposed files must answer 404 or 403: `/.env`, `/.git/HEAD`, `/.DS_Store`, `/package.json`, `/wrangler.toml`, `/wrangler.jsonc`, `/backup.zip`, `/db.sqlite`. A single-page app that answers 200 with HTML for every path is not a leak; check the body, not only the status.

- [ ] Source maps public only on purpose: `curl -sI $U/<bundle>.js.map`.
- [ ] Preview, staging and platform default hostnames are disabled, protected or `noindex`.
- [ ] `/.well-known/security.txt` is served as `text/plain` with `Contact:` and an `Expires:` less than a year away.
- [ ] No secrets in the client bundle or repo history (location and type only in the report).
- [ ] Application basics, tested logged out and as a normal user: admin routes need auth; every API checks record ownership (change an id, expect 403 or 404); session cookies are `Secure`, `HttpOnly`, `SameSite=Lax` or `Strict`; CORS allows only own origins (never `*` with credentials); login, reset, OTP and contact forms are rate limited; uploads check type and size; webhooks verify signatures.
- [ ] Payments: no card numbers stored in the database or logs; use the gateway's tokens.
- [ ] Third-party scripts from a CDN carry `integrity` and `crossorigin`, or are self-hosted.
- [ ] Dependency audit shows nothing critical or high left unexplained: `npm audit --omit=dev`, `pnpm audit --prod`, `pip-audit`, `govulncheck ./...`, `cargo audit`, `bundle audit`, `composer audit`, `dotnet list package --vulnerable`.
- [ ] CDN/WAF: managed rules and DDoS defaults on; API tokens scoped; no global key in CI.

Anything deeper is `lll:security`.

## 3. Database and backups

- [ ] Production migrations match the repo (use the stack's status command, read-only; for D1 `wrangler d1 migrations list <db> --remote` lists unapplied ones; for Supabase `supabase migration list --linked`).
- [ ] Backups run on a schedule and the latest one exists; point-in-time recovery is on if the plan has it; one copy lives outside the primary account or provider.
- [ ] A restore was proven in a non-production target (`lll:backup-drill`). Never use a restore-in-place command on production as a drill.
- [ ] Tenancy/row-level security tested with the anon or a normal user's key.
- [ ] No test or seed rows in production.
- [ ] Indexes exist for the main pages' queries (`EXPLAIN` on the slowest).
- [ ] The app uses a least-privilege role; size, row-read and connection limits are noted with an alert before the limit.
- [ ] Personal data is stored only where needed, with a retention rule and a delete path.

## 4. Bugs and errors

- [ ] `/code-review` has run on the commits that went live, or on the release diff.
- [ ] Test suite passes on the deployed commit (real output recorded).
- [ ] Production logs for the first hours read for errors and warnings (platform tail/observability, host logs).
- [ ] Browser console free of errors on every key page at desktop width and at 360 px phone width.
- [ ] Link crawl: no internal 404s, no mixed content.
- [ ] 4xx/5xx rate near zero apart from bot 404s.
- [ ] Cron jobs, queues and workflows have each run once in production and succeeded.
- [ ] Error tracking receives an event from production.
- [ ] Webhook handlers are idempotent: the same event twice changes nothing the second time.
- [ ] Loading, empty and error states exist where data can be slow or missing.

## 5. Performance

- [ ] Mobile PageSpeed/Lighthouse score of 90 or more on the home page and the main conversion page (lab data).
- [ ] Core Web Vitals "good" at the 75th percentile once field data exists: LCP under 2.5 s, INP under 200 ms, CLS under 0.1. On a new site record lab values and re-check on day 7.
- [ ] Images in AVIF or WebP at display size, lazy-loaded below the fold, width and height set.
- [ ] Hashed static assets have long cache headers; HTML is short-cached or revalidated.
- [ ] Brotli or gzip on: `curl -sI -H "Accept-Encoding: br" $U | grep -i content-encoding`.
- [ ] No render-blocking third-party scripts that can be deferred; fonts use `font-display: swap` with only the weights in use.

## 6. SEO (indexability only)

- [ ] `robots.txt` does not block the site; no stray `noindex` (meta or `X-Robots-Tag`).
- [ ] `sitemap.xml` lists only canonical 200 URLs and is referenced from `robots.txt`; submitted in Search Console.
- [ ] Unique title and description, one `h1`, self-referencing canonical; structured data valid for the page type.
- [ ] Old URLs 301 to new equivalents; `hreflang` correct on multilingual sites; Business Profile linked for local businesses.
- [ ] Open Graph/Twitter previews checked.

Strategy, schema and content work belong to `lll:seo`.

## 7. Accessibility (launch slice)

- [ ] Keyboard-only use works with a visible focus ring; the focused element is not hidden under sticky headers or banners.
- [ ] Tap targets at least 24 by 24 CSS px; drag actions have a tap alternative; login allows paste and password managers.
- [ ] Contrast at least 4.5:1 (3:1 large text); images have alt text; fields have labels; headings in order; works at 200% zoom and 360 px without sideways scroll.
- [ ] An axe or Lighthouse run shows no serious issues on key pages. Deeper review is `lll:audit`.

## 8. Monitoring and operations

- [ ] Uptime monitor on the home page and a health route, alerting a channel someone reads.
- [ ] Alerts for error spikes, failed jobs, certificate and domain expiry, plan limits.
- [ ] One service-level objective written down for the key route (for example 99.9% availability, p95 latency under 500 ms).
- [ ] Billing alerts and hard caps on pay-per-use services; rate limits on expensive endpoints.
- [ ] Incident runbook with severity levels, on-call contact and a user message template; fallback written for each third party (payments, email, AI, maps).
- [ ] Status page or a named channel for outage updates.
- [ ] Domain auto-renew and registrar lock on; renewal owner recorded.

## 9. Analytics

- [ ] Real-time view shows production page views only (not localhost or staging).
- [ ] Conversion events fire once each; consent gating works.
- [ ] Social profiles, Business Profile and email signatures link to the live site.

## 10. Rollback and handover

- [ ] Previous working version known; rollback is one command or console path and someone has run it once (code rollback does not undo data changes).
- [ ] Feature flag or maintenance page ready.
- [ ] Client work: handover pack complete (`lll:handover`), bug-window dates sent in writing.

## 11. Mobile and desktop apps

- [ ] Production build installs from the store or installer on a clean device, launches, and signs in.
- [ ] Crash reporting and analytics receive events from the release build.
- [ ] Staged rollout percentage and halt rule set; first-hour crash-free rate checked.
- [ ] Deep links, push notifications, in-app purchase restore and update-over-previous-version work.
- [ ] Backend the app calls is the production one; API versions older app builds still use stay supported.
