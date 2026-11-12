# Content, on-page and E-E-A-T

## 1. On-page elements

| Element | Pass condition | Notes |
|---|---|---|
| `<title>` | present, unique, names the page's topic near the front, brand last | about 50 to 60 characters is a display guide (pixels, not characters, decide truncation). Google may rewrite titles that are stuffed, vague or boilerplate |
| Meta description | present, unique, written for this page, states the benefit | not a ranking factor; Google often replaces it with a page excerpt. About 120 to 160 characters. Do not open by repeating the title |
| H1 | one clear H1 that matches the page's intent | several H1s are allowed by HTML but muddy intent; never zero |
| H2 to H6 | descriptive, in order, no skipped levels for styling | headings are for structure, not decoration |
| URL | short, readable, stable | see `./technical.md` |
| Images | descriptive alt, real file names, dimensions | see `./images.md` |
| Internal links | descriptive anchor text, link to the next logical page, no orphans | 3 to 5 contextual links per 1,000 words is a sane habit, not a rule |
| External links | cite primary sources; `rel=nofollow` or `sponsored` for paid and affiliate; `ugc` for user content | |
| Open Graph, Twitter Card | `og:title`, `og:description`, `og:image` (1200 px wide), `og:url`, `twitter:card` | link previews, not ranking |
| Robots meta | `index, follow` unless intentionally restricted; `max-image-preview:large` helps Discover and large image previews | `nosnippet` and `data-nosnippet` also limit AI feature quotes |

**Templated metadata check.** Unique strings are not enough when every title and description shares one generated shape (description opens with the title and ends with a stock call to action). Read ten pages of a template side by side. If they match in shape, rewrite the template so each page states what is specific to it. Duplicate or boilerplate metadata is a content-quality problem even when body copy is original.

## 2. Google's Who, How, Why test

| Question | Look for |
|---|---|
| **Who** made it | visible byline, author page with real credentials, About and contact pages. Needed wherever readers expect it, and for health, finance, legal and safety topics |
| **How** was it made | first-hand testing, original data, photos or screenshots, method disclosed. For AI-assisted content, disclose the process where readers would reasonably ask |
| **Why** does it exist | to help the reader, not to catch a search query. Warning signs: written to a word-count target, niche chosen for traffic without expertise, content churned for freshness, fake dates |

If all three answers are weak, the page is at risk under the core helpfulness systems. They run continuously inside core updates now; there is no separate "helpful content update" to wait for.

## 3. E-E-A-T

Experience, Expertise, Authoritativeness, Trust. It is a concept from the Quality Rater Guidelines, not a ranking score. Trust is the most important member. Use the table to find gaps; do not report E-E-A-T as a number to Google.

| Factor | Signals to look for |
|---|---|
| Experience | original photos, screenshots, case studies, before and after, "we tested", specifics that cannot be written without having done it |
| Expertise | author bio with relevant credentials, accurate and current detail, sources cited, no factual errors |
| Authoritativeness | cited or linked by other credible sites, press and industry mentions, consistent publishing on the topic, recognised by peers |
| Trust | contact details and a real address, privacy policy and terms, HTTPS, clear ownership, reviews that are genuine, corrections policy, refund and return terms, no deceptive ads or clickbait |

YMYL topics (health, money, legal, safety, civic information) need the highest bar: named expert authors or reviewers, citations to primary sources, last-reviewed dates.

**Internal rubric (heuristic, say so in the report).** Score 0-100 as Experience 20, Expertise 25, Authoritativeness 25, Trust 30. Each factor: strong, moderate, weak, none, with the evidence quoted. Trust carries the largest share because Google says trust matters most.

## 4. Quality checks that find real problems

1. **Intent match.** Does the page type match what the results show for the query? A blog post against a page full of product pages will not break through. Use `./keywords-briefs-sxo.md`.
2. **Information gain.** What does this page say that the top results do not: data, first-hand detail, a tool, a clearer explanation? "More words" is not gain.
3. **Thin pages.** Pages that add nothing beyond a template, a manufacturer description or a list of links. Fix: merge and 301, expand with real content, or `noindex`.
4. **Cannibalisation.** Two pages for one intent. Find in Search Console: one query with two ranking URLs swapping places. Fix: merge into the stronger URL with a 301, or differentiate intent and re-link.
5. **Duplicates.** Same content on several URLs, syndicated copies, translated copies served without hreflang. Canonical or consolidate.
6. **Freshness.** Show the real published and last-updated dates. Update when facts change; do not bump dates without edits. Review evergreen pages yearly, service pages quarterly, product pages when specs or prices change.
7. **Readability.** Short paragraphs, descriptive subheads, lists and tables where content is a list or a comparison. Flesch scores are a proxy only.
8. **Page-type floors.** Rough coverage floors, not targets: home 500 words, service page 800, blog post 1,500, product page 300 or more, location page 500 or more. A 500-word page that fully answers the query beats a padded 2,000-word one. Report under-floor pages as "check coverage", not as a defect by itself.
9. **Keyword use.** Primary phrase in title, H1, first paragraph, URL and one alt text, used naturally. Do not chase a density number. Synonyms and related terms belong in subheadings.

## 5. AI-assisted content

Google's rule is about quality and scale, not about who typed it. Generative content is fine when it is accurate, original in value, reviewed by a person and attributed. It becomes spam when used to publish many low-value pages. Markers of low-quality output: generic phrasing, no specifics, repeated structure across pages, no author, invented facts, invented quotes and statistics.

Checklist for AI-assisted drafts: a named reviewer who can vouch for it; every number and quote traced to a source; first-hand material added; no repeated template paragraphs across pages; internal links added by hand.

**Draft cleanup.** For a draft that reads machine-written, use the `humanizer` skill. For invisible characters pasted from chat tools (zero-width spaces, direction marks, tag characters), search the file: `grep -nP "[\x{200B}-\x{200F}\x{202A}-\x{202E}\x{2060}\x{FEFF}\x{E0000}-\x{E007F}]" file.md` and delete them. Statistical text watermarks live in word choice and cannot be reliably detected or removed; do not claim otherwise. Clean the user's own drafts only.

## 6. Scoring and output

```
Content quality: xx/100  (Experience x/20, Expertise x/25, Authority x/25, Trust x/30)   heuristic
On-page: xx/100          (titles, descriptions, headings, internal links, images)
Findings: lens seo-content, evidence = URL + quoted element or passage
```

Findings that need a decision (rewrite voice, add expert reviewer, change claims) go to "Needs decision". Writing the new copy is a separate task, not part of an audit.
