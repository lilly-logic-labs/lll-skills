---
name: analytics
description: "Set up and read analytics for sites and apps: tracking plans, GA4 and GTM, Plausible, PostHog, Mixpanel, Firebase, consent and privacy (DPDP, GDPR), UTMs, conversion goals, event QA, dashboards, funnels, retention, A/B results. Use when asked to track, measure, add analytics, fix numbers or explain traffic. Not for rankings and indexing (lll:seo) or campaign ideas (lll:marketing)."
metadata:
  origin: lll
---

# Analytics

Sets up measurement that answers real decisions, with consent and privacy built in, and reads the numbers honestly. Delivers a tracking plan, working instrumentation guidance, checked events, dashboards, and plain-language readings with their uncertainty.

## When to use

- "Add analytics", "track signups", "set up GA4 / GTM / Plausible / PostHog / Mixpanel / Firebase".
- A tracking plan, event names, properties, conversion goals, funnels, UTM rules, campaign links.
- Cookie banner, consent mode, DPDP or GDPR for tracking, IP anonymisation, what is allowed in events.
- "Are my events firing?", numbers that look wrong, traffic dropped, conversions do not match orders.
- Reading data: funnel drop-offs, retention and cohorts, attribution, A/B test results, sample-size questions.
- Dashboards and weekly KPI views; turning numbers into a decision list.
- Reading Search Console or GA4 numbers (clicks, sessions, engagement, channels).

## When not to use

- Fixing why pages do not rank or index, schema, sitemaps, Core Web Vitals work: `lll:seo`.
- Campaign plans, content calendars, social posts, ad copy: `lll:marketing`.
- Strategy, market sizing, investor material: `lll:business`. Price tests and packaging: `lll:pricing`.
- Go-live and day 1 / 7 / 14 site checks: `lll:launch` (it verifies analytics fires; this skill designs it).
- LLM quality evals and prompt observability: `lll:ai`. Security review of tracking code: `lll:security`.

## Modes

- **Guidance** (default): advise, review a plan or snippet, read numbers the user pastes or points at, answer inline. Write no files, start no subagents, change no tool settings.
- **Full**: only when the user asks for a complete tracking plan, instrumentation across the codebase, an analytics audit, or a written report. Steps: inventory existing tracking, write the plan file, implement through `lll:build` (or directly if small, in a worktree per `../../shared/fix-phase.md`), QA every event, build the dashboard, write the report. Subagents are allowed: one small-model inventory pass, one strongest-model consent and personal-data review (`../../shared/agents.md`).

## Rules that hold in every answer

