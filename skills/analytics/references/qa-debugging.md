# QA and debugging events

Do this before any dashboard is trusted, and again after every release that touches tracking.

## 1. QA matrix

One row per planned event. Fill the last two columns from what you observed, not from the code.

| Event | Trigger steps | Expected params | Consent state tested | Observed (tool + request) | Pass |
|---|---|---|---|---|---|
| `generate_lead` | submit the quote form with valid data | `lead_type`, `form_id` | accepted | | |
| `generate_lead` | same, consent denied | none sent | denied | | |
| `purchase` | complete a test order | `transaction_id`, `value`, `currency`, `items` | accepted | | |

Also test: failure paths (form error must not fire the success event), double-clicks, back button and refresh (no duplicate), slow networks, ad blocker on, a fresh profile with no consent, mobile viewport, each language version.

## 2. How to see events

| Tool | Method |
|---|---|
| Any browser tool | DevTools Network panel, filter by the vendor: `collect`, `g/collect`, `/e/`, `/i/v0/e`, `plausible.io/api/event`, `api.mixpanel.com`, `/track`. Open the request payload and read `en=` (event name) and `ep.*` / `epn.*` (GA4 parameters) |
| GA4 | Admin > DebugView (events from debug-mode devices stream in seconds). Enable with the GTM Preview mode, the Tag Assistant, a `debug_mode: true` parameter on the tag, or the Google Analytics Debugger browser extension. Realtime report shows the last 30 minutes. Standard reports lag by hours up to a day |
| GTM | Preview mode (Tag Assistant): shows which tags fired on which events, data layer contents, consent state |
| Server events | send to `/debug/mp/collect` first for validation messages; then check Realtime or DebugView |
| PostHog | Activity (live events) view; Network tab for `/e/` or `/batch` |
| Mixpanel / Amplitude | Live View / User Lookup / Event stream |
| Plausible, Umami | Realtime dashboard; goals page |
| Firebase (Android) | `adb shell setprop debug.firebase.analytics.app <package.name>` then open DebugView; reset with `adb shell setprop debug.firebase.analytics.app .none.` |
| Firebase (iOS) | Xcode scheme argument `-FIRAnalyticsDebugEnabled` (and `-FIRAnalyticsDebugDisabled` to turn off) |
| Browser automation | the `chrome-browser` or `built-in-browser` skill can click through the flow and read the network log; the user's sign-ins and consent choices apply |

## 3. Reconcile with a system of record

Pick one day with enough volume. Compare:

| Analytics | System of record | Expected gap |
|---|---|---|
| `purchase` count and sum | orders and payments in the database or gateway | within a few percent for server-side events; client-side events often 10 to 30 percent lower (blockers, consent, failed loads) |
| `sign_up` | new rows in the users table | same as above |
| Sessions | web server or CDN request logs (humans only) | analytics lower; bots excluded |

Write the observed gap and the cause. A gap that changes suddenly is a bug or a consent change.

## 4. Failure modes and fixes

| Symptom | Likely cause | Fix |
|---|---|---|
| No events at all | wrong ID, script blocked, CSP blocks the vendor domain, consent never granted | check Network and Console, CSP `script-src`/`connect-src`, consent store |
| Page views doubled | tag loaded twice (GTM and hard-coded; two plugins), SPA history tracking plus manual page_view | remove one source |
| Page views once per site visit in SPA | no route-change hook | add one `page_view` per route change |
| Events fire on load not on click | trigger is a page-view trigger | use click or custom-event trigger |
| Event fires but missing in reports | parameter not registered as a custom dimension, event is not a key event, report lag, thresholding | register, wait, check DebugView |
| Revenue missing or in wrong currency | `value` without `currency`, string with symbol, minor units | number in major units plus ISO currency |
| Purchases duplicated | event on thank-you page reload | server-side event with `transaction_id`, or guard the page |
| Bot or spam sessions, odd countries | referrer spam, scrapers, headless browsers | enable bot filtering, filter known bad hostnames, use hostname filter, server-side validation |
| Your own visits in the data | no internal filter | IP rule with `traffic_type=internal` and a data filter; separate dev property |
| `(not set)` in dimensions | parameter missing, or dimension scope mismatch | check the event carries it and the dimension scope matches |
| Sudden drop to zero | release removed the tag, consent banner change, CSP change | compare with the deploy log; check the wrapper tests |
| Users counted twice across subdomains | cross-domain not configured; cookie domain | configure linker; set cookie domain |
| Mobile events missing | debug build used release property, SDK collection disabled, offline batching delay | check the stream, the manifest flag, wait for upload |

## 5. Sanity checks on the data itself

- Bounce or engagement rate near 0 or 100 percent: usually a tagging problem.
- Conversion rate far above the industry norm: duplicate firing or a test event counted.
- Revenue per order far off the real average: currency or tax issue.
- Traffic spikes at odd hours from one country: bots.
- Funnel steps where a later step exceeds the earlier: missing event on the earlier step or users entering mid-funnel.

## 6. Make it stick

- Keep the QA matrix with the plan.
- Add the Playwright check from `./implementation.md` for the top three events.
- Add an alert for "event X volume is zero for 24 hours" (`./dashboards.md`).
- Annotate releases that change tracking. A discontinuity should be visible on the chart.

## 7. Output

The completed matrix, reconciliation numbers with the gap, a ranked list of failures with evidence (request captured or screenshot description), and the fixes. Findings: `../../../shared/findings.md`, lens `analytics`.
