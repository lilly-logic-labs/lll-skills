# Observability and debugging

## Turn it on before production

In the Worker config:

- `observability.enabled: true` for Workers Logs.
- `observability.traces.enabled: true` for traces. The top-level switch alone does not enable traces.
- Set a sampling rate that suits the traffic. Retrieve current options and pricing first.
- Log JSON objects, not free text: `console.log(JSON.stringify({ evt: "order.created", orderId, ms }))`. Include a request id.
- Never log secrets, tokens, full request bodies or personal data. Log ids.

Exact field names change; check the installed `config-schema.json`.

## Pick the signal

| Question | Tool |
|---|---|
| What happened to this request an hour ago | Workers Logs (dashboard query builder, or the observability MCP server) |
| Reproduce it live | `wrangler tail <worker> --format json` with filters such as `--status error` or `--search <text>`; owner go-ahead needed for production (live user data) |
| Where does the time go across calls | Traces |
| Trend of requests, errors, CPU, duration | Workers metrics and analytics |
| Per-tenant or custom event counts | Analytics Engine |
| Custom filtering or forwarding of logs | Tail Workers, Logpush, OpenTelemetry export |
| CPU or memory hot spot in deployed code | `../vendor/workers-profiling/GUIDE.md` |
| Slow pages and Core Web Vitals | `../vendor/web-perf/GUIDE.md` |

Product notes: `../vendor/cloudflare/references/observability/README.md`, `../vendor/cloudflare/references/tail-workers/README.md`.

## Debug order

1. **State the symptom with numbers**: which route, which status, how many, since when, which deployment version. A deploy time that matches the start is the first suspect.
2. **Reproduce locally** with `wrangler dev`. Bind local D1 and other stores. If it only fails remotely, suspect: a missing secret or binding in that environment, a compatibility date or flag difference, a remote-only limit, or different data.
3. **Read the evidence** (logs, tail, traces) before editing.
4. **One hypothesis at a time.** Use `lll:debug` for the root-cause discipline; this file supplies the Cloudflare-specific suspects.
5. **Fix, add a regression test, deploy through the owner.**

## Frequent suspects

| Symptom | Likely cause | Check |
|---|---|---|
| Works locally, `undefined` binding in staging | Binding not repeated under `[env.staging]` | `wrangler deploy --dry-run --env staging` binding list |
| 1101 | Uncaught exception | Stack in logs; missing `await`; JSON parse of empty body |
| 1102 | CPU or memory over limit | Profile; stream large bodies; move CPU work to Queues, Workflows or Containers |
| Random dropped background work | Promise not awaited or not in `ctx.waitUntil` | Floating promises after the response is returned |
| Data from another user shows up | Module-level mutable state shared across requests | Search for top-level `let` and caches keyed without the user |
| Duplicate side effects | Queue redelivery or retry | Idempotency key per message; DLQ |
| Stale reads right after a write | KV propagation, or D1 read replica without the Sessions API | Read your writes through the primary or a session bookmark |
| Slow D1 | Missing index, N+1 queries, no batching, regional distance | `EXPLAIN QUERY PLAN`; `db.batch`; placement; the D1 observability docs for expensive queries |
| Subrequest or connection limits | Too many `fetch` calls per request | Batch; use bindings; check the limits page |
| Durable Object hot spot | One object serving everything | Shard the id; move read-only data out |
| Cron ran twice or overlapped | No lock | Idempotent job; lease row |
| Deploy "succeeded" but old behaviour | Wrong env, wrong account, route points at another Worker, cache | `wrangler deployments list`; routes; Cache Rules |
| Email not arriving | Domain not onboarded, SPF/DKIM/DMARC, unverified destination | `../vendor/cloudflare-email-service/references/deliverability.md` |
| `Dynamic require` or missing Node API | Missing `nodejs_compat` or an old `compatibility_date` | Add the flag and a tested recent date, re-run `wrangler types` |

## After the fix

Record the cause, the version that fixed it and the signal that proves it (error rate back to baseline). For a production incident with customer impact use `lll:debug` incident mode for the timeline and postmortem.
