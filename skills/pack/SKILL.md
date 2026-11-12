---
name: pack
description: Maintain the lll skill pack. Shows which skills fire in your transcripts and where none did, then adds or fixes a skill to CONTRACT.md, runs checks and evals, bumps the version and tags. Use when asked to add a skill, fix a skill that did not fire, which skills do I use, check the pack, release the pack. Not for building a product feature (lll:build).
metadata:
  origin: lll
---

# Pack

Keeps the lll skill pack small, sharp and proven: measures which skills fire, finds the tasks no skill covered, then adds or fixes one skill at a time with evals, checks and a release.
A skill only earns its listing cost if it triggers when it should and stays quiet when it should not.

## When to use

- "Which skills do I actually use", "why did the skill not fire", "add a skill for X", "improve the descriptions", "check the pack", "release the pack".
- A task went badly because no skill fired, or the wrong one did.
- After a batch of skill edits, before sharing or tagging the pack.
- Checking the pack for another host that reads `SKILL.md` (Codex, Cursor).

## When not to use

- Building a product feature or app code: `lll:build` (plan it with `lll:plan`).
- Token cost of the whole setup (hooks, `CLAUDE.md`, MCP servers, plugins): `lll:tokens`. This skill covers only the pack's own listing.
- A skill for another plugin, or for one project only: `anthropic-skills:skill-creator` runs the full draft, test and benchmark loop. Use it for deep description tuning with variance analysis. The contract here binds only this pack.
- Install or manifest health: `/doctor` and `claude plugin validate .`.

## Modes

- **Guidance** (default): run the read-only tools below, explain the numbers, draft a description or outline inline, name the fix. Write no files, start no subagents.
- **Full**: only when asked to add, change or release a skill. Writes inside the pack, adds evals, runs every check, bumps the version when asked. Subagents are optional (`../../shared/agents.md`).

Read `../../shared/ground-rules.md` first. Other sessions often edit the pack at the same time: change only the skills you were asked about, and never commit, stash, reset or tag without the owner. Transcripts hold private text: the usage tool prints counts and names; `--prompts` also prints 100 characters of each prompt, so use it only for the owner's own history and keep it out of reports.

## Tools

Run from this skill's folder unless marked (root), which means the pack root (the folder with `.claude-plugin/plugin.json`).

| Command | Does |
|---|---|
| `node scripts/skill-usage.mjs [--all] [--since 90] [--prompts]` | Per skill: auto-picked calls, typed `/lll:` commands, sessions, last use. Skills never used. Other suites' skills called that overlap an lll name. Sessions with many prompts and no lll skill, with their tools. |
| `node scripts/lint.mjs [skill ...]` | Beyond `check.mjs`: missing "Not for", trigger list cut by a period, router line over 160 characters, references that point at each other, orphan references, scripts without `--selftest`, eval coverage, trigger phrases shared by two skills. |
| `node scripts/check.mjs` (root) | Contract and relative-link check. |
| `node scripts/gen-router.mjs` (root) | Rewrites `hooks/router.txt`, the skill map printed at session start. |
| `node scripts/selftest.mjs` (root) | Self-test of the pack scripts and hooks. |
| `claude plugin validate .` (root) | Manifest and skill validation. |
| `claude plugin details lll` | Component inventory and "Always-on" token cost. Needs the pack installed. |
| `claude plugin eval . --ablation none --tag trigger` (root) | Trigger evals. See `references/evals-howto.md`. |
| `claude plugin tag --dry-run` (root) | Shows the `lll--v<version>` tag it would create. |

## Steps

1. **Orient.** Find the pack root. Read `CONTRACT.md`, `evals/README.md`, `NOTICE`, and the `SKILL.md` of every neighbour the change could touch. State the goal in one line: new skill, fix a trigger, retire or merge, or release.
2. **Measure use.** `node scripts/skill-usage.mjs --all --since 90`. Read the header first: how many sessions used any lll skill. A new install has no history; say so and rely on the user's examples instead.
3. **Find the gaps.** Method and signals in `references/gaps.md`: typed more than auto-picked (the description is failing), long sessions with no skill, other suites' skills doing an lll job, skills never used. Write each gap as one line: pattern, how often, existing skill or none, proposed fix.
4. **Choose the smallest fix.** In this order: reword the description of the skill that should have fired; add a reference or mode to it; add a new skill only when the work has its own trigger, recurs, and no built-in or `anthropic-skills:*` skill already does it. Nothing to fix is a valid answer. Never delete a skill without the owner.
5. **Write or change the skill.** Follow `references/authoring.md` and `references/descriptions.md`. Test the real task without the skill first, so the skill answers observed failures and not guesses. Write facts you verified; hedge the rest. Sources: adapt only MIT or Apache-2.0 text and list it for `NOTICE`; everything else is inspiration, in your own words.
6. **Add evals.** Three positive trigger cases phrased as a busy person types, and one near-miss that belongs to a neighbour. How: `references/evals-howto.md`.
7. **Verify, in order.** `lint.mjs`, `check.mjs`, the skill's own `--selftest` scripts, `selftest.mjs`, `gen-router.mjs` (read the token count it prints), `claude plugin validate .`, `claude plugin details lll`, then the trigger evals. Fix every error, including ones in other skills that block the run, or name the exact blocker. A failing positive means the description is wrong: change the description, not the grader.
8. **Release, only when asked.** Checklist, version rule and tag in `references/release.md`. Tag and push only with the owner's go-ahead.
9. **Report.** Before and after: skills touched, lint and check results (real output), eval scores, always-on token change, what was not tested.

## Rules

- One concern per skill. Two skills that share a trigger phrase need a "Not for" line each, or one should absorb the other.
- Describe when to use a skill, never its workflow. A description that lists the steps invites the model to follow the summary and skip the body.
- No repository names, hostnames, client facts or product rules in any skill. Methods only.
- Point to built-ins (`/code-review`, `/security-review`, `/simplify`, `/init`, `claude-api`, `run`, `dataviz`) and to `anthropic-skills:*` instead of copying them.
- A script is allowed only for deterministic work: zero dependencies, Node 18 or newer, an assert-based `--selftest`.
- Do not edit `NOTICE`, `CONTRACT.md`, `hooks/` or another skill unless the owner asked for that file.
- The router and `house-style` text print at the start of every session; every character in a description is paid for in every session.

## Output

- Guidance: the usage table summary, the gaps list, and the proposed fix or draft description, in chat.
- Full: the changed files with paths, lint and check output tails, eval scores, always-on token cost before and after, version and tag status, and the lines for `NOTICE` if a source was adapted.
