# Structured data (schema.org JSON-LD)

Structured data helps search engines understand a page and can unlock rich results. It is not a direct ranking factor. It must describe what users can see on the page.

## Method

1. **Detect.** `node scripts/seo-probe.mjs snapshot <url>` lists JSON-LD types and counts parse errors. Also check Microdata (`itemscope`) and RDFa. Prefer JSON-LD, which Google recommends.
2. **Validate.** Syntax parses; `@context` is `https://schema.org`; `@type` is real and current; required properties present; values have the right type; URLs absolute; dates ISO 8601; no placeholder text; no content that is not on the page.
3. **Compare with the page.** Every marked-up fact (price, rating, date, author, address) must be visible on the page and match.
4. **Generate** only what the page supports. Mark unknowns `TODO_...`. Never invent ratings, review counts, awards or prices.
5. **Test** with the Rich Results Test (rich result eligibility) and the Schema.org validator (syntax and vocabulary). After release, watch Search Console > Enhancements for errors.
6. **JavaScript sites.** JSON-LD injected by JavaScript can be processed late. For Product, Offer and other time-sensitive types, render it on the server.

## Type status

Status moves. Before promising a rich result, check Google's structured data gallery. The table is a working default.

| Use | Types |
|---|---|
| Recommend when the page fits | `Organization`, `WebSite`, `WebPage`, `Article` / `BlogPosting` / `NewsArticle`, `Person` / `ProfilePage`, `BreadcrumbList`, `Product` / `ProductGroup` / `Offer`, `Review` / `AggregateRating` (with rules below), `LocalBusiness` and subtypes, `SoftwareApplication` / `WebApplication`, `Service`, `Event`, `JobPosting`, `Course`, `VideoObject`, `ImageObject`, `ItemList`, `DiscussionForumPosting`, `QAPage` (one question, community answers), `Dataset` (Dataset Search only) |
| Keep if already there, never add for Google | `FAQPage` (no Google rich result any more). Report as info, not as an error |
| Never recommend | `HowTo` (rich results removed 2023). Also retired from rich results: `SpecialAnnouncement`, `CourseInfo`, `EstimatedSalary`, `LearningVideo`, `ClaimReview`, `VehicleListing`, `Practice Problem`, Book actions |
| Machine-readable only | `WebSite` + `SearchAction` (no sitelinks search box), `ReserveAction`, `OrderAction` |

## Rules that avoid manual actions

- Reviews and ratings must come from real users and be visible. No fake or undisclosed incentivised reviews. Self-serving reviews of your own `Organization` or `LocalBusiness` on your own site are not eligible for star results; review stars work for products and other eligible items.
- Do not mark up content that is hidden, irrelevant to the page, or about a different entity.
- One entity, one `@id`. Link entities with `@id` references inside a single `@graph` instead of repeating blocks.
- Product: `name` plus at least one of `offers`, `review`, `aggregateRating`. Price is a number string without a currency symbol, `priceCurrency` is ISO 4217, `availability` is a full schema.org URL. Merchant listings add shipping and return details.
- Article: `headline`, `image`, `datePublished`, `dateModified`, `author` (a real `Person` with `url`), `publisher`.
- Escape for HTML: when printing JSON-LD from code, replace `<` with `<` so user data cannot close the script tag.

## Templates (fill, then trim to what the page shows)

Organization and site, one graph on the home page:

```json
{
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "Organization", "@id": "https://example.com/#org", "name": "TODO_Company",
      "url": "https://example.com/", "logo": "https://example.com/logo.png",
      "sameAs": ["https://www.linkedin.com/company/TODO", "https://x.com/TODO"] },
    { "@type": "WebSite", "@id": "https://example.com/#site", "url": "https://example.com/",
      "name": "TODO_Site", "publisher": { "@id": "https://example.com/#org" } }
  ]
}
```

Article:

```json
{
  "@context": "https://schema.org", "@type": "Article",
  "headline": "TODO", "image": ["https://example.com/img/cover-1200.jpg"],
  "datePublished": "2026-01-15T09:00:00+05:30", "dateModified": "2026-02-01T10:00:00+05:30",
  "author": { "@type": "Person", "name": "TODO", "url": "https://example.com/authors/todo" },
  "publisher": { "@id": "https://example.com/#org" },
  "mainEntityOfPage": "https://example.com/blog/todo"
}
```

Breadcrumbs:

```json
{ "@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
  { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://example.com/" },
  { "@type": "ListItem", "position": 2, "name": "Guides", "item": "https://example.com/guides" },
  { "@type": "ListItem", "position": 3, "name": "TODO_Page" } ] }
```

Product with offer:

```json
{ "@context": "https://schema.org", "@type": "Product", "name": "TODO", "image": ["https://example.com/p.jpg"],
  "sku": "TODO", "brand": { "@type": "Brand", "name": "TODO" },
  "offers": { "@type": "Offer", "url": "https://example.com/p", "priceCurrency": "INR", "price": "999.00",
    "availability": "https://schema.org/InStock", "priceValidUntil": "2026-12-31" } }
```

Software or web app:

```json
{ "@context": "https://schema.org", "@type": "SoftwareApplication", "name": "TODO",
  "applicationCategory": "BusinessApplication", "operatingSystem": "Web",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" } }
```

Local business subtypes, properties and multi-location graphs: `./local.md`. Comparison and roundup pages use `ItemList`: `./programmatic-comparison.md`.

## Per-stack

| Stack | Notes |
|---|---|
| Next.js, React | render `<script type="application/ld+json">` in a server component with `JSON.stringify(obj).replace(/</g, "\\u003c")`; build the object from the same data as the visible page |
| Astro, SvelteKit, Nuxt, Hugo, Jekyll | partial or layout component that takes page data; one graph per page |
| WordPress | SEO plugins output a graph; do not add a second copy by hand or by a second plugin; check for duplicate `Organization` and `Article` |
| Shopify | the theme emits Product JSON-LD; apps may add a second one. Keep one, fix price and availability to match the page |
| Django, Rails, Laravel, .NET | template helper that serialises a dict or hash; unit test that output parses as JSON |
| Static builders | generate at build time; lint with a script that parses every emitted block |

## Output

Validation table (schema, type, status, issues), missing opportunities by page type, corrected blocks. Lens `seo-schema`. Evidence is the URL or file plus the quoted line.
