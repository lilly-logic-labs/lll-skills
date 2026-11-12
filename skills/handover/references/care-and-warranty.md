# Care and warranty

Section 11 of the handover doc. Its job is to stop the three most common arguments after a project ends: "is this a bug or a new feature", "how fast will you answer", and "what happens after the free period".

## Read the terms first, do not invent them

Order of authority: the signed contract, then the company playbook and price list (when present in the workspace; read them at run time, see the scope skill's rate-card lookup), then the owner's words. Quote them. Where none says, write `OPEN: <question>` and ask the owner. Never create warranty terms, response times or prices. Legal wording is the lawyer's template.

## Four things that look alike

| Term | What it is | Typical wording to look for |
|---|---|---|
| Warranty or bug window | free fixes for anything that does not work as agreed, for a fixed period after launch or handover | length, start date, what counts as a bug, exclusions |
| Change request | new work, priced and dated before it starts | trigger, who approves, price source |
| Care plan | recurring paid service: monitoring, updates, backups check, small changes | tiers, hours, response time, minimum term, notice period |
| Retainer or support contract | agreed hours or deliverables per month | what carries over, what does not |

## What to write

1. **Bug definition.** Behaviour that differs from the signed scope and its acceptance criteria, on the supported browsers, devices and operating systems listed in the scope. Reproducible by us.
2. **Not a bug.** New features or pages, a change of mind, content errors supplied by the client, effects of changes made by others after handover, third-party service changes or outages, hosting or domain issues in the client's own accounts, newly released browser or OS versions not in the supported list, and misuse.
3. **Window dates.** Start (launch or handover date) and end date as absolute dates. State the rule if the date moves (for example, when handover is delayed by the client).
4. **How to ask.** One channel, one address, what to include (what happened, expected result, steps, screenshot, device and browser, time). One named contact on each side.
5. **Response.** The target for acknowledging and the target for a fix, by severity, taken from the terms. If the terms give no numbers, say "best effort" rather than inventing one.
6. **After the window.** The care plan options with what each covers, the price source and the minimum term, how to start one, and what happens with no plan (changes are priced as change requests, urgent fixes at the stated rate).
7. **Hosting and renewals.** Who watches domain, certificate, hosting and licence renewals after the window, and the dates (also in section 12).
8. **Exit.** How the client ends a care plan, the notice period, and what we hand back (access, documentation, a final backup note).
9. **Knowledge.** Where the documentation lives and where a new developer starts (the onboarding doc if present, the README, this pack).

## Sentence bank

- "Anything that does not work as described in the signed scope, on the supported browsers and devices listed in section 2, is fixed free until <date>."
- "New features, new pages and a change of direction are change requests. We give a written price and date before work starts."
- "Report issues to <address or channel>. Include what you did, what you expected, what happened, and a screenshot."
- "After <date>, support continues under a care plan (<names>) or as priced change requests."

## Severity table for support (adapt to the terms)

| Severity | Meaning | Example |
|---|---|---|
| Critical | service down, data loss, payments or sign-in broken for everyone | checkout returns an error for all users |
| High | a core flow broken for some users, with no workaround | password reset email never arrives |
| Medium | feature broken with a workaround, or a visible defect | filter ignores the date range |
| Low | cosmetic or rare | misaligned icon on one device |

## Checks before sign-off

- The bug window end date is an absolute date and appears in the owner summary.
- Care plan wording matches the rate card; no plan is described as included unless the contract says so.
- The client knows what is not covered and has the reporting address.
- Third-party costs after handover (hosting, licences, API usage) are listed with who pays.
- The recurring work after handover that someone must do is named (renew domain, update dependencies, check backups), with an owner for each.
