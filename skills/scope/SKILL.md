---
name: scope
description: "Estimate and propose client work from a repo or a brief: deliverables, ranges, assumptions, risks, rate-card price, timeline, a client-ready proposal and an internal estimate. Use when asked to quote, estimate, size a job, write a proposal or SOW, or say how long or how much. Not for pricing models (lll:pricing), strategy (lll:business), feature design (lll:plan) or learning a repo (lll:onboard)."
metadata:
  origin: lll
---

# Scope

Turns a brief or a repo into an honest estimate and, on request, a proposal the client can sign: deliverables with acceptance criteria, ranges instead of single numbers, named assumptions and risks, a price from the rate card, a timeline with milestones.
Two documents come out of a full run: the proposal (client-facing) and the estimate sheet (internal). They are never mixed.

## When to use

- "How long will this take", "how much should we quote", "estimate this", "size this", "what's the effort".
- A client brief, call notes or an email thread that needs to become scope, price and dates.
- A proposal, SOW, quote or statement of work; a change request that needs pricing.
- An existing repo someone wants extended, fixed or taken over, and the first question is cost.
- Re-estimating after the scope moved, or checking whether a fixed price still holds.

## When not to use

- Choosing a pricing model, tiers, discounts or willingness to pay for our own product: `lll:pricing`.
- Strategy, market size, competitors, investor material: `lll:business`.
- Learning an unfamiliar codebase without a quote in mind: `lll:onboard` (this skill calls it for a quick map).
- The technical plan or spec once the work is sold: `lll:plan`; building it: `lll:build`.
- Closing out a finished project: `lll:handover`.
- Producing the final Word or PDF file: `anthropic-skills:docx` or `anthropic-skills:pdf` (this skill supplies the content).

## Modes

- **Guidance** (default): answer in chat. Restate the ask in outcomes, list deliverables with ranges, the five biggest assumptions, the three biggest risks and the questions to ask the client. No files, no subagents. Run the maths with `echo '<sheet json>' | node scripts/estimate.mjs -` (sheet on stdin, nothing written; use Git Bash) when there is more than a handful of items.
- **Full**: only when the user asks for a written proposal, a full estimate or an end-to-end run. Writes both documents (see Output), runs a fresh-eyes review of the estimate, and may use subagents (`../../shared/agents.md`). Never sends anything.

Follow `../../shared/ground-rules.md`. Scoping is read-only against the repo. The internal estimate never goes into a repository the client owns or will receive: write it beside the proposal in a folder the owner names (default `../scope-<slug>/` outside a client repo, `docs/scope/<YYYY-MM-DD>-<slug>/` inside our own).

## Rules

1. **Ranges, not points.** Every item has best, likely and worst. A single number hides the risk the client is paying us to carry.
2. **Unknowns are priced or removed.** Each unknown becomes one of: a question for the client, a paid discovery spike, a stated assumption, a contingency line, or an exclusion. None may stay silent.
3. **Rates come from the rate card.** Find it at run time ([rate-card lookup](references/rate-card-lookup.md)): the Lilly Logic Labs price list and services playbook when the company folder is present, else ask the owner. Never invent a price, a discount or a payment term. Quote the figures you read for this client only; do not keep them in notes that outlive the quote, because the rate card changes.
4. **Terms come from the playbook and the contract.** Payment split, revision limits, change-request rule, delays, ownership and warranty are read from the company playbook or the owner. Legal wording is the lawyer's template; this skill points at it.
5. **No promises about outcomes we do not control**: rankings, followers, sales, store approval dates, third-party uptime.
6. **Our client's data is theirs.** Do not paste client material into tools the client has not approved.
7. **The owner approves and sends.** This skill drafts.

## Steps

