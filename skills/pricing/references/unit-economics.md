# Unit economics of a price

A price is only right if it pays for the cost to serve, the cost to acquire and the fixed costs. This file holds the formulas, the cost inventory method and the rules of thumb. Run the numbers with `../scripts/pricing-calc.mjs`; do not do them in prose.

## 1. Definitions

| Term | Definition |
|---|---|
| Sticker price | What the buyer sees, tax in or out as shown |
| Net revenue | Price excluding tax, minus platform and payment fees |
| Cost to serve (COGS) | Per customer per month: hosting, metered services, AI calls, messaging, support time if it scales |
| Contribution | Net revenue minus cost to serve |
| Gross margin | Contribution divided by net revenue |
| Churn | Share of paying customers lost per month |
| Customer life | 1 / monthly churn, in months |
| LTV | Contribution per month x customer life (undiscounted; say so) |
| CAC | Sales and marketing spend divided by new paying customers in the same period |
| CAC payback | CAC / contribution per month |
| Break-even customers | Fixed monthly cost / contribution per customer |
| MRR | Sum of monthly recurring revenue from active subscriptions (annual plans divided by 12) |
| ARPU | MRR / paying customers |
| NRR | (Start MRR + expansion - contraction - churn) / start MRR for a cohort |

Convert annual churn to monthly: `1 - (1 - annual)^(1/12)`. Monthly churn of 5% is roughly 46% a year.

## 2. Cost inventory (method)

Never use a fixed list; the stack changes. Find the cost from the project.

1. Search manifests, deploy config and infra files for paid or metered services: hosting and functions, databases, object storage, queues, email and SMS, WhatsApp, AI model calls, maps, search, video and rendering, analytics, error tracking, payment and store fees (`../../../shared/stack-detect.md` for where to look).
2. For each, find the current price page, record the free allowance, the base fee and the metered unit price, with the URL and date.
3. Model usage per customer from the code (limits, quotas, request sizes) or from the owner's logs and dashboards. Prefer real usage; mark estimates.
4. Split costs: per customer per month (variable), per month regardless (fixed), one-time (store fees, legal, setup).
5. Model three scales (for example 100, 1,000 and 10,000 customers). Costs that look tiny at one scale can dominate at another, and free allowances end.
6. Include the human cost that grows with customers: support minutes per customer, onboarding, refunds handling.

## 3. Price check procedure

1. Waterfall: `node scripts/pricing-calc.mjs waterfall --price <sticker> --tax <pct> [--tax-in] --fee <pct> [--fee-gst <pct>] --cogs <n>`
2. Unit economics: `node scripts/pricing-calc.mjs econ --net <net from step 1> --cogs <n> --churn <monthly> --cac <n> --fixed <monthly fixed>`
3. Read the warnings. Repeat for each tier at its usage cap, for the free tier cost per user, and for each scale.
4. Repeat for the low and high end of the willingness-to-pay range.

## 4. Rules of thumb (treat as screens, not laws)

| Check | Healthy | Look closer when |
|---|---|---|
| Gross margin (software) | 70 to 90% | Under 60%: cost to serve or fees too high |
| Gross margin (services-heavy) | 40 to 60% | Under 30% |
| LTV : CAC | 3 or more | Under 1: losing money per customer; over 5: maybe underinvesting in growth |
| CAC payback (consumer, low price) | Under 6 months | Over 12 |
| CAC payback (small business) | Under 12 months | Over 18 |
| CAC payback (enterprise) | Under 18 to 24 months | Over 30 |
| Monthly churn (consumer subscription) | Under 5 to 8% | Over 10% |
| Monthly churn (small business) | Under 3 to 5% | Over 7% |
| Monthly churn (enterprise) | Under 1% | Over 2% |
| Free-to-paid conversion | A few percent for consumer, higher for B2B trials | Compare with your own funnel |

These vary widely by market. Replace them with the owner's own history as soon as there is any.

## 5. Common traps

- Using list price as revenue while discounts, taxes and fees remove 20 to 40% (the waterfall shows it).
- Forgetting that a free tier costs money per user.
- Ignoring that annual customers pay once: cash comes early, but refunds and unused periods matter.
- Using blended CAC from word-of-mouth months to justify paid acquisition costs.
- LTV from a churn rate measured on a young cohort; early cohorts churn differently.
- Counting revenue the platform has not yet paid out (store payout delays) as cash.
- Mixing currencies. Convert once, state the rate and the date.

## 6. Break-even and runway questions

- Break-even customers = fixed monthly cost / contribution per customer. If this is more than you can reach in 12 months, change price, cost or scope.
- Conversion needed: break-even paid customers / expected monthly active users = required paid share. Compare it with published free-to-paid conversion rates for the category (cite the source and date) and with your own funnel.
- If the answer to "what price breaks even at 100 customers" is above the willingness-to-pay ceiling, the product needs a different model (higher price segment, lower cost to serve, usage pricing) or it is a side project.

## 7. Report block

```
Inputs (with source and date): price, tax, fees, cost to serve per customer, churn, CAC, fixed costs
Script output: waterfall lines, econ lines (quoted)
Scales: 100 / 1,000 / 10,000 customers
Sensitivity: price -20%, churn +50%, cost +30%
Verdict: price covers cost at scale X; payback Y months; the weakest assumption is Z
```

For the business-level view (market, model, investors) use `lll:business`.

## 8. Cost levers (when the price only works if cost falls)

List levers, then rank by monthly saving at the expected scale, effort and risk. Only recommend; the owner decides and pays for any trial.

| Lever | Typical saving | Risk to check |
|---|---|---|
| Cheaper model, plan or instance size for the same job | Often the largest | Quality drop: check against the project's own evals before switching |
| Smaller inputs: shorter prompts and context, fewer tool or API rounds, fewer fields fetched | Large for AI and data-heavy features | Answer quality, missed edge cases |
| Caps and quotas on the free tier (set the maximum cost of a free user) | Bounded, predictable | Upgrade friction, user trust |
| Caching, batching and de-duplication (prompt caching, response caching, batched writes) | Medium | Stale data, cache invalidation |
| Stay inside free allowances (prune old data, combine requests) | Small to medium | Complexity |
| Move work to the device or the browser | Medium | Battery, privacy gains, device variance |
| Annual or committed-use pricing from suppliers; remove unused services and seats | Small to medium | Lock-in |
| Payment rail mix: nudge UPI or bank transfer over cards where fees differ | Small, scales with volume | Checkout friction |
| Support deflection: docs, in-product help, status page | Medium at scale | Quality of help |

Do not recommend a lever that breaks a product principle in the project's rules (for example sending user data to another provider). Mention it once, labelled "conflicts with a product principle", and let the owner choose.
