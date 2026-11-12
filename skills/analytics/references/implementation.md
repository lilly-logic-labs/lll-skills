# Implementation

Rules for all platforms:
1. One wrapper, `track(name, params)`, is the only code that calls a vendor SDK. It checks consent, validates names and parameters against the plan, and adds common properties.
2. Money and account events come from the server. Interaction events come from the client.
3. Nothing sends before the consent state is known in consent-first regions.
4. Tests assert the wrapper calls; a failing test beats a silent dashboard.

## 1. Typed wrapper (TypeScript, any web framework)

```ts
// analytics.ts - the only file that touches vendor code
type Events = {
  sign_up: { method: 'email' | 'google' }
  generate_lead: { lead_type: string; form_id: string }
  begin_checkout: { value: number; currency: string }
}
type Consent = { analytics: boolean; ads: boolean }
let consent: Consent = { analytics: false, ads: false }

export const setConsent = (c: Consent) => { consent = c; applyVendorConsent(c) }

export function track<K extends keyof Events>(name: K, params: Events[K]) {
  if (!consent.analytics) return            // drop, do not queue, unless counsel approves queueing
  window.gtag?.('event', name, params)      // swap or add a vendor here
}
declare function applyVendorConsent(c: Consent): void
```

Add a unit test that calls `track` with consent off (expect no call) and on (expect one call with the right params). Remove unknown names at compile time, which is the point of the `Events` map.

## 2. Web

### GTM and the data layer

```js
window.dataLayer = window.dataLayer || [];
dataLayer.push({ event: 'generate_lead', lead_type: 'quote', form_id: 'hero' });
```

Rules: push plain objects with an `event` key; set consent defaults before the container loads; use Custom Event triggers and Data Layer Variables; version containers with notes; never publish without a Preview run (publishing is an owner action).

### Single-page apps and frameworks

| Stack | Notes |
|---|---|
| Next.js (App Router) | load scripts in a client component after consent (`next/script`, `strategy="afterInteractive"`); `@next/third-parties` is fine when no gating is needed; send `page_view` on route change with `usePathname` and `useSearchParams` if automatic history tracking is off |
| React, Vue, Svelte, Angular | router hook calls `track('page_view')` once per route; turn off the tool's automatic history tracking to avoid doubles |
| Astro, Eleventy, Hugo, Jekyll, static sites | one script tag in the layout, behind the consent loader; view transitions need a `page_view` hook |
| WordPress | official Site Kit, GTM plugin, or theme hook; do not stack two plugins; the consent plugin must gate them |
| Shopify | use Customer Events (Web Pixels) so tags run sandboxed and respect Customer Privacy; avoid editing `theme.liquid` for pixels |
| Server-rendered backends | include the loader in the base template; emit events from templates sparingly; confirmations from controllers |

Cross-domain (checkout on another domain): configure linker domains in GA4 and the tag; add the payment gateway to the referral exclusion list so a return from it does not start a new session.

### Avoiding blockers

A first-party proxy path (for example `/stats` routed to the vendor) reduces blocking. It does not remove the consent duty. Cloudflare Workers sketch:

```ts
export default {
  async fetch(req: Request): Promise<Response> {
    const u = new URL(req.url)
    if (!u.pathname.startsWith('/stats/')) return fetch(req)
    const target = new URL(u.pathname.replace('/stats', ''), 'https://VENDOR_INGEST_HOST')
    target.search = u.search
    const headers = new Headers(req.headers)
    headers.delete('cookie')
    headers.set('x-forwarded-for', req.headers.get('cf-connecting-ip') ?? '')
    return fetch(target, { method: req.method, headers, body: req.body })
  },
}
```

Use the vendor's documented proxy recipe for exact hosts and paths. Do not log request bodies in the Worker.

## 3. Server-side events

GA4 Measurement Protocol (secret stays on the server):

```
POST https://www.google-analytics.com/mp/collect?measurement_id=G-XXXX&api_secret=SECRET
{"client_id":"<same client id as the browser>","events":[{"name":"purchase","params":{"transaction_id":"T-1001","value":999,"currency":"INR"}}]}
```

Validate first against `/debug/mp/collect` (same body); it returns messages instead of recording. Include `session_id` if you want the event attached to the browser session. GA4 de-duplicates `purchase` by `transaction_id`.

