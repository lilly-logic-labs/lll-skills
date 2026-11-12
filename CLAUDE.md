# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

The `lll` Claude Code plugin: house skills (`skills/<name>/SKILL.md` → `lll:<name>`), shared rules (`shared/`) and two hooks. **Live-linked** at `~/.claude/skills/lll`, so edits load in the next new session.

## Commands

```sh
node scripts/check.mjs        # contract + every relative link (run before any commit)
node scripts/selftest.mjs     # scripts and hooks
node scripts/gen-router.mjs   # REQUIRED after changing any skill description (rebuilds hooks/router.txt)
claude plugin validate .      # manifest
claude plugin eval . --ablation none --runs 1 --tag trigger   # evals, see evals/README.md
bash scripts/sync-vendor.sh   # refresh vendored upstream copies, then review the diff
```

## Rules (full text: `CONTRACT.md`)

- **Project-agnostic.** Never hard-code a repository, and never copy client or product material into the pack. Skills learn the project at runtime (`shared/stack-detect.md`).
- Frontmatter has only `name`, `description` (≤400 chars: verb + object, triggers, a "Not for" line naming the neighbour skill) and `metadata.origin: lll`.
- `SKILL.md` stays under 300 lines. Depth goes in `references/`, one level deep. Link shared rules as `../../shared/<file>.md`; never copy their text.
- Every skill needs evals in `evals/<name>/`: at least 2 prompts that should trigger it and 1 near-miss.
- Adapted MIT or Apache-2.0 text gets a line in `NOTICE`. Any other licence is inspiration only.
- Bump the version in `.claude-plugin/plugin.json` when releasing (`lll:pack`).

## Hooks

- `hooks/session-start.mjs` prints `house-style.md` and `router.txt` once per session. Every word in them costs tokens in every session.
- `hooks/excuse-check.mjs` (Stop): blocks the stop once if the reply waves off a problem.
