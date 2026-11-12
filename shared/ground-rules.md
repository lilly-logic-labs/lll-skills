# Ground rules

Every `lll` skill follows these. Put the relevant lines into every subagent brief, because subagents do not see this file.

## Authority

1. The project's own `CLAUDE.md`, `AGENTS.md`, contributing guide and ADRs win over any `lll` skill. Read them first.
2. A project's locked decisions are the spec, not findings. A finding may say "ADR 12 is not honoured here". It may not say "ADR 12 is wrong"; that is a question for the owner.
3. When a doc and the code disagree, the code is the fact and the doc drift is a finding.

## Scope and permission

- Work only on repositories, domains and systems the owner controls or has written permission to test.
- Never probe production with anything that writes, floods or brute-forces. Read-only checks against production need the owner's go-ahead in this conversation.
- Rate-limit or abuse probes on staging send at most three requests past the limit, then stop.
- Never upload repository content, findings or logs to a third-party service unless the owner approves that exact tool and data flow.
- Run outside tools only from a pinned version (exact version or commit). No `curl | sh`, no unpinned `npx` of packages the project does not already declare.

## Read-only phases

Audit, review, onboarding and scoping work is read-only until a fix phase starts. During read-only work:

- No file edits, moves or deletes in the target repository.
- No dependency installs, code generation, `prebuild`, or builds that write into the tree.
- No git write commands (`commit`, `checkout`, `switch`, `reset`, `stash`, `rebase`, `push`, `tag`).
- No commands that change remote state: deploys, migrations, secret writes, database writes, DNS, queue or bucket writes, store or console changes. Examples: `wrangler deploy`, `wrangler d1 execute` without `--local`, `terraform apply`, `kubectl apply`, `prisma migrate deploy`, `supabase db push`, `firebase deploy`, `fastlane deliver`, `gh release create`.
- Network calls only where the skill's steps list them.

## Evidence

- Every claim cites `path:line` and quotes the code, or quotes the command and the decisive output line.
- No evidence, no finding.
- Hotspots and grep hits are leads, not conclusions. Confirm or discard each one, then read the rest of the scope.

## Secrets and personal data

- Report a secret's location and type, never its value. Do not print secret values in chat, reports, commits or logs.
- Do not copy personal data from databases, logs or fixtures into reports. Describe the shape ("emails in plain text in `users.email`"), not the content.

## Shared workspaces

- Other people or agents may be working in the same checkout. Never switch its branch, stash, reset, clean or prune it.
- Fixes happen in a separate worktree (`fix-phase.md`).
- Commit only files this run changed.

## Skip list

Unless a step says otherwise, skip vendored and generated paths: `node_modules/`, `vendor/` (except when auditing dependencies), `dist/`, `build/`, `out/`, `.next/`, `.expo/`, `.wrangler/`, `target/`, `bin/`, `obj/`, `Pods/`, generated `android/` and `ios/` folders in Expo projects, `.venv/`, `__pycache__/`, coverage output, minified bundles and lockfiles.

## Honesty

- Report what was skipped, assumed or unverified, one line each.
- State test and build results with the real output. Never claim a pass that was not run.
- A bug found in passing is fixed or reported, never waved off as "pre-existing" or "out of scope". If a fix is blocked, name the exact blocker.
