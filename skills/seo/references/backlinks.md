# Backlinks

Links are one signal among many. Quality, relevance and editorial context matter more than count. This file reviews a profile and plans legitimate link earning.

## 1. Data sources, best first

| Source | Gives | Cost |
|---|---|---|
| Search Console > Links | top linking sites, top linked pages, top anchors for your own site | free, own site only |
| Bing Webmaster Tools | link data for verified sites | free, own site only |
| Third-party index (DataForSEO, Ahrefs, Moz, Semrush, Majestic) | profiles of any domain, new and lost links, competitor gap | paid or limited free |
| Common Crawl web graph | domain-level rank and presence | free, coarse |
| Your own crawl | whether a known link still exists | free |

Say which sources were used. Competitor comparisons need a third-party index; with only Search Console you can review your own profile but not theirs.

## 2. Profile review

1. **Size and growth**: referring domains over time. Healthy is steady growth or stability. A drop of more than about 20 percent in a quarter needs a reason (lost press, site changes, a removed campaign).
2. **Diversity**: no single domain dominates (over 10 percent of links is a flag). Mix of TLDs, countries relevant to the market, site types.
3. **Quality**: relevance of the linking site to your topic, real traffic, editorial placement in body copy, not a footer or sidebar on every page.
4. **Anchor text**: mostly brand and URL anchors, then generic and descriptive phrases; exact-match commercial anchors stay a small minority. A pile of identical commercial anchors is an unnatural-link signal. Healthy mixes vary by industry, so treat any benchmark as a review trigger, not a rule.
5. **Follow mix**: nofollow, sponsored and ugc links are normal and have value as traffic and brand signals.
6. **Top linked pages**: which pages earn links (link magnets), which important pages have none, which linked URLs now return 404 (reclaim with a 301 to the closest page).
7. **Velocity**: spikes (possible negative SEO or a viral hit) and long flat periods.

## 3. Risky links

Review manually; do not auto-disavow.

- Definite problems: paid links without `sponsored`, networks built to pass links, hacked-site injections, mass directory or article-spin submissions, doorway pages, exact-match anchors from many unrelated domains.
- Needs a look: unrelated niches, thin pages with dozens of outbound links, reciprocal exchange patterns across many domains, expired-domain repurposing, site-wide footer links, foreign-language spam, parked domains.
- Monitor: forum profile links, social bookmarks, press-release syndication, coupon sites, comment links.

**Disavow** is a last resort. Use it when there is a manual action for unnatural links, a clear paid-link or network history you control, or a sustained attack that you can show. Google ignores most low-quality links on its own. If used: a UTF-8 text file with `domain:example.com` lines and `#` comments, uploaded by the owner in Search Console. Never claim a disavow will lift rankings.

## 4. Competitor gap

With a third-party index: list referring domains of two or three competitors, subtract yours. Sort by relevance and by how many competitors share the link. Domains that link to several competitors and not to you are the best outreach targets. Domains that link only to you are advantages to protect.

## 5. Earning links

| Tactic | Notes |
|---|---|
| Original data and research | surveys, benchmarks, public datasets with analysis; the most reliable linkable asset |
| Tools and calculators | free utility on a relevant topic |
| Digital PR | newsworthy stories, expert commentary for journalists, local press |
| Partnerships | integrations pages, co-marketing, supplier and customer pages that link to you |
| Reclamation | unlinked brand mentions, broken links to your old URLs, lost links after redesigns |
| Guest content | real expertise for relevant publications; not mass guest-post networks |
| Directories and associations | curated, relevant, ideally free; chamber of commerce, trade bodies |
| Resource pages | offer a genuinely better resource to a page that lists them |

Against Google's link spam policy: buying or selling links that pass ranking signals, large-scale link exchanges, automated link creation, links hidden in widgets or footers of other sites, requiring a link in a template for free product. Do not plan these.

## 6. Scoring honesty

- Give a numeric backlink score only when at least four of these factors have real data: referring domain count, quality mix, anchor naturalness, risky-link share, velocity, follow ratio, geography.
- With fewer, write "insufficient data" and list the factors you do have and where they came from. With a domain-level rank only (Common Crawl), write "not assessed" for every number you did not measure.
- Label each figure with its source and confidence. Verify claimed "link removed" findings by fetching the page; JavaScript-rendered pages cannot be verified from raw HTML, so say "unverifiable".

## 7. Output

Profile overview (with source labels), anchor table, top domains and pages, risky-link list with evidence, gap list, ten outreach targets with the reason each is a fit, 90-day link plan. Lens `seo-links`. Do not run outreach or buy anything without the owner.
