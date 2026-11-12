# AI search and GEO

Covers Google AI Overviews and AI Mode, ChatGPT search, Perplexity, Copilot, Claude search. Treat "GEO" and "AEO" as SEO fundamentals applied to AI answer surfaces, not as a separate discipline.

## What Google says (verify before quoting; check Search Central "AI features" and the AI optimization guide)

- AI Overviews and AI Mode draw on the normal Search index and ranking systems, with query fan-out (several sub-searches) on top.
- A page must be indexed and eligible for a snippet to appear. There is no separate "AI index".
- You do not need `llms.txt`, special AI markup, content "chunking", AI-specific rewrites, or manufactured mentions. Google says these do not help.
- Controls are the normal ones: `noindex`, `nosnippet`, `max-snippet`, `data-nosnippet`. There is no AI-only opt-out file.
- Clicks and impressions from AI features are counted in Search Console's Web performance totals; a separate gen-AI report may exist for some properties. You cannot cleanly split AI from classic traffic in totals.

When a community recommendation contradicts Google's documentation, follow Google and note the contradiction in the report.

## Other engines

| Surface | What drives citations | Action |
|---|---|---|
| Google AI Overviews | pages that already rank in Search | classic SEO plus passages that answer directly |
| Google AI Mode | broader pool than the top 10, query fan-out, freshness, entity clarity | cover sub-questions, keep facts current, make entities unambiguous |
| ChatGPT search | Bing-backed index and OpenAI's own crawler (`OAI-SearchBot`) | be indexed in Bing (Bing Webmaster Tools, IndexNow), allow `OAI-SearchBot` |
| Perplexity | its own index (`PerplexityBot`), heavy use of forums, docs, Wikipedia | allow `PerplexityBot`; real presence in the communities your buyers read |
| Copilot | Bing index | Bing SEO |
| Claude search | `Claude-SearchBot` | allow it if you want to be cited |

Only a minority of domains are cited by both Google AI features and ChatGPT for the same query, so check each surface separately. Third-party citation studies differ by method; quote none as fact without its source and date.

## AI crawlers: check the right token

| Token | Owner | Governs | Obeys robots.txt |
|---|---|---|---|
| `Googlebot` | Google | Search, AI Overviews, AI Mode | yes |
| `Google-Extended` | Google | Gemini and Vertex training and grounding. Not Search | yes |
| `Bingbot` | Microsoft | Bing and Copilot | yes |
| `OAI-SearchBot` | OpenAI | ChatGPT search citations | yes |
| `GPTBot` | OpenAI | model training only | yes |
| `ChatGPT-User` | OpenAI | fetch when a user asks | no, user-triggered |
| `Claude-SearchBot` | Anthropic | Claude search citations | yes |
| `ClaudeBot` | Anthropic | model training only | yes |
| `Claude-User` | Anthropic | fetch when a user asks | no, user-triggered |
| `PerplexityBot` | Perplexity | Perplexity search index | yes |
| `Applebot` | Apple | Siri, Spotlight, Safari suggestions | yes |
| `Applebot-Extended` | Apple | opt-out of Apple AI training; does not crawl | yes |
| `CCBot` | Common Crawl | open dataset used for training | yes |
| `Bytespider` | ByteDance | model training | yes |

Claims and the bot that supports them:

| Claim | Check | Not evidence |
|---|---|---|
| "Citable in ChatGPT search" | `OAI-SearchBot` | `GPTBot` |
| "Available for OpenAI training" | `GPTBot` | `OAI-SearchBot` |
| "Citable in Claude search" | `Claude-SearchBot` | `ClaudeBot` |
| "Eligible for Google Search and AI Overviews" | `Googlebot` | `Google-Extended` |
| "Findable by Siri or Spotlight" | `Applebot` | `Applebot-Extended` |

User-triggered fetchers (and some agentic browsers) ignore robots.txt by design. To control them, use server-side rules (auth, WAF, rate limits). Verify real bots by reverse DNS or published IP ranges, not by user-agent text.

Check access: `node scripts/seo-probe.mjs robots https://example.com`. It prints each token separately.

Typical policy, to be chosen by the owner (a licensing and strategy decision, not an SEO defect):

