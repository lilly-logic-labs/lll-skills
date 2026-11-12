# Commit, PR description and issue review

Review the text around the code: commit messages, the PR description, and the issue or ticket that started the work. These are what future readers, release notes and reviewers depend on.

## Commit messages

Check each commit in the range (`git log <base>..HEAD --format='%h %s%n%b'`).

| Check | Pass when |
|---|---|
| Format | Conventional Commits: `type(scope): subject`. Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert |
| Subject | Imperative mood, about 72 characters or fewer, no trailing period, says what changed |
| Body | Present when the why is not obvious, or for security fixes, data fixes, reverts, breaking changes, migrations; wraps near 72 columns |
| Breaking change | `!` after the type or a `BREAKING CHANGE:` footer, with the migration path |
| References | Issue or ticket linked (`Refs #123`, `Fixes #123`) when one exists |
| Atomic | One logical change per commit; tests live with the code they test |
| Honest | Message matches the diff; no "misc fixes", "wip", "update", "changes" |
| Clean | No secrets, no generated or vendored noise, no debug leftovers, no unrelated formatting churn |
| History | Fix-up commits squashed unless the project keeps them; no merge commits on a rebase-only project |
| Attribution | Any attribution line the host or project requires is present |

Findings: a misleading message is medium (it damages `git bisect` and release notes). A secret in history is critical (rotate the secret; rewriting history is the owner's call). Style problems are low.

## PR description

A good description lets someone review without opening the code first.

| Section | Contents |
|---|---|
| Summary | What and why, in two or three sentences |
| Changes | Bullet list of the main changes, grouped by area |
| Linked work | Issue, plan, spec, ADR |
| How it was tested | Commands run and results; manual steps; screenshots or recordings for UI |
| Risk and rollout | What could break, feature flag, migration steps, rollback |
| Notes for reviewers | Where to look first; known gaps; decisions already made |
| Checklist | Docs updated, tests added, changelog if the project keeps one |

Check: matches the diff (no claims the code does not support); states test evidence rather than "tested locally"; flags breaking changes and migrations; small enough to review (over about 500 lines of real change, suggest a split); title follows the commit format when the project squashes. Missing test evidence on a risky change is medium.

## Issue or ticket

Use when asked "is this issue ready to build?" or when triaging.

| Check | Question |
|---|---|
| Problem | Is the problem stated in user terms, apart from the solution? |
| Evidence | Bug: steps to reproduce, expected versus actual, version/platform, logs. Feature: who needs it and why now |
| Scope | One deliverable. Non-goals stated. Can it be done in one PR? |
| Acceptance | Observable, testable criteria, including one failure path |
| Context | Links to designs, specs, related issues; duplicates checked |
| Priority | Severity (for bugs) and impact stated; owner assigned or assignable |
| Risks | Data, security, migrations, rollout noted |
| Dependencies | Blockers and sequencing listed |
| Ambiguity | Open questions listed, with a named person to answer |

Verdicts: **Ready** (build can start), **Needs info** (list the exact missing items), **Split** (propose the pieces), **Not a ticket** (a discussion or a decision; route to `lll:plan`).

For a bug report without a reproduction, the next step is to get one, which is `lll:debug`'s first step; do not guess a fix from the title.

## Output

```
Commits: <n reviewed>  Issues found: <list with hash and the one-line fix>
PR description: <ok | gaps: ...>
Issue: <Ready | Needs info: ... | Split: ... | Not a ticket>
Suggested rewrite: <subject lines or description sections, only where the original fails>
```

Rewrites are suggestions. Changing history of a shared branch (amend, rebase, force-push) is the owner's decision; propose it, do not do it.