1. **Intake.** Classify the work: new build, feature on an existing product, takeover and stabilise, audit, retainer, change request. Collect goal, users, platforms, integrations, deadline, budget signal, who approves, who supplies content, accounts and hosting. Use [discovery questions](references/discovery-questions.md); ask in one batch, only what moves the estimate by more than about 20 percent. If the user wants a number now, go ahead and write the assumptions in.
2. **Ground it.** Repo given: run `lll:onboard` in guidance mode (stack, size, tests, debt hot spots); a messy untested codebase raises every item (see multipliers in [estimation method](references/estimation-method.md)). Brief only: restate it as outcomes and list what is missing. Look for similar past work (earlier `docs/scope/` folders, the playbook) to use as a reference class.
3. **Find the rate card.** [Rate-card lookup](references/rate-card-lookup.md). Record which file, its date, currency and whether prices include tax. No rate card: effort in days, and ask for the rate.
4. **Break down.** Deliverables are outcomes the client can see and accept, each with acceptance criteria and a milestone. Include the work people forget: discovery, design, content handling, integrations setup, QA, deploy and DNS, handover, training, project communication, revision rounds, store submission. Mark each deliverable in scope, optional or out of scope.
5. **Size.** For each item give best, likely, worst in ideal days using [sizing anchors](references/sizing-anchors.md) and the method in [estimation method](references/estimation-method.md). Apply the unknown multipliers once, at item level. Put the items in the sheet format from [the estimate template](references/estimate-sheet-template.md) and run `node scripts/estimate.mjs <sheet.json>`. Read its flags: wide ranges want a split or a spike; high risk with open unknowns wants a question; a fixed price below the cost rate wants a decision.
6. **Price.** Match each deliverable to a catalogue service line when one fits (price and delivery time come from the rate card); otherwise effort times rate. Show fixed against estimated lines. Compare the total with what a similar catalogue service costs and explain any gap. Check margin against the cost rate if the owner gave one.
7. **Risks, assumptions, questions.** One register: id, type, text, effect on days or price, owner of the answer, due date. Assumptions are copied into the proposal; risks stay in the sheet unless the client must act on them.
8. **Timeline and milestones.** From the script's schedule, then add the client's turnaround on approvals, content delivery dates, third-party lead times (store review, domain transfer, payment-provider approval, email warm-up), public holidays and any blackout dates the owner names. Tie payments to milestones using the playbook's rule.
9. **Write.** Full mode: the client proposal from [the proposal template](references/proposal-template.md) and the internal sheet from [the estimate template](references/estimate-sheet-template.md). Keep the tone plain and specific. Offer `anthropic-skills:humanizer` for the final prose and `anthropic-skills:docx` or `anthropic-skills:pdf` for the file. If the host can show a private page for review, offer that; do not share it outside the owner.
10. **Review before it leaves.** Full mode: a fresh reviewer (not the author; brief in the estimate template) attacks the estimate: missing deliverables, optimistic bests, hidden dependencies, assumptions that are really risks, totals that do not add up, internal figures leaking into the proposal, promises we cannot keep. Fix what it finds; list what you chose not to fix. In guidance mode, re-check the totals, assumptions and out-of-scope list yourself. Then run the checklist at the end of [the proposal template](references/proposal-template.md).
11. **Track change.** After sign-off, every scope change gets a change-log row (what, who asked, effect on days, price and date). A new feature or direction is a change request with its own price and date, never a silent revision.

## Output

- **Guidance**: chat answer with deliverables and ranges, assumptions, risks, client questions, and the number to quote with the reason. Say which rate card was used or that none was found.
- **Full**: in the chosen folder, `proposal.md` (client-facing), `estimate-internal.md` (ranges, risks, margin, review notes, change log), `estimate.json` (the script input, so the numbers can be reproduced). Chat summary: total range and quoted price, timeline, top three risks, open questions for the client, files written, what was skipped or unverified, and what the owner must do next (approve, send, book the call).
- Hand-offs: the final file via `anthropic-skills:docx` or `pdf`; after a signed yes, `lll:plan`; after delivery, `lll:handover`.
