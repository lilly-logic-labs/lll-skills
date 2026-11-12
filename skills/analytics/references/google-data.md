# Reading Google data: Search Console and GA4

Fixing search problems belongs to `lll:seo`. This file is for reading the numbers correctly and tying search and site data together.

## 1. Search Console

### What it is
First-party data about Google Search: queries, pages, countries, devices, impressions, clicks, average position, indexing status, sitemaps, Core Web Vitals field data and manual actions.

### Limits that change how you read it
- Data is 2 to 3 days late, and the interface keeps about 16 months.
- Rare queries are anonymised, so query totals are smaller than page totals.
- Position is an average over all impressions of the query or page, per device and country. A single average hides variance.
- Impressions count when a result is shown, not necessarily seen. Page-two results can count.
- AI features in Google Search (AI Overviews, AI Mode) are reported inside the standard Web totals; there is no separate breakout at the time of writing. Verify in Search Central documentation before telling someone that is still true.
- Clicks are not sessions: they will not match GA4 (consent, blockers, redirects, multiple clicks, bots).
- Domain property (DNS verification) covers all subdomains and protocols; a URL-prefix property sees only that prefix.

### Reading patterns

| Pattern | Likely meaning | Next step |
|---|---|---|
| Impressions up, clicks flat, CTR down | more visibility on lower positions, richer SERP features, or AI answers absorbing the click | look at the queries and position bands; improve snippet/title relevance (`lll:seo`) |
| Clicks down, impressions flat | lower position or CTR | check position by query and the SERP |
| Both down on a date | update, outage, indexing or tracking change | check the Pages report, robots, deploys, known Google updates |
| Branded vs non-branded split | brand demand vs discovery | filter queries by brand terms; track non-branded separately |
| Query with high impressions, low CTR, positions 4 to 10 | the best quick win | rewrite title and description, add a better answer |
| Position 11 to 20 with decent impressions | near page one | strengthen the page and internal links |
| Pages report: Discovered or Crawled, not indexed | crawl budget or quality | `lll:seo` indexing triage |

### Comparing periods
Compare equal-length periods of whole weeks. Prefer year over year for seasonal sites. Use the 28-day or 3-month view for a trend and the daily view for a date of change. Ignore the last 3 days.

### MCP tools (when the `gsc` server is connected)
- Read-only: `mcp__gsc__list_properties`, `mcp__gsc__get_search_analytics`, `mcp__gsc__get_advanced_search_analytics`, `mcp__gsc__get_performance_overview`, `mcp__gsc__compare_search_periods`, `mcp__gsc__get_search_by_page_query`, `mcp__gsc__inspect_url_enhanced`, `mcp__gsc__batch_url_inspection`, `mcp__gsc__check_indexing_issues`, `mcp__gsc__get_sitemaps`.
- Owner actions that change the property (ask first): `mcp__gsc__add_site`, `mcp__gsc__delete_site`, `mcp__gsc__submit_sitemap`, `mcp__gsc__manage_sitemaps`, `mcp__gsc__delete_sitemap`.
- Start with `mcp__gsc__get_capabilities` or `mcp__gsc__list_properties`; if it asks to authenticate, tell the owner and stop.
- The account sees only properties it is authorised for. State which property and dates each number came from.
- When not connected: ask for an export (Performance > Export), or do the checks by hand, and mark Search Console evidence as skipped.

## 2. GA4

### Structure
Property > data stream (web or app) > events (each with parameters) > reports and explorations. Key events (the old "conversions") mark outcomes. Dimensions describe, metrics count.

### Reading rules
- Use Reports for standard questions and Explorations for ad hoc ones; explorations may sample or threshold small data.
- Thresholding hides rows with very small counts when Google signals or demographics are on; the totals can differ from the rows.
- Sessions are attributed by the default channel group (`./utm-attribution.md`).
- Key event rate = key event sessions / sessions; check the denominator.
- Realtime is about 30 minutes; standard reports can be late by many hours; data-driven attribution needs volume.
- Custom dimensions appear only after registration and only for events after that date.
- "Landing page" report with the organic search source gives site-side performance of search visits. Join by landing page with Search Console clicks to find pages that get clicks but do not convert.
- Data retention: event-level exploration data 2 or 14 months (set to 14); BigQuery export keeps raw data indefinitely if you do not set expiry.
- Time zone and currency are set at the property level; a change does not rewrite history.

### BigQuery
Daily export is free (streaming has a cost); tables are `events_YYYYMMDD`. Use for custom funnels, joins with orders, long retention, and when the interface samples. Keep partition filters in queries to control cost. Watch the dataset's location and expiry for privacy.

## 3. GSC and GA4 together

| Question | Method |
|---|---|
| Which search landings convert? | GA4 landing page report, organic Google; join with GSC clicks and CTR by page |
| Why are GSC clicks higher than GA4 organic sessions? | consent, blockers, redirects, tracking load failures; expect a stable ratio and watch it for changes |
| Did a content update work? | GSC clicks and position by page, before and after, equal periods; GA4 engagement and key events for the same page |
| What queries lead to leads? | GSC gives queries for a page; GA4 gives the page's conversions; infer, do not claim exact query-level conversion |

## 4. Mobile consoles

- **Play Console**: store listing visitors, installs, conversion by source, retention, Android vitals (crashes, ANRs), reviews, pre-launch reports.
- **App Store Connect**: impressions, product page views, downloads, sessions, crashes, retention, App Store Search Ads.
- Both: data thresholds, 1 to 2 day delays, organic vs referral splits. Use for the install funnel; use product analytics for behaviour after install.
- For store listing search visibility (ASO), keep it to listing basics here: title, subtitle or short description, screenshots and ratings; deep ASO is out of scope.

## 5. Other free first-party sources

- Bing Webmaster Tools: Bing and partners, including some ChatGPT-related search discovery; IndexNow reporting.
- Cloudflare Web Analytics, CDN logs and server logs: unaffected by blockers; useful for bots and AI crawlers.
- Merchant Center: product feed health and free listings.
- Business Profile insights: calls, direction requests and views for local (`lll:seo`).

## 6. Output

For a read: the question, the property and date range, the numbers with definitions and caveats, what changed, the likely cause, one action. For setup: a checklist of owner actions (verify, link, filter, retention).
