# Packaging and tiers

How to turn a model and a price range into plans a buyer can choose in under a minute.

## 1. Tier design

1. **Name the buyer for each tier.** One line each: "solo owner just starting", "growing shop with staff", "multi-branch business". If two tiers have the same buyer, merge them.
2. **Separate tiers by the value metric first.** Staff count, location count, volume, or the job done. Then by features that matter only to the bigger buyer (roles and permissions, audit logs, integrations, priority support, SSO).
3. **Three tiers is the default.** Two when the audience is simple; four when there is a true enterprise buyer. More than four is a table of confusion.
4. **Make the middle tier the one you want most people to pick**: the fair price for the typical buyer. Highlight it as the recommended plan, honestly.
5. **Entry price**: low enough that the buyer says yes without a meeting. **Top price**: priced for heavy users and for buyers who need extras, not as a bait for the middle.
6. **Gate by value, not by pain.** Do not put basics (export your own data, security, accessibility, deleting your account) behind a paywall.
7. **Price steps.** A common ratio is roughly 2 to 3 times from entry to middle and from middle to top when the value metric also doubles or triples. Check that the cost per unit falls as the tier rises (a volume break), or the top tier will not sell.
8. **Check every tier's margin** with `../scripts/pricing-calc.mjs` at the usage you expect and at the cap.

## 2. Feature allocation table

Fill this before setting prices.

| Feature | Everyone needs it | Costs money to serve | Grows with business size | Tier |
|---|---|---|---|---|
| ... | y/n | y/n | y/n | free / entry / middle / top / add-on |

Rules:
- Core job to be done: free or entry, or the product does not work.
- High cost to serve: metered or in higher tiers.
- Growth features (teams, automation, reports, API): middle and up.
- Controls and compliance (roles, audit, SSO, data residency): top.
- Anything few need but those who do value highly: add-on.

## 3. Free tier

Offer one only when cost to serve is low and the paid step is natural.

| Question | Good answer |
|---|---|
| Does the free user cost money? | A capped, known amount per user; the cap is enforced in code |
| Does the free tier let someone finish the job once? | Yes, a small job; the second and larger jobs need paid |
| What triggers the upgrade? | A limit tied to value reached (client number, team size, volume) |
| Is the free tier visible in a way that spreads the product? | Share links, exports with a small mark, invites |
| What is the share of free users expected to convert? | A stated target (a few percent is typical for consumer products; verify with your own data) |

Failure signs: free users never hit the limit; free users use the support queue; free usage costs more than paid margin.

## 4. Trials, money-back, annual and monthly

- **Free trial** (7 to 30 days): for products that show value in days. Card up front raises the paid conversion rate and lowers sign-ups; no card brings more sign-ups and weaker intent. Pick by how much traffic and how much sales effort you have. For UPI audiences a card-free trial with a pay prompt at the end often works better than asking for a mandate on day 1.
- **Money-back** (14 to 30 days): reduces risk, lifts conversion; state refund rules clearly and honour them (billing operations reference).
- **Annual plan**: discount of 15 to 25% (about 2 months free) is common; it improves cash and retention. Show the monthly equivalent and the total. Offer a clear refund rule for the unused part.
- **Monthly plan**: higher per-month price, keeps the barrier low.
- **Lifetime plan**: use sparingly and with a cap; it is a cash lever that costs support forever. Price it at several years of the annual price and say what "lifetime" means (product lifetime, not customer's).
- **Pay-what-you-want or community pricing**: only for small, mission-led products.

## 5. Add-ons and overage

- Add-ons are for things a minority want and will pay for. Keep to 3 or fewer.
- Overage beats a hard stop for paid customers if the price per unit is shown before they exceed the cap. Hard stop on the free tier.
- Never surprise the customer with a bill; send a usage alert at about 80% of the included amount.

## 6. Price points

- Pick prices that are easy to say and compare. Charm endings (49, 99, 199, 499, 999 in rupees; 9 or 19 in dollars) are common in consumer products; round numbers signal premium and are common in business tools. Test, do not assume.
- Anchor with the top tier or the annual price; do not invent a fake "was" price. A strikethrough must show a price you really charged.
- For India consumer apps, show the monthly equivalent of the annual plan and whether GST is included (India and platforms reference).
- Round after the net-of-fees maths, not before.

## 7. Pricing page checklist

- [ ] Each plan: price, billing period, currency, whether tax is included, and who it is for.
- [ ] The recommended plan is visible and the reason is plain.
- [ ] One comparison table with 6 to 10 rows, in the buyer's words, not internal feature names.
- [ ] A line on what happens at the limit, on cancel, on refund.
- [ ] A switch for monthly and annual with the saving stated in money.
- [ ] Payment methods shown (cards, UPI, net banking, invoice).
- [ ] FAQ: what counts as a user or unit, can I change plans, what happens to my data, GST invoice.
- [ ] Trust: security note, support contact, refund promise, a customer line (with permission).
- [ ] For B2B: a "contact us" option for the top tier only, with a promise on reply time.
- [ ] No dark patterns: no pre-ticked upsells, no hidden renewals, no hard-to-find cancel, no fake countdowns. These also breach consumer rules in many countries.

Page copy and design: `lll:marketing`, `lll:ui`.

## 8. Worked example (fictional)

Product: a booking and reminder app for salons. Cost to serve about 4 rupees per salon per month plus 0.30 per WhatsApp reminder. Buyer: owner of a small salon, price anchors are a free diary app and a 700 rupee a month tool.

| Tier | Price (incl. GST) | For | Includes | Limit |
|---|---|---|---|---|
| Free | 0 | Trying it | 1 staff, 30 bookings a month | No reminders |
| Starter | 299 a month or 2,999 a year | One-chair salon | 1 staff, unlimited bookings, 100 reminders | Cap on reminders |
| Studio (recommended) | 599 a month or 5,999 a year | 2 to 5 staff | Up to 5 staff, 500 reminders, reports | Extra staff paid per head |
| Chain | 1,499 a month | Several branches | Branches, roles, export, priority help | Custom above 10 staff |

Why: reminders carry the cost and the value, so they define the tiers; staff count scales with the business; the free tier shows the booking page but not the money-saving feature. Run the maths for each tier at its cap before launching.
