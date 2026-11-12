# Pricing models and value metrics

## 1. Value metric: the unit you charge on

Test every candidate against these four. A metric that fails two is wrong.

| Test | Question | Fails when |
|---|---|---|
| Value | Does the bill grow when the customer's benefit grows? | Charging per user for a tool one person uses for the whole firm |
| Clarity | Can the customer predict it and check it? | Metrics only the vendor can count (compute units, "interactions") |
| Fairness and gaming | Can they cut the bill without cutting value? | Per seat where people share a login |
| Cost link | Does your cost to serve grow with it? | Unlimited usage on a metered paid service |

Examples by product:

| Product | Candidate metrics | Usually best |
|---|---|---|
| Team collaboration | Active user, workspace, project | Active user per month |
| Booking or billing for small shops | Location, staff member, invoices or bookings per month | Staff or location, with a booking cap on the lowest tier |
| Messaging or notifications | Messages sent, contacts | Messages in bundles, contacts as the tier gate |
| API or infrastructure | Requests, compute, storage, bandwidth | Metered with a free allowance |
| AI feature | Credits, generations, tokens, seats | Credits or runs per month, hard cap on the free tier |
| Marketplace | Take rate, listing fee, subscription for sellers | Take rate on completed orders |
| Education or content | Seat, course, cohort, access period | Access period or cohort |
| Consumer app | Access to premium features, storage, accounts | Plan with a time period |
| Desktop or one-time tool | Licence per machine or per major version | Per user licence with paid upgrades or maintenance |

## 2. Models compared

| Model | Choose when | Watch out for | Typical price shape |
|---|---|---|---|
| Subscription, flat | One clear product, similar usage across customers, simple buying | Heavy users cost you, light users churn | One price per month, a lower per-month price for annual |
| Per seat | Value grows with the number of users; collaboration | Seat sharing, discouraging adoption | Price per user per month, volume breaks |
| Tiered | Distinct segments with different needs and budgets | Too many tiers, arbitrary limits | 3 tiers, entry, popular middle, top |
| Usage based | Cost and value scale with use; developers; variable demand | Unpredictable bills, revenue swings, hard to budget | Per unit with free allowance and volume bands |
| Hybrid (base plus usage) | You need predictable revenue and fair pricing for heavy use | Complexity in the pricing page | Platform fee plus included units plus overage |
| Freemium | Strong word of mouth or network effects, low cost to serve, a clear upgrade trigger | Free users cost money; a free tier that is enough forever | Free tier limited by value reached, paid tier unlocks the next job |
| Free trial | Product shows value within days | Trial users who never activate | 7 to 30 days, with or without a card |
| One-time or lifetime | Software with low ongoing cost; consumers who dislike subscriptions | No recurring revenue, support forever | One price; consider paid major upgrades or a lifetime tier as a limited cash tool |
| Credits or tokens | Variable-cost features (AI, rendering, messages) | Opaque conversion; expiry disputes | Packs with clear expiry and rollover rules |
| Take rate | You sit inside a transaction | Disintermediation | Percentage plus fixed fee, caps |
| Retainer or project | Services and agencies | Scope creep | Fixed scope price or monthly retainer with defined hours or outputs |
| Value based or outcome based | Measurable, attributable outcome; enterprise | Hard to measure, disputes | Share of savings or revenue, with a floor |

Choosing: start from the metric, then ask who pays and how they buy (card, UPI, invoice, procurement), then your cost structure (is the marginal cost near zero or per use?), then the sales motion (self-serve, founder-led, sales team).

Rules of thumb:
- Self-serve with a price under about 100 dollars a month: published prices, card or UPI checkout, 2 to 4 tiers.
- Above that or with several buyers: contact sales for the top tier only, published prices for the rest.
- Marginal cost near zero and a viral loop: freemium or a generous free trial.
- Meaningful cost per use: never offer that use free without a cap.

## 3. Pricing by buyer type

| Buyer | What matters | Notes |
|---|---|---|
| Consumer | Low friction, clear value fast, local payment methods, annual saving | Price anchors are other apps and daily spends; small prices are compared to a cup of tea or a streaming plan |
| Prosumer and freelancer | Pays personally, expenses it, compares to tools they know | Monthly and annual, a free tier that lets them try on real work |
| Small business | ROI in hours or rupees saved, simple invoice, GST invoice | Often wants monthly billing and a person to call; staff-based pricing fits |
| Mid-market and enterprise | Procurement, security review, SLAs, SSO | Annual contracts, custom terms for the top tier, discount guard rails |
| Developer | Free to try, pay when it works in production | Usage based with a free allowance; transparent calculator |

## 4. AI features

- Cost to serve is real and variable. Get the cost per use from the repo or the provider's price page (and `lll:ai` for ways to cut it) before choosing the metric.
- Meter what costs money: runs, generations, tokens, minutes. Bundle credits into tiers; show remaining credits.
- Cap the free tier by the daily or monthly cost you can afford per user. A free tier with no cap is a marketing budget with no ceiling.
- Price the outcome where you can (a finished report, a processed document), and keep a fair-use limit on "unlimited".
- Provider prices change often. Re-check them before each price decision; for Anthropic models use the `claude-api` skill for current prices, caching and batch discounts.

## 5. Anti-patterns

- Cost-plus only: it ignores value and leaves money on the table.
- Copying the market leader's price without their brand, scale or cost.
- Many tiers that differ in tiny limits.
- Charging per seat when the real value is per outcome.
- A free tier that already solves the whole job.
- Hiding the price to avoid comparison when the buyer is a self-serve small business: they leave.
- Setting a price by what you would pay yourself.
