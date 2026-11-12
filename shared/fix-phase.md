# Fix phase

Skills that find defects fix every `confirmed` finding, unless the user asked for report only. Fixes are local and reviewable. Nothing is pushed, merged, deployed or released.

## Setup

1. Choose the base: the commit the audit read (normally the shared checkout's `HEAD`). If that checkout is on someone else's feature branch or has uncommitted changes, say so and ask whether to base on it or on the default branch (`main`/`master`). Record the base sha and branch in the report.
2. Create a worktree from that base, never switch the shared checkout:
   `git worktree add .worktrees/lll-fix-<YYYY-MM-DD>-<skill> -b lll-fix/<YYYY-MM-DD>-<skill> <base-sha>`
   Add `-2`, `-3` if the name is taken. If `.worktrees/` is not ignored by the project, use a sibling folder outside the repository instead.
3. Install dependencies inside the worktree with the project's documented command (lockfile-respecting: `npm ci`, `pnpm install --frozen-lockfile`, `uv sync --frozen`, `go mod download`, `cargo fetch`, `bundle install`). This is a local write and is allowed. If install needs credentials or a private registry the run lacks, stop the fix phase and report that blocker.
4. Run every gate once for a baseline. Gates that already fail become `confirmed` findings in lens `tests` or `release` and are fixed first.

## Not auto-fixed

These go to the report under "Owner actions" or "Needs decision", with the finding id:

- Anything needing a secret, a dashboard, a deploy, a remote migration, a store console, DNS, or a physical device.
- Legal and policy text (privacy policy, terms), pricing, product copy and any product decision.
- Any fix whose correct behaviour the code and docs do not settle.
- Major-version dependency upgrades and upgrades that change lockfiles across many packages; minor and patch security bumps are allowed.
- The project's rule files (`CLAUDE.md` rules sections, `AGENTS.md`, ADRs). A rule the code breaks is a code fix; a rule that looks wrong is "Needs decision".
- `needs_validation` findings.

## Order and batching

- Fix in severity order: critical, high, medium, low.
- Batch findings that touch the same files, so two fixers never edit one file.
- Run batches one at a time, each starting from the previous green commit.

## Per finding

1. Fix the root cause at the narrowest responsible layer. Grep every caller of any function you change.
2. Write a failing regression test first where the finding is testable, then make it pass. If it is not testable (pure config, platform glue), say why in the commit body.
3. Schema changes add a new migration. Never edit a migration that may have run anywhere.
4. Contract changes update both sides in the same commit.
5. Run all gates. Commit only when all pass: one commit per finding, message `fix(<lens>): <title>` with the finding id in the body, plus any attribution line the host requires.
6. If the gates are not green after two attempts, `git restore` the files you touched, and report the finding as "not fixed" with the blocking output.

## Review

After all batches, a fresh reviewer (not a fixer) reads `git diff <base>..HEAD` in the worktree against the findings. It checks that each fix addresses the scenario, adds no regression, stays in scope and breaks no project rule. A problem goes back to a fixer once. If still wrong, `git revert` that commit and mark the finding "reverted".

## Docs sync

If fixes changed documented behaviour, run `lll:docs` in the worktree on the fix diff before finishing.

## Finish

- Run every gate on the branch tip and paste the real output into the report.
- Commit the report on the fix branch.
- Tell the user the worktree path and branch. Do not merge or push; the owner reviews the branch. Leave the worktree for them to inspect; removing it is their call (`git worktree remove <path>`).
