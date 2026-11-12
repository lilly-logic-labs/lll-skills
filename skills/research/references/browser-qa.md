# Browser QA

Walk a live site like a careful user and report what is broken, with evidence. The diff-aware, quick, standard and regression passes are adapted from the gstack `qa` skill (MIT, see `NOTICE`); the checklists and report template are written for this pack.

QA here finds and reports. Fixing is another job: root cause with `lll:debug`, the change with `lll:build`, design opinions with `lll:ui`, search issues with `lll:seo`, go-live readiness with `lll:launch`.

## Scope and permission

1. Target: URL(s) the owner controls or may test. Prefer staging or a preview deployment. Production only with the owner's go-ahead in this conversation, and then read-only.
2. Accounts: test accounts supplied by the owner. Never real customers. Never type credentials into chat or a report.
3. Data: create test data with a recognisable prefix (`qa-<date>-`). List it in the report so the owner can clean it up.
4. Payments: provider test mode only. No real cards.
5. Abuse probes (rate limits, lockouts): at most three requests past the limit, on staging, then stop (`../../../shared/ground-rules.md`).
6. Email, SMS and push triggered by tests go to inboxes the owner controls.

## Pick the pass

| Pass | When | What |
|---|---|---|
| Quick | A few minutes, smoke | Home plus the primary flow, console errors, mobile width |
| Standard | Before release | All main flows, three viewports, forms, links, keyboard basics |
| Diff-aware | On a feature branch | Map changed files to routes and components, test those and their neighbours first |
| Regression | After fixes | Re-run each issue from the previous report and the happy paths around it |

For diff-aware: read `git diff --stat <base>..HEAD`, map files to routes (framework routing conventions, component imports), list affected pages, test them, then do a quick pass elsewhere.

## Checklist per page

- Loads without error; status 200; reasonable title; correct canonical language.
- Console: no errors, no uncaught exceptions, no noisy warnings. Note each unique message once with the page where it appears.
- Network: no 4xx/5xx for first-party assets or API calls; no blocked mixed content; unexpected third-party requests listed.
- Images, fonts and icons render; broken image count; alt text present on informative images.
- Layout at 375, 768 and 1440 widths: no horizontal scroll, no clipped or overlapping content, tap targets usable, sticky bars do not cover content.
- Links: internal links resolve (sample or crawl a limited set); `target="_blank"` links have `rel="noopener"`; no `href="#"` dead ends; external links not broken in the main nav and footer.
- Keyboard: Tab reaches every control in a sensible order; focus is visible; Escape closes dialogs; no keyboard trap.
- Landmarks and headings: one `h1`, logical order, a skip link or landmarks on larger sites.
- Cookie and consent banner: appears where required, choices work, a "reject" choice exists, analytics scripts do not fire before consent where the policy says so (check network).
- 404 and error pages: styled, helpful, correct status code.
- Refresh, back and forward in the middle of a flow behave sensibly.

## Flow testing

For each flow write the steps first, then run them and mark pass or fail:

1. Sign up (valid, duplicate email, weak password, missing fields, double submit).
2. Sign in and out (wrong password message, locked account text, session persists on reload, protected page redirects when signed out).
3. Password reset (email arrives, link works once, expired link handled).
4. Core action of the product (create, edit, delete, undo, search, filter, upload).
5. Checkout or payment in test mode (cart, coupon, failure card, success card, receipt, confirmation page).
6. Forms: empty, invalid, valid, very long text, special characters and emoji, paste, autofill, validation message placement, preserved input after an error, double click on submit.
7. Empty states, loading states, offline or slow network behaviour (throttle).
8. Deep link to an inner page while signed out and while signed in.
9. Settings: change and persist; destructive actions ask for confirmation.
10. Permissions: a user cannot open another user's URL by changing an id. Report suspected access-control gaps to `lll:security` with the exact URL pattern; do not probe further.

Mobile web specifics: 100 vh issues with browser chrome, input zoom on focus under 16 px font, tap delay, safe-area insets, orientation change, sticky headers over anchors.

## Evidence rules

Each issue has: URL, viewport, steps to reproduce (numbered), expected, actual, a screenshot path (and a second one for the state before the action if useful), console or network lines if relevant, severity, and a guess at the layer (UI, API, content, config) labelled as a guess.

Severity (see `../../../shared/findings.md` for definitions):

- critical: data loss, money or legal figures wrong, one user seeing another's data, sign-in or payment impossible for everyone
- high: a core flow fails for common input; privacy leak; the page crashes
- medium: edge-case failure, lost input, broken secondary page, consistent console errors on a core page
- low: cosmetic or minor accessibility defect

A finding needs a failure scenario: "Entering a name with an apostrophe on /signup returns 500 and loses the form" is a finding; "signup feels slow" is a note.

## Health summary

Score each page or flow so progress is visible. Start at 100 per flow and subtract: critical 40, high 20, medium 8, low 2; floor at 0. Report the table, not a single blended number, and keep functional results (pass or fail per flow) separate from the score.

| Flow | Result | Score | Issues |
|---|---|---|---|
| Sign up | fail | 60 | QA-001 (high) |

## Report template

```markdown
# Browser QA: <site> (<YYYY-MM-DD>)
Target: <URL(s)>  Environment: staging | preview | production (read-only)
Pass: quick | standard | diff-aware | regression   Tool: <built-in browser | Chrome | Playwright>
Viewports: 375, 768, 1440   Accounts: <test account names>   Test data created: <prefix and items>

## Summary
- Flows passed <n>, failed <n>, not run <n>
- Issues: critical <n>, high <n>, medium <n>, low <n>

## Issues
### [HIGH] <title>
- Id: qa-<slug>   Lens: bugs | a11y | perf | content
- Location: <URL> @ <viewport>   Screenshot: <path>
- Steps: 1... 2... 3...
- Expected / Actual:
- Evidence: <console or network line>
- Fix: <one line, if obvious>   Confidence: high | medium | low

## Flow results
<table>

## Not covered
<pages, flows, devices, and why>

## Owner actions
<test data to delete, accounts, settings, anything needing a person>
```

Chat summary: counts by severity, the top five issues with URLs, the report path, what was not covered. Do not claim a clean site from a quick pass.

## Handing off

- Cause unknown: `lll:debug` with the reproduction steps.
- Obvious fix: `lll:build`.
- Page speed numbers: `lll:cloudflare` web-perf guide or `lll:seo` technical SEO.
- A broader accessibility audit: `lll:audit` (a11y lens).
- Pre-launch or post-launch checks (DNS, email, legal pages, monitoring): `lll:launch`.
