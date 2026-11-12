# Rate-card lookup

Prices, delivery times, revision limits and terms change. Read them at run time, every time, from the owner's own files. Do not copy figures into this skill, into reusable notes or into a later quote without re-reading the source.

## 1. Find the owner's rate card

1. Read the workspace and project `CLAUDE.md` (and `AGENTS.md`). If they name a rate card, price list, client playbook or services playbook, use those paths.
2. Otherwise look in `.`, `..`, `../..` and `../../..` for a business folder (`company/`, `business/`, `docs/business/`, `docs/pricing/`) and list its files:

```
for d in . .. ../.. ../../..; do for f in company business docs/business docs/pricing; do test -d "$d/$f" && echo "$d/$f"; done; done
```

3. If nothing is found, go to section 5.

## 2. What to read (read only; never edit these files)

| Source | What it usually holds |
|---|---|
| Price list or rate card | service lines, what each includes, "from" prices and currency, delivery times, care plans, bundles |
| Services playbook | per-service delivery checklists and client sheets (what the client must provide) |
| Client playbook or terms | project steps and time limits, communication, revisions, payment split, late payment, cancellation, delays, ownership |
| Price research | why the prices are what they are; background only |

Strip an HTML file to plain text (styles and tags removed):

```
node -e "const t=require('fs').readFileSync(process.argv[1],'utf8').replace(/<style[\s\S]*?<\/style>/g,'').replace(/<[^>]+>/g,' ').replace(/[ \t]+/g,' ').replace(/\n\s*\n+/g,'\n');console.log(t)" <file.html>
```

Ignore files whose names say old, archive or draft (for example a price list marked `-old`). When two files disagree, the newest dated one wins; say which you used and its modified date (`ls -l`, or `git log -1 --format=%cs -- <file>` inside the company repo).

## 3. What to extract

Fill this table in the estimate sheet. Quote only what you read.

| Field | Source | Used for |
|---|---|---|
| Service line name and what it includes | price list | mapping deliverables to the catalogue |
| "From" price, currency, dollar variant, whether tax is included | price list | the price line; say "from" when the card says it |
| Delivery time | price list | the timeline, then add the client's turnaround |
| Free revision rounds per item, paid round price and hours | price list or playbook | the revisions clause |
| Care plan tiers and what each covers | price list | the support section |
| Bundles and discounts, and the conditions | price list | pricing; never invent a discount |
| Payment split by project size, when each part is due | client playbook (money) | payment terms and milestones |
| Quote validity | client playbook (steps) | "valid until" |
| Change requests against revisions | client playbook (revisions) | the change clause |
| Delays, client silence, pause and close rules | client playbook (delays) | assumptions about client turnaround |
| Account and work ownership, retained tools and kits | client playbook (ownership) | ownership section |
| Delivery checklist for the service | services playbook | turning a service into deliverables and acceptance criteria |
| What the client must provide | client sheet | the "what we need from you" section |

If the rate card does not state a field the proposal needs (for example the revision limits), say so and ask the owner; do not borrow a number from another document that calls it a proposed default.

## 4. Map deliverables to service lines

1. List the deliverables from the breakdown.
2. For each, find the catalogue service that covers it. A service covers a deliverable when its included items cover the acceptance criteria. Partial cover: price the catalogue service and add the gap as a separate line.
3. Compare: effort times rate against the catalogue "from" price. If effort says the work is bigger than the catalogue, the catalogue price is the floor and the gap is priced as extra scope; if smaller, quote the catalogue price (do not discount below it without the owner).
4. Items with no catalogue match (custom work, unusual integrations) are priced from the rate-card hourly or day rate for change requests, or ask the owner for the rate.
5. Use the service's playbook checklist as the starting list of deliverables and its client sheet as the "what we need from you" list.
6. Add the care plan as an option, not a default, unless the owner says it is included.

## 5. No rate card found: ask for one

Do not invent one. Ask the owner, in one batch:

- Day or hour rate, by role if it differs; currency; whether quotes include tax.
- Minimum project fee and minimum engagement for retainers.
- Payment split, and what is due before work starts.
- How many revision rounds are free, and the price of extra rounds and change requests.
- Discounts allowed and who approves them.
- Warranty or bug-fix window and any care plan offered.
- Pass-through costs (hosting, licences, ad spend, store fees) and who pays them.
- Margin or cost-rate target, if the owner wants it checked.

Until answered, give effort in days and a conditional price ("at <rate> per day this is <range>") and mark it unconfirmed.

## 6. Honesty checks

- Say which files and dates the figures came from, in the internal sheet.
- Currency and tax: state both on every price line.
- Never present a "from" price as a fixed price.
- If a number in the proposal is not traceable to the rate card, the owner's words or the script's output, remove it.
