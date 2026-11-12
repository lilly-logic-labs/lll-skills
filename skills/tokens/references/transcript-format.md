# Claude Code transcript format and `usage.mjs`

Transcripts are JSON Lines files, one per session, under the Claude config directory (default `~/.claude`, or the folder set by the config-directory environment variable) at `projects/<project-slug>/<session-id>.jsonl`. The slug is the project's absolute path with every non-alphanumeric character replaced by `-` (`C:\work\app` becomes `C--work-app`). Subagent transcripts sit in `projects/<slug>/<session-id>/subagents/agent-*.jsonl`. The format is not a public contract: fields observed in current versions are listed here, and the script ignores what it does not recognise.

Contents: Entry types · Usage fields · Pitfalls · What the script prints · Ad hoc questions · Privacy

## Entry types used

| `type` | Fields used |
|---|---|
| `assistant` | `message.id`, `message.model`, `message.usage`, `message.content[]` blocks (`text`, `thinking`, `tool_use` with `id`, `name`, `input`) |
| `user` | `message.content` as a string or blocks; `tool_result` blocks with `tool_use_id` and `content`; `isMeta`, `isCompactSummary`; typed slash commands appear as `<command-name>/name</command-name>` text |
| `attachment` | `attachment.type`: `hook_additional_context` (`hookEvent`, `content[]`), `hook_success` (runs), `instructions` (`files[]` with `path`, `type`, `content`), `skill_listing` (`content`, `skillCount`, `names`, `isInitial`), `prompt_snapshot` (`systemPrompt[]`), `deferred_tools_delta`, `mcp_instructions_delta`, `agent_listing_delta`, `session_context` |
| `system` with `subtype: compact_boundary` | `compactMetadata` with `trigger` (`auto` or `manual`), `preTokens`, `postTokens` |
| `cost-state` | `totalCostUSD`, `modelUsage` (cumulative per session) |
| skipped | `api-request*`, `file-history-*`, `queue-operation`, `last-prompt`, `mode`, `permission-mode`, `ai-title`, `tools-used` |

## Usage fields

`message.usage` carries `input_tokens` (fresh, uncached), `cache_creation_input_tokens` (written to cache; `cache_creation.ephemeral_5m_input_tokens` and `ephemeral_1h_input_tokens` split it by lifetime), `cache_read_input_tokens` (re-read from cache at a fraction of the input price) and `output_tokens`. Context size for one request = input + cache creation + cache read.

Cost units in the script weigh them as input-token equivalents: input 1, cache write 1.25 (5 minute) or 2 (1 hour), cache read 0.1, output 5. These ratios follow the published price structure of current Claude models. They compare setups; they are not a bill. `cost-state.totalCostUSD`, when present, is the logged cost and is shown separately.

## Pitfalls the script handles

- **One API message is split over several `assistant` entries** (one per content block) that repeat the same `message.id` and usage. Summing every entry multiplies the spend several times. The script keeps one usage record per message id (the maximum of each field).
- `tool_use` and `tool_result` blocks are deduplicated by id.
- Transcripts can be hundreds of megabytes. The script streams line by line and skips large irrelevant entries by prefix before parsing.
- Subagent work is in separate files. The script reports it separately and as a share of total cost.
- Context-sized fields like `attachment.content` contain the real text; the script counts lengths and prints none of it.
- Token estimates for tool results and context files use characters divided by four. Images are counted as about 1000 tokens each.
- Hook rows are keyed by event plus the first 48 characters of the text, so two hooks that print similar openings merge; read the hook commands to separate them.
- Compaction rebuilds the prefix, so the session-start rows are the first occurrence in each session, not a sum.

## What the script prints

Run `node scripts/usage.mjs` (flags: `--all`, `--project <text>`, `--since <days>`, `--session <id-prefix>`, `--top <n>`, `--no-subagents`, `--dir <projects-folder>`, `--json`). Sections:

1. SPEND: tokens by class, cache hit ratio, cost units, subagent share, largest request, logged cost.
2. SESSIONS: per session calls, prompts, peak context, hit ratio, compactions, output, cost units, logged cost.
3. TEXT INJECTED BY HOOKS: by event and text prefix; per-prompt total.
4. SESSION-START CONTEXT: system prompt, each instruction file, skill listing, deferred tools, MCP instructions, agents, session context, start hooks.
5. TOOL RESULTS BY SIZE and LARGEST SINGLE OUTPUTS: tool name and a short target (last path segments or first two command words).
6. FILES READ 3+ TIMES IN ONE SESSION.
7. COMPACTIONS: count, automatic share, average context before.
8. SKILLS, COMMANDS, MCP: Skill tool calls, typed slash commands (including `/lll:` commands), MCP calls per server, servers and skills listed but unused in the window, with their listing cost.

## Ad hoc questions

For anything else, write a short Node or `jq` filter over the JSONL; keep to counts and names. Examples: sessions per day, most common first words of Bash commands, which tool precedes each compaction, prompts per session. Do not print message bodies into the conversation.

## Privacy

Transcripts contain source code, secrets that appeared in outputs, and personal data. Read them locally only. Do not upload them to a third-party service and do not copy content into reports. When a table lists a file or command, it is the name only. If the user shares a report outside the team, review the paths in it first.
