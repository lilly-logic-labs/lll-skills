---
name: ship
description: Prove work is really done, then commit, open a PR, finish the branch, deploy and watch it. Use when about to say done, fixed or passing, or asked to commit, make a PR, merge, set up a worktree, release, deploy, or check a deploy after it went out. Not for go-live checks of a website (lll:launch), reviewing code (lll:review) or app store releases (lll:mobile).
metadata:
  origin: lll
---

# Ship

Takes finished work from "I think it works" to evidence, a clean commit, a reviewable PR, and a watched deploy.
Iron law: no completion claim without fresh verification output from this session.

## When to use

- About to say "done", "fixed", "passing" or "ready", or to commit or open a PR.
- Work is complete and the user must choose how to integrate it.
- An isolated workspace is needed before starting or executing a plan.
- A release or deploy is requested, or a deploy just happened and needs watching.
- Writing commit messages, a PR body or release notes.

## When not to use

- Reviewing the change for defects: `lll:review`.
- Building or fixing: `lll:build`; unknown cause: `lll:debug`.
- A website that just went live (smoke, SEO, legal, monitoring checklists): `lll:launch`.
- Backup and restore proof: `lll:backup-drill`. Docs refresh: `lll:docs`.

## Modes

- **Guidance** (default). Run the verification gate and report. Draft commit messages and the PR body. Present the finish menu. Commit only when asked. Push, merge, tag, publish and deploy never happen unless the user asks for that exact step in this conversation.
- **Full**. Only when the user asks to ship end to end. Gates, review check, commits, push of the feature branch, PR creation, and (each with its own explicit approval) merge and deploy, then a canary watch.

Both follow `../../shared/ground-rules.md`: remote and production writes need the owner. Stack and gate commands come from `../../shared/stack-detect.md`.

## Route

| Need | Read |
|---|---|
| About to claim any result | `references/verification.md` |
| Isolated workspace | `references/worktrees.md` |
| Work complete, choose merge, PR, keep or discard | `references/finish-branch.md` |
| Commit messages, PR title and body, release notes | `references/commit-and-pr.md` |
| Release or deploy | `references/deploy.md` |
| Watch a deploy | `references/canary.md` and `scripts/canary.mjs` |

## Steps

1. **Read the state.** `git status`, current branch, `git log <base>..HEAD`, any uncommitted work that is not yours. Other people or agents may share the checkout: touch only your files.
2. **Verify** (`references/verification.md`). Identify each claim you will make, find the command that proves it, run it fresh, read the full output and exit code, then state the result with the evidence. Include the requirement-by-requirement check against the plan or issue. UI and mobile work is run, not just compiled.
3. **Check review status.** Was the whole branch reviewed (`lll:review`)? If not, offer it; for risky changes insist. Open critical and high findings block shipping.
4. **Docs.** Behaviour or interface changed: update docs first (`lll:docs`).
5. **Commit.** Stage named paths only, never everything in a shared checkout. Conventional Commits; one logical change each; tests with the code (`references/commit-and-pr.md`). Add any attribution line the host or project requires.
6. **Finish the branch** (`references/finish-branch.md`). Re-verify on the merged result if integrating. Present the four options and wait for the choice: merge locally, push and open a PR, keep as is, discard (typed confirmation).
7. **Open the PR** when chosen. Title and body from the template, test evidence included. Use `gh` for GitHub; other hosts use their CLI or give the user the text.
8. **Deploy** only on request (`references/deploy.md`). Pre-deploy checks, migration order, rollback plan, then the deploy command the project documents. Merging to the default branch may itself trigger a deploy: check the pipeline first and say so.
9. **Watch** the deploy (`references/canary.md`): baseline before, checks after, alert on change versus baseline, only after two consecutive bad checks. Decide with the user: roll back, investigate or accept.
10. **Report** with evidence, what was not verified, and what is left for the owner.

## Stop conditions

Stop and ask before: merging to the default branch, pushing to a shared branch, force-pushing anything, tagging or publishing a release, any production deploy, discarding work, deleting a branch with unmerged commits, running a destructive migration.

## Red flags

| Thought | Reality |
|---|---|
| "Should work now" | Run it. |
| "I am confident" | Confidence is not evidence. |
| "The subagent said it passed" | Check the diff and run the check yourself. |
| "Linter passed, so build passes" | Different gates prove different things. |
| "I ran it earlier" | Earlier is before your last edit. Run fresh. |
| "Just this once, skip the check" | That is how broken main happens. |
| "Commit everything with `git add -A`" | You may commit someone else's work or a secret. Name paths. |
| "Push now, tidy later" | History on a shared branch is public. |
| "Deploy is automatic, so no check" | Automatic deploys need the most watching. |

## Output

- Verification block: each gate, its command, the real result line; requirements checklist; what was not verified.
- Commits (hashes and subjects), branch name, PR link if created.
- Deploy and canary outcome if requested.
- Next steps owned by the user, such as merge approval, deploy approval, secrets, store submission.
