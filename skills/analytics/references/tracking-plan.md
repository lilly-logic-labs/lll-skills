# Tracking plan

A tracking plan is the contract between the people who ask questions and the code that records answers. Write it before instrumenting, review it in pull requests, and lint it.

## 1. Start from decisions

Table first, events second:

| Decision | Metric that informs it | Event(s) | Segment cuts |
|---|---|---|---|
| Which channels deserve budget? | signups and paid conversions by source | `sign_up`, `purchase` | source, medium, campaign |
| Where do new users stall? | step conversion in onboarding | `onboarding_step_completed` | device, plan, country |
| Is the product sticky? | week-4 retention of activated users | `activation_reached`, any core action | signup cohort |
| Does the pricing page convert? | pricing view to checkout start | `view_pricing`, `begin_checkout` | source, device |

Drop any event with no row in this table.

## 2. Minimum event sets by site type

| Type | Events |
|---|---|
| Content or marketing site | page views (automatic), `cta_clicked`, `generate_lead` (form success), `newsletter_signup`, `outbound_clicked`, `file_downloaded`, `search_performed` |
| Lead generation or local service | `generate_lead` (with `lead_type`), `phone_click` (a `tel:` tap), `whatsapp_click`, `form_started`, `form_submitted`, `booking_completed` |
| SaaS | `sign_up`, `login`, `activation_reached`, `invite_sent`, `feature_used` (with `feature`), `begin_checkout`, `purchase` / `subscription_started`, `subscription_cancelled`, `trial_started`, `trial_converted` |
| E-commerce | `view_item_list`, `view_item`, `add_to_cart`, `remove_from_cart`, `view_cart`, `begin_checkout`, `add_shipping_info`, `add_payment_info`, `purchase`, `refund`, `search`, `sign_up`, `login` |
| Mobile app | `first_open` (automatic), `sign_up`, `tutorial_complete`, `activation_reached`, core-action event, `paywall_viewed`, `purchase`, `push_opened`, `app_rating_prompted` |
| Marketplace | `search`, `listing_viewed`, `contact_seller`, `booking_requested`, `booking_completed`, `listing_created`, `review_submitted` (supply and demand sides tracked separately) |

## 3. Naming

- `snake_case`, lowercase letters, digits, underscores. Start with a letter.
- When GA4 has a recommended event for the action (`sign_up`, `login`, `purchase`, `add_to_cart`, `begin_checkout`, `view_item`, `generate_lead`, `search`, `share`, `tutorial_complete`, `refund`), use that exact name and its parameters, so built-in reports work.
- Otherwise `<verb>_<object>`: `invite_sent`, `report_exported`, `plan_upgraded`. Past tense for something that happened, consistently.
- One event per user action; put variants in parameters (`cta_clicked` with `cta_id`), not in the name (`clicked_hero_cta`, `clicked_footer_cta`).
- Never rename a live event. Add the new one, run both for a period, then retire the old and note it in the changelog.
- Names are case-sensitive in most tools. Pick lowercase and enforce it.

### Limits to design within (GA4 standard property; check current Google documentation, limits change)

| Item | Limit |
|---|---|
| Event name | 40 characters, snake_case recommended, no reserved prefixes (`google_`, `ga_`, `firebase_`) |
| Parameters per event | 25 |
| Parameter name / value | 40 / 100 characters |
| Distinct event names per property | 500 |
| User properties | 25; name up to 24 characters, value up to 36 |
| Custom dimensions (event / user) | 50 / 25 |
| Reserved event names | `first_visit`, `session_start`, `screen_view`, `app_exception`, `error`, `user_engagement`, `in_app_purchase`, `app_remove`, `notification_*` and others; the lint script lists them |

A parameter must be registered as a custom dimension or metric in GA4 to appear in standard reports. High-cardinality values (IDs, URLs with IDs, timestamps) eat quota and make unreadable reports; keep them out of dimensions.

## 4. Event spec

One block per event (a table row works; the lint script reads JSON or CSV):

```
name: purchase
fires_when: server confirms payment captured (not when the button is clicked)
where: server (webhook handler)          consent_category: analytics (aggregate) / ads if forwarded
params: transaction_id (string, required), value (number), currency (ISO 4217), items (array), coupon, payment_type
user_id: hashed account ID if signed in
personal_data: none
owner: growth
decision_it_feeds: channel ROI, AOV
```

JSON form for the script:

```json
{ "events": [
  { "name": "purchase", "description": "Payment captured server-side", "owner": "growth",
    "params": ["transaction_id", "value", "currency", "items", "coupon"] },
  { "name": "generate_lead", "description": "Contact form accepted", "owner": "sales",
    "params": ["lead_type", "form_id"] }
 ],
  "userProperties": ["plan_tier", "signup_source"] }
```

CSV columns: `event,params,description,owner` with params separated by `|`.

Run `node scripts/analytics-check.mjs plan plan.json`. It reports bad names, reserved names, near-duplicates, over-limit counts, parameters that look like personal data, `value` without `currency`, `purchase` without `transaction_id`.

## 5. Properties and dimensions that earn their keep

- Event-level: `plan`, `feature`, `source_page`, `form_id`, `method` (login or signup method), `result` (success or failure), `error_code` (a code, never a message with user text).
- User-level: `plan_tier`, `signup_source`, `account_age_bucket`, `role`, `country` from the browser or app settings.
- Money: `value` is a number in major units; `currency` always accompanies it; tax and shipping rules written down.
- Never: raw URLs with query strings containing tokens or emails, search queries typed by users (unless aggregated), names, emails, phone numbers.

## 6. Identity

- Anonymous ID from the tool's cookie or device ID. On sign-in, associate a stable internal user ID (not the email), using the tool's identify call or GA4 `user_id`. Do not share one ID across tools unless the privacy design says so.
- Merge rules: say how anonymous activity links to a user and what happens on logout, shared devices, and multiple accounts.
- Server events carry the same anonymous ID (pass it to the backend in the request) or the user ID, so sessions stitch.
- Deleting a user: record how the deletion request reaches each analytics tool (most have a delete-user API).

## 7. Conversions (key events)

Pick few: usually one to three per business goal. A key event is a business outcome (lead accepted, trial started, purchase), not an engagement signal (scroll, click). Mark them in the tool (GA4 "key events"), define counting (once per session or every time), and keep a test that fails if the event stops firing.

## 8. Governance

- The plan lives in the repository (`docs/analytics/tracking-plan.md` or JSON beside the code) and changes through pull requests.
- Add a changelog table: date, change, reason, who.
- Review quarterly: delete events nobody has queried in 90 days.
- Add a contract test where practical: the typed wrapper rejects unknown event names and parameters.

## 9. Output of this step

The decision table, the event table or file, the lint result, the open questions for the owner (which key events, which consent categories), and the implementation tickets. Implementation is in `./implementation.md`.
