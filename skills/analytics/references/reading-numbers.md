# Reading the numbers

Goal: turn a report into a decision. Start with the question, check the data is sound, read the pattern, state the size and the doubt, then name one action.

## 1. Before you read: data-quality gate

Stop and fix or caveat if any answer is no.

| Check | How |
|---|---|
| Is tracking intact for the whole period? | look for tracking releases, banner changes, outages; annotate the chart |
| Is the period complete? | no partial days or weeks; today is partial |
| Is the comparison fair? | same length, same weekday mix, same season (compare to last year for seasonal businesses) |
| Do the totals reconcile? | orders and revenue vs the system of record (`./qa-debugging.md`) |
| Is consent loss stable? | a banner change can move traffic by 20 percent or more without any real change |
| Are bots and internal visits out? | filters on; look at odd countries or hours |
| Is the metric defined the same way as last time? | write the definition beside the number |

## 2. Metric definitions (write them down)

| Term | Meaning | Trap |
|---|---|---|
| Users (GA4 "active users") | distinct devices or IDs with an engaged session | cross-device people count twice; not people |
| Sessions | visit with a timeout | new session on campaign change, timeout, or a payment-gateway round trip |
| Engaged session (GA4) | 10 s+, or a key event, or 2+ page views | replaces bounce; check what the threshold means for your page type |
| Conversion rate | conversions / sessions (or / users) | state the denominator; use sessions for traffic-quality, users for audience |
| Funnel conversion | users who reach step N / users who reached step 1 within a window | open vs closed funnels; order and window change the answer |
| Retention (N-day) | share of a cohort active on day N | "active" must mean a valuable action, not an app open |
| Churn | customers lost in a period / customers at start | separate logo churn from revenue churn |
| Activation | users reaching the first value moment / signups | pick the event that predicts retention |
| ARPU, LTV, CAC, payback | revenue per user, lifetime value, acquisition cost, months to repay CAC | LTV from fewer than 12 months of data is a model, not a fact |
| MRR, ARR, net revenue retention | recurring revenue and expansion | exclude one-off fees; new, expansion, contraction, churn bridge |
| AOV, items per order, refund rate | e-commerce basics | compare on net revenue after refunds |
| Search impressions, clicks, CTR, position | Search Console | position is an average over varied queries and devices |

## 3. How to read each shape

### Trend
Plot daily with a 7-day average. Look for level shifts (step change = release or tracking), seasonality (weekly cycle, month-end, festival or holiday), and trend (slope). A drop on one day with recovery is noise; a step that stays is a cause to find.

### Funnel
- Find the biggest relative drop between adjacent steps, then segment it by device, source, country, new vs returning. The drop is usually in one segment.
- A rate below the step before it plus a quick exit usually means a UX or speed problem; a drop right after a form or payment step means validation, errors, trust or price.
- A later step bigger than an earlier one means a tracking gap or entry mid-funnel.

### Retention and cohorts
- Read the curve shape: does it flatten (a retained core) or fall to zero? A flat tail above 0 is the signal that matters.
- Compare cohorts by signup week or by acquisition channel. Improvement should show in newer cohorts.
- Beware survivors: averages across ages hide the cohort that left.

### Segments
Cut by one dimension at a time: channel, device, country, new vs returning, plan, landing page. Check the share of total each segment holds before celebrating a rate.

### Attribution
Treat as a map of touchpoints, not proof of cause (`./utm-attribution.md`).

## 4. Noise and size rules

- Small counts swing. With 20 conversions a day-over-day change of 30 percent is routine. A rate from fewer than about 100 events is a guess; say "too few to read".
- Rough rule for a proportion: margin of error is about 1 divided by the square root of the sample size, at 95 percent (for 1,000 sessions, about plus or minus 3 points on a 50 percent rate; smaller for low rates). `node scripts/analytics-check.mjs ab --a n,x --b n,x` gives the exact test.
- Multiple comparisons: slice enough ways and something will look significant. Predict the segment first or treat it as a lead to test, not a finding.
- Regression to the mean: an extreme week is followed by a more normal one. Do not credit or blame the last change.
- Simpson's paradox: a total can move opposite to every segment because the mix changed. Check segment shares before explaining a total.
- Seasonality and novelty: compare to the same period last year; a new feature's first week overstates the effect.
- Survivorship and selection: people who reach step 4 are not like people who reach step 1.
- Correlation: two lines moving together are a lead. A test or holdout shows cause.

## 5. From pattern to action

For each finding write:

```
Observation: <number, period, comparison, definition>
Size: <absolute and relative; users/revenue at stake per month>
Confidence: <high / medium / low and why: sample, data quality, alternative explanations>
Likely cause: <one or two hypotheses, each with the evidence for and against>
Action: <one change or one test, owner, date>
Check: <metric and threshold that will tell us it worked, and when we look>
```

Rank by size at stake times confidence, divided by effort. Prefer actions that remove a clear leak over actions that chase a vague lift.

## 6. Report template (when asked for a written read)

1. **Answer** (3 lines max): what moved, how much, so what.
2. **Caveats**: data quality, partial periods, consent changes.
3. **Evidence**: three charts at most, each with a title that states the finding.
4. **Actions**: ranked list with owner and expected effect.
5. **Open questions** and what data would settle them.

Charts: use the `dataviz` skill. Dashboards: `./dashboards.md`.

## 7. Traffic dropped, checklist

1. Tracking: tag still firing? consent change? release in the window?
2. Which channel dropped? Organic search down: check Search Console, then hand to `lll:seo`. Paid down: budget, disapprovals, bids. Referral or social down: campaign ended?
3. Which pages and which countries or devices?
4. Seasonality or calendar (holiday, exam season, weekdays)?
5. Outages, redirects, robots or noindex errors, a slow release?
6. Competitors or SERP change (AI answers, new features)?
Report the largest explained part first, and the unexplained remainder.
