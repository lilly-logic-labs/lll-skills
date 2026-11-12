# Skill contract

Every skill in this pack follows these rules. The checker agent and `scripts/check.mjs` enforce them.

## Location and names

- One folder per skill: `skills/<name>/SKILL.md`, with optional `skills/<name>/references/*.md`.
- `<name>` is lowercase, hyphenated and matches the frontmatter `name`. The plugin namespace makes it `lll:<name>`.
- Every relative path is written relative to the file that contains it (normal markdown semantics). From `SKILL.md`: `../../shared/findings.md`, `references/x.md`. From `references/x.md`: `../../../shared/findings.md`, `./other.md`, `../scripts/tool.mjs`.
- References are one level deep: `SKILL.md` links to `references/x.md`; a reference never sends the reader on to a third file except `../../shared/*.md` or a vendored folder inside the same skill.
- Shared rules live in `shared/` at the plugin root. Link them as `../../shared/<file>.md`. Never copy their text into a skill.

## Frontmatter

Only these keys, so the skill also loads in Codex, Cursor and other agents that read `SKILL.md`:

```yaml
---
name: <name>
description: <what it does>. Use when <trigger phrases the user would type>. Not for <nearest neighbour skill and when to use that instead>.
metadata:
  origin: lll
---
```

- `description` is at most 400 characters. It is the only text the model sees before choosing a skill, so it carries the trigger phrases. Lead with the verb and the object, then the triggers, then the "Not for" line.
- No `${CLAUDE_*}` variables, no `$ARGUMENTS`, no tool names that exist only in Claude Code inside shell code blocks.

## Body

- `SKILL.md` stays under 300 lines and never exceeds 500. Depth goes into `references/`.
- Required sections, in this order:
  1. `# <Title>` and a two-line statement of what the skill delivers.
  2. `## When to use` and `## When not to use` (name the other `lll:*` skill to use instead).
  3. `## Modes`: **guidance** (default: answer, review or advise inline, write no files, start no subagents) and **full** (only when the user asks for a full, whole-repo, end-to-end or written-report run). Skills that are always a single inline action may say "Single mode" instead.
  4. The steps, as a numbered list.
  5. `## Output`: what the user gets (chat summary, report path, branch, files).
- Agent-neutral words: "parent" is the agent running the skill; "subagent" is whatever delegation the host offers. If the host has none, run the subagent briefs one after another.
- Stack-neutral first: describe the check or method in general terms, then add per-stack notes (web, mobile, desktop, backend; JavaScript/TypeScript, Python, Go, Rust, Java/Kotlin, Swift, PHP, Ruby, .NET) in references.
- Learn the project at runtime from its own CLAUDE.md, AGENTS.md, README, manifests and docs (`../../shared/stack-detect.md`). Never hard-code a particular repository.
- Plain imperative sentences. One idea per sentence. No filler, no marketing tone, no emoji.

## Behaviour every skill keeps

- Follow `../../shared/ground-rules.md`: project rules win, read before acting, no remote or production writes without the owner, secrets reported by location only, systems we own or have written permission to test.
- Skills that find defects use `../../shared/findings.md` for the finding format and verdicts and `../../shared/fix-phase.md` to fix confirmed findings.
- Skills that write a report use `../../shared/report.md`.
- Subagent model choice follows `../../shared/agents.md`.
- Claude Code built-in skills (`/code-review`, `/security-review`, `/simplify`, `/init`, `claude-api`, `run`, `dataviz`, `artifact-*`) and `anthropic-skills:*` (pdf, docx, xlsx, pptx, humanizer, skill-creator, docs) stay installed. Point to them where they fit; never duplicate them.

## Sources and licences

- Adapting text from an MIT or Apache-2.0 source is allowed: add a line to `NOTICE` naming the source, its licence and the files that used it.
- A source with no licence, or one that is not MIT or Apache-2.0, is inspiration only. Write every sentence in your own words.
- Never copy material from a client or product repository into this pack.

## Evals

- Each skill has `evals/<name>/` with trigger cases: prompts that must load this skill and at least one near-miss prompt that must load a different skill. Format: see `evals/README.md`.
