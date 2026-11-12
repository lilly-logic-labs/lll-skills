# E-commerce SEO

Product, category and merchant-listing visibility. Product schema detail is in `./schema.md`; images in `./images.md`; speed in `./core-web-vitals.md`.

## 1. Product page checklist

| Area | Pass |
|---|---|
| Title | product name plus the distinguishing feature, brand last; unique per variant that has its own URL |
| Description | written for this product, not the manufacturer's copy; specs in a table; sizing, materials, compatibility, care, what is in the box |
| Heading | one H1 with the product name; H2s for features, specifications, reviews, delivery and returns, related items |
| Images | several angles and a lifestyle shot; descriptive alt naming the product and variant; large enough for zoom; WebP or AVIF with dimensions |
| Price and availability | visible, current, and identical to schema and the merchant feed |
| Reviews | real, visible, with dates; pagination crawlable; no fake or incentive-undisclosed reviews |
| Delivery and returns | clear, linked, and marked up where supported |
| Breadcrumbs | Home > Category > Subcategory > Product, with `BreadcrumbList` |
| Internal links | back to the category, to related and complementary products, to buying guides |
| Trust | contact details, policies, secure checkout, business identity |

## 2. Category and listing pages

- Each category has a unique introduction (not just a grid), a clear H1, and links to subcategories. Keep the intro helpful; avoid a wall of text under the grid.
- Pagination: each page self-canonical, plain `<a href>` links, no infinite scroll without paginated URLs, no canonical of page 2 to page 1.
- Faceted navigation decides crawl waste. Index only facets people search for (colour + product type, brand + category) with unique titles and content. Everything else: no links to it in crawlable form where possible, canonical to the base, or `noindex, follow`. Do not rely on robots.txt alone if you need Google to see a canonical.
- Sorting and view parameters never indexable. Internal search results `noindex`.

## 3. Variants

- One URL per product with variant selection by parameter and a canonical to the main URL is the simplest choice when variants are near-identical. Give each variant its own URL only when it has its own demand (different model, not different colour).
- Use `ProductGroup` with `hasVariant` / `variesBy` for grouped variants. Each variant has its own `Offer`, `sku`, image.
- Do not leave different canonical targets per variant that contradict internal links.

## 4. Stock and lifecycle

| Situation | Handling |
|---|---|
| Temporarily out of stock | keep the page 200, show `OutOfStock`, offer alerts and alternatives |
| Seasonal | keep the URL, update availability, keep internal links |
| Discontinued with a clear successor | 301 to the successor or the closest category |
| Discontinued without a successor | 404 or 410; link nearby alternatives from the category |
| Replaced by a new model | link old to new; redirect only if the pages serve the same need |

## 5. Merchant listings and feeds

- Free listings in Google Shopping come from a Merchant Center feed or from Product markup on the page. Price, availability, GTIN, brand and images must agree across page, markup and feed; mismatches get items disapproved.
- Provide `gtin` or `mpn` and `brand` where they exist. Add shipping and return policy details (markup or Merchant Center settings).
- Merchant API replaces older Content API integrations; check the current Google migration dates before building new feed code.
- AI-generated product images carry the IPTC `DigitalSourceType` label, and AI-written feed titles and descriptions are labelled per Merchant Center policy (`./images.md`).
- Adult products need the required adult-content attribute in markup and feed. Check current Merchant Center policy for restricted categories.
- Search Console has merchant listing and product snippet reports. Merchant Center diagnostics are the source for feed errors. Both are owner access.

## 6. Marketplaces

For Amazon and similar: the listing title, bullets, backend keywords and images are the SEO. Compare your price, rating and review count with the top ten listings for the target keyword. Marketplace work is separate from site SEO; do not assume one improves the other. DataForSEO can pull marketplace data when configured (paid; ask first).

## 7. Platform notes

| Platform | Notes |
|---|---|
| Shopify | canonicalises `/collections/x/products/y` to `/products/y`; edit `robots.txt.liquid` for facets; review apps and popups cost INP; metafields for specs |
| WooCommerce | one SEO plugin; remove tag and attribute archive bloat; variation URL handling; page cache with cart exclusions |
| Magento, headless storefronts | server-render category and product pages; sitemaps from the catalogue; avoid client-only product data |
| Custom stacks | server-render product data and JSON-LD, generate sitemaps from the catalogue table, return correct status codes for removed products |

## 8. Agentic commerce (watch, do not oversell)

Open standards for AI agents to browse and buy (such as Universal Commerce Protocol, discovery files under `/.well-known/`) are early. Clean Product markup, a healthy Merchant Center feed and stable, labelled, accessible product pages are the prerequisite for any of them. Report their absence as an opportunity, never a defect, and verify current specs at the source before implementing.

## 9. Scoring

Heuristic weights: schema completeness 25, title and meta 15, images 20, content quality 20, internal linking 10, technical 10. Schema ladder: required fields only is a base; add rating, identifiers, shipping, return policy and reviews to reach full.

## 10. Output

Lens `seo-ecommerce`. Table per template (product, category, brand, search, cart): pass/fail by section; schema validation of three sample products; feed-vs-page consistency check on five products; ranked fixes with the revenue-relevant templates first.
