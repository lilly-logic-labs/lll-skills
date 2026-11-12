# Docs and MCP

Cloudflare changes limits, prices, flags and APIs often. Retrieve before you rely on memory, in this order.

## Retrieval order

1. **Project evidence** (the pinned truth for this repository):
   - installed wrangler: `npx wrangler --version`, `npx wrangler <command> --help` through the project's own package manager
   - config schema: `node_modules/wrangler/config-schema.json`
   - generated types: `worker-configuration.d.ts` (from `wrangler types`), `@cloudflare/workers-types`
2. **Cloudflare docs through MCP**, when connected. Tool names vary by connector; look for a docs search tool such as `search_cloudflare_documentation`, or the `docs` and `search` tools of the Cloudflare API connector. Prefer these over web search.
3. **Docs by URL.** Every docs page has a Markdown twin: append `index.md` (for example `https://developers.cloudflare.com/d1/platform/limits/index.md`). The index of everything is `https://developers.cloudflare.com/llms.txt`. The changelog is `https://developers.cloudflare.com/changelog/index.md`.
4. **Library docs** for frameworks around the Worker (Hono, Drizzle, Astro, SvelteKit, Next.js) through the host's library-docs tool (for example context7) or their own sites.
5. If none works, say "unverified, from memory" next to every limit, price, flag or API shape you give.

## Always retrieve, never recall

- Limits and quotas: the product's `/platform/limits/` page.
- Prices and free allowances: the product's `/platform/pricing/` page.
- Compatibility flags and dates: `https://developers.cloudflare.com/workers/configuration/compatibility-flags/`.
- Binding shapes: the config schema and generated types.
- Anything marked beta, preview or closed beta (Artifacts, Think, `cf` CLI, `sandbox@next`, Previews): re-check availability and API before promising it.

## The Cloudflare MCP servers

Cloudflare publishes remote MCP servers. If the user has them connected, use them for the matching job. They run as the user, so the same ownership rule applies: reads need a go-ahead, writes belong to the owner.

| Server | Use for | Typical risk |
|---|---|---|
| docs | Search documentation, Pages to Workers migration guide | none (public docs) |
| api | Search and call the Cloudflare REST API through two tools: search then execute | execute can write to the account; show the call, wait for the owner |
| bindings | List and manage bindings and resources (KV, D1, R2, Workers) | writes create or delete resources |
| builds | Workers Builds status and logs | reads only unless re-running a build |
| observability | Query Workers logs and analytics | log lines can hold personal data; do not paste them into reports |

An MCP connector that needs sign-in is the user's to authorise. Never ask for tokens in chat.

## Node.js compatibility errors

Symptoms: `Dynamic require of "X" is not supported`, missing `node:` modules, a package that needs `fs` or `crypto`.

1. Retrieve the current Node.js compatibility page for the runtime.
2. Add `"compatibility_flags": ["nodejs_compat"]` and a `compatibility_date` that is recent and tested (today's date for a new Worker).
3. Re-run `wrangler types` and the tests. If a package still fails, look for a Workers-compatible alternative before polyfilling.

## Error codes seen in the browser

- 1101: the Worker threw an uncaught exception. Find the stack in logs.
- 1102: the Worker exceeded CPU or memory. Profile it; do not just raise a limit.
- Others: the Workers errors page lists them. Retrieve it, do not guess.

## Cite what you used

When the answer depends on current behaviour, end with the docs URL(s) you used so the owner can check.

## Skill feedback

If the user says the vendored guidance is wrong or outdated, point them to the skill-feedback note inside the relevant vendored folder, for example `../vendor/wrangler/references/skill-feedback.md`. Do not edit vendored files.
