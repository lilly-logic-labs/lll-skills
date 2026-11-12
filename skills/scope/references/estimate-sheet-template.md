# Estimate sheet (internal)

File: `estimate-internal.md` with its input `estimate.json` in the scope folder. Never share it with the client and never write it into a repository the client owns. It is the working proof for the proposal.

## Script input (`estimate.json`)

Run `node scripts/estimate.mjs --example` for a sheet to start from, then `node scripts/estimate.mjs estimate.json` (or pipe with `-`). Use `--json` for machine output.

| Key | Meaning |
|---|---|
| `project`, `currency` | labels |
| `rate` | sell rate per day; if absent, items need `price` |
| `costRate` | internal cost per day, optional; enables margin and below-cost flags |
| `hoursPerDay` | for the hours line |
| `team` | `people`, `focus` (0 to 1, realistic 0.6 to 0.75), `daysPerWeek` |
| `overhead` | fractions on build effort: `pm`, `qa`, `review` (0.1 means 10 percent) |
| `clientTurnaroundDays` | calendar days added per milestone for approvals |
| `items[]` | `id`, `name`, `milestone`, `best`, `likely`, `worst` (days), optional `risk` (low, medium, high), `unknowns[]`, `price` (a fixed price from the rate card overrides effort times rate) |

The script rejects `best > likely > worst`, missing values and overhead given as 10 instead of 0.1. It flags: worst more than three times best, high risk with open unknowns, and fixed prices that imply a day rate under the cost rate or under 60 percent of the sell rate.

## Document layout

```markdown
# Estimate: <project> (<YYYY-MM-DD>)   Status: draft | reviewed | sent | signed

Owner: <who approves>   Prepared by: <name>   Rate card: <file, date, currency, tax>
Confidence: high | medium | low   Why: <reference class, unknowns>
Basis: fixed | estimated with cap | time and materials

## 1. Ask in outcomes
<restated brief, one paragraph; what the client said versus what we understood>

## 2. Result
| | Days (loaded) | Hours | Price |
|---|---|---|---|
| Expected | | | |
| p80 (basis for fixed price) | | | |
| Worst (sum) | | | |
Timeline: <weeks at p80>; milestones: <table from the script>
Margin at cost rate: <%> (if given)

## 3. Items
<table from the script, plus a "source" column: anchor row used, multiplier applied and why, reference project>

## 4. Spikes and discovery
| Unknown | Spike | Days | Result needed by | Effect if it fails |
|---|---|---|---|---|

## 5. Risk, assumption and question register
| Id | Type (risk, assumption, question, exclusion) | Text | Effect on days or price | Owner of the answer | Due | Status |
|---|---|---|---|---|---|---|
| R1 | risk | payment provider approval slow | +5 days, slips launch | client | day 3 | open |

## 6. Sensitivity
What moves the number most: top three drivers, with the total if each goes to its worst case. Which one would you buy down first, and how.

## 7. Rate-card mapping
| Deliverable | Catalogue service | Catalogue price | Effort-based price | Quoted | Reason for the gap |
|---|---|---|---|---|---|

## 8. Capacity and calendar
Who does the work, their other commitments, blackout dates, third-party lead times (store review, domain transfer, provider approval, email warm-up).

## 9. Review notes
Findings from the fresh-eyes review (missing items, optimistic bests, hidden dependencies, totals), each marked fixed, kept (with reason) or open.

## 10. Change log (after sign-off)
| Date | Change | Asked by | Effect on days | Effect on price | Effect on date | Approved |
|---|---|---|---|---|---|---|

## 11. Actuals (after delivery)
| Item | Estimated (likely) | Actual days | Note |
|---|---|---|---|
Lesson for the anchors: <one line>
```

## Plan changes without losing the audit trail

When scope moves after sign-off, edit the plan with one of these operations and log it in section 10 with the effect:

| Operation | Use when |
|---|---|
| Split | a deliverable proved bigger than one milestone |
| Insert | new work appears (usually a change request with its own price) |
| Skip | the client drops it; keep the row, mark it skipped, adjust the price by the rate card's rule |
| Reorder | a dependency or a client delay moves things |
| Abandon | the work stops; settle per the contract |

Each step is stated so that a fresh person could continue from it without the conversation: what it delivers, what it needs, how to check it is done.

## Fresh-eyes review brief (paste into the reviewer, which has not seen the reasoning)

```
Goal: attack this estimate. List what is missing, what is optimistic, what is double counted,
which assumptions are really risks, and where the totals or dates do not add up.
Inputs: the brief, estimate.json, the script output, the proposal draft. Nothing else.
Rules: no edits; for each point give the item id, the evidence and a suggested change.
Ground rules to respect: client data stays inside approved tools; no prices invented.
Output: a numbered list, then a line "items reviewed: <n>; not reviewed: <ids or none>".
```

Use a strong model for this review (`../../../shared/agents.md`: ambiguous judgement work). Treat its list as leads; apply the ones you can defend.
