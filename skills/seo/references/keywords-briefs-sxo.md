# Keywords, clusters, briefs and search experience (SXO)

## 1. Keyword research without paid tools

Sources, best first:
1. **Search Console queries** for the site: what you already show for. Filter to position 4 to 20 with real impressions: these are the quick wins.
2. Autocomplete and "related searches" for each seed; People Also Ask questions.
3. Competitor titles, headings and URL slugs; their sitemaps show what they invest in.
4. Customer language: support tickets, sales calls, reviews, community threads, internal site search.
5. Modifiers: best, vs, alternative, pricing, for [audience], how to, template, checklist, examples, mistakes, free, near me.
6. Paid tools when connected (DataForSEO, Ahrefs, Google Keyword Planner). If none: say volumes are unknown, rank by intent fit and Search Console impressions.

Output a table: keyword, intent, page type, current URL (if any), position, impressions, difficulty guess (low, medium, high from SERP strength: big brands and Wikipedia in the top 5 means high), priority.

## 2. Intent and page type

| Intent | Signals | Page type that wins |
|---|---|---|
| Informational | how, what, why, guide | article, guide, video |
| Commercial investigation | best, vs, review, alternative | comparison, roundup, review |
| Transactional | buy, price, sign up, book | product, service or landing page |
| Navigational | brand name, login | the brand's own page (do not chase) |
| Local | near me, [city] | local pack plus location or service page |

The intent is whatever the SERP shows, not what you hoped. Search the query and list the top 10 page types.

## 3. SERP-overlap clustering

Group keywords by how Google ranks them, not by words.

1. Collect 30 to 50 deduplicated keywords. Drop navigational ones.
2. Pre-group by guessed intent to reduce comparisons (four groups of ten need about 180 comparisons, not 780).
3. For each candidate pair, list the top 10 organic URLs for both and count shared URLs (ignore ads, snippets, PAA).
4. Decide:

| Shared URLs | Meaning | Action |
|---|---|---|
| 7 to 10 | same intent | one page targets both |
| 4 to 6 | same topic cluster | separate pages in the same cluster |
| 2 to 3 | related | separate clusters, cross-link |
| 0 to 1 | different | separate or drop |

5. If no SERP data is available, fall back to intent-only grouping and label it lower confidence.
6. Cannibalisation check: no two pages share a primary keyword.

## 4. Hub-and-spoke architecture

- **Pillar** page: broadest intent, highest volume, overviews every sub-topic. Typical 2,500 to 4,000 words if the topic needs it.
- **Clusters**: two to five sub-topic groups. Each has two to four **spoke** pages that go deep on one question. Typical 1,200 to 1,800 words.
- Template per spoke by intent: guide, how-to, listicle, explainer, comparison, review, best-of, landing page.
- Link matrix: every spoke links to the pillar and the pillar links to every spoke (mandatory). Spokes link to two or three siblings. Cross-cluster links are rare and meaningful.
- Rules: every page has at least three internal links in; no orphan; anchor text is descriptive; links sit in body copy.
- Record the plan as a table (page, keyword, intent, template, words, links out) or JSON adjacency list. Offer an HTML cluster map through the artifact tools only if asked.
- Scorecard after writing: coverage (written / planned), links per page, orphans, cannibalisation, images per page, pillar links complete.

## 5. Content brief

Two modes: **new page** (build from scratch) and **improve** (keep what works, add what is missing; avoid a rewrite when targeted changes will win).

Process:
1. Read the site (home page, sitemap) so every suggestion is something the business can credibly write. Do not copy competitor sections the site cannot deliver. For hub or "types of" pages, include every real category or sub-page and link each; invent none.
2. Take the top five real competitors for the query (skip Wikipedia, Reddit, marketplaces, directories, aggregators, social). Score each for depth, formatting, SEO and UX out of 10.
3. Find gaps: topics missing, topics shallow, quality problems (outdated, no expert view, poor format). Rank gaps by impact times advantage divided by effort.
4. Classify intent and the SERP's rewarded format.
5. Specify **information gain**: exactly what this page adds that no ranking page has (original data, real case outcomes, expert quotes, first-hand method, a tool). "More detail" does not count.
6. List E-E-A-T needs: author and credentials, cited sources with dates, last-updated date, reviewer for sensitive topics.
7. Add 3 to 5 internal links with anchor text and real target URLs; say whether the page is hub or spoke.

Template:

```
## Brief: <primary keyword>
Intent and SERP format: ...      Audience and knowledge level: ...
Competitors: | URL | key H2s | words | score /40 | main gap |
Gaps: topic / depth / quality bullets
H1: ...   Slug: /...   Target length: ~N words (competitor average ~M)
Outline: H2/H3 with words per section, format notes (table, list, definition), snippet targets, keyword placement per section
Title (about 50-60 chars) / Meta description (about 120-160 chars, specific, with a call to action)
Information gain: ...        E-E-A-T needs: ...        Internal links: ...
Schema: Article + BreadcrumbList (+ others that fit)
```

Primary keyword goes in the title (near the front), H1, URL, meta description, first paragraph and one alt text; not in every heading. Secondary terms (5 to 8 close, 10 to 15 broader) spread through subheadings and body. No density target.

Outline-only mode: skip competitor table, gaps, gain and E-E-A-T; give H1, slug, length and the outline with a one-line writing note per section.

Never name SEO tools or researchers in the brief text. Write for the person who will write the page.

## 6. SXO: why a good page does not rank

A technically perfect page can fail because it is the wrong page type for the query. SXO reads the SERP backwards.

1. Take the page and its target keyword (from the title and H1 if not given).
2. Search the keyword. For the top 10, record page type, format, rough depth, schema, media, and who the domains are (big brands, niche authorities, unknowns). Note SERP features: snippet type, People Also Ask, video, images, shopping, local pack, AI Overview.
3. Consensus: one page type in more than 60 percent of results is strong; 40 to 60 mixed; under 40 fragmented.
4. Compare the page's type with the consensus.

| Your page | SERP wants | Severity | Response |
|---|---|---|---|
| Blog post | product or service pages | critical | build a product or service page, link the post to it |
| Blog post | comparison | high | restructure as a comparison with a matrix |
| Product page | informational | high | add an education layer or publish a guide |
| Landing page | tool or calculator | high | build the tool |
| Service page | local results | medium | add location signals and local schema |
| Same type | same type | aligned | depth, UX, authority |

Page-type taxonomy: home, category, product, service, landing, article or guide, comparison, listicle, tool or calculator, directory, documentation, video, forum thread, local profile.

5. **User stories** from the signals: People Also Ask shows knowledge gaps and worries; ad copy shows commercial triggers; related searches show the journey; snippet format shows the expected answer shape. Write three to five as: "As a [who], I want [goal], because [driver], but I am blocked by [barrier]". Cite the signal for each.
6. **Gap score (0-100, heuristic)**: page type 15, content depth 15, UX signals 15, schema 15, media 15, authority 15, freshness 10, against the SERP norm. Report it beside the SEO score, never inside it. A page can score 95 on technical SEO and 30 on SXO.
7. **Personas**: derive four to seven from the signals. Score the page 0-25 on each of relevance, clarity (answer within ten seconds), trust, action (clear next step). Fix the weakest persona first.
8. **Wireframe** (only if asked): current structure vs target structure, with concrete elements ("pricing call to action under the hero linking to /pricing#teams") rather than "add a CTA".

Limits to state: SERPs differ by country, device, personalisation and date. Say which was sampled.
