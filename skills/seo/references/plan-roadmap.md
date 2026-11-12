# SEO plan and roadmap

For a new site, a relaunch, or an existing site that needs direction. Produces a plan someone can execute and measure. A general marketing calendar is `lll:marketing`; this file covers the search part.

## 1. Discovery (ask only what you cannot read)

Read the repo, README and business docs first. Then confirm:

- Business model, offer, margins, who buys, in which countries and languages.
- Goal in numbers: leads, signups, sales, calls, per month; current baseline if any.
- Constraints: budget, team and writer capacity, dev time, timeline, brand and legal limits.
- Current assets: site, content, Search Console and analytics access, Business Profile, backlinks, reviews.
- Top five competitors, named by the owner and by who ranks for the main queries.

If analytics or Search Console is not set up, that is step one of the plan (`lll:analytics`).

## 2. Competitive read

For each of five competitors, in a table: positioning, page types they have, content depth, top ranking pages (from Search Console-like data if available, else visible SERP sampling), schema in use, technical quality (speed, rendering), review presence, and the gap you can credibly fill. Do not estimate competitor traffic as fact; tools disagree. Label estimates.

## 3. Architecture

- Map customer journeys to page types: problem content, solution pages, comparison pages, pricing, proof, onboarding docs.
- Design the URL hierarchy and the pillar and cluster structure (`./keywords-briefs-sxo.md`).
- Navigation and internal linking so every key page is within three clicks and has descriptive links in.
- Decide the page set before the content: counts per type, which are generated (`./programmatic-comparison.md`), which are hand-written.
- Apply scale gates for location or generated pages.

## 4. Content strategy

- Topics from Search Console gaps, customer language and competitor gaps. Rank by business value, intent fit and difficulty.
- Each planned page: keyword, intent, page type, owner, brief status, due date, information-gain idea, internal links.
- E-E-A-T plan: named authors with bios, expert reviewers for sensitive topics, original data, case studies, update schedule.
- Refresh plan: the existing pages with impressions but low CTR or position 4 to 20 often beat new pages.
- Cadence the team can sustain. Ten good pages beat fifty thin ones.

## 5. Technical foundation

Short list from `./technical.md`: indexable templates, canonical logic, sitemaps, redirects, rendering, field CWV targets, schema per page type, mobile parity, preview-host noindex, analytics and Search Console set up.

## 6. Roadmap

| Phase | When | Work |
|---|---|---|
| 1 Foundation | weeks 1 to 4 | analytics and Search Console, fix indexing blockers, core pages (home, offer, about, contact), title and meta templates, essential schema, sitemap, redirect map |
| 2 Expansion | weeks 5 to 12 | publish the first cluster, comparison and pricing pages, internal-link hubs, Business Profile and citations for local, image and speed fixes |
| 3 Scale | months 4 to 6 | more clusters, refresh programme, digital PR and partnerships for links, AI-search readiness (`./geo-ai-search.md`), internationalisation if justified |
| 4 Authority | months 7 to 12 | original research, tools, thought leadership, review programme, advanced schema, quarterly audit and drift checks |

Each item carries owner, effort, dependency, expected effect, failure check and leading indicator.

## 7. Business-type notes

| Type | Emphasis |
|---|---|
| SaaS or app | feature, use-case and integration pages; comparison and alternatives; pricing page; docs as an SEO asset; glossary; programmatic integrations with real content; product-led content; `SoftwareApplication` schema |
| Local service | Business Profile first; service pages per service; location pages with real content; reviews; citations; click to call; `LocalBusiness` schema (`./local.md`) |
| E-commerce | category page quality; facet rules; product page uniqueness and schema; Merchant listings; reviews; buying guides (`./ecommerce.md`) |
| Publisher or blog | topical authority clusters; author pages; freshness; Discover (large images, strong titles); archives and pagination hygiene; ad layout shift |
| Agency or consultancy | case studies with measurable outcomes; service and industry pages; expert authorship; thought leadership; local pages if place-bound |
| Marketplace or directory | listing page quality at scale; faceted navigation control; supply-side content; duplicate listing rules; programmatic gates |
| Documentation or developer tool | clean URLs and versioning canonicals; `llms.txt` optional; code-sample pages; changelog; search inside docs |
| Mobile app | the web side is landing pages and help content; store listing optimisation is `lll:mobile` |

## 8. KPIs

Lead with leading indicators, because ranking and traffic lag by months.

| Metric | Source | Baseline | 3 months | 6 months | 12 months |
|---|---|---|---|---|---|
| Indexed key pages / submitted | Search Console | | | | |
| Impressions for target query groups | Search Console | | | | |
| Clicks and CTR on target templates | Search Console | | | | |
| Average position for target groups (median, not mean) | Search Console | | | | |
| Organic leads or signups | analytics | | | | |
| Pages passing field CWV | CrUX / Search Console | | | | |
| Referring domains (quality, not count alone) | Search Console Links, Bing | | | | |
| AI-search mentions in the prompt panel | manual | | | | |

Set targets only after a baseline; state them as ranges with the assumption. Never promise a ranking position or a timeline for page one.

## 9. Risks and dependencies

List: dev capacity, writer capacity, approval delays, platform limits (CMS cannot edit canonicals), reliance on one traffic source, algorithm updates, brand or legal review times, data gaps. Each with a mitigation.

## 10. Deliverables

When files are requested: `SEO-STRATEGY.md` (summary, goals, competitors, architecture), `SITE-STRUCTURE.md` (URL tree and templates), `CONTENT-CALENDAR.md` (page, keyword, owner, date), `ROADMAP.md` (phases, items, KPIs). Keep each to what the team will use. A shareable page version can be made with the artifact tools.
