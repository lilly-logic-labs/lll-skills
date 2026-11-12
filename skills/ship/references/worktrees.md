# Worktrees and isolated workspaces

Work on a feature, a fix, or a plan in a place where it cannot disturb the main checkout or another agent's work. A worktree is a second working folder on the same repository, with its own branch.

## 1. Detect what you already have

```
git rev-parse --git-dir
git rev-parse --git-common-dir
git branch --show-current
```

- The two directories differ: you are already in a linked worktree. Do not create another. Skip to setup checks.
- Same directory and a normal branch: ordinary checkout. Decide whether isolation is needed.
- Detached HEAD in a linked worktree: managed by a tool (or a previous run). Treat as isolated; finishing will need a branch (see finish-branch guidance in this skill).
- Submodule: `git rev-parse --show-superproject-working-tree` prints a path. Not a worktree; take care with commits.

## 2. When isolation is needed

Create one when any is true:
- The current checkout is on the default branch.
- Other people or agents have uncommitted work in it.
- A plan will run for a while and you want a clean base.
- Several tasks will run in parallel.
- A fix phase of an audit or review (`../../../shared/fix-phase.md`).

Not needed for a one-line change on a feature branch you own with a clean tree. Never start work directly on `main`/`master` without the user's consent.

## 3. Prefer the host's native tool

If the host offers a worktree or isolated-workspace tool (Claude Code: `EnterWorktree`), use it. It handles location, cleanup and session binding. Only fall back to git commands if no such tool exists.

## 4. Git fallback

Choose the location in this order:
1. A path the project's docs (`CLAUDE.md`, `AGENTS.md`) name.
2. `.worktrees/` inside the repository, but only if it is git-ignored: `git check-ignore -q .worktrees`. If it is not ignored, do not create it there (the worktree contents would show up as untracked); use a sibling folder `../<repo>-worktrees/` instead, or ask before editing `.gitignore`.
3. A sibling folder outside the repository.

Create:
```
git worktree add <path> -b <type>/<short-name> <base>
```
- Branch name: `feat/…`, `fix/…`, `chore/…`, or `lll-fix/<date>-<skill>` for fix phases. Add a suffix if the name is taken.
- `<base>` is the branch or commit to start from (default branch tip unless told otherwise). Fetch first if the base is remote: `git fetch origin`.
- A branch can be checked out in only one worktree at a time. Git refuses a second; pick a new branch.

## 5. Set up the worktree

1. Change into it. All later commands run there; use absolute paths.
2. Install dependencies with the project's locked command (`npm ci`, `pnpm install --frozen-lockfile`, `uv sync --frozen`, `go mod download`, `cargo fetch`, `bundle install`, `composer install`, `dotnet restore`, `pod install` where needed). Installing is a local write and allowed. If it needs credentials the run lacks, stop and report that.
3. Environment files: gitignored `.env` files are not copied by git. Tell the user which are missing. Copy a local env file only if the user agrees; never print or commit secret values.
4. Generated code or native folders (Prisma client, codegen, Expo prebuild, Pods): run the project's documented generate step.
5. Run the gates once for a baseline. Gates already red are recorded as pre-existing and fixed first or reported as the blocker.
6. Record the base: `git rev-parse HEAD` and the branch name.

## 6. Work rules in a worktree

- Commit on the worktree's branch only. Do not switch branches inside it.
- Do not edit the main checkout from the worktree session, and do not touch other worktrees.
- Gitignored build output and `node_modules` are per worktree; builds can be slow the first time.
- Long paths on Windows: keep the worktree path short, and enable long paths if the toolchain needs it.
- Ports and caches may collide with the main checkout's dev server; use different ports.

## 7. Cleanup

- Only remove a worktree you created, and only after its work is merged, discarded on the user's typed confirmation, or kept on purpose.
- Merged: `git worktree remove <path>`, then `git branch -d <branch>` (safe delete; fails if unmerged, which is the protection you want).
- Discarded: `git worktree remove --force <path>` and `git branch -D <branch>` only after the typed confirmation from the finish menu.
- Kept or PR open: leave the worktree in place and tell the user the path.
- Tool-managed worktrees (created by the host's tool) are cleaned by the host. Do not remove them by hand.
- `git worktree prune` removes records of folders already deleted; run it only on a repository you own.
- Never remove a worktree with uncommitted changes unless the user confirmed discarding them.

## 8. Common failures

| Symptom | Cause | Fix |
|---|---|---|
| `fatal: '<branch>' is already checked out` | Branch used in another worktree | New branch name |
| Worktree folder shows as untracked in main | Created inside the repo without an ignore rule | Move it outside, or ignore the folder |
| Tests fail only in the worktree | Missing env file or generated code | Setup steps 3 and 4 |
| `git worktree remove` refuses | Uncommitted changes or locked | Look at `git status` there; commit or confirm discard |
| Editor opens the wrong folder | Path confusion | Open the worktree path explicitly |
