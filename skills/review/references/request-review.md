# Request a review

Get a change reviewed by a fresh reader with exactly the context it needs. The reviewer must catch problems before they cascade into the next task, the merge or production.

## When to request

- After each task in a multi-task build (task-level review).
- After a major feature, before merging.
- Before a risky merge: migration, auth, money, public API, concurrency.
- When stuck, for a fresh view.
- Before refactoring, to set a baseline.

Not needed for a trivial typo fix, but the whole-branch review before the PR is not optional for anything larger.

## 1. Prepare

Do this before you ask anyone.

1. **Self-review the diff.** Read it as a stranger. Remove debug output, dead code and unrelated edits. Split unrelated changes into separate commits or PRs.
2. **Run the gates** (tests, types, lint, build). A reviewer should not be the first to find red.
3. **Fix the range.** Base and head commits: `git merge-base <base> HEAD` and `git rev-parse HEAD`. A reviewer reads this range, not "recent changes".
4. **Write the brief** (below). Context is the product: a reviewer who knows the intent finds more and false-alarms less.

## 2. The brief

```
What was implemented: <one or two sentences>
Why / requirement: <issue, plan task, spec section; paste the acceptance criteria>
Range: <base-sha>..<head-sha>   (or PR link)
Stack and gates: <stack-detect block; the commands that were run and their result>
Not in scope: <things deliberately left out, so they are not flagged>
Decisions already made: <locked choices and ADRs that are not up for debate>
Risk you want eyes on: <migration, concurrency, auth, performance, UI states, etc.>
Known gaps: <things you know are incomplete or unverified>
```

Keep it short. Link, do not paste, long documents; paste the acceptance criteria themselves.

## 3. Dispatch

- **With subagents**: spawn a fresh reviewer (a mid-tier model for task-level review; the strongest available for the whole-branch review or for security, money, auth or migrations; `../../../shared/agents.md`). Give it the brief and read access to the repository. Do not hand it your session history; it should judge the work product, not your reasoning, and your context stays free.
- **Without subagents**: do a separate pass yourself. Re-read the brief, then the diff and surroundings from scratch, and label the result "self-review".
- **Human reviewer**: open the PR with a description that follows the PR body in `lll:ship`, and point to risk areas. Ask for specific attention, not a general "LGTM".

The reviewer follows the review steps of this skill and returns findings in the findings format, with a verdict.

## 4. Act on the result

1. Fix critical and high findings now, each with a failing test first, then the full suite.
2. Fix medium findings before moving on, unless the owner defers them in writing.
3. Note low findings; fix cheaply or list them as deferred.
4. Push back with evidence if a finding is wrong (receive-review rules in this skill). A wrong finding gets a written reason, not silence.
5. Re-review the fixes when they were non-trivial: a scoped re-review of the fix range only.
6. Do not proceed to the next task with unresolved critical or high findings.

## 5. Whole-branch review checklist

Before the PR or merge, one pass over `base..HEAD`:
- Does the branch do everything in the plan or issue, and nothing else?
- Are interfaces consistent across tasks (names, types, error shapes)?
- Anything left from intermediate steps: stubs, TODOs, flags, dead code, duplicated helpers?
- Do the tests cover the behaviours, not the implementation?
- Docs, changelog, migrations, env examples updated?
- Rollout and rollback understood?

## Red flags

- "It is simple, no need to review." Simple changes carry the bugs nobody looks for.
- Asking for review without gates green.
- Sending a 3000-line diff with no brief.
- Arguing with a finding by explaining intent instead of showing the code that prevents the scenario.
- Ignoring a critical finding because it is inconvenient.
