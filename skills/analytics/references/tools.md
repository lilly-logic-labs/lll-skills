# Choosing and setting up tools

Choose by the decisions in the tracking plan, the audience's laws, who will read the reports, and what the team will actually maintain. More tools means more consent surface and more disagreeing numbers.

## 1. Decision table

| Tool | Best for | Consent and privacy posture | Notes |
|---|---|---|---|
| Google Analytics 4 (+ Tag Manager) | marketing sites, e-commerce, Google Ads link, free BigQuery export | sets identifiers; consent needed in EU and UK; Consent Mode available | steep UI, thresholding, sampling in explorations; the default for Ads attribution |
| Search Console | queries, impressions, indexing for Google Search | first-party, no visitor tracking | always set up for a public site; link to GA4 |
| Cloudflare Web Analytics | simple page views, referrers, countries, Web Vitals | no cookies, no fingerprinting, no visitor-level data | free; no custom events; good baseline with no banner burden (confirm for your jurisdiction) |
| Plausible, Umami, Fathom, Simple Analytics | privacy-first site analytics with goals and custom events | cookieless by design; hosted or self-hosted | small scripts; no user-level journeys; revenue goals in some |
| PostHog | product analytics, funnels, retention, session replay, feature flags, experiments | choose EU or US cloud or self-host; cookies or memory-only mode; replay needs masking | strongest all-in-one for SaaS and apps |
| Mixpanel, Amplitude | product analytics at scale, cohorts, experimentation | identifiers; residency options | strong analysis UI; event volume pricing |
| Firebase Analytics (GA4 for apps) | mobile apps, free, Crashlytics and Remote Config nearby | device IDs; Apple ATT only if tracking across apps or sites | DebugView, BigQuery export; Play and App Store consoles add install funnel |
| Matomo | full-featured self-hosted or cloud alternative to GA | can run without cookies; own the data | needs hosting and upkeep |
| Segment, RudderStack | one pipe to many tools, warehouse sync | you become the controller of a bigger data flow | worth it at several destinations; overkill for one tool |
| Microsoft Clarity, Hotjar, FullStory | heatmaps and session replay | records behaviour; mask inputs; consent usually required | use short, specific studies; never record payment or health fields |
| Server logs / CDN analytics | traffic truth including blocked trackers, bots, AI crawlers | no client script | good for bot and crawler counts, cache and error rates |

## 2. Typical stacks

| Situation | Suggested set |
|---|---|
| Brochure or docs site, EU or India visitors, no ads | Search Console + Cloudflare Web Analytics or Plausible/Umami |
| Lead-gen site running Google Ads | GA4 + GTM with Consent Mode, Search Console, call and form tracking, UTM registry |
| E-commerce | GA4 (with `items`), platform analytics (Shopify, WooCommerce), ad pixels behind consent, server-side purchase event, Merchant Center and Search Console |
| SaaS product | PostHog or Mixpanel for product; GA4 or Plausible for the marketing site; server-side billing events; warehouse later |
| Mobile app | Firebase Analytics + Crashlytics, Play Console and App Store Connect analytics, PostHog or Mixpanel if product analysis is deep, an attribution service only when paid acquisition justifies it |
| Desktop or CLI tool | opt-in anonymous telemetry to PostHog or a small endpoint; document exactly what is sent; off by default in privacy-sensitive markets |
| Internal tool | none or server logs; do not add third-party trackers |

## 3. Tag manager or code

| | GTM | Code in the repo |
|---|---|---|
| Good for | marketing tags changed by non-developers, many vendors | product events, money events, anything tied to app state |
| Risks | tag sprawl, slower pages, silent breakage, hard code review | needs a release to change |
| Rule | keep GTM for marketing tags; send product events from code through the wrapper and the `dataLayer` or the SDK |

## 4. Client or server

| | Client | Server |
|---|---|---|
| Sees | clicks, scroll, UI state, marketing parameters | confirmed payments, account actions, API results |
| Loss | ad blockers, consent denial, script failures | none from browsers |
| Use for | interaction analytics | revenue, sign-ups, trials, cancellations, anything that must be right |

Send the money event from the server, with the same client ID or user ID the browser has. Do not double count: pick one source for each event name.

## 5. Setup notes

### GA4 + GTM

1. Create a property and a web data stream; copy the measurement ID (public). Install through GTM (preferred for marketing) or `gtag.js`.
2. Admin settings worth doing: data retention to 14 months; Google signals off unless ads personalisation is wanted and consented; internal traffic rule and data filter; unwanted referrals (payment gateways, your own domains for cross-domain); enhanced measurement reviewed (site search, outbound clicks, file downloads, scroll, form interactions: turn off what you will track better yourself); timezone and currency.
3. Mark key events. Register custom dimensions only for parameters you will report on.
4. Link Search Console, Google Ads, BigQuery (daily export is free and keeps raw data past retention).
5. Consent Mode v2: default `denied` for `ad_storage`, `analytics_storage`, `ad_user_data`, `ad_personalization` in regions that need consent, then update on choice (`./consent-privacy.md`).
6. All admin changes are owner actions. Prepare a checklist instead of changing them.

### Search Console

Verify the domain property with a DNS TXT record (covers all subdomains and protocols). Submit the sitemap. Link to GA4. Add users with the right level. Deeper reading: `./google-data.md`; fixing problems: `lll:seo`.

### Cloudflare Web Analytics

Enable for the zone (auto-injection for proxied sites) or paste the beacon snippet with its token on other hosts. Single-page apps: enable the SPA option. Counts visits and page views without cookies; there are no custom events, so use another tool for conversions.

### Plausible or Umami

Add the script with `defer` and the domain; proxy the script through your own path to avoid blockers if wanted. Custom events: `plausible('signup', { props: { plan: 'pro' } })` or `umami.track('signup', { plan: 'pro' })`. Define goals in the dashboard. Hash-based or SPA routing needs the matching script variant.

### PostHog

Choose region (EU or US) or self-host. Use the JS or mobile SDK with a project key (public). Decide autocapture on or off; turn on only what the plan needs. `identify(userId)` after sign-in, `reset()` on logout. Session replay: mask all inputs by default, block sensitive elements with the masking class, sample sessions. Turn off IP storage in project settings if the policy requires. Feature flags and experiments live in the same tool.

### Mixpanel or Amplitude

Project token (public) in the SDK. `track`, `identify`, `people.set` / user properties. Choose the data residency region at project creation. Disable default geolocation and IP storage where the policy requires. Keep event names under the plan.

### Firebase Analytics (apps)

Add the Firebase config files to the app, enable the Analytics SDK, set the consent defaults before the first event, log events with the wrapper. Use DebugView while testing. Link BigQuery. iOS: the ATT prompt is needed only if you track users across other companies' apps and sites; first-party analytics alone does not need it. Android and iOS store privacy forms must match what the SDKs collect.

### Store consoles

Play Console (acquisition, installs, retention, Android vitals) and App Store Connect (App Analytics, sales, crashes) need no SDK. Data thresholds hide small numbers. Read them for the install funnel; read product analytics for behaviour after install.

## 6. Cost and lock-in

Prefer tools that export raw events (GA4 to BigQuery, PostHog and Mixpanel exports). Keep the tracking plan tool-agnostic so a swap is a wrapper change. Estimate monthly event volume from the plan before choosing a paid tool.
