# Business model and go-to-market

Decide what is sold, to whom, how it is delivered and how the first customers are won. The cheapest way to learn whether anyone will pay comes before any big build.

## 1. Read the starting point

From the repo (cite paths): what is live, what is proposed, what is manual today, who the users are, what the owners locked (price lists, founder terms, product principles), the team's hours and roles. Label every capability: built, built but specific to one use, proposed. If the project documents client-work terms versus product terms (finder fees, ownership, revenue share), say which treatment a recommendation assumes and list the question for the owners; flag that this is not legal or tax advice.

### Capability map

Turn the product's goals into a table the owners can check against the code:

| Capability | Customer outcome it serves | Status (live, built but untested, proposed) | Evidence (path or link) | Gap | Needed for customer 1 / customer 10 |
|---|---|---|---|---|---|

Only `live` rows count as proof in investor or customer material. Turning gaps into a build plan is `lll:plan`.

## 2. Choose the model

Compare before discussing features, because the model decides which features matter.

| Model | Who does the work | Needs before the first rupee | Strength | Weakness |
|---|---|---|---|---|
| Managed service | You run it for each client | Little software, founder time | Fast revenue, deep learning | Does not scale; margin falls with hours |
| Self-serve product | The customer | Onboarding, billing, support, docs | Scales | Slow to first revenue; needs acquisition |
| Hybrid (service to start, product later) | You, then software | Repeatable process first | Validates before building | Risk of staying a service |
| White-label or reseller | A partner sells and supports | Multi-tenant tooling, partner terms | Distribution | Margin share, brand control |
| Marketplace | Both sides | Supply or demand first | Network effects | Chicken and egg |
| Usage or API | Developers | Docs, reliability | Low sales cost | Unpredictable revenue |
| Licence or one-time | Customer installs | Packaging, support | Simple | No recurring revenue |

For each model give: gross margin (from the pricing calculator), founder hours per customer, build needed before revenue, cash needed, treatment under any founder terms, and the evidence that would change the choice. Recommend one.

## 3. Ideal customer profile and first ten customers

1. Pick the narrowest segment where the pain is acute and the buyer reachable (use the segment table from the market research method: size, trigger, barrier, reachability). Name five real, reachable examples.
2. Write the ICP table: who, size, place, trigger, status quo, budget holder, disqualifiers, where they gather.
3. Plan ten conversations, then ten pilots. A founder-led, manual first version can serve the first customers: a spreadsheet, a chat group and one hand-built file is a legitimate v1.
4. Separate what customer 1 needs from what customer 10 needs. Do not recommend the full console by default.

## 4. Channels by product type

| Product | Likely first channels | Typical cost drivers |
|---|---|---|
| MSME or local-business software (India) | WhatsApp, field visits, accountant and distributor partners, trade events, vernacular YouTube | Founder time, travel, demo effort |
| Consumer app | Short video, creators, referral, store listing, communities | Creator fees, paid installs |
| B2B SaaS | Founder outreach, content, partnerships, communities, marketplaces | Sales time |
| Developer tool | Open source, docs, tutorials, X, Hacker News, conferences | Content time |
| Marketplace | Seed one side by hand, local focus | Incentives |
| Agency or managed service | Referrals, case studies, outbound, LinkedIn | Founder time |

Pick one primary channel for 90 days. Marketing detail: `lll:marketing`. Outbound lead method: `lll:marketing` also owns prospect outreach; investor outreach is in this skill.

## 5. Pilot design

```
Goal:            what we want to learn (one question)
Customers:       number, segment, how chosen
Offer and price: what they get, what they pay (even a small amount), term
Success measure: usage, outcome and a payment, each with a number
Duration:        2 to 8 weeks
Our effort:      hours per week, who
Exit:            what happens after, for yes and for no
Proof captured:  quotes, numbers, a case study with permission
```

A pilot with no price teaches nothing about willingness to pay. Charge something, or ask for a signed commitment.

## 6. Economics viability

Do not set the price here (that is `lll:pricing`). Check that a business can exist:

1. Cost to serve per customer per month, from the repo and the price pages.
2. Contribution at the pricing range from the pricing work (or a stated assumption).
3. Fixed costs per month: tools, hosting, salaries or founder draws, legal and accounting.
4. Break-even customers and months to reach them at a stated acquisition rate.
5. CAC payback for the chosen channel.
6. A three-scale view (for example 10, 100, 1,000 customers) showing where the cost lines change shape.
7. Sensitivity: price down 20%, churn up 50%, cost up 30%.

Run the maths with the `lll:pricing` calculator (`node ../pricing/scripts/pricing-calc.mjs econ ...`) and quote its output. A model that only works at a scale you cannot reach in 12 to 18 months is a risk to name, not a plan.

## 7. Go-to-market plan skeleton

```
Positioning (one sentence)
Segment and first ten named targets
Offer and price (from lll:pricing)
Channel and weekly activity targets
Proof plan: what must exist before claims (pilot results, numbers, quotes)
Sales path: first contact, demo, pilot, close, onboarding
Roles: who sells, who delivers, who fixes (from the team documents)
Milestones: day 30, 60, 90 with numbers
Budget: money and hours
Risks and kill criteria
```

## 8. Risks to cover

- Distribution cost higher than customer value.
- A platform change (API, store policy) breaking the wedge.
- A large player adding the feature for free.
- The buyer and the user being different people.
- Dependence on one founder's relationships.
- Regulation (finance, health, data protection, labour, tax).
- Cash: months of runway at the current burn.
- Concentration: one customer is over 30% of revenue.

For each: signal, owner, response.

## 9. Output

Answer: model, segment, channel, pilot, and what to stop doing. Evidence: tables above with sources and dates. Assumptions: with tests. End with the assignment: the first five conversations, the date, and the number that counts as a yes.