1. Decisions first. Write down the 3 to 7 decisions the numbers will drive, then choose events and tools. No event without a question it answers.
2. No personal data in events: no email, phone, name, address, exact location, free text, government IDs, payment details. Use a pseudonymous ID. If a tool needs more, stop and ask the owner.
3. Non-essential tracking waits for consent where the law requires it (EU and UK cookies and similar identifiers, and wherever personal data is processed under India's DPDP Act, notice and consent apply). This skill gives engineering guidance, not legal advice. Privacy policy and consent text go to the owner and counsel.
4. One definition per metric, written down. "Conversion" means one event with one filter.
5. Verify in a debug view before trusting a number. Reconcile with a system of record (orders in the database, payments in the gateway).
6. Always say what the data cannot show: blocked trackers, denied consent, bots, sampling and thresholding, lag, small samples.
7. Association is not cause. Say "moved with", not "caused", unless it was a controlled test.
8. Remote changes need the owner: publishing a GTM container, editing GA4 admin, creating or deleting properties, changing retention, linking ad accounts, rotating keys. Prepare the change; do not make it.
9. Secrets by location only. Public identifiers (GA4 measurement ID, PostHog project key) are public by design. API secrets, service-account keys and write keys with admin scope are not.
10. Reports carry aggregates, never raw user rows.

## Route the request

| The user asks about | Read |
|---|---|
| Events, properties, naming, conversions, identity, tracking-plan files | `references/tracking-plan.md` |
| Which tool to use, how to set one up, client or server side | `references/tools.md` |
| Cookie banner, consent mode, DPDP, GDPR, CCPA, IP handling, app store privacy forms | `references/consent-privacy.md` |
| Code: web frameworks, GTM data layer, mobile, desktop, backend, proxy | `references/implementation.md` |
| UTMs, channels, attribution, referrals, AI-assistant traffic, campaign links | `references/utm-attribution.md` |
| Are events firing, numbers wrong, debug views, test traffic | `references/qa-debugging.md` |
| Reading funnels, retention, cohorts, significance, reporting | `references/reading-numbers.md` |
| A/B tests, hypotheses, prioritising work from data, learning log | `references/experiments-decisions.md` |
| Dashboards, KPI views, alerts | `references/dashboards.md` |
| Search Console and GA4 specifics, store consoles | `references/google-data.md` |

## Steps: setting up measurement

1. **Learn the project.** Follow `../../shared/stack-detect.md`. Find what already tracks: search for `gtag(`, `googletagmanager`, `dataLayer`, `plausible`, `umami`, `posthog`, `mixpanel`, `amplitude`, `segment`, `analytics.track`, `firebase_analytics`, `FirebaseAnalytics`, `static.cloudflareinsights.com`, `_paq`, `fbq(`, `clarity`. Note the platform (web, mobile, desktop, backend), where users are (laws), the consent mechanism, and what the owner can access.
2. **Write the decisions** and the core funnel in one page: acquisition, activation, the money event, retention. For a marketing site that may be "which pages and sources produce enquiries". For an app, "which users reach the first value moment". See `references/tracking-plan.md`.
3. **Choose tools** with `references/tools.md`. Default to the least invasive tool that answers the decisions. Say what was ruled out and why.
4. **Design consent and privacy** before code: what runs without consent, what waits, where choices are stored, what the policy must say (`references/consent-privacy.md`).
5. **Write the tracking plan** as a table or file: event, trigger, parameters, owner, consent category, personal data flag. Lint it: `node scripts/analytics-check.mjs plan plan.json` (or `.csv`).
6. **Implement** with one typed wrapper (`track(event, params)`) that checks consent and is the only place vendor code is called (`references/implementation.md`). Prefer server-side events for money and account actions; client-side for interaction.
7. **Define campaign links.** Naming registry and a link builder; check links with `node scripts/analytics-check.mjs utm <url>`.
8. **QA every event** against the plan with the tool's debug view, then reconcile one day of data with the system of record (`references/qa-debugging.md`). Exclude internal and test traffic.
9. **Build the dashboard** from the decisions, not the available metrics (`references/dashboards.md`). Annotate launch dates and tracking changes.
10. **Hand off.** List owner actions (publish container, set retention, link accounts, update privacy policy) and a review date.

## Steps: reading numbers

1. **Restate the question** and the decision it feeds. If there is none, say so and ask what would change.
2. **Check data quality first**: tracking changes, outages, consent changes, bots, filters, thresholding, lag, unassigned and (not set) rows (`references/reading-numbers.md`).
3. **Compare like with like**: same weekday mix, same segment definition, same period length, seasonality, campaigns running.
4. **Size the evidence.** Show counts beside rates. Use `node scripts/analytics-check.mjs ab --a n,x --b n,x` for two-arm comparisons and `sample` to plan tests.
5. **Explain with a ranked list of causes**, the evidence for each, and the cheapest check that would separate them. Mark confidence.
6. **End with actions**: decision, owner, metric, threshold, date to re-check (`references/experiments-decisions.md`). Charts: use the `dataviz` skill.

## Tools and data

| Source | Use |
|---|---|
| `scripts/analytics-check.mjs` (Node 18+) | tracking-plan lint, UTM lint, sample size, A/B maths. Self-test: `node scripts/analytics-check.mjs --selftest` |
| Search Console MCP (`mcp__gsc__*`) | search clicks, impressions, queries, pages, index status. Read tools only; `submit_sitemap` and site changes need the owner |
| Exports the user pastes or attaches (CSV, screenshots) | the usual route for GA4, PostHog, Mixpanel, store consoles when no connector exists |
| Browser skills (`chrome-browser`, `built-in-browser`) | watch network calls and the data layer on a live page; sign-ins are the user's |
| `dataviz`, artifact tools | charts and a shareable dashboard page |
| Vendor admin or write APIs | owner approval each time |

If no analytics export is available, say that no numbers were read and give the plan and the questions to ask instead of inventing figures.

## Output

- **Guidance**: a short answer with the recommended event, tool or reading, the caveats, and the next action.
- **Full**: `docs/analytics/tracking-plan.md` (or the project's docs location), instrumentation on a branch, the QA matrix with observed results, dashboard spec or page, `docs/audits/<YYYY-MM-DD>-analytics.md` per `../../shared/report.md` when an audit was done, and an owner-actions list.