```
# Allow search and citation
User-agent: OAI-SearchBot
User-agent: Claude-SearchBot
User-agent: PerplexityBot
Allow: /

# Opt out of model training (owner's choice)
User-agent: GPTBot
User-agent: ClaudeBot
User-agent: Google-Extended
User-agent: Applebot-Extended
User-agent: CCBot
Disallow: /
```

CDN or WAF "block AI bots" toggles can also block the search tokens. After enabling one, re-run the robots check and a live fetch with the bot's user-agent from an allowed IP range.

## `llms.txt`

Optional. Google Search ignores it, and no major AI search engine is confirmed to use it for citations. It does help coding agents that load documentation, so it is worth shipping on developer-docs sites. Report presence, never credit it with ranking or citation effect.

Minimal form:

```
# Product name
> One-sentence description.

## Docs
- [Getting started](https://example.com/docs/start): install and first run
- [API reference](https://example.com/docs/api): endpoints and errors
```

## What helps (all of it is SEO)

1. **Indexed and snippet-eligible.** Fix `./technical.md` issues first.
2. **Server-rendered main content.** Most AI crawlers do not run JavaScript.
3. **Self-contained answers.** A direct answer in the first 40 to 60 words under each question-style heading; roughly 130 to 170 words per answer block reads well when quoted. These are readability heuristics, not Google rules.
4. **Original, first-hand content.** Data, tests, case studies, expert quotes with names. Commodity listicles are the least citable.
5. **Specific, sourced facts.** Numbers with units, dates and links to primary sources.
6. **Clear entities.** Consistent brand name, `Organization` and `Person` schema with `sameAs`, author pages, an About page, matching profiles (LinkedIn, GitHub, YouTube, Wikipedia or Wikidata when notable).
7. **Real freshness.** Visible updated date tied to real edits. Refresh pages that answer fast-changing questions.
8. **Comparison tables and lists** where the content is a comparison or a list.
9. **Presence where buyers ask.** Honest participation on Reddit, YouTube, GitHub, review sites and industry forums. Do not manufacture mentions; Google calls that unhelpful and it can backfire.
10. **Bing visibility.** Verify the site in Bing Webmaster Tools, submit the sitemap, use IndexNow.

## Agent-friendly pages

AI agents read pages through screenshots, raw HTML and the accessibility tree. The tree is the cleanest signal.

- Real `<button>` and `<a href>`, not `<div onclick>`.
- Every input has a `<label for>` or `aria-label`.
- Interactive targets at least 24 by 24 CSS px; transparent overlays do not cover controls.
- Stable layout (low CLS) so click targets do not move.
- Forms work without a mouse-only gesture.

This overlaps with accessibility; hand a deeper pass to `lll:audit` (a11y lens) or `lll:ui`. Treat gaps as opportunities, not failures. Lighthouse has an experimental agentic-browsing category that reports pass counts, not a 0 to 100 score; do not mix the two.

## Measure

- Search Console: impressions and clicks by page and query; compare periods after changes.
- Analytics: sessions from `chatgpt.com`, `perplexity.ai`, `gemini.google.com`, `copilot.microsoft.com`, `claude.ai`. Many AI visits arrive without a referrer and land in Direct. Report this as undercounted. Setup: `lll:analytics`.
- Server logs: count hits per AI user-agent and which URLs they fetch.
- Prompt panel: 20 to 50 buyer questions, run monthly on each surface, record whether the brand is mentioned, cited with a link, or absent, and which pages are cited. Note date, country, model. Results vary run to run; look at trends, not single answers.
- geo-optimizer MCP (when connected): `geo_check_bots`, `geo_citability`, `geo_schema_validate`, `geo_audit`. Confirm tool and data flow with the owner; public URLs only.

## Output

```
GEO readiness (heuristic): xx/100
  Technical access 20 | Passage quality 25 | Structure 20 | Authority and entities 20 | Media and data 15
Crawler access: one line per token with what it governs (search vs training vs user-triggered)
llms.txt: present/absent (no ranking weight)
Top 5 changes, each with the failure check
Passages to rewrite: quote, then the rewritten self-contained version
```
