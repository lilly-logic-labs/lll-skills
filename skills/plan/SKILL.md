---
name: plan
description: Turn an idea into an approved design and a task-by-task implementation plan, or review a plan before building. Use when asked to brainstorm, spec, design a feature, "how should we build X", "write the plan", "poke holes in this plan", or CEO, eng or design review. Not for strategy (lll:business), quotes (lll:scope) or executing a plan (lll:build).
metadata:
  origin: lll
---

# Plan

Turns a vague request into an approved design, then into a plan an engineer who has never seen the codebase can execute.
Also challenges an existing plan through product, engineering and design lenses before any code is written.

## When to use

- The request is new behaviour, a feature, an integration, a rewrite or anything with open questions.
- The user asks for a spec, design doc, implementation plan, task breakdown or "how would you build X".
- The user has a plan or spec and wants it challenged: scope (product lens), architecture and tests (eng lens), UX gaps (design lens), or all three in order (autoplan).
- A multi-step job is about to start and no plan exists yet.

## When not to use

- Everything needed is already in the request and the change is small: build it with `lll:build`.
- Market sizing, strategy, positioning, investor material: `lll:business`. Prices: `lll:pricing`.
- Executing an approved plan: `lll:build`.
- Cause of a failure unknown: `lll:debug`.
- Learning an unfamiliar repo or pricing a client job: `lll:onboard`, `lll:scope`.

## Modes

- **Guidance** (default). Interview, compare approaches, state the design and a plan outline in chat, or give a review verdict in chat. Write no files, start no subagents.
- **Full**. Only when the user asks for a written spec, a written plan, "write it up", a full review or autoplan. Write the spec and plan files, run the builder check, run the lens reviews. Subagent use follows `../../shared/agents.md`.

Both modes follow `../../shared/ground-rules.md` and learn the project with `../../shared/stack-detect.md`.

## Hard gate

Nothing is built until the user approves the design: in chat for a small change, in the written document for a project.
Building means product code, scaffolding, installing dependencies or starting an implementation skill.
Reading, searching and throwaway spikes the user said yes to are fine. Keeping a spike is a new request that returns to this gate.

## Steps

1. **Size the work.** Say the size in plain words; the user may override it. If it grows mid-task, stop and step up a size.

   | Size | Design | Next |
   |---|---|---|
   | Quick, clear task | the request itself | do it (`lll:build`), say what you did |
   | Small change | agreed in chat | build it |
   | Project | written spec | written plan, then `lll:build` |

   Several independent projects in one request: agree an order and plan them one at a time.

2. **Learn before asking.** Run `../../shared/stack-detect.md` steps 1 to 4. Read `CLAUDE.md`, the README, recent `git log --oneline -30`, ADRs and any existing plan folder. Grep for code that already does part of the job. Never ask a question the repo can answer.

3. **Brainstorm.** Open with one line: the user may skip the questions and say "just build it". If they do, state any significant how-it-gets-made choice (platform, language, medium) in one line and go to `lll:build`.
   - One question per message, one sentence, no list of examples hanging off it.
   - Intent unknown: ask an open question anchored in a real moment ("What happens today when this goes wrong?").
   - A discrete choice: ask with the host's structured question tool if it has one (Claude Code: AskUserQuestion), 2 to 4 options, the recommended option first and labelled "(Recommended)" with a one-line reason. Otherwise ask in plain text in the same shape.
   - Prefer a guess they can correct to a question they must compose.
   - Every three answers, play back what you understood in 200 to 300 words. Mark your own guesses as guesses. End with "what is wrong or missing?".
   - Cover goals, non-goals, anti-goals (what would make it a failure even if it works), constraints, current state, prior art, who uses it, how success is measured. Question bank: `references/brainstorm.md`.
   - Offer to look (code, files, web) when it would settle a question. They decide.
   - A quick throwaway build is often the cheapest way to learn. Offer a spike when words are not converging.

4. **Challenge the premise, then compare approaches.**
   - Is this the right problem? What happens if we do nothing? What in the repo already solves part of it? How will users get it (distribution)?
   - Present 2 or 3 approaches: a minimal one (fewest files, ships first), an ideal one (best long-term shape), optionally a lateral one. Per approach: summary, effort S/M/L/XL, risk, what it reuses, 2 pros, 1 con.
   - Recommend one with a "because" tied to the user's stated goal. Prefer the approach that covers the whole requirement (tests, edge cases, error paths) over a 90% shortcut, and among equal coverage the smaller diff.
   - Wait for the choice. A recommendation written in prose and acted on is the failure this gate prevents.

5. **Agree the design.** Small change: one chat message with what changes, what does not, and how it is verified. Project: write the spec (step 6). Calls you made for the user are labelled "my call", never "agreed".

6. **Write the spec** (Full mode). Template, location rules and the builder check: `references/spec-template.md`.
   Save under the project's plan folder (`docs/plans/` if none exists), name `YYYY-MM-DD-<topic>-design.md`.
   Run the builder check: a fresh subagent (or you, cold) reads only the spec and lists the questions it would need answered before planning. Settle answered ones from the repo, decide minor ones and mark them "my call", bring the user-only ones in one message, once.

7. **Write the plan** (Full mode). Template and rules: `references/plan-template.md`.
   - Map files first: which exist, which are new, one responsibility each.
   - Tasks are the smallest unit with its own test cycle and a reviewable deliverable. Each has Files, Interfaces (consumes and produces, exact names), and steps.
   - Steps are one action with a checkable result: write the failing test, run it and see it fail, implement, run and see it pass, commit. Code steps give signature, file and pinned values; test steps give name and assertions; verification steps give command and expected output.
   - No placeholders ("TBD", "handle edge cases", "add appropriate validation"). A plan longer than the code it describes has written the code.
   - Self-review: spec coverage, step scan, type and name consistency across tasks, review-focus tests, proportion.
   - Run `node scripts/plan-lint.mjs <plan.md>` and fix what it reports.

8. **Review the plan when asked** (or in Full mode before handoff for a project). Pick the lens, read its reference, then run it:
   - Product and scope: `references/review-ceo.md`
   - Architecture, data flow, errors, tests, performance, rollout: `references/review-eng.md`
   - UX and interaction gaps, only if the plan has UI: `references/review-design.md`
   - All lenses in sequence with auto-decisions and one final gate ("autoplan", "review everything"): `references/autoplan.md`
   Findings need a failure scenario; without one they are questions. Ask for decisions one at a time, recommendation first. Never batch. Never edit code in a plan review.

9. **Hand off.** Link the plan and ask for the execution choice with a recommendation:
   - inline (`lll:build`, one context, one fresh reviewer at the end): cheaper, fits tightly coupled or short plans;
   - subagents (`lll:build`, fresh implementer and two reviews per task): fits long plans with independent tasks or high cost of a mistake.

## Red flags

| Thought | Reality |
|---|---|
| "I will offer options to save them effort" | Options steer. Ask them to describe it first when intent is unknown. |
| "I will fill in sensible defaults" | Fine. Say them out loud, labelled as your call. |
| "They said sounds good to the idea" | Approval covers what was shown. An unwritten design is not approved. |
| "The spike works, I will keep building on it" | Keeping it is a new request through the gate. |
| "I will write the plan quickly and refine in code" | A plan with gaps moves the decisions to the implementer, who has least context. |
| "Review found nothing, so skip the diagrams" | "No issues" needs one or two lines on what was examined. |

## Output

- Guidance: the agreed design or review verdict in chat, plus the next step.
- Full: spec path, plan path, lint result, review verdicts with open decisions listed, and the recommended execution choice.
- Never claims a file was saved without reading it back.
