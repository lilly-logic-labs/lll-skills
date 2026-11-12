# Founder decisions

For choices with real trade-offs: which market, which model, whether to pivot, whether to take a deal, whether to hire, whether to stop. The output is a one- to two-page memo the owners can decide from. Ideas on premise challenge and alternatives adapted from gstack plan-ceo-review and office-hours (MIT); the wording is this pack's own. Reviewing a feature plan or a spec is `lll:plan`.

## 1. Premise challenge (always first)

Answer in writing, one or two lines each:

1. **Is this the right problem?** Could a different framing give a much simpler or bigger result?
2. **What happens if we do nothing?** Real pain with a cost, or a hypothetical one?
3. **What already exists?** Our own assets, partners, customers, code, content that cover part of it.
4. **Who is the customer and what do they pay today?** The status quo and its cost.
5. **How does it reach customers?** A product without distribution is a hobby. Name the channel, or defer on purpose.
6. **What would we have to believe?** List the three beliefs the whole decision rests on, and mark each fact, estimate or hope.

State the premises as sentences the owners can agree or disagree with. If they disagree, revise and loop.

## 2. Frame the decision

```
Decision:       <the choice, as a question>
Deadline:       <date, and what happens if we miss it>
Decider:        <who>   Consulted: <who>
Reversibility:  two-way door (cheap to undo) | one-way door (costly or impossible to undo)
Criteria:       <3 to 5, weighted: money, time, risk, learning, fit with principles, team energy>
Constraints:    <product principles, founder terms, legal, cash, hours>
```

Two-way doors: decide fast, with one conversation and a time-boxed test. One-way doors: take longer, get a second opinion, write the memo, check with a lawyer or accountant where relevant.

## 3. Options

Always at least two, three when there is a meaningful third.

```
OPTION A: <name>
  Summary:    1-2 sentences
  Effort:     S / M / L / XL (hours or weeks)
  Cost:       money
  Risk:       low / med / high, and what
  Upside:     what it unlocks
  Reuses:     existing assets
  Reversible: yes / partly / no

OPTION B: ...
```

Rules:
- One option is the **minimal** one: smallest effort, ships soonest, learns the most per hour.
- One is the **ideal** one: best long-term position if it works.
- One can be **lateral**: a different framing (partner instead of build, service before product, sell the process not the software).
- "Do nothing" is an option with a cost; include it when the pain is real.
- Ask once: what is the 10-star version, and what is the version at twice today's effort that gets most of it? Put the second in the options.

For a business bet, pick a posture before comparing:

| Posture | Meaning |
|---|---|
| Expand | Go for the bigger version because the upside is large and the evidence supports it |
| Selective | Keep the core, add only the pieces that pass a test |
| Hold | Keep scope, tighten execution, fix failure paths |
| Reduce | Cut to the narrowest paid wedge |

State the posture and why. Cut or add only with the owners' agreement.

## 4. Score

A weighted table beats a gut feeling only if the weights were set before scoring.

| Criterion | Weight | A | B | C |
|---|---|---|---|---|
| ... | % | 1-5 | 1-5 | 1-5 |

Show the total, then check whether the winner survives a change of weights by 20% either way. If the result flips, say the decision is close and pick by reversibility.

## 5. Pre-mortem

Imagine the choice failed in a year. Write the three most likely reasons (people, market, execution, cash, platform, regulation). For each: an early warning sign, who watches it, and a pre-agreed response. Fold the top one into the plan.

## 6. Kill criteria and review date

```
We will stop or change course if, by <date>, <number> is not reached (e.g. 5 paying pilots, 40% week-4 retention, CAC payback under 9 months).
We will review on <date> with <who>.
```

Without a number and a date, a failing project drifts for months.

## 7. Memo template

```
# Decision: <question>      Date: ...   Decider: ...
Recommendation: <option> because <one sentence>.
Why now / deadline:
Premises (and which are facts):
Options considered: A, B, C (table above)
Scores and sensitivity:
Risks and pre-mortem:
What would change our mind:
Kill criteria and review date:
Next action (this week): who, what, by when
Open questions for the owners:
```

## 8. After the decision

- Record the decision and the reason in the project's decision log (ADR folder, `docs/decisions/`, or `docs/business/`). Locked decisions are the spec; later work may say "this is not honoured", not "this is wrong" without raising it with the owners.
- Tell everyone affected the same day.
- Put the review date in a calendar; hold the review.
- If a decision touches the rules files (`CLAUDE.md` rules, product principles), the owner edits them; this skill proposes the wording.

## 9. Common traps

- Deciding by the loudest voice rather than by the criteria written first.
- Treating a hope as a fact in the premises.
- Comparing the best case of one option with the worst case of another.
- Ignoring reversibility.
- Taking investor or peer advice as evidence about your customer.
- Letting sunk cost vote.
- Choosing the ideal option with no first step that fits this month's hours.
