# Store release

Store rules, deadlines and form fields change often. Retrieve the current Google Play policy centre, Play Console help, App Store Review Guidelines and App Store Connect help before stating any requirement. Everything that touches a console, a signing key or a submission is an owner action: prepare the content and the steps, do not click.

## Release readiness checklist

Use as the full-mode walk-through. Each failed row is a finding (`../../../shared/findings.md`; lens `release`).

Identity and versions
- [ ] Application id and bundle id match the store records and every external service that checks them (Firebase, sign-in, App Links, push, billing).
- [ ] Version name/number and build/version code are produced from one source; build number higher than any uploaded.
- [ ] Release tag or commit recorded for every store build.

Build and signing
- [ ] Release artifact built from a clean checkout in CI, not from a laptop.
- [ ] Signing keys and API keys live in the owner's vault; upload keystore backed up in two places; fingerprints recorded.
- [ ] Release artifact checked for debug code: not debuggable, no dev menu, no QA bridge, no test endpoints, no logging of payloads, TLS not relaxed.
- [ ] Minification on; mapping, dSYM, source maps and Flutter symbols uploaded to crash reporting.
- [ ] Target SDK and minimum OS meet the current store requirement; native libraries meet current alignment rules.

Privacy and policy
- [ ] Privacy policy URL live, matches what the app actually collects and shares (including SDKs and AI providers).
- [ ] Play Data safety form and App Store privacy labels reflect the same data as the policy and the SDK list.
- [ ] iOS privacy manifest present; required-reason APIs declared; third-party SDKs bring their own manifests.
- [ ] Every permission requested is used; usage strings are specific; restricted permissions have Play declarations.
- [ ] Account creation implies in-app account deletion and a web deletion URL where required; deletion actually removes data.
- [ ] Tracking: ATT flow if tracking; consent flow for analytics and ads where law requires it (EU, UK, others).
- [ ] Children's, health, finance, news or government categories checked for their extra rules.
- [ ] User-generated content has reporting, blocking and moderation.
- [ ] Payments: digital goods use the store billing system unless an allowed exception applies; subscription terms, price, renewal and cancellation are shown before purchase; restore purchases exists.

Content and listing
- [ ] Name, subtitle/short description, full description, keywords, category, age rating questionnaire answered honestly.
- [ ] Screenshots from the real release build for each required device size; no misleading claims; localised where you ship localised.
- [ ] Review notes: demo credentials that work, steps to reach gated features, hardware or region requirements, a contact.
- [ ] Support URL and marketing URL live; support email monitored.
- [ ] Release notes written for users.

Quality
- [ ] Smoke test of the release build on the oldest supported OS and a low-end device: install, sign up, sign in, core flow, payment sandbox, push, deep link, offline, upgrade from the previous version.
- [ ] Pre-launch report (Play) or TestFlight feedback reviewed; crash-free sessions in the beta above threshold.
- [ ] Accessibility pass done (screen reader, large text).
- [ ] Data migration from the previous version tested.

Rollout and recovery
- [ ] Staged rollout percentage plan and who watches crash rate, ANR rate and key funnel.
- [ ] Rollback path: halt rollout, ship a fix with a higher build number, or push an OTA update for JS-only fixes where the stack allows. Know the review time for a hotfix.
- [ ] Server compatible with old app versions still in the wild; minimum supported app version enforced by a server flag with a friendly update prompt.
- [ ] Remote kill switch or feature flags for risky features.

## Versioning rules

- Semantic or calendar version for humans; a monotonically increasing integer for the stores. Never reuse or lower the integer.
- Hotfix: bump the build number, keep the version or bump the patch.
- OTA (Expo): the runtime version changes whenever native code changes; otherwise users with old binaries receive an incompatible update.

## Common rejection and suspension causes

| Store | Cause | Remedy |
|---|---|---|
| Both | Crashes or broken core flow on the review device | Test the release build; supply working credentials |
| Both | Metadata mismatch, misleading screenshots, keyword stuffing | Align listing to the app |
| Both | Privacy form does not match the SDKs/data | Audit SDKs; update forms and policy together |
| Both | Missing account deletion | Add in-app flow and web URL |
| Both | Login required with no demo access | Add review credentials or a demo mode |
| Apple | Payments outside In-App Purchase for digital goods; missing Sign in with Apple parity; vague permission strings; 4.2 minimum functionality | See the iOS native reference in this skill |
| Apple | Beta, trial or "test" wording, placeholder content | Remove |
| Google | Target API too old; restricted permissions without declaration (SMS, call log, background location, all files access) | Update target; justify or remove permission |
| Google | Closed-testing requirement for new personal accounts not met | Run the required test with real testers for the required period |
| Google | Repetitive content, impersonation, deceptive behaviour, ads policy | Rework the app or listing |
| Google | Foreground-service type or exact-alarm use not declared | Declare in Play Console and the manifest |
| Both | Third-party SDK violates policy (data collection, tracking) | Update or remove SDK |

Read the rejection text literally. Quote the guideline number or policy name in the fix notes. Reply in the console with what changed and where reviewers see it. Appeal only with evidence.

## Store listing work

- Copy, keywords and campaign planning: `lll:marketing`. App-store SEO overlaps with `lll:seo`.
- Screenshots: show the real UI, one idea per image, large readable captions, localised sets for top markets.
- Preview video: under the store's length limit, no device frames that mislead.
- Ratings prompt: ask after a success moment, through the platform API only, never gated on positive sentiment.

## Distribution paths

| Path | Use |
|---|---|
| Internal testing/TestFlight internal | Team builds every merge or nightly |
| Closed/external beta | Customers or testers before launch |
| Staged production rollout | Default for every release after the first |
| Ad hoc/enterprise/sideload (APK) | Pilots and internal tools only; check each store's terms |
| OTA update (Expo/CodePush-style) | JS and asset fixes inside store policy |

## Owner actions to list in every release report

Console edits (listing, forms, declarations), key custody, store submission and promotion to production, rollout percentage changes, legal text, pricing, and any accounts or payments. Name the exact screen or command.
