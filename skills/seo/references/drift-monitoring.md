# SEO drift monitoring

Capture the SEO-critical state of key pages, then diff after a deploy, migration, theme change or plugin update. Catches the quiet breaks: a `noindex` left on from staging, a canonical that changed, schema that disappeared.

## What the script records

`node scripts/seo-probe.mjs snapshot <url> --out baseline.json` stores, from the raw HTML and headers: status, final URL, redirect chain, `X-Robots-Tag`, meta robots, title, meta description, canonical, h1 and h2 text, JSON-LD types and a content hash, Open Graph, hreflang set, image counts, link counts, word count, text hash, HTML hash, byte size, and the lint issues.

It does not record Core Web Vitals or anything JavaScript adds after load. For those, use field data (CrUX, Search Console) and a rendered check from the browser skills.

## Choose the pages

- Home, and one page per template: category, product or service, article, location, pricing, signup, 404.
- Top 10 landing pages from Search Console (clicks, last 3 months).
- Pages with special treatment: redirects, noindex on purpose, hreflang sets.

Fifteen to thirty URLs cover most sites. Name the files by host, slug and date, for example `docs/seo-baselines/example.com/home-2026-02-01.json`. Writing them into a repository is a change: ask first in guidance mode.

## Workflow

1. Before the change, in a script loop with a one-second pause:

```
for u in $(cat urls.txt); do
  node scripts/seo-probe.mjs snapshot "$u" --out "baselines/$(echo "$u" | sed 's#[^a-zA-Z0-9]#_#g').json" >/dev/null
  sleep 1
done
```

2. Deploy (or migrate, or switch theme).
3. Take the same snapshots into `after/`.
4. Diff each pair: `node scripts/seo-probe.mjs diff baselines/x.json after/x.json`. Exit code 2 means at least one critical change.
5. Triage by severity, then decide: expected (log it) or regression (fix or roll back).
6. Keep the new snapshots as the next baseline.

## Rules the diff applies

| Severity | Change |
|---|---|
| critical | status went from success to 4xx or 5xx; `noindex` added (meta or header); canonical removed or changed; title removed; h1 removed; JSON-LD removed |
| warning | title text changed; h1 rewritten (less than half similar); description removed or changed; final URL changed; more redirect hops; Open Graph removed; JSON-LD content changed; hreflang set changed; visible words dropped by more than 30 percent |
| info | JSON-LD added; h2 set changed; visible text changed |

Every critical and warning has a first action:

| Finding | Do next |
|---|---|
| `noindex-added` | find the template or header rule that sets it (staging flag, plugin, middleware) |
| `canonical-changed` or `-removed` | check the head template and any plugin; confirm intent |
| `schema-removed` or `-modified` | validate the output of the JSON-LD component (`./schema.md`) |
| `status-error` | server or routing; check logs |
| `title-changed`, `description-changed` | confirm intent; watch CTR in Search Console for two weeks |
| `content-shrunk` | content failing to render server-side, or a component error |
| `final-url-changed`, `redirects-added` | review redirect rules (`./technical.md`) |

## CI check (optional)

Run the snapshots against production right after each deploy, diff against the committed baselines, and fail the job on exit code 2. Do not diff a preview host against production baselines: host, canonical and final URL differ by design and drown the real changes. For previews, keep a separate baseline taken from the same preview host. Preview hosts must block indexing. Deploy-time gating belongs to `lll:ship` (post-deploy canary), which can call this check.

## Traffic drop investigation

1. Run a diff of the key pages against the last baseline.
2. In Search Console, compare the last 28 days with the previous period by page and by query; find which pages and which query groups lost clicks, and whether impressions, CTR or position moved.
3. Check the dates against deploys, migrations, robots changes and known core updates.
4. Check the Pages report for a jump in excluded or errored URLs, the Crawl Stats report for server errors, and the manual actions and security reports.
5. Report the likely cause with evidence, or "undetermined" with the next data to collect.

## Limits

Raw HTML only. A site that renders content with JavaScript shows a small, stable snapshot even when the page changes visibly. Use the rendered view of a browser skill for those sites and compare screenshots or extracted text by hand.
