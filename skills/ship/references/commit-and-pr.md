# Commits and pull requests

## Commit rules

1. **Stage by path.** `git add <file> <file>` for the files this work changed. Not `git add -A` or `git add .` in a checkout others share, and never before checking `git status` for secrets, env files, generated output and unrelated edits. `git add -p` to split a file with mixed changes.
2. **Look before committing.** `git diff --staged` and read it. Anything surprising stays out.
3. **One logical change per commit**, with its tests. Mechanical moves or formatting in their own commit.
4. **Conventional Commits.** `type(scope): subject`
   - Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
   - Scope: the area (package, module, screen); optional.
   - Subject: imperative, about 72 characters or fewer, no trailing period, what changed.
   - Body (blank line after the subject): why, not what; wrap near 72 columns. Required for fixes of security or data bugs, reverts, migrations and breaking changes.
   - Breaking change: `feat(api)!: …` and a footer `BREAKING CHANGE: <what and how to migrate>`.
   - Footers: `Fixes #123`, `Refs #456`.
5. **No secrets, no tokens, no personal data, no build output, no large binaries.** If one slipped in before the commit: unstage. After the commit: tell the owner; rotate the secret; do not rewrite shared history yourself.
6. **Add the attribution line** the host or project asks for (for example a `Co-Authored-By:` trailer), as the last line of the message body, after other footers.
7. **Hooks run.** Do not use `--no-verify`. If a hook fails, fix the cause. A new commit after a failed hook, not `--amend`, since the failed commit never happened.
8. **Amend and rebase only your own unpushed commits.** Anything pushed to a shared branch stays; add a new commit. No force-push without explicit request, and never to the default branch (`--force-with-lease` if ever asked).
9. **Commit messages are persisted prose**: normal complete sentences, no filler or shorthand.

Examples:
```
fix(auth): reject expired refresh tokens

The refresh endpoint compared expiry with <= against a value in
seconds, so tokens stayed valid for one extra second window per
clock skew. Compare in milliseconds and add a regression test.

Fixes #482
```
```
refactor(billing): move proration into its own module

No behaviour change. Callers import from billing/proration; the old
helpers in invoice.ts are removed.
```

## Choosing granularity

- Plan tasks: one commit per task (the plan says so).
- Bug fix: regression test plus fix in one commit.
- Refactor then feature: two commits, refactor first.
- Dependency bump: its own commit, with the lockfile.
- Squash-merge projects: the PR title becomes the commit subject, so make it conventional.

## PR title and body

Title: the Conventional Commit subject for the whole change, under about 70 characters. Details go in the body.

Body template:

```markdown
## Summary
<What changed and why, in two or three sentences. Link the issue or plan.>

## Changes
- <main change, grouped by area>

## Testing
- `<command>`: <result>
- Manual: <steps and outcome; screenshots or recording for UI>

## Risk and rollout
<What could break. Migration steps. Feature flag. How to roll back.>

## Notes for reviewers
<Where to start. Decisions already made. Known gaps or follow-ups.>
```

Rules:
- Test evidence is the real commands and results, not "tested locally".
- State anything not verified.
- Mention breaking changes and migrations first.
- Keep PRs reviewable: about 500 changed lines or fewer; larger work splits by layer or by step, or uses stacked PRs with the base noted.
- Draft PR (`--draft`) for work in progress or when CI results are needed before review.
- Add the host's attribution line for PR descriptions when required, at the end.

Create with the CLI (GitHub), passing the body from a file or here-doc so formatting survives:

```
gh pr create --base <base> --head <branch> --title "<title>" --body-file <path-to-body>
```
Then read back the link and the CI status: `gh pr view --web` is for the user; `gh pr checks` for you.

Pushing and creating a PR is a remote write. It needs the user's request (choosing the PR option in the finish menu, or saying "open a PR").

## Release notes and changelog

- If the project keeps a changelog, add entries under Unreleased in the PR; group as Added, Changed, Fixed, Removed, Security. Write for users, not for maintainers.
- Semver for libraries and APIs: breaking is major, feature is minor, fix is patch. Pre-1.0 projects follow their own rule; check the docs.
- Version bump and tag only when the user requests a release; tagging and publishing are remote writes (see the deploy guidance).

## Checks before pushing

1. Gates green on the tip, fresh.
2. `git log <base>..HEAD` reads like a story.
3. `git diff <base>...HEAD --stat` shows only intended files.
4. No debug output, no `.only`, no TODOs you introduced, no commented-out code.
5. Branch is up to date with the base (rebase or merge per project policy); resolve conflicts by reading both sides, then re-run the gates.
