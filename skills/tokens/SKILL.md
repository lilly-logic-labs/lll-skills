---
name: tokens
description: Measure and cut what Claude Code spends. Finds session-start context, CLAUDE.md and memory size, skill and MCP listings, per-prompt hook text, cache misses, big tool outputs and unused plugins. Use when asked about token use, context bloat, cost, running out of context, Claude is slow, optimize my setup. Not for install health (/doctor), LLM feature cost (lll:ai) or skill usage (lll:pack).
metadata:
  origin: lll
---

# Tokens

Finds where a Claude Code setup spends tokens, ranks the waste, applies the cuts the owner approves, and shows a before and after table with measured numbers.
`/doctor` asks whether the install is healthy. This asks what each session costs, why, and what to remove.

## When to use

- "Why is this so expensive", "I keep hitting the context limit", "Claude is slow", "token usage", "cut my context", "optimise my setup", "what is eating my tokens".
- After adding plugins, MCP servers, skills or hooks, or when `CLAUDE.md` or memory has grown.
- Before a long autonomous run, to check the fixed cost per turn.
- A teammate asks for the cost of a workflow or a plugin before adopting it.

## When not to use

- Install, auth or settings validity: `/doctor`. Run it first if Claude Code itself misbehaves.
- Cost of an LLM feature inside a product (prompts, caching in the product's API calls, evals): `lll:ai` (and the `claude-api` skill).
- Which skills of the lll pack get used and which are missing: `lll:pack`.
- Trimming a prompt or reply style for one task: ask for it directly. This skill is about the standing setup.

## Modes

- **Guidance** (default): explain numbers the user pasted (`/context` output, a bill), answer "what does X cost", or name the likely biggest cuts from what is visible. Running `node scripts/usage.mjs` is allowed, because it only reads and prints counts. Write no files, change no config, start no subagents.
- **Full**: only when asked to audit, optimise, or write a report. Measures the whole setup and the transcripts, proposes ranked cuts, applies the approved ones, re-measures and writes the before and after table. Subagents are optional (`../../shared/agents.md`; the mid tier suffices).

Read `../../shared/ground-rules.md` first. Transcripts hold private conversation text. The script prints only counts, tool names and file names; never paste message text into a report, never upload a transcript to any service, and keep the output in the conversation or the owner's repository.

## Steps

1. **Scope the question.** Which project or all projects, which window (default 30 days), and the symptom: money, context filling fast, slow turns, or just tidiness. Tell the user to run `/context` in their own session and paste the result; slash commands are theirs to run, and it shows the live breakdown that the transcripts cannot.
2. **Measure spend.** Run `node scripts/usage.mjs` (current project), `--project <text>`, or `--all`, with `--since <days>`, `--top <n>` and `--session <id>` as needed. Read the header first: cache hit ratio, share of cost in subagents, largest request context, number of compactions. Format and caveats are in `references/transcript-format.md`. For large histories the script streams and may take a minute.
3. **Inventory the fixed context** that every session pays before the first prompt (`references/context-sources.md`): global, project and nested `CLAUDE.md` plus imported files, rules folders, memory index, skill listing, MCP server instructions and deferred tool names, agent listing, output style, session-start hook text. The script's SESSION-START CONTEXT table gives sizes from real sessions. Add what it cannot see: `claude plugin list`, then `claude plugin details <plugin>` for each enabled plugin (it prints "Always-on: ~N tok" and a per-component table), frontmatter size of user skills, `claude mcp list`, and the `hooks` block of every settings file.
4. **Find per-prompt injections.** Hooks on `UserPromptSubmit` (and `SubagentStart`, `PostToolUse` with context output) add text on every prompt or tool call. The text stays in the conversation and is re-read on every later turn, so it is usually the largest hidden cost. The script's hook table shows fires, average and total tokens per source. Trace each to its owner with `references/per-prompt-hooks.md`.
5. **Find waste in the work itself.** From the tables: tools whose results are large, single outputs over about 5k tokens, files read three or more times in one session, sessions with many compactions, low cache hit ratio or many cache writes (long idle gaps, edits to prefix files, model switches), subagent share, skills and MCP servers listed but never used. Conversation habits that cause these are in `references/habits.md`.
6. **Rank the cuts.** Estimate each as tokens per session times sessions per week, with risk and effort. Pick from `references/cuts.md`: remove per-prompt text first, then unused plugins, skills and servers, then trim `CLAUDE.md` and memory, then cap tool output, then model and habit changes. Label every estimate "projected". Never give a savings number you did not measure; the unbuilt version has no baseline.
7. **Apply with the owner's OK.** List each edit as file, what changes, tokens removed. Copy the original to the scratchpad or a backup path first, then edit. Use the `update-config` skill for `settings.json`. Disable rather than delete when unsure. If the owner batches edits to `CLAUDE.md`, memory or settings for the start of a session (editing them mid-session invalidates the prompt cache), write the edits as a patch list and stop. Most changes apply from the next session; say so.
8. **Re-measure.** After a few real sessions, run the script again with the same flags and fill the table in `references/before-after-template.md`: fixed context tokens, tokens per prompt from hooks, cache hit ratio, cost units per session, compactions. Mark each line measured or projected. If a number did not move, say so and revert the change if it hurt quality.
9. **Leave habits.** Three to five lines the owner can follow (`references/habits.md`): when to `/clear`, when to `/compact` and with what instruction, which model for which work, how to cap output.

## Rules

- Measure before cutting and after. Estimates from characters divided by four are for ranking only.
- Never cut content that guards safety, correctness or data (security rules, destructive-command guards, migration rules) to save tokens. Move it to a path-scoped file or a skill instead, so it loads when needed.
- A cheaper setup that makes the agent worse is not cheaper. Keep a short quality check for each cut: re-run one representative task and compare results.
- Do not touch the project's rules sections. Propose moving them and let the owner decide.
- Do not disable a plugin because it is unused in a short window; check how often it triggers and what it guards.

## Output

- Chat summary: the three biggest costs with numbers, ranked cuts with projected savings, what was applied, what needs the owner, and the exact commands the user should run themselves (`/context`, `/compact`, `/clear`).
- Full mode: a before and after table (`references/before-after-template.md`), written to `docs/audits/<date>-tokens.md` when the project keeps audits, otherwise shown in chat. Backup paths for every edited config file.
