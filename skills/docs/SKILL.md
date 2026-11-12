---
name: docs
description: Sync docs with code. Updates README, CLAUDE.md or AGENTS.md, docs/, API docs, changelog, ADRs, env examples and agent memory after a change; a drift-check mode reports mismatches without editing. Use when docs are stale, update the docs, sync README, docs out of date, after merging a change. Not for commit or PR text (lll:ship) or a first CLAUDE.md (/init).
metadata:
  origin: lll
---

# Docs

Keeps every doc that makes a claim about the code true after the code changes. It finds the change set, lists the claims it touches, verifies each against the code, and edits facts in place.
The code is the fact. A doc that disagrees with it is the defect, unless the owner's locked decision says otherwise.

## When to use

- After a feature, fix, rename, removal or refactor: "update the docs", "sync the README", "docs are out of date", "did we document this".
- Before a release or merge: "check the docs match the code".
- After `lll:build` or `lll:ship` finished a change, or after a fix phase (`../../shared/fix-phase.md` ends by calling this skill).
- Memory or instruction files may mislead the agent: "CLAUDE.md is stale", "memory says the old way".

## When not to use

- Writing the commit message, PR body or release notes from a diff: `lll:ship`.
- Creating a first `CLAUDE.md` or `AGENTS.md`: the `/init` built-in.
- Writing a new guide, tutorial or whole documentation site from nothing: do it as a normal task; use `anthropic-skills:humanizer` for tone. This skill flags coverage gaps, it does not invent pages.
- Planning or specs: `lll:plan`. Client handover packs: `lll:handover`.
- Auditing whether the code is right: `lll:audit` or `lll:review`. Here, the code is assumed right.

## Modes

- **Update** (default): scoped to one change set, inline, no subagents, no report file. The docs it edits are the only files written. This is the guidance mode of this skill: the user's request to update docs is the permission to edit them.
- **Drift check**: read-only. Reports doc-versus-code mismatches as a list, edits nothing. Use when the user says "check", "audit the docs", "are the docs accurate", or wants a review before deciding. Details in `references/drift-check.md`.
- **Full**: only when asked for a whole-repository sweep or a written report. Subagents allowed (one `sonnet`-tier brief per docs area, `../../shared/agents.md`), report per `../../shared/report.md`, fixes in a worktree per `../../shared/fix-phase.md`.

Read `../../shared/ground-rules.md` first. The project's own instructions about docs win, including any rule that limits edits to `CLAUDE.md`, `AGENTS.md` or the memory index to the start of a session (some owners batch those edits to keep the prompt cache stable). If such a rule exists, produce the exact edits as a patch list and do not apply them.

## Steps

1. **Learn the docs landscape.** Per `../../shared/stack-detect.md` section 1. Inventory doc files: `git ls-files '*.md' '*.mdx' '*.rst' '*.adoc' '*.txt'`, doc generators and their sources (Docusaurus, MkDocs, Sphinx, Typedoc, Javadoc, Storybook, OpenAPI files), the changelog and ADR folders, env example files, and the agent memory directory (`references/memory-sync.md`). Note which files are history or protected (`references/protected-and-history.md`).
2. **Find the change set.** In order: files or a PR the user named; otherwise `git diff $(git merge-base HEAD <default-branch>) --name-only` plus staged, unstaged and untracked files. In a non-git folder, ask which files changed. Classify each change: new public surface (command, flag, route, export, config key, env var), changed behaviour, rename or move, removal, dependency or runtime version, schema, infrastructure, error message, default value.
3. **List the claims it touches.** For every changed name, path, flag, env var, route, command, default, count, version and old value, search all docs for it (`grep -rn`, including the old name for renames). Add structural claims: file trees, architecture and data-flow descriptions, command lists, "how to run/test/deploy" steps, diagrams. Add code comments and docstrings next to changed code. Add memory entries about the area. Write the ledger as `doc:line, claim, what to check`.
4. **Verify each claim against the code.** `references/claim-checks.md` has the method per claim type. Run `node scripts/drift.mjs --root <repo>` for links, anchors, stale paths, missing scripts and env names, then read the code for everything it cannot see. Mark each claim **current**, **stale** (and what the code says now) or **unverifiable** (needs a person: product intent, external systems, screenshots, legal wording).
5. **Edit.** Rules:
   - Change facts only, in the doc's existing voice, format and heading style. Smallest edit that makes it true.
   - Add a new section only when a new feature has no home; copy the shape of its neighbours. Otherwise flag the gap (`references/other-docs.md`, coverage map).
   - Update examples and commands so they work as written; keep placeholders for secrets and personal data.
   - Edit the source of generated docs and report that regeneration is needed; do not hand-edit output.
   - Dated plans, specs, audits, retros and accepted ADRs are history: leave them. A superseding ADR or a status line is the way to record a change (`references/changelog-and-adr.md`).
   - Never edit the owner's rules sections of `CLAUDE.md` or `AGENTS.md`, only the facts around them (commands, structure, architecture). A rule the code breaks is a code issue, a rule that looks wrong is a question for the owner.
   - Add a changelog entry in the file's own format when the project keeps one; never rewrite released entries, and never choose a version number (ask).
   - Prose longer than a line: run it through `anthropic-skills:humanizer` for tone only after the facts are right.
6. **Sync memory and agent files.** `references/memory-sync.md`. Update or delete memory entries the code now contradicts, fix the index line, add nothing the repo already records. Memory sits outside the repo, so list each change in the summary.
7. **Re-verify.** Re-run `scripts/drift.mjs`, re-read each edited claim against the code, run the documented commands that are safe and read-only (`--help`, version, list, dry run), and check that the edit did not leave an orphan reference (renamed heading, moved file). A doc that cannot be reached from `README` or `CLAUDE.md` is a finding.
8. **Report.** One line per file changed saying what changed and why, then what was left alone and why, claims needing an owner, memory changes, and anything not verified.

## Do not

- Do not guess a behaviour to fill a doc. Unknown stays marked unverified and goes in the summary.
- Do not paste secret values from `.env` files, logs or code into any doc. Name the variable and its purpose.
- Do not "improve" tone, structure or positioning of a doc nobody asked to change. Positioning text, security-model descriptions and design rationale go to the owner as questions.
- Do not delete a section because it looks unused. Move deletions to the summary as proposals unless the code it described is gone.
- Do not run builds, installs or generators that write into the tree just to check a doc, unless the owner approved.
- Do not commit. Leave the edits staged or unstaged for the owner or for `lll:ship`, unless asked.

## Output

- Chat summary: files updated with a one-line reason each, claims left unverified or for the owner, gaps flagged (new surface with no docs), memory entries changed or deleted, and the result of the last `drift.mjs` run.
- Drift check: a list of mismatches (`path:line`, claim, what the code says, suggested fix), or a written report in full mode.
- Full mode: report at `docs/audits/<date>-docs.md` and the fix branch and worktree.
