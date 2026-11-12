---
name: cloudflare
description: Build, configure, review and fix platform errors on Cloudflare, covering Workers, wrangler, D1, KV, R2, Queues, Durable Objects, Workflows, Containers, email sending and routing, Turnstile, agents and MCP servers. Use when the user says Cloudflare, Worker, wrangler, D1, R2. Not for security audits (lll:security), SEO (lll:seo), spam-folder delivery (lll:launch) or app-logic bugs (lll:debug).
metadata:
  origin: lll
---

# Cloudflare

Current-docs-first work on the Cloudflare developer platform: pick the right product, write or review the config and code, deploy safely.
This skill routes each request to the vendored upstream guide in `vendor/`, then adds the house rules the guides leave out.

## When to use

- Building, changing, reviewing or debugging a Worker, Pages site, Durable Object, Workflow, Queue consumer, container, cron job or Cloudflare-hosted API.
- Choosing between D1, KV, R2, Queues, Durable Objects, Workflows, Containers, Hyperdrive or Vectorize.
- Editing `wrangler.jsonc`, `wrangler.toml`, `cloudflare.config.ts`, bindings, environments, secrets, routes, custom domains.
- Sending or receiving email through Cloudflare, adding Turnstile, building an Agents SDK agent or a remote MCP server.
- "Why is my Worker slow, erroring, over its limits or costing too much".

## When not to use

- Security audit or threat review of a Cloudflare-hosted app: `lll:security` (it covers the Cloudflare engine).
- Rankings, indexing, schema, AI search visibility: `lll:seo`. Go-live checks of a site, email and DNS: `lll:launch`.
- Backup and restore rehearsal: `lll:backup-drill`. Generic root-cause debugging with no Cloudflare angle: `lll:debug`.
- LLM prompts, RAG design, evals on top of Workers AI: `lll:ai` (this skill only wires the bindings).

## Modes

- **Guidance** (default): answer, write or review inline. Edit only the files the user asked for. No subagents. Remote reads and writes need the owner (rule 3 below).
- **Full**: only when the user asks for a whole-project Cloudflare review or an end-to-end build. Read-only review first with [the review checklist](references/review-checklist.md), a report per `../../shared/report.md`, findings per `../../shared/findings.md`, fixes per `../../shared/fix-phase.md`. Subagents per `../../shared/agents.md`. Never deploys.

## House rules

1. **Docs before memory.** Cloudflare limits, prices, flags and APIs change monthly. Retrieve before relying on recall ([sources](references/docs-and-mcp.md)).
2. **Project wins.** The pinned wrangler version, installed types and `node_modules/wrangler/config-schema.json` beat the web docs for that project. Never upgrade wrangler to match the docs without saying so.
3. **Remote writes belong to the owner.** Deploys, secrets, remote D1 writes and migrations, bucket and queue writes, DNS and routes: prepare the exact command, state the target account, environment and resource, and hand it over. Read-only remote checks need the owner's go-ahead in this conversation.
4. **Local first.** `wrangler dev`, `--local` D1, `wrangler deploy --dry-run`, `wrangler types`. A local run can still hit real resources through remote bindings, so check bindings before testing writes.
5. **Secrets via `wrangler secret`**, never in `vars`, source, command arguments or chat. Report a secret by name and location only.
6. **Observability on** for every production Worker, and a rollback path stated before any deploy.

## Steps

1. **Learn the project.** Follow `../../shared/stack-detect.md`. Then find: wrangler config (`wrangler.jsonc`, `wrangler.json`, `wrangler.toml`) or `cloudflare.config.ts`; which CLI the project uses (Wrangler if a wrangler config exists, otherwise `cf`; see `vendor/cloudflare/GUIDE.md` "Choose the CLI"); wrangler version, `compatibility_date`, flags, environments, every binding, framework and adapter, CI deploy path. Run `wrangler whoami` only if the owner agrees; it shows the account.
2. **Retrieve current docs** for the exact product and operation (see [docs and MCP](references/docs-and-mcp.md)). If nothing can be retrieved, say so and mark the answer unverified.
3. **Route the request** with the table below. Read the guide and only the references the task needs.
4. **Choose products** when the user describes a need and not a product: use [the product choice table](references/product-choice.md). Recommend the smallest set that meets the requirement and say what deciding fact separates the options.
5. **Plan the change.** Smallest diff that works. Bindings go in the config for every environment that needs them, then run the project's `wrangler types`. Do not hand-write `Env`.
6. **Apply safely.** Classify each command with [wrangler safety](references/wrangler-safety.md) before running it. Migrations are new files, never edits to ones that may have run.
7. **Validate** in proportion: typecheck, project tests, `wrangler deploy --dry-run` with the intended `--env`, a local run of the affected path. A dry run proves packaging, not that remote resources work. Say which of these were not run.
8. **Observe.** For a new or changed Worker confirm logs and traces are enabled and say where to look ([observability and debugging](references/observability-and-debug.md)).
9. **Hand back**: what changed, target environment, checks run with real output, owner actions (deploy, remote migration, secret, DNS), and anything unverified.

