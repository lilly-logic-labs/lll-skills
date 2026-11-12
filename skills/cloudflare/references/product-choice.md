# Product choice

Pick the smallest set of Cloudflare products that meets the requirement. Limits and prices below are deliberately not quoted; fetch them from the product's limits and pricing pages (retrieve, never recall).

## Storage and state

| Need | Pick | Why | Watch out |
|---|---|---|---|
| Relational app data, SQL, joins, moderate size | **D1** | Managed SQLite, migrations, `--local` dev, Time Travel recovery | Per-database size cap and write throughput (single primary). Use batches. Index what you filter on. Read replication uses the Sessions API for read-your-writes. |
| Per-entity strong consistency: room, document, cart, rate limiter, counter, tenant | **Durable Object** (SQLite storage) | One instance per id serialises access; WebSockets; alarms | Design the id (one object per entity, not one global). Avoid one hot object for everything. |
| Read-heavy config, flags, lookup tables, cache | **KV** | Global reads, low latency | Eventually consistent; writes take time to appear everywhere; no transactions; do not use as a database or a counter. |
| Files, uploads, media, backups, exports | **R2** | S3-compatible object store, no egress fees, presigned URLs | No SQL; keep metadata in D1; multipart for big objects; lifecycle rules for temp files. |
| Existing Postgres or MySQL you keep | **Hyperdrive** | Pooling and caching for external SQL from Workers | Still pay the network hop; use placement near the database. |
| Vector search, custom retrieval | **Vectorize** + Workers AI | You control embeddings and chunking | Dimension and metric must match the embedding model. |
| Managed RAG over documents | **AI Search** | Less plumbing | Less control of chunking and ranking. |
| High-cardinality custom metrics | **Analytics Engine** | Cheap write-heavy events, SQL reads | Sampled at high volume; not a source of truth. |
| Shared account-level secrets | **Secrets Store** | One secret, many Workers | Per-Worker `wrangler secret` is simpler for one Worker. |
| Event log with independent readers | **K2 Streams** | Durable log, subscriptions | Check availability. |

## Compute and flow

| Need | Pick | Why | Watch out |
|---|---|---|---|
| HTTP API, webhook receiver, edge logic | **Workers** | Default | Keep CPU short; stream big bodies; never keep per-request state at module level. |
| Static site, SPA, SSR framework | **Workers + Static Assets** | New default | Existing Pages projects stay on Pages until a migration is asked for. |
| Background job with retry, fan-out, burst buffering | **Queues** | Decouples producer and consumer; dead-letter queue | At-least-once delivery: consumers must be idempotent. Set `max_retries` and a DLQ. |
| Multi-step process with waits, sleeps, retries, human approval | **Workflows** | Durable steps, resumable | Steps must be deterministic and idempotent; do not hold state outside `step.do` results. |
| Recurring job | **Cron Triggers** | Scheduled entry point | Cron only starts work; enqueue it. Guard against overlapping runs. |
| Binaries, non-JS runtimes, long CPU (video, ffmpeg, headless browsers) | **Containers** (fronted by a Worker and a Durable Object) | Full Linux process | Cold starts; instance sizes; pay while running; design for restarts. |
| Run model-generated or untrusted code | **Sandbox SDK** or **Dynamic Workers** | Isolation | Sandbox for shell and filesystem needs; Dynamic Workers for isolates. |
| Stateful AI agent, scheduled tasks, MCP server | **Agents SDK** | Built on Durable Objects | See `../vendor/agents-sdk/GUIDE.md`. |
| Rendered pages, screenshots, PDFs | **Browser Run** (Browser Rendering) | Headless browser as a service | Session limits; cache results. |
| Image resize and delivery | **Images**; video: **Stream** | Managed pipelines | Check per-image pricing for your volume. |

## Edge and network

- Cache: Workers Cache for application responses; Cache Rules and Cache Reserve for a proxied origin.
- Route to a private origin: Tunnel. Private services from a Worker: Workers VPC.
- Protect: WAF, rate limiting, Bot Management, Turnstile for forms (`../vendor/turnstile-spin/GUIDE.md`).
- Custom domains for your customers' hostnames: Cloudflare for SaaS.
- Gradual rollout and flags: Flagship, or KV for simple flags, or Workers versions with gradual deployment.

## Deciding questions

Ask or infer these before choosing:

1. Must two requests see each other's writes at once? Yes: D1 primary or Durable Object. No: KV or cache.
2. What is the unit of coordination (user, room, tenant, order)? That is the Durable Object id.
3. How big does the data get and how fast does it grow? Large objects go to R2, rows to D1.
4. Can the work fail halfway and be retried safely? If not, make the step idempotent before choosing Queues or Workflows.
5. Does it need more than Workers can give (native binary, long CPU, GPU)? Containers or an external service.
6. What does it cost at 10x the traffic? Estimate with the pricing page, not a guess.

## Combinations that work

| App | Pieces |
|---|---|
| File upload app | Worker API, R2 for files, D1 for metadata, Queues for processing |
| Multi-tenant SaaS | Worker, D1 (shared schema with tenant id, or one database per tenant when isolation is a hard requirement), KV for tenant config, Queues for async |
| Realtime collaboration | Worker, Durable Object per document or room, D1 for the index |
| Media or document pipeline | Queues or Workflows to orchestrate, Containers for heavy tools, R2 for artifacts, D1 for job state |
| Document assistant | Worker, AI Search (managed) or Vectorize + Workers AI (custom), AI Gateway for logging and caching of model calls |
| Webhook ingester | Worker verifies the signature, enqueues, consumer processes idempotently, DLQ for poison messages |

Anything touching LLM design (prompts, evals, cost) belongs to `lll:ai`; this table only places the infrastructure.
