# Technical SEO

Order matters: fix what stops crawling and indexing first. Everything below is a check with a pass condition and a fix.

## 1. Crawlability

| Check | Pass | Fix |
|---|---|---|
| robots.txt | 200, valid, no `Disallow: /` for `*`, no block on CSS, JS or images used for rendering, `Sitemap:` line present | edit the file the host serves; test with `node scripts/seo-probe.mjs robots <site> --path /key/page` |
| Status codes | indexable pages 200; removed pages 404 or 410; moved pages 301/308 | fix at the server or framework layer, not with meta refresh or JS redirects |
| Soft 404s | an empty or "not found" page returns 404, not 200 | return the real status from the route (`notFound()` in Next.js, `abort(404)`, `http.NotFound`) |
| 5xx and timeouts | none on crawled pages; robots.txt itself never 5xx | a 5xx on robots.txt can pause crawling site-wide |
| Depth | key pages within three clicks of home, linked from crawlable `<a href>` | add hub links, breadcrumbs, related-links blocks |
| Orphans | every indexable page has at least one internal link and a sitemap entry | compare the sitemap URL list with a link crawl |
| Parameters, facets, search | crawl traps blocked or canonicalised: `?sort=`, `?filter=`, calendar pages, session IDs, internal search results | `noindex` search results; canonical facets to the base; avoid blocking in robots.txt if you need Google to see the canonical |
| Large sites (over about 10k URLs) | server answers fast and steadily; sitemaps current; no infinite URL spaces | watch Crawl Stats in Search Console (host status, response time, by file type) |

Facts to keep straight:
- Googlebot reads the first part of an HTML response only (documented as 2 MB for HTML). Inline base64 images, huge inline CSS or JSON state blobs can push content and JSON-LD out of range. Keep the main content and structured data early.
- Crawl rate adjusts automatically. There is no manual crawl-rate setting. Improve server speed and keep sitemaps honest instead.
- `robots.txt` blocks crawling, not indexing. A blocked URL with links can still appear in results without a snippet. To keep a page out, allow crawling and serve `noindex`.
- `noindex` only works if the page is crawlable. Never combine `Disallow` with `noindex` and expect the `noindex` to be seen.

## 2. Indexability

- **Canonical**: every indexable page has an absolute, self-referencing `rel=canonical` on the preferred URL (scheme, host, path, trailing-slash rule). Canonical is a hint. Conflicts (canonical to A, sitemap lists B, internal links go to C) make Google choose for you.
- **No mixed signals**: a page is never both `noindex` and canonical-to-another or listed in the sitemap.
- **Duplicates**: pick one of `http`/`https`, `www`/apex, trailing slash or not, upper/lower case. Redirect the rest with a single 301. Parameter and print URLs canonical to the clean URL.
- **Pagination**: each page self-canonical with crawlable `<a href>` links. Do not canonical page 2 to page 1. `rel=next/prev` is not used by Google.
- **Thin and near-duplicate pages**: merge and 301, or `noindex`, or make them worth indexing. See `./content-onpage.md`.
- **Non-HTML files**: PDFs and feeds use `X-Robots-Tag: noindex` header when they must stay out.
- **Canonical changes take time**: after a fix, Google may keep a duplicate cluster for up to a couple of weeks. Do not call the fix failed on day one.
- **Removing a URL fast** (owner action): Search Console Removals is temporary; the durable fix is 404/410 or `noindex`.

### Search Console "Pages" reasons: meaning and first action

| Reason | Meaning | First action |
|---|---|---|
| Crawled, currently not indexed | Google fetched it and chose not to index | improve uniqueness and usefulness, add internal links, check canonical and duplicates; do not resubmit repeatedly |
| Discovered, currently not indexed | known URL, not yet crawled | internal links, sitemap, server speed, crawl budget on big sites |
| Duplicate without user-selected canonical | Google picked a canonical for you | add explicit self-canonical; consolidate duplicates |
| Duplicate, Google chose different canonical | your canonical was overridden | align canonical, internal links, sitemap, redirects; check content really differs |
| Alternate page with proper canonical | normal for variants, AMP, parameter URLs | none, unless the canonical target is wrong |
| Page with redirect | URL redirects | fine; make sure the sitemap lists the destination |
| Soft 404 | page looks empty or "not found" but returns 200 | return a real 404, or fill the page |
| Blocked by robots.txt | crawl disallowed | remove the rule if the page should be indexed |
| Excluded by `noindex` | tag or header present | remove if unintended, check templates and `X-Robots-Tag` |
| Server error (5xx) / Not found (404) | fetch failed | fix at source; 404 is fine for removed pages |

## 3. Redirects

- One hop: `http://www.example.com/x` should reach `https://example.com/x` in one 301, not three.
- Use 301 or 308 for permanent moves, 302 or 307 only for temporary ones. No meta-refresh or JS redirects for SEO moves.
- No loops, no redirects to a URL that itself redirects, no redirects to the home page for every dead URL (use the closest equivalent or 404/410).
- Migrations: build a 1:1 old-to-new map from the sitemap, Search Console top pages and backlink targets. Test every mapped URL. Keep redirects for at least a year. Re-run `snapshot` on the top 50 old URLs after launch.
- Trailing slash and case: pick one rule and enforce it once, at the edge or framework.

## 4. JavaScript rendering

