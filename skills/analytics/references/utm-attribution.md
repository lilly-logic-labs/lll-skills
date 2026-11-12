# UTMs, channels and attribution

## 1. UTM rules

UTM parameters label where a visit came from. They only work if everyone spells them the same way.

| Parameter | Meaning | Rule | Example |
|---|---|---|---|
| `utm_source` | who sent the traffic | lowercase platform or partner name | `google`, `linkedin`, `newsletter`, `partner-acme` |
| `utm_medium` | the kind of channel | one value from the approved list | `cpc`, `paid_social`, `social`, `email`, `affiliate`, `referral`, `display`, `video`, `sms`, `qr`, `influencer` |
| `utm_campaign` | the initiative | `<yyyy>-<mm>-<name>` or a stable slug | `2026-03-spring-launch` |
| `utm_content` | which creative or link | optional; variant or placement | `hero-cta`, `video-a` |
| `utm_term` | paid keyword | optional; usually auto-filled by ad platforms | `crm-software` |

- Lowercase only, hyphens or underscores, no spaces, no personal data, no sensitive words. `Email` and `email` become two rows.
- Required: source, medium, campaign. Without them, GA4 files the visit as Direct or Unassigned.
- Keep UTMs before any `#fragment`. After the `#` they are not read.
- Never put UTMs on internal links. They overwrite the real source and start new sessions.
- Ad platforms with auto-tagging (Google Ads `gclid`) need no manual UTMs; mixing them can break attribution. Use auto-tagging for Google Ads, UTMs for everything else.
- Redirectors and short links must preserve the query string. Test the final URL.
- QR codes and print: use a dedicated vanity path or a UTM-tagged URL with `utm_medium=qr`.
- Keep a registry (sheet or file): approved sources, mediums, campaign names, owner, start and end dates. A link builder reads from it.

Check links before use: `node scripts/analytics-check.mjs utm "<url>" "<url>"` (or `--file urls.txt`). It flags missing fields, uppercase, spaces, repeats, UTMs after `#`, and mediums GA4 will not group.

## 2. How GA4 groups channels (default channel group)

GA4 assigns each session a channel from source and medium: Direct, Organic Search, Paid Search, Organic Social, Paid Social, Email, Affiliates, Referral, Display, Video, Organic Shopping, Paid Shopping, SMS and others; sessions that match nothing are Unassigned. A native AI assistants group exists in newer properties for known assistant referrers; availability and recognised sources change, so confirm in the property. Sessions from AI tools that strip referrers land in Direct.

To report custom groupings (partners, regions, creator programmes) build a custom channel group in the property.

Common distortions:

| Symptom | Cause | Fix |
|---|---|---|
| Direct is large and growing | dark social (chat apps, email clients, apps without referrers), AI tools, untagged links, missing UTMs, redirects dropping the referrer | tag everything you control; ask "how did you hear about us"; look at landing pages of Direct traffic |
| Referral from your own domain or subdomain | cross-domain not configured | list linker domains; exclude self-referrals |
| Referral from a payment gateway or auth provider | the return trip starts a new session | add to unwanted referrals |
| Unassigned | medium not recognised | use standard mediums |
| Organic Search vs Search Console clicks differ | GA4 counts sessions, consent loss, blockers, different definitions | expect a gap; compare trends, not totals |
| Paid platform reports more conversions than GA4 | different attribution windows and view-through; platform models | decide one source of truth for budget decisions |

## 3. Attribution models

| Model | Credits | Use |
|---|---|---|
| Last click (non-direct) | the final marketing touch | simple and stable; biased to bottom-funnel channels |
| First click | the touch that introduced the visitor | reading discovery channels |
| Data-driven (GA4 default for key events) | spread by modelled contribution | needs enough conversions; opaque |
| Platform-reported (Ads, Meta) | whatever that platform touched, with view-through | useful inside the platform; will not sum to your real sales |
| Self-reported ("how did you hear about us") | what people remember | cheap, often shows channels trackers miss (word of mouth, podcasts, AI tools) |
| Coupon or vanity URL | exact for offline and creator campaigns | works when the code is memorable |

Plain rules:
- Attribution answers "which touches were present", not "what caused the sale". Say so.
- Windows matter: 30-day click vs 1-day view gives very different numbers. Write the window beside the figure.
- Compare channel cost to outcome on one consistent model; never mix platform-reported and GA4 numbers in one table without labels.
- For real causal answers use holdouts, geo tests or incrementality tests; for small budgets use before-and-after with caveats.
- Marketing mix modelling is for large, multi-channel spend; do not propose it for small sites.

## 4. Apps

- Install attribution: Google Play install referrer (`utm_*` in the Play URL), Apple Search Ads attribution, and, for paid social at scale, a mobile measurement partner (AppsFlyer, Adjust, Branch). Apple's privacy framework (SKAdNetwork / AdAttributionKit) limits and delays user-level data; expect coarse results.
- Deep links and deferred deep links carry campaign data into the first session; test cold install paths on a real device.
- Web-to-app: put UTMs on the store link or use the link service; log the source on first open and attach it as a user property.

## 5. Email, SMS, messaging

- Email: UTM on every link in the message template, `utm_medium=email`, campaign per send. Apple Mail Privacy Protection inflates opens: judge by clicks and conversions.
- SMS and WhatsApp: short links with UTMs; many in-app browsers drop referrers, so UTMs carry the whole signal.
- Newsletters you do not own: a dedicated landing page or code.

## 6. AI assistants

Traffic from chat assistants appears with referrers like `chatgpt.com`, `perplexity.ai`, `gemini.google.com`, `copilot.microsoft.com`, `claude.ai`, or no referrer at all. Group them in a custom channel and treat the total as a floor. Pair with server logs (AI bot hits) and a monthly prompt panel (`lll:seo`, AI search reference).

## 7. Output of this step

A registry table, a link-builder template, the custom channel group definition, a list of referral exclusions and cross-domain settings for the owner to apply, and a note on which attribution source is the source of truth for budget.
