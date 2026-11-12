# Estimation method

How to size work so the number survives contact with the project. The script (`../scripts/estimate.mjs`) does the arithmetic; this file is the judgement that goes in.

## 1. Estimate deliverables, not hours of activity

A deliverable is something the client can see, try and accept: "catalogue with search and filters", not "build product API". Size the deliverable end to end (design, build, test, deploy), then list the tasks only where they carry risk or where two people split the work. Tasks that add up to more than the deliverable's range mean the range is wrong, not the tasks.

Split a deliverable when its worst case is more than three times its best case, when two people could do halves in parallel, or when part of it is unknown. The script flags wide ranges for exactly this reason.

## 2. Three points per item

| Point | Meaning | Check |
|---|---|---|
| Best | everything goes right, no surprises, someone who has done it before | has this ever happened? if not, raise it |
| Likely | the usual path with the usual friction | the number you would bet on |
| Worst | not the disaster, the bad-but-plausible case (about 1 in 10) | what has to go wrong, written in one line |

Units are ideal working days for one competent person on the stack: focused, no meetings, no waiting. Do not pad inside the item; padding hides in three places and nobody can defend it. The script adds PM, QA and review overhead once, and a statistical buffer through p80.

The script's maths: expected = (best + 4 likely + worst) / 6; spread = (worst - best) / 6; project spread combines items as the square root of the sum of squares; p80 = expected + 0.84 spread. Items are treated as independent. When risks are shared (one vendor API behind five items), the real spread is wider than the script shows: say so, or model the shared unknown as its own item.

## 3. Reference classes beat intuition

Before sizing, look for a similar finished project: earlier estimate sheets, the git history of a comparable build, the playbook's catalogue service. Compare actual against estimate if the data exists. State the reference ("similar to the clinic site, which took 14 days against 10 estimated") and adjust for differences. If you have no reference, say so; the confidence is lower.

Starting ranges per kind of work are in the sizing-anchors reference. They are starting points, not rates. Replace them with your own actuals as the data arrives.

## 4. Multipliers for unknowns (apply once, at item level)

| Condition | Multiply the item by | Better move |
|---|---|---|
| Third-party API with poor docs, no sandbox, or partner approval needed | 1.5 to 2 | paid spike first, or exclude until access exists |
| Inherited code with no tests and no docs | 1.3 to 1.6 on every item that touches it | onboarding pass (`lll:onboard`) priced as discovery |
| Vague requirements ("like Uber but for X") | 1.5 to 2, or do not quote | sell a paid discovery that produces the spec |
| Stack new to the team | 1.3 | pick the stack the team knows unless the client insists |
| Payments, health, children's data, regulated domain | add compliance work as its own items | do not hide it inside a feature |
| Accessibility to AA on a custom UI | +10 to 25% on UI items | agree the standard in writing |
| Several languages or right-to-left | +15 to 30% on UI and content items | per extra language, priced separately |
| Client-supplied content or assets | add a delay assumption, not effort | content due date in the timeline |
| Data migration from a legacy system | 5 to 25 days depending on mess | sample the data before pricing |
| Performance targets with numbers | add a measurement item | agree the test setup |

Do not stack three multipliers on one item without saying why; two usually mean the item should be split.

## 5. Work people forget

Discovery and kickoff, design and revisions, copy and content handling, environment and CI setup, domain, DNS and email setup, analytics and consent, QA on real devices and browsers, accessibility pass, performance pass, security basics, deployment and rollback, data seeding, admin tooling, documentation, handover and training, the bug window after launch, store listing assets and review rounds, project communication and weekly updates, waiting for client feedback. List them in the sheet even when small, so a client cutting scope sees what they are cutting.

## 6. Overhead and capacity

- PM, QA and review overhead are fractions of build effort (typical starting points: PM 8 to 15 percent, QA 15 to 25, review 5 to 10; calibrate to your own history). The script applies them to every item.
- Calendar time is effort divided by people times focus. One person on one project is rarely above 70 percent focus once meetings, support and context switching are counted. Use what the team really delivers.
- Client turnaround is calendar time with no effort. Add it per milestone. A project can be 20 days of work and 9 weeks long.
- Team constraints and holidays belong to the owner's calendar; ask for blackout dates.

## 7. Confidence and communication

State confidence next to the number:

| Confidence | When | How to quote |
|---|---|---|
| High | reference class exists, requirements clear, no open unknowns | fixed price at p80 |
| Medium | some unknowns with a plan | fixed price for clear parts, estimated or capped for the rest |
| Low | vague or unknown-heavy | paid discovery first, or time-and-materials with a cap |

Fixed price is a transfer of risk. Charge for it, and only for a scope you can write down with acceptance criteria. Anything not written is a change request.

## 8. Re-estimate

Re-run the sheet when: scope changes, a spike returns, an assumption turns out false, or a milestone finishes more than 25 percent off. Keep the old sheet; the difference is how you learn. After delivery, record actual days against the estimate in the sheet so the next one has a reference class.

## 9. Anti-patterns

- One number with no range.
- Estimating from the technology ("a React app") instead of the outcomes.
- Padding every line, then being unable to explain the total.
- Counting build days only and quoting calendar time as if the client replies instantly.
- Pricing a deliverable that has an unanswered question beside it.
- Letting a discount silently remove a deliverable's QA or handover.
- Copying last project's total because the pages look the same.
- Quoting a fixed price for work whose only description is a mood.
