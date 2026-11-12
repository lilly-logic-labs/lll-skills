# Cloudflare project review checklist

Full mode only. Read-only until a fix phase (`../../../shared/ground-rules.md`). Every item that fails becomes a finding in `../../../shared/findings.md` format with a failure scenario. Use lens names `release`, `bugs`, `security`, `db`, `perf`, `drift`.

Inventory first: wrangler configs (all environments), bindings, routes, cron triggers, queues (producers and consumers), Durable Object classes and migrations, Workflows, containers, D1 migrations folder, CI deploy file, docs that describe the deployment.

## 1. Config and release

- [ ] `compatibility_date` is set and not years old; flags justified. (`../vendor/workers-best-practices/references/configuration.md`)
- [ ] `nodejs_compat` present only if needed.
- [ ] Every environment repeats the bindings it needs; staging does not share production resource ids.
- [ ] Environment names in CI match config; the deploy script passes `--env`.
- [ ] `observability` and traces enabled for production; sampling reasoned.
- [ ] `wrangler types` output committed or generated in CI; no hand-written `Env`.
- [ ] CI runs typecheck, tests and `wrangler deploy --dry-run`; real deploy needs the owner's pipeline.
- [ ] A rollback path is documented; schema changes are backward compatible with the previous version.
- [ ] Routes and custom domains match the docs; no stray `workers.dev` route exposing an admin surface.
- [ ] Placement set when the Worker makes many sequential queries to one regional database.

## 2. Secrets and access

- [ ] No secret in `vars`, source, `.dev.vars` committed, test fixtures or docs. Report location and type only.
- [ ] `.dev.vars` and `.env*` ignored.
- [ ] Required secrets declared or checked at startup.
- [ ] CI token is account-owned, scoped, per environment.
- [ ] Constant-time comparison for tokens and webhook signatures; `crypto.randomUUID()` or `getRandomValues` for ids and tokens, never `Math.random()`.

## 3. Code correctness (Workers runtime)

- [ ] No unawaited promises; background work uses `ctx.waitUntil(...)` (not destructured).
- [ ] No module-level mutable request state.
- [ ] Large bodies streamed, not buffered with `.text()`.
- [ ] `passThroughOnException` not used as error handling.
- [ ] Errors return structured responses; no stack traces to clients.
- [ ] Inbound webhooks verify the signature before parsing.
- [ ] Outbound `fetch` of user-supplied URLs is allow-listed (SSRF).
- [ ] CORS is explicit, not `*` with credentials.
- [ ] Platform classes (Durable Objects, Workflows, entrypoints) extend the base class and use `this.env`.

## 4. Data stores

D1
- [ ] Migrations numbered, immutable, applied by a documented step; no edits to old files.
- [ ] Queries parameterised (`.bind()`), never string-built from input.
- [ ] Indexes exist for every `WHERE` and `ORDER BY` on hot paths; multi-row writes use `batch`.
- [ ] A restore story exists (Time Travel window known, export schedule if needed).
- [ ] Foreign keys and cascades checked against SQLite behaviour.

KV
- [ ] Not used where read-your-writes or atomic counters are needed.
- [ ] Write rate per key is within limits; TTLs set for cache entries.

R2
- [ ] Buckets private unless public by design; presigned URL expiry short; content-type and size validated on upload.
- [ ] Lifecycle rule for temporary objects; multipart cleanup.

Queues and Workflows
- [ ] Consumers idempotent; `max_retries` and dead-letter queue set; poison messages observable.
- [ ] Batch size and timeout reasoned; no long CPU inside a consumer.
- [ ] Workflow steps deterministic; side effects only inside `step.do`.

Durable Objects
- [ ] Id strategy matches the coordination unit; no single global object on a hot path.
- [ ] Storage migrations declared (`new_sqlite_classes` for new classes); alarms idempotent; WebSocket hibernation used where it fits. (`../vendor/durable-objects/references/rules.md`)
- [ ] Authorisation checked before routing to the object.

Containers
- [ ] Health check and restart behaviour handled; images pinned; no secrets baked into the image; cost of idle instances understood.

## 5. Performance and cost

- [ ] No Cloudflare REST API calls where a binding exists.
- [ ] No N+1 fetches or queries per request.
- [ ] Cache strategy stated (Workers Cache, Cache Rules, KV) with invalidation.
- [ ] Log volume bounded; no per-request debug logging in production.
- [ ] Per-request KV or R2 writes counted against pricing at 10x traffic.
- [ ] Unbounded loops, retries or queue fan-out capped.

## 6. Email and bot protection

- [ ] Sending domain onboarded; SPF, DKIM, DMARC published and aligned (`../vendor/cloudflare-email-service/references/deliverability.md`).
- [ ] Transactional only; bounce and complaint handling exists.
- [ ] Public forms and sign-up endpoints have Turnstile verified server-side, plus rate limits.

## 7. Docs drift

- [ ] README and CLAUDE.md list the real bindings, environments, deploy and migration commands (`lll:docs` fixes drift).
- [ ] Resource ids in docs match the config (ids are not secrets, but stale ones cause wrong-account mistakes).

## Report notes

- Put owner-only steps (remote migrations, secrets, DNS, dashboard settings) under "Owner actions".
- A configuration that fails open in production is `high`. Data loss on migration or restore is `critical`.
- Security-grade findings (auth bypass, tenant leaks) belong to `lll:security`; hand them over instead of re-deriving them.
