# Discovery questions

Ask only what moves the estimate by more than about 20 percent, in one batch. Everything unanswered becomes a written assumption. A short brief with five open questions is a sign to sell a paid discovery step first.

## Always

1. What outcome should exist at the end, and how will you know it worked? (one sentence)
2. Who uses it, roughly how many, and what do they do first?
3. What is the deadline, and what is fixed about it (launch event, season, funding date)?
4. What is the budget range or ceiling? (A ceiling changes what we propose, not only the price.)
5. Who approves work for you? One person, named. Who supplies content, and by when?
6. What exists already: a site, an app, a design, a brand, a codebase, accounts, data?
7. What must integrate: payments, email, CRM, ERP, accounting, SMS or WhatsApp, maps, identity, analytics?
8. Who owns the domain, hosting and store accounts today?
9. Anything regulated or sensitive: payments, health, children, personal data, a sector regulator?
10. What would you cut first if the budget were 30 percent lower?

## By engagement type

| Type | Extra questions |
|---|---|
| New build | competitors or references you like; must-have against nice-to-have; admin needs (who edits what); languages; launch plan and marketing dependency |
| Feature on an existing product | repo access and who knows the code; tests and CI; release process; how users get the change; what must not break |
| Takeover and stabilise | known bugs and incidents; backups and environments; who built it and are they reachable; secrets and accounts in whose name; hosting costs |
| Audit or review | what decision does it feed; scope of systems; permission to test; deadline for findings |
| Retainer | hours or deliverables per month; response time expectation; out-of-hours cover; what counts as in scope |
| Change request | what changed against the signed scope; effect on the deadline; who asked |

## By platform

| Platform | Questions |
|---|---|
| Website | pages and templates; who writes copy; CMS needs; forms and where leads go; analytics and consent; SEO migration and redirects if replacing a site; accessibility target |
| Web app | roles and permissions; data volume; imports and exports; reports; audit trail; multi-tenant; browsers supported |
| Online store | product count and variants; payment methods and countries; shipping and tax rules; inventory source; returns; marketplace feeds |
| Mobile app | iOS, Android or both; minimum OS; offline need; push; in-app purchases; camera, location, sensors; store accounts; analytics and crash reporting; app review risks |
| Desktop | operating systems; offline; auto-update; code-signing certificates; file access |
| Backend or API | consumers; expected load; uptime expectation; data retention; third-party limits; hosting preference; observability |
| AI feature (`lll:ai`; model prices via the `claude-api` skill) | data sources; accuracy bar and who checks it; privacy of inputs; cost ceiling per use; fallback when the model is wrong (`lll:ai`) |

## Questions to ask about a repo (after a quick map)

- Which parts do you want changed, and which must stay untouched?
- Is there a staging environment, and who can deploy?
- Are the tests trusted? Which areas have bitten you before?
- Which accounts, keys and third-party services does it depend on, and who holds them?
- Is there a release window or a freeze?

## Turning answers into scope

- Each answer is either a deliverable, an acceptance criterion, an assumption or an exclusion. Write which.
- A "maybe" is an optional line with its own price.
- If the budget ceiling is below the likely estimate, offer two options: a smaller scope at the ceiling, and the full scope at the real price. Do not squeeze the full scope into the ceiling by cutting QA or handover.
- Record the date of each answer and who gave it; the proposal's assumptions cite them.