## Routing table

| Request | Read |
|---|---|
| Which Cloudflare product fits, architecture, "can Cloudflare do X" | `vendor/cloudflare/GUIDE.md`, then [product choice](references/product-choice.md) |
| Worker code review, anti-patterns, compat date, runtime patterns | `vendor/workers-best-practices/GUIDE.md` |
| wrangler commands, config, environments, previews, rollback | `vendor/wrangler/GUIDE.md`, [wrangler safety](references/wrangler-safety.md) |
| New project, no wrangler config; `cf` commands | `vendor/cf-cli/GUIDE.md` |
| D1, KV, R2, Queues, Workflows, Containers, Hyperdrive, Vectorize, cron | `vendor/cloudflare/references/` (one folder per product, start at its `README.md`) |
| Durable Objects: rooms, per-entity state, alarms, WebSockets, DO tests | `vendor/durable-objects/GUIDE.md` |
| Agents SDK agent, chat agent, MCP server, scheduled agent tasks | `vendor/agents-sdk/GUIDE.md`, [build an agent or MCP server](references/build-agent-and-mcp.md) |
| Email sending, Email Routing, Email Workers, SPF, DKIM, DMARC | `vendor/cloudflare-email-service/GUIDE.md`, [email and Turnstile](references/email-and-turnstile.md) |
| Bot protection on a form or endpoint | `vendor/turnstile-spin/GUIDE.md`, [email and Turnstile](references/email-and-turnstile.md) |
| Next.js on Workers | `vendor/nextjs-on-cloudflare/GUIDE.md` |
| Running untrusted or generated code, agent sandboxes | `vendor/sandbox-next/GUIDE.md` (preview SDK), `vendor/sandbox-stable/GUIDE.md` (stable), `vendor/sandbox-migrate-to-next/GUIDE.md` (port) |
| CPU or memory hot spots in a deployed Worker or DO | `vendor/workers-profiling/GUIDE.md` |
| Page speed, Core Web Vitals, Lighthouse | `vendor/web-perf/GUIDE.md` |
| Streaming data into R2 Iceberg, SQL over it | `vendor/basin/GUIDE.md` |
| Durable event log with independent readers | `vendor/k2/GUIDE.md` |
| Zero Trust, Access, Gateway, WARP, tunnels; migrating from another SASE | `vendor/cloudflare-one/GUIDE.md`, `vendor/cloudflare-one-migrations/GUIDE.md`, `vendor/gateway-workers/GUIDE.md` |
| Logs, tail, traces, error codes, "my Worker is failing" | [observability and debugging](references/observability-and-debug.md), `vendor/cloudflare/references/observability/README.md` |
| Whole-project Cloudflare review | [review checklist](references/review-checklist.md) |

Pointers into `vendor/` are read-only upstream copies. Do not edit them.

## Quick decisions

- New site or app: Workers with Static Assets. Keep an existing Pages project until the user asks to move it.
- Relational data: D1. Per-entity coordination or live rooms: Durable Objects. Config read at the edge: KV. Files: R2. Background work: Queues. Long multi-step jobs with waits and retries: Workflows. Non-JS or heavy binaries: Containers.
- Cache: Workers Cache first; Cache API or KV only for a concrete requirement it cannot meet.
- Never poll the Cloudflare REST API from a Worker for something a binding offers.
- Marketing or bulk email does not belong in Cloudflare Email Service; it is for transactional mail.

## Output

- Guidance: the answer or diff in chat, the commands the owner must run (with target and rollback), checks run, anything unverified.
- Full: report at `docs/audits/<date>-cloudflare.md` per `../../shared/report.md`, a local fix branch if fixes were made, and the owner-action list.