Other vendors:

| Vendor | Server call | De-dup key |
|---|---|---|
| PostHog | `capture` with `distinctId`, event, properties; flush or shut down the client in serverless handlers | `uuid` |
| Mixpanel | `track` with `distinct_id`, `time`, properties | `$insert_id` |
| Plausible | Events API `POST /api/event` with domain, name, URL, props, forwarded user agent and IP | none |
| Segment, RudderStack | `track` with `userId` or `anonymousId`, `messageId` | `messageId` |

Patterns:
- **Outbox**: write the analytics event row in the same database transaction as the domain change, then ship from a worker or queue (Cloudflare Queues, SQS, a job runner). Retries then never lose or invent events.
- **Idempotency**: use the dedupe key above; replays must not double count.
- **Clock**: set the event time on the server; late events carry their real time.
- **Identity**: pass the browser's anonymous ID to the backend (header or form field) so sessions and server events stitch; add the internal user ID when known.
- **No secrets in payloads**, no personal data (`./consent-privacy.md`).

Backend language notes: Node (`posthog-node`, `mixpanel`), Python (`posthog`, `requests` to the Measurement Protocol; signatures differ by SDK version, check the installed one), Go and Rust (plain HTTP client with timeout and retry), Java/Kotlin and .NET (vendor SDK or `HttpClient`), PHP and Ruby (vendor SDK; keep the call off the request path by queuing).

## 4. Mobile

```kotlin
// Android (Kotlin)
Firebase.analytics.logEvent("sign_up") { param("method", "email") }
```
```swift
// iOS (Swift)
Analytics.logEvent("sign_up", parameters: ["method": "email"])
```
```dart
// Flutter
await FirebaseAnalytics.instance.logEvent(name: 'sign_up', parameters: {'method': 'email'});
```
```ts
// React Native / Expo (dev build with @react-native-firebase/analytics)
await analytics().logEvent('sign_up', { method: 'email' })
```

Rules:
- Disable collection until consent where required: Android manifest `firebase_analytics_collection_enabled=false`, iOS `FIREBASE_ANALYTICS_COLLECTION_ENABLED=NO`, then enable at runtime after the choice (`setAnalyticsCollectionEnabled`). Set consent-mode defaults the same way.
- Screen views: name screens by stable keys, not by localised titles.
- Keep an offline queue per the SDK; do not build your own unless needed.
- Set user ID after sign-in and clear it on sign-out.
- Expo managed workflow needs a development build or config plugin for native SDKs; Expo Go does not load them.
- Release builds and debug builds use separate analytics properties or data streams, so test events never mix with real ones.
- Store privacy forms (App Privacy, Data safety) are updated whenever an SDK or event changes.

## 5. Desktop, CLI and embedded

- Opt-in or clear first-run choice; off switch in settings and by environment variable (`DO_NOT_TRACK=1`).
- Anonymous random install ID stored locally; reset on request. No usernames, paths, hostnames, file names or content.
- Batch and send in the background with a short timeout; never block startup or exit on the network.
- Document the exact payload in the README. Electron and Tauri: send from the main process, not from webviews with remote content.

## 6. Testing the instrumentation

Unit: the wrapper with consent on and off. Integration with Playwright:

```ts
const hits: string[] = []
await page.route('**/g/collect*', (r) => { hits.push(r.request().url()); r.fulfill({ status: 204 }) })
await page.goto('/')
expect(hits).toHaveLength(0)              // before consent
await page.getByRole('button', { name: 'Accept' }).click()
await page.getByRole('link', { name: 'Get a quote' }).click()
expect(hits.some((u) => u.includes('en=generate_lead'))).toBe(true)
```

Manual verification and debug views: `./qa-debugging.md`.

## 7. Review checklist for tracking code

- [ ] Vendor calls only in the wrapper; event names from a typed map.
- [ ] Consent gate tested; defaults set before the first tag.
- [ ] No personal data in params or URLs; query-string redaction on page views.
- [ ] Money events server-side with a dedupe key.
- [ ] No tag loaded from a domain the team does not recognise (`lll:security` for third-party script review).
- [ ] Debug and production use different properties or streams.
- [ ] Scripts load `defer`/`async`, not render-blocking, and do not hurt INP (`lll:seo` Core Web Vitals notes).
