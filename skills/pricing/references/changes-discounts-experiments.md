# Price changes, discounts and experiments

## 1. Raising a price

When: you are the cheapest by a wide margin and win nearly every deal; the product improved a lot; costs rose; churn is low and sales cycles are short; people say "that's cheap" in interviews.

Steps:
1. **Decide who is affected.** New customers only, new plus renewals, or everyone. Safest first step: new customers and new sign-ups.
2. **Choose the size.** A 10 to 30% rise on new customers is a common test; more needs a story (new plan, new value). Run the numbers: with gross margin m and a rise of x (both in percent), the share of customers you can lose before contribution falls is `x / (m + x)`. A 20% rise at 80% margin breaks even at a 20% volume loss. Take m from `../scripts/pricing-calc.mjs`.
3. **Pick the grandfathering rule** (below) and write it down before announcing.
4. **Check the contract and the platform.** Terms of service notice period; annual customers keep their term; app stores require user consent for some subscription price increases and notify subscribers (check the store's current rules and the platform setting for "price increase opt-in").
5. **Announce** with notice (30 days is a common minimum; longer for annual customers), the new price, the date, the reason, what they get, and what they can do (lock in annual, change plan, cancel). Send by email and in-product. The copy is `lll:marketing`.
6. **Rollout in stages.** One cohort or region first, watch for two billing cycles' worth of signal where you can, then the rest.
7. **Watch**: conversion rate, new-customer mix by plan, cancellations, downgrades, refund requests, support tickets, reviews, revenue per visitor and net revenue retention. Compare with a baseline period.
8. **Rollback plan**: what number triggers it, who decides, and how existing customers are treated if you reverse.

### Grandfathering options

| Option | Effect | Use when |
|---|---|---|
| Keep old price for existing customers for good | Goodwill, but two price lists forever | Small base, loyalty is the asset |
| Keep old price for 6 to 12 months, then move | Time to adapt, planned revenue step | Most cases |
| Keep old price while the plan is unchanged; new price if they upgrade | Natural migration | Tiered plans |
| Move everyone with notice and a discount for the first term | Clean list, some churn risk | Strong value gain, big cost rise |

Never change a price silently; never apply a rise to a prepaid period without the customer's agreement.

## 2. Lowering a price

Usually a mistake as a reflex. Alternatives: a lower entry plan, a regional price, an annual discount, a usage cap, a better free tier. If the cut is right (price was above the ability to pay), apply it to new customers and offer existing customers the same choice, or they feel punished for loyalty.

## 3. Discounts

Give a discount for something: money earlier (annual prepay), volume, commitment, a case study, a non-profit or student status, a launch window. A discount for nothing teaches customers to wait.

Policy to write down:
- Maximum discount and who can approve it.
- Time limit and what happens after (renewal at list price, with notice).
- No stacking.
- Where it is shown (coupon code vs automatic).
- Whether it applies to renewals.

Coupons: use single-use or limited-count codes with an expiry; set the discount in the billing system, not by editing the plan price; watch for leaked codes. Festival and launch offers: pick a real end date and honour it. Do not call a normal price a "sale".

Enterprise deals: floor price per unit, approvals above a threshold, discount tied to term length and volume, never to a vague promise.

## 4. Experiments

Pricing tests are hard: small samples, long cycles and fairness concerns. Pick the cheapest design that can change a decision.

| Design | How | Good for | Caution |
|---|---|---|---|
| Interview ladder | Show different ranges to different interviewees | Early price band | Small n |
| Painted door | Landing page with plan buttons at price A or B | Pre-launch signal | Measures intent |
| Split price on new visitors | Randomise price by visitor, track sign-up and paid conversion | Pages with steady traffic | Same person must see the same price; inform support; check local consumer rules |
| Geo or cohort test | Different price in one region or one month's cohort | Low traffic | Confounded by season and mix |
| Plan test | Change limits or features, keep price | Tier design | Slow |
| Stated-then-real | Survey, then launch a pilot at the chosen price | Medium stakes | Needs follow-up |

Rules:
1. **Hypothesis**: "Raising Starter from 299 to 349 changes sign-up to paid conversion by less than one point."
2. **Primary metric**: revenue per visitor (or per sign-up) beats conversion rate, because price changes both. Also guard: refund rate, churn after 30 days.
3. **Sample size** before you start: `node scripts/pricing-calc.mjs sample --base 0.04 --lift 0.01`. If the traffic cannot reach it in 4 weeks, do not run a split test; use interviews or a pilot.
4. **Run whole weeks**, avoid festivals and launches, do not peek and stop at the first green day.
5. **Consistency**: a visitor sees one price across devices where possible; customers who ask are never refused the lower price you showed someone else on the same day without a reason; check local rules on price discrimination and on notifying customers of personalised pricing.
6. **Decision rule written first**: ship B if revenue per visitor is higher by at least X with no worse refund rate; else keep A.
7. **Read** with `lll:analytics`; keep the raw numbers in the report.

## 5. After the change: review at 30, 60, 90 days

| Metric | Source | Question |
|---|---|---|
| New customers per week, by plan | Billing | Did mix shift down? |
| Conversion trial to paid | Product analytics | Did it fall more than planned? |
| Churn and downgrades | Billing | Is the cohort at risk? |
| Net revenue retention | Billing | Is expansion working? |
| Refunds and disputes | Payment provider | Did expectations break? |
| Support tickets about price | Support | What are people saying? |
| Competitor responses | Pricing pages | Did anyone follow? |

Write the result into `docs/pricing/` so the next decision starts with data.
