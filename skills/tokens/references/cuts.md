# Catalogue of cuts

Rank by tokens saved per session times sessions, then by risk. Every estimate is "projected" until re-measured. Apply only what the owner approves; most changes take effect from the next session.

Contents: 1 Per-prompt text · 2 Plugins, skills and agents · 3 MCP · 4 Instruction files and memory · 5 Tool output · 6 Subagents and models · 7 Context hygiene · 8 Cache · 9 Output tokens

## 1. Per-prompt text (usually first)

- Remove, shorten, or move each per-prompt hook text to `SessionStart` or to a change-only pattern (see the per-prompt hook notes). Savings: tokens per prompt times prompts, plus later cache reads.
- `SubagentStart` text: remove or shorten, since it repeats for every subagent.
- `PostToolUse` hooks that echo large text on every tool call: print only on a problem.
- Risk: the agent loses a behaviour the hook enforced. Mitigation: keep a one-line rule in `CLAUDE.md`.

## 2. Plugins, skills and agents

- Disable plugins with no use in the last 30 days: `claude plugin disable <name>` (reversible, `claude plugin enable <name>`). Check "Always-on" with `claude plugin details <name>` and the unused-skills table from the script.
- Remove duplicates: two plugins that ship the same skill, or a wrapper suite and the pack that replaced it.
- User skills in the Claude config directory's `skills/` folder: remove unused ones, or move rarely used ones into a plugin that stays disabled until needed. Shorten own descriptions under 400 characters; the description is the only part that is always loaded.
- Skills used only by typing their command can be hidden from automatic selection where the host supports it (in Claude Code, the `disable-model-invocation` frontmatter key; confirm in current docs). That removes the listing cost and keeps the command.
- Many bundled agents add about 85 tokens each to every session; disable plugins that bring dozens you never start.
- Risk: a skill that fires rarely but matters (security, release). Check usage over a long window and ask before disabling.

## 3. MCP servers and connectors

- Remove servers not called in the window (`claude mcp remove <name>`, or disable the connector in its settings). The script lists servers present but never called.
- Move servers needed by one project into that project's `.mcp.json` instead of the user scope.
- Where a CLI exists (`gh`, `aws`, `gcloud`, `wrangler`, `kubectl`), prefer it: its output can be sliced with `head`, `jq` and flags, MCP results often cannot.
- Large MCP results: lower the MCP output limit where the host allows it (documented as `MAX_MCP_OUTPUT_TOKENS`; confirm), and ask tools for fields and limits.
- Deferred tool loading is already the default for large tool sets: keep it, and do not force all schemas into the prompt.

## 4. Instruction files and memory

- Root `CLAUDE.md` about 200 lines at most. Move per-module rules to nested `CLAUDE.md` files (loaded when that folder is touched), long procedures to skills (loaded when used), reference tables to `docs/` (linked by path, read on demand).
- Replace `@file` imports with plain path mentions unless the file must always be in context.
- Remove duplicates between user and project files, and between `CLAUDE.md` and rules folders.
- Rules that only apply to some files: scope them by path where the host supports path-scoped rules, or put them in a nested file.
- Compress wording: drop filler, merge bullets, keep commands and paths exact. Never paraphrase code blocks, commands or identifiers. Keep a backup of the original.
- Memory: delete stale entries, merge near-duplicates, keep the index one short line per memory. Use `lll:docs` to find entries the code now contradicts.
- Do not touch the owner's rule text without asking; propose which rules to move and where.

## 5. Tool output

- Slice reads: `Read` with offset and limit, `sed -n '40,80p'`, `Grep` with a head limit or count first, `rg -m`, `git log -n 20 --oneline`, `git diff --stat` before a full diff, `ls` before `find`.
- Command output: pipe through `head`, `tail`, `grep`, `jq` filters. A command output proxy that condenses output (for example `rtk`) is worth keeping on; check it does not hide failures.
- Do not read lockfiles, build output, minified bundles, large logs or generated code; grep them.
- Set a cap on shell output length where the host allows it (documented as `BASH_MAX_OUTPUT_LENGTH`; confirm).
- Images and PDFs: crop and downscale screenshots, read PDFs by page range, avoid full-page captures when a region will do.
- Repeated reads of one file: read once, note the facts, or use a subagent to summarise.

## 6. Subagents and models

- Subagents keep wide reads (searching a codebase, reading many files) out of the parent context and return a summary; use them for exploration, not for small edits. Each subagent has its own fixed cost, so one wide brief beats many narrow ones (`../../../shared/agents.md`).
- Check what subagent starts inject (`SubagentStart` hooks) and the subagent share of cost in the script.
- Choose the model by task: small and fast for search and mechanical edits, mid for implementation, strongest for security, money, migrations and ambiguous debugging. Lower the reasoning effort for routine work (`/model` and `/effort` are the user's commands).
- Switching model mid-session loses the prompt cache for that model; decide at the start of a task.

## 7. Context hygiene

- `/clear` between unrelated tasks. The old conversation costs on every later turn and adds nothing.
- `/compact` at a natural boundary (after research, before implementation) with an instruction saying what to keep. Automatic compaction near the limit fires at an arbitrary moment and loses detail; manual compaction earlier is cheaper and safer. Do not compact in the middle of debugging.
- For long tasks, write decisions and open items to a notes file, `/clear`, and resume from the file.
- Prefer a new session over resuming a very long one when the history no longer matters.

## 8. Cache

- The cache covers the stable prefix (system prompt, tools, instruction files, earlier turns). Any change to the prefix, such as editing `CLAUDE.md`, memory, settings, enabling a plugin, adding an MCP server or switching model, invalidates the cache from that point and the next turn pays full write price.
- An idle gap longer than the cache lifetime (five minutes by default, longer for some plans and settings) means the next turn rewrites the whole context. Avoid pausing in the middle of a big session when the work can be finished or cleared.
- Keep time-varying text (dates, counters, timestamps) out of instruction files and hooks that sit in the prefix.
- Batch edits to instruction files and settings for the start of a session.
- For API applications you build, caching and token counting belong to the `claude-api` skill and `lll:ai`.

## 9. Output tokens

Output tokens cost several times more than input tokens. A terse reply style (an output style or a short rule) cuts output and speeds turns. Keep code, commands and error text exact; shorten prose, preambles, recaps and restatements. Ask for diffs rather than whole files when only a few lines change.
