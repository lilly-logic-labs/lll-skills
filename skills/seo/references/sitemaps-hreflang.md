# Sitemaps and hreflang

## Part 1: XML sitemaps

A sitemap is a list of canonical, indexable, 200 URLs you want crawled. It helps discovery and signals freshness. It does not force indexing.

### Check an existing sitemap

Run `node scripts/seo-probe.mjs sitemap https://example.com --check 10`. It reads robots.txt, fetches each declared sitemap (and children of an index, up to ten), then samples URLs. Findings to confirm by hand:

| Check | Pass | Severity if failed |
|---|---|---|
| Reachable and valid XML | 200, parses | high |
| Limits per file | at most 50,000 URLs and 50 MB uncompressed (news: 1,000) | critical; split with an index |
| Declared | `Sitemap:` line in robots.txt and submitted in Search Console | medium |
| URL quality | only canonical, indexable, 200, https URLs; none redirected, noindexed, blocked or 404 | high at scale |
| Host | URLs on the same host as the sitemap | medium |
| `lastmod` | valid W3C datetime and set to the last meaningful content change; not "today" on every build | low to medium; Google ignores untrustworthy `lastmod` |
| `priority`, `changefreq` | Google ignores them; drop them | info |
| Coverage | every important indexable page appears; compare with a crawl | medium |
| Size on big sites | split by type (pages, posts, products, images) so Search Console reports per segment | low |

Extension sitemaps: image sitemaps use `image:image` and `image:loc` (up to 1,000 images per URL). Video sitemaps need title, description, thumbnail and a content or player location. News sitemaps list only articles from the last two days and need publication name, language, date and title.

### Generate

Use the framework's generator; hand-written sitemaps rot.

| Stack | Generator |
|---|---|
| Next.js | `app/sitemap.ts` (and `generateSitemaps` for big sets) |
| Astro | `@astrojs/sitemap` |
| SvelteKit, Nuxt, Remix | route-based endpoint or `@nuxtjs/sitemap` |
| Hugo, Jekyll, Eleventy | built-in or plugin |
| WordPress | core `/wp-sitemap.xml` or the SEO plugin's sitemap (use one) |
| Shopify | automatic at `/sitemap.xml` |
| Django | `django.contrib.sitemaps` |
| Rails | `sitemap_generator` gem |
| Laravel | `spatie/laravel-sitemap` |
| .NET, Go, Rust, Java | generate from the same route or content table that renders the pages, on build or on a schedule |

Rules for the generator: derive from the database or route table; include only canonical indexable URLs; take `lastmod` from the content's real modified time; split at the limits; write a sitemap index; add the `Sitemap:` line to robots.txt.

Minimal file:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://example.com/page</loc><lastmod>2026-02-07</lastmod></url>
</urlset>
```

Submitting in Search Console is an owner action (it changes remote state). Reading sitemap status through the Search Console MCP is fine.

Scale gates for generated page sets are in `./programmatic-comparison.md`.

## Part 2: hreflang and international SEO

Use only when the site has equivalent pages in several languages or regional variants.

### Strategy

| Structure | Use when | Note |
|---|---|---|
| Subdirectories (`/fr/`) | default choice | shares domain strength, simple to run |
| ccTLDs (`example.de`) | strong local presence, legal or trust need | separate sites to build and maintain |
| Subdomains (`fr.example.com`) | separate platform or team | treated more like separate sites |

Do not redirect users by IP or browser language without crawlable links to every version. Offer a visible language switcher. Machine-translate only with human review; mass untranslated or auto-translated pages risk the scaled content policy.

### Rules

1. Every page lists all its alternates, including itself (self-reference).
2. Return tags: if A lists B, B must list A. A missing return tag invalidates the pair.
3. `x-default` for the fallback or language selector, once per set.
4. Language is ISO 639-1 (`en`, `fr`, `ja`). Region is ISO 3166-1 alpha-2 and optional (`en-GB`, `pt-BR`, `en-IN`). Script subtags are allowed (`zh-Hans`, `zh-Hant`). Region alone is invalid.
5. Common code mistakes: `eng`, `jp` (should be `ja`), `en-uk` (should be `en-GB`), `EU`, `es-LA`.
6. Hreflang URLs must be canonical, same protocol, and match the canonical exactly (slashes included). Non-canonical pages are ignored.
7. Hreflang is a hint. Search Console has no country-targeting setting any more; ccTLD, hreflang and content signals decide.
8. Pick one delivery method: HTML `<link>`, HTTP `Link` headers (for PDFs), or the sitemap (best for large or cross-domain sets).

HTML:

```html
<link rel="alternate" hreflang="en-IN" href="https://example.com/en-in/page" />
<link rel="alternate" hreflang="hi"    href="https://example.com/hi/page" />
<link rel="alternate" hreflang="x-default" href="https://example.com/page" />
```

Sitemap form (add `xmlns:xhtml="http://www.w3.org/1999/xhtml"`; every `<url>` repeats the full set, itself included):

```xml
<url><loc>https://example.com/page</loc>
  <xhtml:link rel="alternate" hreflang="en" href="https://example.com/page"/>
  <xhtml:link rel="alternate" hreflang="fr" href="https://example.com/fr/page"/>
  <xhtml:link rel="alternate" hreflang="x-default" href="https://example.com/page"/>
</url>
```

### Validate

1. `snapshot` one URL per locale: check the hreflang list, self reference, and `x-default`.
2. Build the matrix: rows = locales, columns = locales; every cell should be present. Missing cells are return-tag errors.
3. Compare each hreflang URL with the target page's own canonical.
4. Spot-check HTTP status of every alternate (200, no redirect).

| Issue | Severity |
|---|---|
| Missing self reference or return tags | high |
| Invalid language or region code | high |
| Hreflang on non-canonical or redirecting URL | high |
| Mixed http and https | medium |
| No `x-default` where a fallback exists | low |
| Same set declared in HTML and sitemap with differences | medium |

### Content parity and localisation

- Same page exists in every declared language. Same section structure, titles, descriptions and schema translated. Stale translations (older than the source) are flagged.
- Text length varies by language (German often longer, Japanese shorter); check that layouts survive.
- Formats follow the locale: numbers (1,000.00 vs 1.000,00), dates, currency symbol and placement, phone numbers with country code, address order, units. In India, lakh and crore grouping (1,00,000) and the rupee symbol are expected on en-IN pages.
- Cultural fit: calls to action, trust marks and legal pages fit the market; no foreign brand references or foreign legal claims on localised pages.

### Per-stack

| Stack | Notes |
|---|---|
| Next.js | i18n routing plus `alternates.languages` in metadata |
| Django | `LocaleMiddleware`, `i18n_patterns`, template loop over `LANGUAGES` for link tags |
| WordPress | WPML or Polylang output hreflang; do not add manual tags too |
| Rails, Laravel, Spring, .NET | route-prefix locale plus a head partial that renders alternates from a translation lookup |
| Shopify | Markets with subfolders adds hreflang automatically; check it |

Lens `seo-international`.
