# Sizing anchors

Starting ranges in ideal working days for one competent developer who knows the stack, build and test only. Design, PM, QA overhead and client waiting are separate (the script adds overhead; milestones add turnaround). Ranges are deliberately wide: they are the best-to-worst band for a typical case, not a price.

These are starting points. Replace them with your own actuals after each project, and say in the sheet which anchors you used. If a row below does not match the work, size from the nearest row and name the difference.

## Websites and landing pages

| Work | Days | Notes |
|---|---|---|
| Landing page, one screen flow, copy supplied | 2 to 5 | forms, analytics hooks, responsive, deployed |
| Brochure site, 5 to 12 pages from a design | 6 to 15 | shared components; CMS excluded |
| CMS or headless content model | +2 to 5 | editor roles, previews, content migration extra |
| Blog or news section | +2 to 4 | listing, post page, feed, tags |
| Contact or lead form with email delivery and spam protection | 0.5 to 1.5 | deliverability setup is its own item (DNS, SPF, DKIM, DMARC) |
| SEO foundation (meta, sitemap, schema, redirects) | 1 to 3 | content and link work excluded |
| Analytics with consent banner | 1 to 3 | per tool; dashboards extra |
| Extra language | +20 to 30% of page work | translation supplied |
| Performance and accessibility pass | 1 to 3 | AA audit and fixes on custom UI can be more |

## Web apps and backends

| Work | Days | Notes |
|---|---|---|
| Project setup, CI, environments, deploy | 1 to 3 | |
| Email and password auth with reset and verification | 3 to 6 | use a provider if the client accepts it |
| Each social login | 1 to 2 | |
| Roles and permissions | 3 to 8 | per-tenant rules push it to the high end |
| One CRUD module with validation and tests | 2 to 5 | list, detail, create, edit, delete |
| Search, filter, sort, pagination on a module | 2 to 5 | full-text engines extra |
| Dashboard with charts | 3 to 8 | per page; data prep may dominate |
| File upload with storage and access control | 2 to 4 | image processing extra |
| Email notifications, transactional | 2 to 4 | templates and queue |
| Reports and CSV or PDF export | 2 to 5 | |
| Admin panel | 8 to 20 | scales with the number of modules |
| Hosted checkout payments | 3 to 6 | refunds, tax, receipts extra |
| Subscriptions, webhooks, invoices, dunning | 8 to 20 | idempotency and reconciliation drive the high end |
| Documented third-party API integration with sandbox | 3 to 8 | each |
| Poorly documented or partner-gated integration | 8 to 25 | use a spike |
| Background jobs, queues, retries | 2 to 5 | |
| Webhook receiver with signature check and idempotency | 1 to 3 | |
| Multi-tenancy retrofit | 10 to 30 | data isolation tests are the cost |
| Data migration from a legacy system | 5 to 25 | sample the data first |
| Observability: logs, error tracking, alerts, health check | 1 to 3 | |
| Infrastructure as code | 3 to 8 | |
| Stabilise an inherited codebase | 3 to 10 | discovery, tests on the riskiest paths, upgrades |

## Online stores

| Work | Days | Notes |
|---|---|---|
| Hosted platform store (theme, catalogue, payments, shipping setup) | 8 to 15 | product data entry excluded |
| Custom store: catalogue, cart, checkout, orders, admin | 25 to 60 | |
| Shipping and tax rules | 3 to 10 | per region group |
| Inventory or ERP sync | 5 to 15 | depends on the other system's API |

## Mobile apps

| Work | Days | Notes |
|---|---|---|
| Cross-platform app shell: navigation, auth, theming, CI | 5 to 10 | Expo or Flutter |
| A simple screen / a complex screen | 0.5 to 1.5 / 2 to 5 | forms, lists, states, error handling |
| Push notifications | 3 to 6 | provider setup, permission flow, deep links |
| Offline storage and sync | 10 to 30 | conflict rules decide it |
| In-app purchases or subscriptions | 5 to 10 | per store policy review time excluded |
| Deep links and share | 1 to 3 | |
| Native module or bridge | 3 to 10 | |
| Store listing, assets, privacy forms, submission, per store | 2 to 4 | review wait is calendar time, not effort |
| Second platform when building native, not cross-platform | 70 to 90% of the first | design shared |

## Desktop

| Work | Days | Notes |
|---|---|---|
| Electron, Tauri or Wails shell with IPC | 3 to 6 | |
| Auto-update and code signing | 3 to 8 | certificates are client-owned and take time |
| Packaging and testing per OS | 2 to 4 | each |

## AI features

| Work | Days | Notes |
|---|---|---|
| LLM feature prototype (prompt, structured output, one tool) | 3 to 8 | `lll:ai`; model choice and prices from the `claude-api` skill, not memory |
| Evals, guardrails and fallbacks for it | +3 to 8 | the accuracy bar and who checks it decide this |
| Retrieval over client documents | 5 to 15 | data cleaning dominates |
| Cost per use and monthly ceiling | 0.5 to 1 | write it into the proposal as a client cost |

## Design, content and delivery

| Work | Days | Notes |
|---|---|---|
| UI design per screen, including revision rounds within the limit | 0.5 to 1.5 | design system first: 3 to 8 |
| Copy and content handling | assumption | client supplies; our work is placing and checking |
| QA | 15 to 25% of build | real devices and browsers, regression |
| PM and communication | 8 to 15% of build | weekly update, calls |
| Domain, DNS, email, SSL, go-live | 1 to 3 | |
| Handover pack and walkthrough | 1 to 2 | `lll:handover` |
| Training session and recording | 0.5 to 1 | |
| Bug window after launch | reserve 5 to 10% of build | include it in the price, even if unused |

## Using the anchors

1. Pick the row, then adjust for this project: more roles, tricky rules, more states, existing design, existing tests.
2. Put the range into best and worst, the likely value near the lower third unless there is a reason, and the reason in the item note.
3. Apply a multiplier from the estimation method once, if an unknown applies.
4. Write the source in the sheet: "anchor: CRUD module 2 to 5, adjusted up for audit trail".

Confidence drops when you size by analogy to a row that only half fits. Say so in the sheet.
