# Receive a review

Review feedback is a set of claims about your code. Verify each against the code, then act. Technical correctness over social comfort. No performative agreement.

## The loop

1. **Read all of it** before reacting. Items interact; a later comment can change an earlier one.
2. **Restate each requirement** in your own words, or ask. Mark items you do not understand.
3. **Clarify first if anything is unclear.** Do not implement the clear items while the unclear ones are open: they may be related, and partial work built on a misreading must be redone. Ask the reviewer one batched question.
4. **Verify each claim against the code.** Reproduce the scenario. Check the callers and tests. Does the suggestion break something else? Why was it written this way (history, `git blame`, comments, ADRs)? Does it work on all supported platforms and versions?
5. **Decide**: accept, accept with a different fix, push back, or defer.
6. **Implement one item at a time**, each with a failing test where behaviour changes, then the focused test, then the full suite before moving on.
7. **Reply** with the outcome, per thread.

## Order of work

1. Anything blocking: breaks, security, data loss.
2. Simple fixes: typos, imports, naming.
3. Complex fixes: refactors, logic changes.

## Responses to avoid

Do not write "You are absolutely right!", "Great catch!", "Thanks for catching that!" or any thanks as filler. Actions show you heard. State the fix or the disagreement.

| Instead of | Write |
|---|---|
| "You're absolutely right, I'll fix that" | "Fixed in `abc123`: `parse` now rejects empty input; test added." |
| "Good point!" | "Confirmed: two callers pass `null`. Guard added in the shared helper." |
| "Sorry, my mistake" | "It was wrong because X. Corrected." |

If you pushed back and were wrong, say so once, factually: "Checked, you were right: `X` is null when Y. Implementing now." No long apology.

## When feedback is unclear

Stop. Ask. "I understand items 1, 2 and 6. I need clarification on 3: do you mean A or B?" Then wait.

## Source matters

- **The user (your partner)**: trusted. Implement after understanding. Still ask when scope is unclear. No performative reaction; just do it.
- **An external or automated reviewer** (bot, outside contributor, another model): treat as suggestions to verify. Check each claim. It may lack context, may be right for another codebase, or may be wrong. Reject on evidence.
- **Conflict with a locked decision** (ADR, the owner's earlier ruling): stop and discuss with the owner first.

## Checking whether a suggestion is worth it

- **"Implement it properly" for a feature nothing uses**: grep for callers. No usage: ask whether to remove it instead (nothing used, so nothing to harden). Used: implement.
- **"Add X for robustness"**: what real input reaches this path? If none, say so and propose not adding it.
- **"Make it more generic / extensible"**: is there a second user today? If not, decline (laziness ladder in `lll:build`).
- **"Rename / restructure"**: is it in scope for this PR, or a follow-up?
- **"This breaks on platform Y"**: reproduce on Y, or ask for the failing case.

## When to push back

Push back, politely and with evidence, when the suggestion:
- breaks existing behaviour or a test (name it);
- ignores the reason the code is as it is (point to the history or constraint);
- conflicts with the project's rules or the stated requirement;
- adds unused scope;
- is technically wrong for this stack or version;
- is a preference with a real cost (churn, risk) and no failure scenario.

Format: the claim you checked, what you found, what you propose. "Checked `findUser` callers: all three pass a validated id (`api/users.ts:41`, `jobs/sync.ts:18`, `cli.ts:9`), so a null guard here would be dead code. Leaving as is; happy to add a test that pins the contract instead."

If you cannot verify a claim, say so: "I cannot verify this without running on Android 8. Should I borrow a device, or ship with this flagged unverified?"

## Replying on a PR

Reply inside the comment's thread, not as a new top-level comment.
- GitHub inline: `gh api repos/{owner}/{repo}/pulls/{pr}/comments/{comment_id}/replies -f body='...'`
- General PR comment: `gh pr comment {pr} --body '...'`
- Quote the commit that addresses it. Resolve a thread only when the reviewer's point is closed; leave it to them if the repository's convention says the reviewer resolves.
- Posting is a shared-state action. In guidance mode, draft the replies and let the user send, unless they asked you to post.

## After the round

1. All accepted items done; full suite green with real output.
2. Pushed-back and deferred items listed with reasons.
3. Request a scoped re-review of the fix range if the changes were non-trivial.
4. Do not mark the review done on the reviewer's behalf.

## Mistakes to avoid

- Implementing everything to look cooperative.
- Implementing a suggestion without understanding it.
- Fixing the one line quoted and not its siblings elsewhere (sideways sweep).
- Batching all changes into one commit with no test, then claiming they are fixed.
- Arguing from authority or tone instead of from the code.
