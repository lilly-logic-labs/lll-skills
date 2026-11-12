# Platform notes

Per-host, per-stack and per-store details for launch checks. Check each against the vendor's current documentation (context7 or the vendor's docs tool); limits and console layouts change.

Contents: Cloudflare Workers and Pages · Vercel and Netlify · Containers, Fly, Render, Heroku · Kubernetes · Supabase and Firebase · WordPress and hosted CMS · Static hosting (GitHub Pages, S3) · Apple App Store · Google Play · Desktop apps · Backends and APIs by stack

## Cloudflare Workers and Pages

- Deploy proof: `wrangler deployments list` or `wrangler versions list` names the live version; compare with the release commit. `wrangler deploy --dry-run` is the only deploy-like command allowed in read-only phases.
- Rollback: `wrangler rollback <version-id> --message "<why>"` (no id goes to the previous version). Data in D1, KV, R2 and Durable Objects is not rolled back.
- Hostnames: disable or protect the `*.workers.dev` and `*.pages.dev` hostnames, or set `noindex`, so the canonical domain is the only indexed one.
- TLS: SSL/TLS mode Full (strict). Check WAF managed rules, bot settings, rate-limiting rules on login and forms, Turnstile on public forms.
- Limits to read before launch: requests and CPU time per plan, D1 row reads and size, KV and R2 operations, subrequest limits, queue throughput. Alert before them.
- Secrets: `wrangler secret`, not `vars`. Scoped API tokens; no global key in CI.
- D1: migrations list against `--remote` (read-only); Time Travel info shows the retention window; schedule an export if you want a copy outside the account.
- Logs: Workers Observability or `wrangler tail`; set sampling and retention. Details live in `lll:cloudflare`.

## Vercel and Netlify

- Deploy proof: the deployment record for the commit; `vercel ls`/`vercel inspect` or the Netlify deploys list. Wait for it to be "ready" before checking.
- Rollback: `vercel rollback` or promote a previous deployment; Netlify "publish deploy" on an earlier one. Environment variable changes need a redeploy to apply.
- Preview deployments carry production-like URLs: password-protect or `noindex`; keep previews off production data.
- Check environment variable scopes (production vs preview), serverless function region next to the database, function timeouts, image optimisation quotas and bandwidth limits.

## Containers, Fly.io, Render, Heroku, Railway

- Deploy proof: release record tied to the image tag or commit (`fly status`, `heroku releases -n 1`, the Render deploy list); a reachable URL is not proof.
- Health checks: readiness route that exercises the database; restart policy; minimum instances above zero for launch day if cold starts hurt.
- Persistent data: volumes are not backups; managed Postgres backups and PITR tier must be on.
- Rollback: redeploy the previous image or release (`heroku rollback`, `fly deploy --image <previous>` or the Render dashboard).
- Autoscaling and connection limits: database connection pool size against instance count.

## Kubernetes

- `kubectl rollout status deployment/<name>` and `kubectl rollout undo deployment/<name>`; readiness and liveness probes configured; resource requests and limits set; pod disruption budget; an ingress certificate that renews.
- Secrets in the cluster secret store or an external secrets operator, not in manifests.
- Check autoscaler bounds and that the previous ReplicaSet still exists for rollback.

## Supabase and Firebase

- Supabase: row level security on every table in `public` and each policy tested as anon and as a normal user; migrations in step (`supabase migration list --linked`); backup tier (free has none; paid daily with retention by plan; PITR is an add-on); Storage objects are not in database backups; auth redirect URLs and site URL set to the production domain; email templates and SMTP provider configured (default SMTP is rate limited).
- Firebase: security rules reviewed and deployed; App Check on; budgets and alerts; Firestore scheduled export or backups configured; Auth authorised domains include the production domain; indexes deployed.

## WordPress and hosted CMS

- Core, theme and plugins updated; unused plugins removed; admin URL and users reviewed (no `admin` user, two-factor on); XML-RPC and file editing disabled if unused.
- Backups include files and database, stored off the host; restore tested on a staging copy.
- Search visibility ("discourage search engines") is off; permalinks set; caching plugin and CDN configured; the login page rate limited.
- Hosted site builders: custom domain connected, SSL on, redirect from the platform subdomain, SEO settings and legal pages filled in.

## Static hosting (GitHub Pages, S3 plus CDN, Cloudflare Pages)

- Custom domain with HTTPS enforced; apex and `www` both handled; 404 page configured; SPA fallback behaviour understood (it can mask real 404s).
- Cache invalidation after deploy; correct content types; headers set through the host's header file or CDN rules.
- No private files in the published folder.

## Apple App Store

- App Store Connect record complete: metadata, screenshots for required device classes, age rating, privacy nutrition labels, support and privacy URLs, review notes with a demo account.
- Build uploaded from the release scheme, signed with the distribution certificate, processed, attached to the version. Use TestFlight (internal then external) before submission.
- Export compliance and encryption answers, background modes, usage description strings for every permission, in-app purchase products approved and "restore purchases" works, Sign in with Apple where social login is offered.
- Choose phased release; watch crash-free sessions in the first day. A rejection is a normal event: read the reply, fix, resubmit.

## Google Play

- Play Console: store listing, data safety form matching the SDKs in the build, content rating, target audience, app access instructions for reviewers, privacy policy URL.
- Upload an Android App Bundle signed with Play App Signing; keep the upload key safe. Meet the current target API level requirement.
- New personal developer accounts may need a closed test with a minimum tester count and duration before production access; plan the calendar for it.
- Use internal, closed and then production tracks with a staged rollout percentage and the halt button ready; check pre-launch report and Android vitals.

## Desktop apps

- Signed and notarised installers (Windows code signing certificate; macOS Developer ID and notarisation); unsigned builds trigger warnings and blocks.
- Auto-update channel tested from the previous version, with a signature check on updates and a way to pull a bad release; update server and download links are production.
- Crash reporting on; telemetry consent; uninstall leaves no orphaned services; licence and third-party notices in the app.
- Download page checksums or signatures published.

## Backends and APIs by stack

| Stack | Launch-day things to confirm |
|---|---|
| Node / TypeScript | `NODE_ENV=production`, graceful shutdown, unhandled rejection handling, connection pool size, `npm audit --omit=dev` |
| Python (Django, FastAPI, Flask) | `DEBUG` off, allowed hosts, static files served, workers and timeouts, migrations applied, `pip-audit` |
| Go | build with `-trimpath`, health route, graceful shutdown, `govulncheck ./...` |
| Rust | release profile build, panic handling, `cargo audit` |
| Java / Kotlin | production profile, heap and thread settings, actuator or health route not public, dependency check |
| PHP (Laravel, Symfony) | debug off, caches built (`config:cache` style), queue worker supervised, `composer audit` |
| Ruby (Rails) | `RAILS_ENV=production`, assets precompiled, secret key base set, `bundle audit` |
| .NET | production environment name, developer exception page off, health checks, `dotnet list package --vulnerable` |
