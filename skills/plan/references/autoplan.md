# Autoplan: all lenses in sequence, auto-decided

Use when the user says "autoplan", "review everything", "run all the reviews" or wants one pass without being asked at every step. The questions are answered by principles; only genuine judgment calls reach the user, once, at the end. Full mode.

## Sequence

Strict order, one phase active at a time. The engineering lens always runs last so it reviews the plan as amended by the others.

1. **Intake.** Record a restore point (copy the plan to a scratch file or note the commit). Read the plan, the spec, `CLAUDE.md`, recent `git log`. Detect scope:
   - UI scope (screens, components, flows)? Then the design lens runs.
   - Developer-facing scope (API, CLI, SDK, docs)? Then add a developer-experience pass: time to first success, error messages, docs, naming, copy-paste examples.
2. **Product lens** (the product and scope lens file named in step 8 of the skill).
3. **Design lens** (its file named in step 8), only if UI scope.
4. **Engineering lens** (its file named in step 8), always.
5. **Pre-gate check.** Every phase produced its outputs (below). Produce missing ones before the gate; allow two repair attempts, then list what is incomplete.
6. **Final gate.** Present once. Apply the answers. At most three revise cycles.

Run each lens at its full depth; auto-deciding replaces the user's answers, never the analysis. A section with no findings still gets one or two lines on what was examined.

## Six decision principles

1. **Completeness.** Pick the approach that covers more of the requirement (tests, edge cases, error paths).
2. **Fix the blast radius.** Fix what the plan touches plus its direct importers when it is small (fewer than five files, no new infrastructure).
3. **Pragmatic.** Two options fix the same thing: take the cleaner one quickly.
4. **Do not duplicate.** Reuse what exists.
5. **Explicit over clever.** Ten obvious lines beat a two-hundred-line abstraction.
6. **Bias to action.** Flag concerns, do not stall.

Tiebreakers: product lens favours 1 and 2; design lens favours 5 and 1; engineering lens favours 5 and 3.

## Classify each decision

- **Mechanical:** one clearly right answer. Decide silently. Log it.
- **Taste:** reasonable people could disagree (two close approaches, borderline scope, a second reviewer disagrees with a valid point). Decide with the recommended option and surface it at the final gate.
- **User challenge:** the review would change the user's stated direction (merge, split, add or remove a feature or workflow, reverse an earlier decision). Never auto-decide. Present at the gate: what they said, what you propose, why, what you might be missing, the cost if you are wrong. Their direction stands until they approve.

## Audit trail

Append one row to the plan after every auto-decision.

```markdown
## Decision audit trail
| # | Phase | Decision | Class | Principle | Rationale | Rejected alternative |
|---|---|---|---|---|---|---|
```

## Required outputs per phase

| Phase | Must exist |
|---|---|
| Product | premise statements with evidence; findings or "examined, none" per section; failure honesty table; Not in scope; What already exists; dream state delta |
| Design | a score for every pass; decided gaps; state table; unresolved decisions |
| Engineering | scope challenge with receipts; architecture diagram; coverage diagram; test list added to the plan; Not in scope; What already exists; failure modes registry with critical gaps; parallelisation note |

## Final gate

One message, one page:

1. Plan summary, one to three sentences.
2. Counts: decisions made, how many auto, how many taste, how many user challenges.
3. Each user challenge, with the five facts above.
4. Each taste decision with the principle and what the alternative would change.
5. Cross-phase themes: concerns raised in two or more lenses, or "none".
6. Deferred items.
7. Options: approve as is (recommended when no user challenge is open), approve with overrides, discuss, revise, reject.

An override of one decision re-runs the phases it affects, and the engineering lens runs again after them. Cap at three cycles. Approval is recorded in the plan header (`Status: approved <date>`).

A security or data-loss finding outside the plan's scope is reported at the top of the gate message, not buried in the audit trail.
