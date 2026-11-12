# Finish a branch

Implementation is complete. Decide how it gets integrated: verify, present the options, execute the choice, clean up.

## 1. Verify first

Run the project's gates fresh on the branch tip (verification rules in this skill). If anything fails, stop: show the failures and do not offer the menu. Fixing comes first.

## 2. Establish the facts

```
git branch --show-current
git status --short
git log --oneline <base>..HEAD
git rev-parse --git-dir ; git rev-parse --git-common-dir
```

- Base branch: the branch you started from; usually `main`, `master` or `develop`. If unsure, `git merge-base HEAD main` (or the other candidates). Ask only if it is truly ambiguous.
- Uncommitted changes: yours? Commit them. Someone else's? Leave them and say so.
- Linked worktree or detached HEAD: note it, because cleanup differs (section 5). Detached HEAD means there is no branch to merge or PR: create one first (`git switch -c <name>` inside that worktree) or offer a patch, and say why.

## 3. Present exactly these options

Do not add commentary. Ask with the host's structured question tool (Claude Code: AskUserQuestion), recommended option first.

```
Implementation complete, checks green. What would you like to do?
1. Push and create a Pull Request  (Recommended)
2. Merge back to <base> locally
3. Keep the branch as is (I will handle it later)
4. Discard this work
```

Recommend 1 for shared repositories and anything non-trivial. Recommend 2 only for solo repositories with no review process. A host that cannot ask questions: print the list and wait.

## 4. Execute the choice

### 1. Push and open a PR
```
git push -u origin <branch>
gh pr create --title "<conventional title>" --body "<body per commit-and-pr guidance>"
```
- Pushing a feature branch needs the user's choice of option 1 (that is the approval). Never force-push. Never push to the default branch.
- No `gh` or no GitHub: give the push command and the PR text for the user's host.
- Keep the worktree; the branch is still in use. Report the PR link.

### 2. Merge locally
```
git switch <base>
git pull --ff-only          # if a remote exists
git merge --no-ff <branch>  # or the project's policy: squash, rebase
<run the gates again on the merged result>
```
- Check the project's merge policy first (squash-only, linear history, protected branch). If the base is protected or the project requires PRs, say so and offer option 1.
- Verify the merged result, not just the branch. If the gates fail after the merge, do not push; report and stop.
- Delete the feature branch only after the merge is verified: `git branch -d <branch>` (safe delete).
- Pushing the merged base is a separate step that needs its own request.
- In a linked worktree, `git switch <base>` fails because the base is checked out in the main checkout. Run the merge from the main checkout path, or use option 1.

### 3. Keep as is
Report: "Keeping branch `<name>`. Worktree preserved at `<path>`." Do nothing else. No cleanup.

### 4. Discard
Show what will be lost and require a typed confirmation:
```
This will permanently delete:
- Branch <name>
- Commits: <git log --oneline <base>..HEAD>
- Worktree at <path>
Type 'discard' to confirm.
```
Wait for the exact word. Anything else cancels. Then, from the main checkout:
```
git worktree remove --force <path>     # only if you created that worktree
git branch -D <branch>
```
Irreversible except via reflog for a short time; say so once in the confirmation. Never discard work that is not yours without the owner's say.

## 5. Cleanup by option

| Option | Remove worktree | Delete branch |
|---|---|---|
| 1. PR | No | No |
| 2. Merge locally | Yes, if you created it | Yes (safe delete), after verified merge |
| 3. Keep | No | No |
| 4. Discard | Yes, if you created it | Yes (forced), after typed confirmation |

If the worktree was created by the host's tool, leave removal to the host.

## 6. After

Summarise: what was done, where the work is (branch, PR link, worktree path), and the next owner action (review, merge approval, deploy). If a deploy follows, go to the deploy guidance.

## Mistakes

- Offering the menu with failing gates.
- Merging without re-running the gates on the merged result.
- Open-ended "what next?" instead of the four options.
- Deleting the worktree when the branch is still needed for a PR.
- Discarding without the typed word.
- Force-pushing, or pushing to the default branch, without being asked.
