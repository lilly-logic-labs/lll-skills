# Where session context comes from

Everything below is read by the model at the start of every session (and again after every compaction or `/clear`, which rebuilds the prefix). Sizes use tokens of about four characters. Real numbers for this machine come from `node scripts/usage.mjs` (SESSION-START CONTEXT) and from the user's `/context`.

Contents: Sources and how to measure each · Budgets · Commands · What `/doctor` does not tell you

## Sources and how to measure each

| Source | Loaded when | Measure | Typical size | Cut |
|---|---|---|---|---|
| System prompt and built-in tool definitions | always | script table "system prompt" | 2k to 9k | not controllable; choose output style and model, not the prompt |
| User `CLAUDE.md`, `RTK.md`-style imports, `rules/*.md` | every session | script table rows of kind `User`; `wc -c` | 0.3k to 5k each, rules folders can reach 10k+ | trim, de-duplicate with project files, scope rules by path |
| Project `CLAUDE.md` (root) | every session in that project | kind `Project`; `wc -c CLAUDE.md` | 1k to 6k | keep around 200 lines; move detail to docs or skills |
| Nested `CLAUDE.md` in subfolders | when files in that folder are read | `git ls-files '**/CLAUDE.md'` | on demand | good place for module-specific rules |
| `@file` imports inside any instruction file | at launch, up to a few hops | follow the `@` lines | whole imported file | link by path in prose instead of importing, unless always needed |
| Memory index (`MEMORY.md` of auto-memory) | every session | kind `AutoMem` | 0.1k to 2k | one short line per memory; prune stale ones |
| Skill listing | every session | script table "skill listing"; `claude plugin details` | about 60 to 120 tokens per skill | disable unused plugins and skills; shorten own descriptions |
| Deferred tool names (MCP tools not yet loaded) | every session | script "deferred tool names" | about 9 tokens per tool | remove idle servers |
| MCP server instructions | every session | script "MCP server instructions" | 0.1k to 2k per server | remove or narrow servers |
| Full MCP tool schemas | when a tool is loaded or when tools are not deferred | `claude mcp list`, `/context` | 200 to 1000 per tool | prefer CLIs; project-scope servers |
| Agent (subagent) listing | every session | script "agent listing" | about 85 per agent | remove plugins with many agents you do not use |
| Output style | every session | settings `outputStyle` | small | choose a terse style (also cuts output tokens) |
| Session context (git status, user) | every session | script row | 0.2k to 1k | keep the working tree clean; big `git status` lists cost tokens |
| SessionStart hook output | session start, after `/clear`, and after each compaction | script "SessionStart hook text" | 0.2k to 2k | shorten; remember it repeats after every compaction |
| Skills invoked during the session | when loaded | `Skill tool calls` in the script | 1k to 5k each, once | keep SKILL.md short; depth in references |

Hooks themselves (the code) cost nothing; only the text they print into the conversation does. `claude plugin details` says "harness-only, no model context cost" for hooks for that reason, so check the printed text separately (see the per-prompt hook notes).

## Budgets

Rough targets for a setup that stays lean. These are guides, not rules; a heavy domain may need more.

| Item | Target |
|---|---|
| Total fixed context before the first prompt | under 15k tokens, under 8k for a lean setup |
| Root `CLAUDE.md` | about 200 lines, under 3k tokens |
| User-level instructions plus rules | under 3k tokens |
| Memory index | under 1k tokens |
| Skills listed | only those used in the last month; each description under 400 characters |
| MCP servers | only those used weekly; the rest project-scoped or removed |
| Text injected per prompt by hooks | 0 tokens; if needed, under 50 |
| Single tool output | under 5k tokens; cap or slice anything larger |

## Commands

```
claude plugin list                       # enabled and disabled plugins
claude plugin details <plugin>           # component inventory, "Always-on: ~N tok", per-component table
claude mcp list                          # configured MCP servers and health
node scripts/usage.mjs --project <text>  # session-start context, hooks, tools, cache, compactions
```

Files to measure with `wc -c` (characters divided by four is the token estimate) or the script: the user's `~/.claude/CLAUDE.md`, `~/.claude/rules/`, each imported `@file`, the project's `CLAUDE.md` and nested ones, the auto-memory folder's index, the frontmatter of each `~/.claude/skills/*/SKILL.md`, and every `settings.json` (`~/.claude/`, project `.claude/settings.json`, `.claude/settings.local.json`) for `hooks`, `enabledPlugins`, `mcpServers` and `outputStyle`.

The user runs `/context` themselves for the live breakdown by category; paste it into the conversation to cross-check the script.

## What `/doctor` does not tell you

`/doctor` checks the installation, configuration validity and some size warnings. It does not read your history, so it cannot show how much text hooks inject per prompt, which tools produce the large results, how often context is compacted, the cache hit ratio, how much subagents cost, or which skills and servers you never use. This skill computes those from the transcripts.