1. Compare raw HTML with the rendered DOM. Raw: `node scripts/seo-probe.mjs snapshot <url> --json`. Rendered: the `chrome-browser` or `built-in-browser` skill, or Search Console URL Inspection > View crawled page.
2. Required in the initial HTML (not injected later): `<title>`, meta description, `rel=canonical`, meta robots, hreflang, main content, internal links as `<a href>`, JSON-LD for time-sensitive types (Product, Offer).
3. Google's JavaScript guidance: if raw HTML and rendered DOM disagree on canonical, either may win; a `noindex` in raw HTML may be honoured even if JavaScript removes it; pages returning a non-200 status may not be rendered at all. Serve the correct directive in the first response.
4. Links: crawlers follow `<a href>`, not `onclick` handlers or `#` fragments. Do not use fragment URLs for distinct content.
5. Lazy-loaded main content that needs a scroll or click may never appear to crawlers. Load primary content on first render.
6. Rendering strategy: SSR or SSG for public SEO pages; CSR only behind login. Dynamic rendering (serving prerendered HTML to bots) is a workaround Google does not recommend; record it as technical debt.
7. AI crawlers mostly do not run JavaScript. Server-rendered content matters even more for AI search (`./geo-ai-search.md`).
8. SPA route changes must update title, canonical and meta on every navigation, and each route needs a real URL that works when opened directly.

## 5. HTTPS and security signals

- HTTPS everywhere, valid certificate, HTTP redirects to HTTPS, no mixed content. HSTS once stable.
- HTTPS is a light signal; do not over-weight security headers for ranking. Report CSP, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options` as hygiene (hand deep review to `lll:security`).
- Spam-policy risks: scripts that hijack the Back button (via `history.pushState` or injected third-party code), hidden text or links, cloaking, sneaky redirects, hacked-content injection, parasitic third-party sections on your domain. Treat as critical when found.

## 6. Mobile

- Mobile-first indexing: Googlebot Smartphone is the crawler that counts. The risk is parity loss, not exclusion.
- Parity: same primary content, headings, links, structured data, meta robots and titles on mobile and desktop. No content only in desktop tabs.
- `<meta name="viewport" content="width=device-width, initial-scale=1">`, tap targets about 48 px, base text 16 px, no horizontal scroll.
- No intrusive interstitials: full-screen popups on arrival, consent walls that redirect, heavy ad density. Banners and legal dialogs are fine.
- Keep key content visible on load, not behind accordions or "read more", where it matters for the query.

## 7. URL structure

Lowercase, hyphenated, short and descriptive, no session IDs, stable. Hierarchy mirrors the site (`/guides/seo-audit`). Avoid dates in URLs for evergreen content. Do not change URLs without a redirect plan. Flag over about 100 characters or deep parameter use.

## 8. Other protocols

- **IndexNow**: pings Bing, Yandex, Naver and others about changes. Google does not use it. Cheap to add on content sites; use the host's plugin or a key file plus a POST.
- **AMP**: no ranking advantage. Do not recommend building or maintaining AMP.
- **Status page and maintenance**: maintenance windows return 503 with `Retry-After`, not 200 with an error page.
- **Staging and preview hosts** (`*.pages.dev`, `*.vercel.app`, `*.netlify.app`, `*.workers.dev`, staging subdomains): require auth or send `X-Robots-Tag: noindex`; never list them in sitemaps. Treat an indexed preview host as high.

## 9. Per-stack notes

| Stack | Check |
|---|---|
| Next.js | `generateMetadata` or `metadata` sets title, description, `alternates.canonical`, `robots`; `app/robots.ts`, `app/sitemap.ts`; `notFound()` gives 404; middleware redirects are single-hop; client-only pages hide content from raw HTML; `next/image` for LCP |
| Astro, SvelteKit, Nuxt, Remix / React Router | prefer prerender or SSR for public routes; set head per route; sitemap integration; check adapter returns real 404s |
| Vite or CRA single-page apps | head tags set by JS are invisible in raw HTML; add prerendering or move public pages to SSR; keep a real 404 status |
| WordPress | Settings > Reading "discourage search engines" off; one SEO plugin only; canonicals for tag, author, date archives; `noindex` thin archives; permalinks without `?p=` |
| Shopify | `/collections/x/products/y` duplicates canonicalise to `/products/y`; filter URLs; `robots.txt.liquid`; app scripts slow INP |
| Webflow, Wix, Squarespace | edit title, canonical and redirects in settings; avoid auto-generated duplicate CMS collection pages |
| Rails, Django, Laravel, Spring, .NET | sitemap framework or package; middleware for `X-Robots-Tag` on staging; `APPEND_SLASH` or route rules for one trailing-slash form; real 404 handlers; gzip or brotli |
| Go, Rust, plain servers | templates render head tags server-side; correct status codes; `Cache-Control`; compression; HTTP/2 or 3 at the edge |
| Cloudflare Workers, Pages, other CDN | `_redirects` and `_headers`; single canonical host; `X-Robots-Tag: noindex` on preview domains; avoid HTML rewriting that strips head tags; cache HTML carefully; WAF or bot rules must not block `Googlebot` (verify by reverse DNS, not user-agent) |
| Static hosts (Netlify, Vercel, GitHub Pages) | trailing-slash setting, custom 404 returns 404, redirects file, preview URLs noindexed |

## 10. Output for this area

Technical findings with `seo-technical` lens, a pass/warn/fail line for each of: crawlability, indexability, redirects, JS rendering, HTTPS and security, mobile, URL structure. Evidence format as in `../../../shared/findings.md`.
