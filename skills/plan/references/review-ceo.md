# Product and scope lens ("CEO review")

Challenge whether the plan solves the right problem at the right size. Review only: change no code, and change the plan only for decisions the user approves, one at a time.

## Prime directives

1. Every failure must surface to the system, the team and the user. Zero silent failures.
2. Name each error's class, trigger, handler, what the user sees and the test that proves it. Flag catch-alls.
3. Trace four paths for every new flow: happy, nil (input missing), empty (present but zero-length), upstream error.
4. Map the human edge cases: double click, back button, slow link, stale page, retry after timeout.
5. Dashboards, alerts and runbooks for a new feature are launch scope, not follow-ups.
6. New flows, state machines and pipelines get a diagram.
7. Every deferral is recorded (TODOS file, issue or the plan's "Not in scope"), never dropped.
8. Optimise for the six-month future. Say when today's choice makes it worse.
9. If the plan should be thrown away for something better, say so with the alternative.

## Step 0: scope challenge

0A. **Premise.** Name the real problem, the target outcome and the cost of doing nothing. Does the plan solve the pain or a proxy for it? List each factual claim in the plan as verified (cite `path:line` or a command) or unverified.

0B. **Existing leverage.** Map each sub-problem to code, services or dependencies that already do part of it. For any rebuild, say why refactoring the existing path is worse.

0C. **Dream state.** One block:

```
CURRENT STATE            THIS PLAN                 12-MONTH IDEAL
<describe>      --->     <delta this plan makes>   --->   <target>
```
Does the plan move toward the ideal, sideways, or away?

0D. **Alternatives.** If an approach is still undecided: A) the plan as written, B) the smallest alternative that meets the goal, C) a larger or rewrite option only with evidence. One question at a time, recommended option first, effort S/M/L/XL and risk for each.

0E. **Pick the posture.** Recommend one, let the user override:

| Posture | When | Behaviour |
|---|---|---|
| Expansion | greenfield, "go big" | Describe the platonic ideal and a 10x version for 2x effort. Propose each addition separately. |
| Selective expansion | added capability | Hold the scope, then offer expansions one by one with effort, risk and payoff. |
| Hold scope | fix or refactor, scope is right | Make it bulletproof: failure paths, edge cases, tests, observability. Cut nothing, add nothing. |
| Reduction | more than about 15 changed files, or a tangle of goals | Find the minimum that achieves the goal. Everything else deferred with approval. |

A posture approves no change. Each addition or cut is its own decision: add to scope, defer with a recorded reason, or skip.

0F. **Expansion framing** (expansion postures only). Per candidate: the felt user experience first, then shape, effort, risk, payoff. List at least five adjacent small improvements ("thirty-minute delighters") and let the user pick. Keep rejected ones in "Not in scope".

0G. **Hold checks** (hold and reduction). More than 8 files or more than 2 new classes or services: challenge whether fewer moving parts reach the same goal. Find the minimum change set. Flag work that can be deferred without blocking the goal.

0H. **Temporal interrogation** (all but reduction). Ask what an implementer will wish had been decided: at hour 1 (naming, ownership of state), hour 4 (the integration that does not match), hour 8 (the edge case nobody listed), hour 16 (what to ship first when time runs out). Write the answers into the plan as decisions.

## Product review sections

For each, report findings (with a failure scenario) or one or two lines on what was examined and why nothing was found. Ask decisions one at a time.

1. **User value.** Who benefits, what changes for them, how success is observed. Is the first-run path the best path? What does the user see in each state (loading, empty, error, success, partial)? For UI-heavy plans run the design lens afterwards (step 8 of the skill).
2. **Failure honesty.** For each new capability that can fail: what the user sees, what the team sees, how it is recovered. Table: `CAPABILITY | FAILURE | USER SEES | TEAM SEES | RECOVERY`. A row with "nothing" is a critical gap.
3. **Trust and safety, at the product level.** New data collected, who can see or change what, abuse cases, consent and legal exposure. Deep technical security belongs to the eng lens and `lll:security`.
4. **Operations as scope.** Metrics that say it works and that it is broken, alerts, dashboards, a runbook line per new failure mode, who is on the hook.
5. **Rollout and reversibility.** Flag or staged rollout? Rollback path and time? One-way doors (data deleted, emails sent, prices changed, public API shape) get explicit owner approval.
6. **Long-term trajectory.** Debt introduced (code, operational, test, doc), path dependency, knowledge concentration, reversibility from 1 (one-way door) to 5 (trivial to undo), and the twelve-month question: will a new engineer find this obvious?
7. **Distribution.** For a new artifact, how users get it and how it updates. Out of scope is fine if written down.

## Outputs

Add these to the plan under a `## Product review` heading, only after the user has settled each decision:

- **Not in scope:** considered, deferred, with a one-line reason and the trigger that would bring it back.
- **What already exists:** the reusable pieces and whether the plan reuses or rebuilds each.
- **Dream state delta:** the block from 0C, updated.
- **Failure honesty table** from section 2.
- **Accepted scope changes:** each with who approved it.
- **Unresolved decisions:** each with options and the cost of leaving it open.
- **Verdict:** proceed, proceed after named changes, or rework, with the single biggest risk.

Business strategy, market and pricing questions that surface go to `lll:business` and `lll:pricing`; note them and move on.
