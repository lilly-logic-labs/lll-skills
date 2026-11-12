# Spec (design document)

Write a plain document a skilled builder could plan from without coming back to the user. Use for projects (step 6). A small change gets the same content as one chat message.

## Location

1. The project's own convention if documented (`CLAUDE.md`, CONTRIBUTING, existing `docs/specs/`, `docs/rfcs/`, `docs/plans/`).
2. Otherwise `docs/plans/YYYY-MM-DD-<topic>-design.md`.
3. The user's stated preference beats both. Outside a git repo, ask.

## Template

```markdown
# <Topic>: design

Status: draft | approved by <name> on <date>
Plan: <path, filled in when written>

## Why
<The problem in the user's words. Who hits it, how often, what it costs. What happens if nothing is done.>

## Goals
- <Observable outcome, measurable where possible>

## Non-goals
- <Things deliberately left out, each with a one-line reason>

## Anti-goals
- <Outcomes that would make this a failure even if it technically works>

## Constraints
- <Platform, deadline, budget, compliance, team skills, performance budgets. Exact values.>

## Decisions
| Decision | Chosen | Alternatives rejected | Decided by |
|---|---|---|---|
| <topic> | <choice> | <what and why not> | user / my call |

## What already exists
<Code, services, dependencies reused. File paths. What is rebuilt and why refactoring the old path is worse.>

## Design
<How it behaves, in prose and one diagram where flow or state is involved. Data model, interfaces, error behaviour, empty/loading/failure states for anything a user sees.>

## Acceptance criteria
- <Each one checkable: given, when, then. Includes failure paths.>

## Risks and failure modes
| What can go wrong | Likelihood | Effect | Handling |
|---|---|---|---|

## Rollout
<Order of changes, migrations, flags, rollback path, who is told.>

## Not in scope
- <Considered and deferred, with the trigger that would bring it back>

## Open questions
- <Only what the user must answer; each with the options and a recommendation>

## Left to the builder
<Choices the implementer may make freely.>
```

## Rules

- Things the user decided go in as they decided them. Things you decided are labelled "my call".
- Exact values stay exact (limits, names, copy, versions). Do not paraphrase numbers.
- No section is filled with filler. If a section does not apply, write one line saying why.
- Keep it as short as the project allows. A spec longer than the plan it produces is a design transcript.

## Builder check

Dispatch a fresh subagent with this brief, or read the spec cold yourself if there is no subagent:

```
You are a skilled <software engineer>. You have been handed the design document at <path> and
must produce an implementation plan from it. You cannot talk to its author.

Read it. Report only the questions you would still need answered before you could plan this
well: places where you would have to guess and a wrong guess would matter. For each, give the
question and why the answer changes the plan. Rank by importance.
Skip anything the document leaves to the builder and anything you could reasonably decide
yourself. Skip wording nitpicks. If nothing important is left, say "nothing important left".
```

Sort the answers into three piles:
- **Answered already** by the conversation or the repo: put the answer in the spec.
- **Minor**: a sensible builder could settle it without changing what is built. Decide it, mark it "my call".
- **Theirs**: only the user can answer, and the answer changes what is built. Bring these in one message, most important first.

That is the only round of questions the check produces. Update the spec, hand it over with the list of "my call" decisions so the user can check them, and wait for approval.
