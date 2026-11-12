# India, app stores and payment rails

Tax rates, fee schedules and payment rules change. Every figure here is the last known value: look up the current page, cite the URL and the date, and send tax and legal points to the owner's accountant. This is not tax or legal advice.

## 1. GST and price display

- Digital services and software sold to Indian customers carry GST (18% at the last check). Verify the rate and the SAC code for the product with the accountant.
- **Consumer (B2C) prices are shown including GST.** "199 a month" means 199 with tax in; the seller keeps about 168.6 before fees at 18%. On Google Play in India, listed prices include GST; confirm in the console how the amount you set is treated.
- **Business (B2B) quotes are shown excluding GST** with "plus GST" next to the price, and the tax invoice adds it. GST charged is not revenue.
- **Tax invoice fields for B2B**: your GSTIN and the buyer's, invoice number (continuous series), date, place of supply, SAC code, taxable value, CGST plus SGST or IGST, total. Credit notes for refunds. Keep copies.
- **Exports of services** (a foreign customer paying in foreign currency) can be zero-rated under conditions, usually with a Letter of Undertaking; the rules are detailed. Ask the accountant before billing a foreign customer without GST.
- **TDS**: business customers in India may deduct tax at source from your payment and remit it to the government. Quote the price as the gross amount, expect to receive the net, and reconcile against the customer's TDS certificates.
- **GST on fees**: gateway and platform fee invoices carry GST. A registered seller can usually claim input tax credit; the script option `--fee-gst 18` includes the extra cost when no credit is available.
- If registered for GST, the sticker price decision changes your take: model it with `../scripts/pricing-calc.mjs waterfall`.

## 2. Payment methods and recurring payments

| Method | Notes |
|---|---|
| UPI (one-time) | The default for consumers; zero merchant fee for most merchants under current government policy (verify); show it first |
| UPI AutoPay (recurring mandate) | Needs a one-time registration with authentication; the customer is notified before each debit (at least 24 hours at the last check); the customer can cancel any time; per-transaction limits without extra authentication (15,000 rupees, higher for some categories such as insurance or mutual funds; verify current limits) |
| Cards | Recurring card payments follow the RBI e-mandate rules: registration with authentication, pre-debit notification, per-transaction limits. Expect more failed recurring payments than in markets without these rules |
| Net banking and wallets | Still used; check the gateway coverage |
| Pay later and EMI | For higher-value plans; the provider takes a fee |
| Invoice and bank transfer (NEFT, RTGS) | For B2B; add payment terms and late-fee wording |
| Cash on delivery | Physical goods only |

Consequences for pricing:
- A monthly price above the mandate limit needs authentication each time. An annual price above it is a one-time payment, not an AutoPay debit.
- Many consumers dislike autopay. Offer a prepaid month, quarter or year as well as a subscription, and show the saving.
- Plan for failed debits: grace period, retry schedule, reminders (billing operations reference).

## 3. App store fees and prices

Verify on the current policy pages of each store.

| Item | Google Play | Apple App Store |
|---|---|---|
| Commission on subscriptions | 15% (at last check) | 30%, falling to 15% after a subscriber's first year |
| Commission on one-time purchases | 15% on the first 1 million US dollars of yearly earnings, 30% above (at last check) | 15% under the small business programme (under 1 million dollars of yearly proceeds), otherwise 30% |
| Base for the fee | Usually the price excluding tax; check | Usually the price excluding tax; check |
| Local prices | Set per country in the console; the console offers a price template by country | Price tiers by storefront; set per country |
| Alternative billing | Programmes exist in some countries; check India's current rules | Programmes exist in some regions; check the current rules |
| Payouts | Monthly, with a delay and a minimum | Monthly, with a delay and a minimum |
| Refunds | The store handles most refunds; you cannot refund store purchases from your own provider | Same |
| Price changes | Subscribers must be notified; rises may need their consent to continue | Same |

Rules for store products:
- Prices set in the console are what the customer sees. Choose the number so that the tax-in sticker ends cleanly (for example 199 or 299).
- Run `../scripts/pricing-calc.mjs waterfall --price 199 --tax 18 --tax-in --fee 15` to see the real payout.
- Web checkout sold outside the app may be allowed in some storefronts and not in others. The rules change often; check before building a flow around it.
- Digital goods inside a store app generally must use the store's billing where the store requires it. Physical goods, services consumed outside the app and some business-to-business apps are exceptions.

## 4. Payment gateways

- Typical domestic gateway fees at last check: around 2% on cards and net banking, UPI at zero or a small flat fee, international cards higher, plus GST on the fee. Check the provider's price page.
- Gateways for India: Razorpay, Cashfree, PayU, Stripe (availability for Indian businesses varies by invite and category; check), PhonePe and others. For selling worldwide as a merchant of record (they handle consumer VAT and sales tax abroad): Paddle, Lemon Squeezy, FastSpring, Stripe with tax products. Merchant of record fees are higher and the tax work is lighter.
- Settlement time (T+2 or similar), rolling reserves for new accounts, refund fee treatment (fees on a refunded payment are often not returned), dispute fees.
- Foreign-currency receipts need an authorised gateway or bank route and correct remittance paperwork: ask the accountant.

## 5. Price points and psychology (hypotheses to test)

- Common consumer points in rupees: 49, 99, 149, 199, 299, 499, 999 a month or year-end multiples; annual plans commonly shown as "two months free" or a rupee saving.
- Business tools: 499, 999, 1,499, 2,999, 4,999 per month; round numbers read as serious.
- Daily framing ("less than 7 rupees a day") works for consumer apps when the maths is honest and the real price is shown too.
- Annual prepay with a UPI payment link converts better than autopay for some audiences; test it.
- Free first step, paid second step: many Indian users try free tools for a long time; gate on the job done, not on a stopwatch.
- Price India separately from the US. Converting a US price at the exchange rate usually overshoots local willingness to pay for consumer products; peer apps' India prices are the best anchor. For B2B tools sold to Indian small businesses, the anchor is staff cost or the money the tool recovers.

## 6. Other regions (what to check)

| Region | Check |
|---|---|
| US | Sales tax by state, shown at checkout, not in the sticker price; marketplace and economic nexus rules for digital goods |
| EU and UK | VAT on consumer digital services at the customer's country rate, shown in the price; one-stop-shop registration, or use a merchant of record |
| Australia, New Zealand, Singapore, Japan, Canada | GST or equivalent registration thresholds for foreign digital sellers |
| Brazil, Mexico, Indonesia, Nigeria and similar | Local payment methods dominate (Pix, OXXO, local wallets); card-only checkout loses most buyers; local taxes apply |
| Currencies | Show the local currency where you can; fix a rounding rule and a review date for exchange-rate drift |

Use purchasing-power adjusted prices by country for consumer products, and limit abuse (a VPN to a cheaper country) with payment-country checks where it matters.
