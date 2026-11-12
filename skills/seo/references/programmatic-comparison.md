# Programmatic pages and comparison pages

## Part 1: Programmatic SEO (pages generated from data)

Good for integrations, templates, glossaries, directories, product and data pages. Dangerous when pages differ only by a swapped word.

### Standalone value test

Would this page be worth publishing if no sibling pages existed? If not, do not publish it, or merge it into a page that is.

### Safe and risky page families

| Usually safe at scale | High risk at scale |
|---|---|
| integration pages with real setup steps and screenshots | city-swapped location pages |
| tool and template pages with a real download or calculator | "best [tool] for [industry]" with no industry-specific substance |
| glossary entries with 200+ words, examples and related terms | "[competitor] alternative" without real comparison data |
| product pages with unique specs, reviews, availability | AI-written pages with no review and no unique data |
| data pages with a unique number, chart or analysis per record | pages where most text is shared template boilerplate |

### Data assessment

- Count records, columns, empty values. Each record needs enough distinct attributes to write a distinct page.
- Flag near-duplicate records (most fields identical). Merge them.
- Check freshness and source licence. Stale data creates stale pages.

### Template design

- Static blocks (shared) vs dynamic blocks (unique per record). Conditional sections that appear only when data exists.
- Each dynamic block must add information, not keyword variants.
- Title, H1, description, intro and one body section must come from record-specific facts.
- Add supplementary value: related records, local or contextual notes, user content, a computed insight.

### Uniqueness measure

Unique share = words appearing on this page and not on other pages of the set (ignore header, footer, navigation), divided by the page's words.

Quick method: split the main text into 5-word shingles per page, then for each page count shingles that appear on no other page. A small Node or Python script over the rendered HTML files does it. Also compare title and description shapes across 20 pages with the templated-metadata check (`./content-onpage.md`).

| Measure | Action |
|---|---|
| Unique body share under about 40 percent | thin risk: fix the template before publishing |
| Under about 30 percent, or metadata all one shape | stop and fix |
| Under 300 words of main text | review for value |
| 100 or more pages with no human review | warn, review a sample first |
| 500 or more pages without justification | stop and ask the owner |

### Rollout

1. Review a sample of 5 to 10 percent by hand before launch.
2. Publish in batches of 50 to 100. Watch indexing (Search Console Pages report) and impressions for 2 to 4 weeks before the next batch.
3. Never ship hundreds of new pages at once on a young site.
4. If pages are not being indexed, do not add more. Improve the template, add internal links, prune the weakest.

### Technical rules for sets

- URLs: lowercase, hyphenated slugs from data, unique, no parameters for primary content, consistent trailing slash.
- Self-canonical on each page; parameter variants canonical to the clean URL; if a hand-written page covers the same intent, it is the canonical one.
- Hub pages by category link to members; members link to 3 to 5 related members and back to the hub; BreadcrumbList from the URL hierarchy.
- Sitemaps: split at 50,000 URLs or 50 MB; `lastmod` from the record's real update time; exclude noindexed pages (`./sitemaps-hreflang.md`).
- Index control: `noindex` pages below the quality bar; avoid indexable faceted combinations; merge thin records into aggregate pages; monthly compare indexed count with intended count.
- Policy risks to name in the report: scaled content abuse, doorway pages, and (for third-party sections hosted on a reputable domain) site reputation abuse. Check current wording on Search Central.

Lens `seo-content` or `seo-technical`. Gate failures are findings with the page count and the measured share as evidence.

## Part 2: Comparison, alternatives and roundup pages

Target comparison-intent searches with accurate, balanced, useful pages.

### Page types

| Type | Target query shape | Structure |
|---|---|---|
| X vs Y | `A vs B`, `A vs B pricing`, `A vs B for [use case]` | verdict first, criteria table, one section per criterion, who should pick which, FAQ |
| Alternatives to X | `X alternatives`, `best alternatives to X` | why people leave X, 5 to 10 options each with best-for, pros, cons, price |
| Roundup | `best [category] tools` | stated criteria, ranked list, methodology, update date |
| Feature matrix | `[category] comparison` | sortable table plus notes |

### Build steps

1. Confirm search intent in the SERP (`./keywords-briefs-sxo.md`): do results show comparisons, or product pages?
2. Collect facts from official pages and docs: features, limits, pricing, integrations, support, security. Record the source URL and date for each. Test the competitor's product where possible.
3. Choose criteria that matter to the reader, not only where you win.
4. Draft the verdict honestly. Say who each option is best for, including cases where a competitor is better.
5. Add a "last verified" date, author, and disclosure of which product is yours or which links are affiliate.
6. Schedule a review: quarterly, or when a competitor ships a major change.

### Matrix rules

```
| Feature        | Us     | Competitor A | Competitor B |
|----------------|:------:|:------------:|:------------:|
| Feature 1      | Yes    | Yes          | No           |
| Feature 2      | Yes    | Partial      | Yes          |
| Price from     | $X/mo  | $Y/mo        | Not public   |
```

Use "Not publicly available" rather than guessing. Pricing carries "as of [date]". Include hidden costs (per-seat fees, setup, overage).

### Fairness and legal

- Every claim about a competitor is verifiable. No disparagement, no implied endorsement, no logo use beyond what the trademark owner allows. Name the product in plain text.
- Disclose affiliate links and your own affiliation. Review markup only for real reviews.
- Get legal review for regulated claims (health, finance) and for any comparative advertising rule in your market.

### On-page

- Title: `A vs B: [key difference] ([year])`, `[N] best A alternatives in [year]`, `[N] best [category] tools, compared`. Keep the year only if you maintain it.
- H1 matches the title's intent. Verdict or summary above the fold, call to action after the table and at the end, not inside competitor descriptions.
- Social proof that is genuine: third-party review ratings with source links, customer stories about switching.
- Internal links: related comparisons, feature pages, pricing, case studies. Breadcrumb Home > Comparisons > page.
- Schema: `ItemList` for roundups (`itemListElement` with `ListItem` position, name, url), `Product` or `SoftwareApplication` for the items you describe, `Article` for the page. No `AggregateRating` unless the ratings are real and shown. See `./schema.md`.
- Minimum depth: enough to answer the comparison fully; around 1,500 words is common, but coverage decides.

### Output

Outline with section word targets and the table, schema block, keyword set (primary, secondary, long-tail), and content gaps against the current top results. Files only when asked.
