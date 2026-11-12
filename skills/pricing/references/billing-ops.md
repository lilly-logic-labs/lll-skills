# Billing operations

How money flows after the price is set: subscriptions, failed payments, refunds, invoices, disputes and the month-end check. Use when someone asks "a customer was charged twice", "how should we handle failed payments", "write our refund policy", "reconcile payouts" or "what is our MRR". Billing code changes go through `lll:build`; payment security through `lll:security`. Never ask a customer for card numbers in chat or email, never store card data (use the provider's hosted checkout), and keep customer personal data out of the repo and reports.

## 1. Subscription states and access

| State | Meaning | Access |
|---|---|---|
| Trialing | Free period running | Full |
| Active | Paid and current | Full |
| Past due | Latest payment failed, retrying | Full, with a visible banner (grace period) |
| Unpaid or suspended | Retries exhausted | Read-only or limited; data safe |
| Canceled, active until period end | Customer chose to leave | Full until the paid period ends |
| Expired | Period ended | Free tier or locked; data retained for a stated time |
| Paused | Customer or you paused | Limited; no billing |

Write the state-to-access table into the product docs so billing, app and support agree. The provider's states differ (Stripe, Razorpay, store billing); map them explicitly.

## 2. Failed payments (dunning)

- Retry on a schedule that fits the rail: cards and mandates retry on days 1, 3, 5 and 7 (provider smart retries help); UPI AutoPay retries are limited and the customer may need to re-approve.
- Message on each failure: what happened, the amount, the date access will change, one button to update the payment method. Email plus in-app banner plus WhatsApp or SMS where permitted.
- Grace period of 3 to 7 days with full access, then limited access, then lock. Do not delete data on non-payment.
- Offer a way to switch to a prepaid payment link.
- Track involuntary churn separately from voluntary churn: if more than a third of churn is failed payments, fix dunning before acquisition.
- Store subscriptions: the store handles retries and a billing grace period; read its status signals (server notifications) rather than guessing.

## 3. Refunds and cancellations

Write the policy in plain words and publish it on the pricing page and in the terms.

| Case | Suggested default (owner decides) |
|---|---|
| Within a stated window of first purchase (7 to 30 days), not used heavily | Full refund |
| Annual plan cancelled mid-term | No cash refund after the window, access until term end; or pro-rated refund as a goodwill lever |
| Double charge or technical failure | Immediate refund plus apology |
| Downgrade | Effective at the next renewal; credit for the unused difference only if you promised it |
| Account closed for abuse | No refund |
| Store purchase | The store decides; point the customer to the store's refund page |

Handling: acknowledge within one working day, refund to the original payment method, give the expected days (card and UPI refunds can take several days), issue a credit note for tax invoices, record the reason. Refund fees: most gateways keep their fee on refunds; include it in the cost.

Cancellation must be as easy as sign-up: a visible button, no phone call or form maze. This is also a legal expectation in many places.

## 4. Proration and plan changes

- Upgrade: take effect now, charge the pro-rated difference for the rest of the period.
- Downgrade: effect at the next renewal, no refund for the difference.
- Seat or unit added: pro-rate the new unit to the renewal date.
- Switch monthly to annual: credit the unused monthly time, charge the annual amount.
- Show the amount and date before the customer confirms.

## 5. Disputes and chargebacks

- A dispute starts when the customer's bank reverses a payment. The gateway gives a short deadline (often one to three weeks) and a fee.
- Evidence pack: the payment record and descriptor, proof of delivery or access (login and usage logs), the terms and refund policy as shown at purchase, customer messages, your refund offer.
- Prevention: a clear billing descriptor with your product name, an email receipt for each charge, a renewal reminder before annual charges, easy cancellation, quick refunds for honest mistakes.
- Track dispute rate; providers penalise accounts over about 1%.

## 6. Invoices and credit notes

- Numbered, continuous series per financial year; never edit an issued invoice: issue a credit note and a new invoice.
- Consumer receipts for B2C; tax invoices with tax identity numbers for B2B (the India and platforms reference lists the Indian fields).
- Send the invoice by email and keep it in the account page. Keep records for the period the law requires (ask the accountant).
- Currency and exchange rate on the invoice for foreign customers.

## 7. Reconciliation (weekly, and at month end)

1. Export the gateway or store settlement report for the period.
2. Match each payout to a bank credit: gross sales, minus refunds, minus fees, minus tax withheld by the platform, equals the payout.
3. Match orders or subscriptions in your database to settlement lines. List what is in one and not the other: late events, duplicate webhooks, test charges in live mode, refunds not recorded.
4. Compare the total with the revenue report. Differences above a stated tolerance get an owner and a date.
5. Store payouts arrive monthly and late: book them when earned, hold cash when received.
6. Keep the reconciliation as a table in `docs/` or the accountant's sheet; no card or personal data.

## 8. Metrics and reporting

| Metric | Rule |
|---|---|
| MRR | Monthly recurring revenue of active paying subscriptions; annual plans / 12; exclude one-offs and tax |
| New, expansion, contraction, churned MRR | Movement of MRR in the period; they add up to the change |
| ARR | MRR x 12 (do not annualise one-offs) |
| Logo churn vs revenue churn | Customers lost vs revenue lost; both |
| Gross vs net revenue retention | Net includes expansion |
| Deferred revenue | Annual prepayments are cash now and revenue over the term; the accountant books it |
| Cash vs revenue vs profit | Never mix them in one chart |

Quote the metric definitions in every report, and keep one source of truth (the billing system or a script), not hand edits.

## 9. Webhooks and billing code (hand over to engineering)

- Verify signatures; handle events idempotently (store event ids); tolerate out-of-order events; never trust the redirect URL alone to grant access.
- Do not grant access on "payment initiated", only on "payment succeeded" or the equivalent.
- Reconcile by a periodic job against the provider's API, as webhooks get lost.
- Test the failure paths: card declined, mandate cancelled, refund, dispute, webhook replay.
- Debugging billing incidents: `lll:debug`. Payment security review: `lll:security`.

## 10. Month-end checklist

- [ ] Settlement reports exported and reconciled.
- [ ] Refunds and credit notes recorded.
- [ ] Failed-payment backlog worked.
- [ ] MRR movement table updated; churn reasons tagged.
- [ ] Tax filings data prepared for the accountant (taxable value, tax, fees, TDS).
- [ ] Open disputes and deadlines listed.
- [ ] Price list and live prices checked for drift (the page, the console, the billing system agree).

## 11. Support replies (drafts, edit to voice)

- "Charged twice": "Thanks for flagging this. I can see two charges on <date>. I have refunded the second one; it reaches your account in 5 to 7 working days. The reference is <id>."
- "Cancel": "Done. Your plan stays active until <date>; you will not be charged again. Your data stays for <n> days if you want to come back."
- "Refund after the window": state the policy kindly, offer the best allowed alternative (credit, downgrade, pause), and escalate only for real faults.
