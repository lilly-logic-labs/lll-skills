# Willingness-to-pay methods

Pick the method by how much evidence you can reach and how much time you have. Combine two when the decision is expensive to reverse.

| Method | Needs | Gives | Use when | Weakness |
|---|---|---|---|---|
| Real purchase test | Checkout and traffic | What people actually pay | You have traffic or a pilot list | Needs volume; live prices must be honest |
| Pre-sale or deposit | A promise you can keep | Strongest early signal | New product, B2B pilots | Needs a clear delivery date |
| Customer interviews | 8 to 15 target buyers | Why, ranges, budget owner | Always, first | Stated price lies a little; ask about behaviour |
| Van Westendorp | 100+ respondents | Acceptable range and optimum | Early price band for a new product | Ignores competitors and costs |
| Gabor-Granger | 100+ respondents | Demand curve at fixed prices | Choosing between a few prices | Stated, not actual, intent |
| Bundle choice ("conjoint-lite") | 50+ respondents | Which features justify which tier | Tier design | Fewer attributes than full conjoint |
| Fake door or painted door | A page and traffic | Click or sign-up rate at a price | No product yet | Measures curiosity, not payment |
| Anchors and analogues | Desk research | Reference prices | No budget | Weakest evidence |

## 1. Customer interviews (always first)

Aim: learn what they pay today, what the problem costs, who decides. Not: ask "would you pay X". Ten conversations of 20 minutes beat a survey of 200 guesses.

Questions, in order:
1. How do you handle this today? Walk me through the last time. (Behaviour first.)
2. What does that cost you in time, money, mistakes or lost customers? How often?
3. What have you tried or paid for? How much? Why did you stop or stay?
4. Who decides to buy something like this and who signs off the spend? What budget does it come from?
5. If this worked, what would you stop doing or stop paying for? What would that save?
6. What would make it clearly not worth it? (Names the ceiling.)
7. Show a price or a range after step 5: "Tools like this cost between A and B. Where would you expect this to sit, and why?" Watch the reaction. Do not defend.
8. What would have to be true for you to pay this month? (Names the barrier.)

Record: current spend, cost of the problem, buyer, budget line, price reaction, objection, exact quotes. After ten interviews, tabulate. If the price reaction is "that's cheap" more than twice, your range is too low.

Never ask: "Would you buy this?" "Do you like the price?" "What would you pay?" with no anchor. People answer politely.

## 2. Van Westendorp price sensitivity

Ask each respondent four questions about the product, with a one-paragraph description:
1. At what price would it be so cheap you would doubt its quality? (too cheap)
2. At what price would you consider it a bargain, a good value? (cheap)
3. At what price would it start to feel expensive, but you would still consider it? (expensive)
4. At what price would it be too expensive to consider? (too expensive)

Rules:
- Same time period for every answer ("per month").
- At least 100 consistent respondents from the real target, 200 or more when segmenting. Under 100 is directional.
- Recruit buyers, not friends. Offer no hint of your price.
- Drop inconsistent rows (the four must rise in order). The script does it and reports how many.

Run:
```
node scripts/pricing-calc.mjs vw responses.csv
```
CSV columns: `too_cheap,cheap,expensive,too_expensive`. Output: PMC (marginal cheapness), OPP (optimal price point), IPP (indifference price point), PME (marginal expensiveness).

Read: price between PMC and PME is the acceptable range. OPP is where fewest people reject on either side. IPP is where equal numbers call it cheap and expensive; the market often accepts a bit above it. Then cross-check with competitor anchors and cost: a range below your cost to serve means the product needs a different model or a lower cost.

## 3. Gabor-Granger

Show 4 to 7 prices in a random order (or ascending), one per screen: "Would you buy at this price?" Collect the share who say yes at each price. Enter pairs of price and percent:

```
node scripts/pricing-calc.mjs gg 49:62,99:41,149:23 --cost 20
```

It prints revenue and profit per respondent for each price and the best price of each. Treat the result as a ranking, not a forecast: stated intent overstates purchase by a wide margin, so apply a haircut (a common planning discount is half or less) before turning it into a revenue number, and confirm with a live test.

## 4. Bundle choice ("conjoint-lite")

Use to decide what goes in which tier.
1. List 4 to 6 features and 3 price points.
2. Build 6 to 10 cards, each a bundle of features at a price. Vary one thing at a time.
3. Show each respondent 3 cards at a time with a "none of these" option; ask which they would buy.
4. Count how often a feature appears in chosen cards compared with rejected ones, by price level.
5. Features that raise choice at a given price are tier-defining; features no one cares about are free or cut.

For anything larger than this (many attributes, share-of-preference simulation) use a proper conjoint tool; this is a screen, not a model.

## 5. Painted door and pre-sale

- Painted door: a pricing page with a real button. After the click, say "not ready yet, join the list" or take a deposit. Measure click-through by price (an A/B on price needs the sample size from the script).
- Pre-sale: an offer with a delivery date and a refund promise. Ten paying customers beat a thousand "interested". Only run it if you can deliver or refund.
- Be honest: do not charge for something you have no plan to deliver.

## 6. Reading the evidence

- Compare the method's range with the alternative's cost. If the buyer's cost today is 5,000 a month, prices of 500 to 1,500 are credible; 4,500 needs very strong proof.
- Segments differ. Report the range by segment and price for the segment you chose.
- Check cost: contribution must stay positive at the low end of the range (unit economics reference).
- State the evidence level (1 to 5 in `SKILL.md`) with the recommendation.
- Anchoring: whichever price a respondent sees first drags answers. Randomise order and keep descriptions neutral.
- Do not run surveys on people you cannot reach later; the list is also your launch list.

## 7. Survey fieldwork basics

- Describe the product in 3 to 5 sentences and show a screenshot; test that a stranger can repeat it.
- Screen respondents (role, spend, last purchase) and drop speeders and straight-liners.
- Use the local currency and the way the price is really shown (including or excluding tax).
- Record country, segment, current tool, current spend for cuts later.
- Keep it under five minutes. Collect consent and say how the data is used. Do not store personal data in the repo.
