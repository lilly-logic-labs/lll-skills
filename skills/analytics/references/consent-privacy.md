# Consent and privacy for analytics

Engineering guidance, not legal advice. Laws and regulator guidance change; before shipping a banner, a privacy notice or a data-transfer arrangement, the owner takes it to counsel. Writing the legal text (privacy policy, terms) is an owner action, not something to auto-fix.

## 1. Work out what applies

Answer in order:

1. **Where are the users?** Law follows the user's location, not the server's. List the countries and regions that matter.
2. **What does each tool store or read on the device?** Cookies, local storage, device IDs, fingerprints, advertising IDs. Read each tool's documentation and test in the browser's storage panel.
3. **What does each tool send?** IP address, user agent, URLs, user IDs, free text, location.
4. **Who receives it and where?** Vendor, sub-processors, country of storage. A data processing agreement and a transfer mechanism may be needed.
5. **Is it aggregate and anonymous, or tied to a person or device?** Anything linkable to a person or a device over time is likely personal data.
6. **Whose data?** Children and sensitive categories raise the bar.

## 2. Regimes in brief

| Regime | Core ideas for analytics |
|---|---|
| India, Digital Personal Data Protection Act 2023 and Rules | Consent must be free, specific, informed, unconditional and unambiguous, given by a clear affirmative action, for a stated purpose. A notice in plain language says what data, why, how to withdraw and how to complain. Withdrawal must be as easy as giving consent. Collect only what the purpose needs and erase when the purpose is served or consent is withdrawn (unless a law requires retention). Under-18 users need verifiable parental consent; no tracking, behavioural monitoring or targeted advertising aimed at children. Report personal data breaches to the Data Protection Board and affected people. Name a grievance contact. Large "significant" fiduciaries have extra duties. Commencement is phased; confirm current dates |
| EU GDPR + ePrivacy | Storing or reading anything on a device (cookies, local storage, fingerprinting) needs prior consent unless strictly necessary. Analytics usually is not strictly necessary, though some regulators accept narrow, aggregate, first-party measurement without consent (France's CNIL sets strict conditions). Consent: freely given, specific, informed, unambiguous, as easy to withdraw as to give, recorded. Legitimate interest does not replace consent for advertising cookies. Vendors are processors: sign a DPA. Transfers outside the EEA need a valid mechanism |
| UK GDPR + PECR | Similar to the EU. Recent UK law adds some consent exemptions for low-risk analytics; check the ICO's current guidance |
| California CCPA / CPRA and other US states | Notice at collection, a way to opt out of "sale" and "sharing" (cross-context behavioural ads), honour the Global Privacy Control signal, limit sensitive data, honour access and deletion requests |
| Children (COPPA, GDPR for children, Play Families, App Store Kids) | No behavioural ads, restricted SDKs and identifiers, parental consent. Avoid third-party analytics in children's products unless certified and configured for it |
| Health, finance, education data | extra sectoral rules (HIPAA in the US, local regulators). Do not send such data to general analytics tools |

## 3. What may run before consent

| Category | Examples | Before consent? |
|---|---|---|
| Strictly necessary | session cookie, CSRF, load balancing, cookie preferences, security | yes |
| Aggregate, cookieless analytics with no identifiers, no cross-site, no IP storage | Cloudflare Web Analytics, Plausible, Umami in default mode | commonly accepted in many places, not guaranteed everywhere; owner confirms per market |
| Analytics with identifiers | GA4, Mixpanel, Amplitude, PostHog with cookies, Clarity | wait for consent in consent-first regions |
| Advertising and retargeting | Google Ads, Meta Pixel, LinkedIn Insight, TikTok Pixel | wait for consent; separate category |
| Session replay and heatmaps | PostHog replay, Hotjar, Clarity, FullStory | wait for consent; mask inputs |

"No banner needed" is a legal conclusion that depends on the tool, its configuration and the market. State it as "likely, subject to the owner's confirmation".

## 4. Banner and consent management

Requirements to check (each a finding if it fails in a consent-first region):

- Tags that need consent do not fire before it. Verify with the network panel on a fresh browser profile: no analytics or ad requests, no non-essential cookies, before choosing.
- Reject is as prominent and as easy as Accept, on the first layer. No pre-ticked boxes. No "cookie wall" that blocks the site unless you pay.
- Categories are granular (analytics, advertising, functional) with a short, true description and the vendors listed.
- The choice is stored, respected on every page and across subdomains, and can be changed later from a visible link ("Cookie settings").
- Consent is logged: timestamp, version of the notice, choice. Re-ask when purposes change and at a sensible interval.
- Honour Global Privacy Control and Do Not Track signals where law or policy requires.
- The banner does not cause layout shift or block Core Web Vitals (reserve space or overlay).
- A tested path exists for users who block JavaScript: no tracking, site still works.

Implementation options: a consent management platform (certified for Google's Consent Mode if you run Google ads), an open-source banner (such as Klaro or Osano's Cookie Consent), or a small custom store behind the `track()` wrapper. Whatever the choice, the wrapper reads the stored choice and gates every vendor call.

### Google Consent Mode v2

Set defaults before any Google tag loads, in regions that need consent:

```js
gtag('consent', 'default', {
  ad_storage: 'denied', analytics_storage: 'denied',
  ad_user_data: 'denied', ad_personalization: 'denied',
  wait_for_update: 500
});
// after the user chooses:
gtag('consent', 'update', { analytics_storage: 'granted' /* and others as chosen */ });
```

Denied states send cookieless pings that feed modelled conversions; they are not "tracking-free" if you also forward them elsewhere. Advanced vs basic mode is a policy choice for the owner. Google requires the signals for ads personalisation in the EEA and the UK.

## 5. Data minimisation

- Do not send: email, phone, names, addresses, government IDs, payment details, health or financial details, precise location, free text, passwords or tokens. The plan linter flags suspicious parameter names.
- URLs: strip query strings that carry tokens, emails or search terms before sending page views (`page_location` can leak them). Many tools allow redaction rules.
- IDs: pseudonymous internal user ID. Keep the mapping to a real person in your own database only. Hash is not anonymisation if the input is guessable (email).
- IP and location: GA4 does not store full IPs. For other tools, find the IP and geolocation setting and set it to what the policy says. Country or region level is enough for most questions.
- Replay: mask all text inputs by default; block payment, health and personal-data fields entirely.
- Retention: set the shortest useful period (GA4 event data is 2 or 14 months; BigQuery export keeps its own copy, so set table expiry). Delete users on request through each tool's deletion API.
- Access: least privilege; remove people who left; no shared logins.

## 6. Mobile and desktop

| Platform | Points |
|---|---|
| iOS | App Privacy labels in App Store Connect must match SDK behaviour. Third-party SDKs need privacy manifests. App Tracking Transparency prompt only for cross-app/site tracking or sharing data with data brokers; first-party analytics alone does not trigger it. Honour "Allow tracking" off by not reading the IDFA |
| Android | Play Data safety form must match SDK collection. Advertising ID use is declared and limited. Families policy for child-directed apps |
| Both | defaults before first event: analytics collection disabled until consent in consent-first regions (Firebase has a manifest or plist switch and a runtime API) |
| Desktop and CLI | telemetry off by default or an explicit first-run choice; a documented, minimal payload; an easy off switch and an environment variable such as `DO_NOT_TRACK`; no file paths, usernames or content |

## 7. Policy and records the owner must keep

- Privacy notice that lists each analytics tool, purpose, data collected, retention, recipients, transfers, and how to withdraw or complain. Update it whenever tools change.
- A register of processors with signed agreements and transfer mechanisms.
- A consent log and an access/deletion request procedure.
- For India: the notice and consent flows, a grievance contact, breach response, children's data rules, and (if designated) significant fiduciary duties.

## 8. Review checklist and severities

| Check | Severity if failing |
|---|---|
| Non-essential tracking fires before consent in a consent-first region | high |
| Personal data in event parameters or URLs | critical when sensitive, high otherwise |
| Reject harder than accept, pre-ticked boxes | high |
| No way to change consent later | medium |
| Tool used is missing from the privacy notice | medium (owner action) |
| Session replay without masking | high |
| Analytics on a children's product | high |
| Retention left at maximum with no need | low |
| Third-party tag loaded from an unknown domain | high; hand to `lll:security` |

Findings use `../../../shared/findings.md` with lens `analytics`. Evidence: the request in the network panel, or `path:line` of the tag or initialisation code.
