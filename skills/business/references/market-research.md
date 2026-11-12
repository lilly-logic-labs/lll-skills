# Market research

A sourced picture of who the customers are, how many there are, what they use today and what is changing. Answer the question asked; do not write a full study when the owner wants a number.

## 1. Scope

| Request | Do |
|---|---|
| One question ("how big is it", "who are the competitors") | Answer that, with sources |
| "Quick scan" or "one-pager" | One page: size range, top three competitors, primary segment, best opportunity, biggest risk, each with a source |
| Full research | Sections below in order; spend more time on the ones that change a decision |

Read the repo's earlier research first and update it.

## 2. Source hierarchy

1. Primary: regulator and government statistics, company filings and annual reports, official pricing and product pages, platform developer docs, store listings, standards bodies.
2. Industry bodies and respected research with a stated method.
3. News with named data sources.
4. Blogs, forums, reviews and social posts: use for sentiment and anecdotes, never for size.

Start points for India: government statistics offices and ministries, the central bank, the payments authority (for UPI volumes), the telecom regulator (for subscribers and usage), the securities regulator, industry associations, listed companies' annual reports. Global: statistics offices, OECD, World Bank, company filings, platform transparency reports. Always open the underlying page, not the summary of it.

Paid "market size" reports often disagree widely and hide their method. If you quote one, quote at least two and show the range.

## 3. Market sizing

Bottom-up first.

```
Population that has the problem
  x share reachable by your channel
  x share who would pay (from price evidence)
  x price per year
= SAM (serviceable market)
  x share you can win in 3 years (from the go-to-market plan)
= SOM (obtainable)
```

Rules:
- Every step has a source or is marked an assumption with the value used.
- TAM is the whole demand for the category; use it only for context. Investors and owners need SAM and SOM.
- Cross-check with a top-down number (analyst estimate or the revenue of leaders); explain a gap larger than 3 times.
- Show low, base and high. Use `lll:pricing`'s calculator (`node ../pricing/scripts/pricing-calc.mjs`) for any margin or break-even arithmetic.
- Give growth rate with its source and the two or three drivers.
- Date every figure. Fintech, AI and consumer-app figures older than about 18 months are suspect.

Worked shape (fictional): "single-chair salons in 50 Indian cities: businesses (government/trade-body count, dated) x 40% with a smartphone and a WhatsApp number (assumption, test by survey) x 25% who would pay 299 a month (price test pending) = SAM; first-year capture 1% = SOM".

## 4. Segments

Describe three to five segments. Per segment:

| Field | Content |
|---|---|
| Size | Count, with source |
| Who they are | Role or business type, age and income band if consumers, city tier, language |
| Main problem | In their words |
| How they cope today | The status quo and what it costs |
| Buying trigger | First hire, new branch, tax season, a bad month |
| Barriers | Trust, setup effort, price, habit, switching cost |
| Willingness to pay | Evidence level (see `lll:pricing`) |
| Reachability | Where to find them in bulk (communities, directories, associations, events) |

Choose one primary and one secondary segment and say why. A segment you cannot name five reachable people in is not a segment yet.

## 5. Trends and regulation

List forces that help or hurt: technology shifts, payment rails, platform policy, data protection, sector regulation (finance, health, education, e-commerce), tax, import rules, cost of cloud or AI. For each: source, date, effect on the product, and what you will do about it. Distinguish rules in force from proposals.

## 6. Customer sentiment

Read reviews of the top competitors (store listings, review sites), community threads and public posts. Summarise recurring complaints and wishes, with two or three short quotes and links. Count: "14 of 60 one- and two-star reviews mention X". Reviews are a sample, biased to the angry and the delighted: say so.

## 7. Opportunities

Score gaps the evidence shows:

| Opportunity | Market size (H/M/L) | Competition (H/M/L) | Fit with product and principles (H/M/L) | Priority 1-5 | Evidence |
|---|---|---|---|---|---|

Name the lever for each (price, features, trust, language, channel, speed). Recommend one focus. Roadmap items come from the competitor and go-to-market steps, not here.

## 8. Risk table

| Risk | Type (market, regulatory, technology, competitive, platform, economic) | Impact | Likelihood | Mitigation |
|---|---|---|---|---|

Cover at least switching costs, distribution cost, platform policy changes, a large player copying the feature, and dependence on one channel or one supplier.

## 9. Watch for

- Stale data, single-source numbers, and growth rates used as thesis.
- Survivorship bias: companies that shut down or pivoted are evidence of what does not work. Look for them.
- Confusing "customers who say they have the problem" with "customers who pay to fix it".
- Averages that hide segments with very different economics.
- Translating a global number to India (or the reverse) without adjusting for price level and adoption.

## 10. Report body

Answer (3 to 5 sentences and the recommended focus) then Evidence in this order: size, segments, competitors (competitor reference), trends and regulation, sentiment, opportunities, risks. End with a checklist of next research steps ("interview 10 owners in segment X; test price Y").
