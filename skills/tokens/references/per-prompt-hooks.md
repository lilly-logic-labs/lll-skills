# Per-prompt and per-event hook injections

A hook that prints text on every prompt is usually the largest hidden cost in a setup. The text becomes part of the conversation, so it is written to the cache once and re-read at the cache-read price on every later turn, it takes room in the context window, and it brings the next compaction closer. A 400-token reminder over 150 prompts adds 60k tokens of history and several thousand cache reads.

Contents: Which events add text · Find them · Measure them · Fix them · Safe patterns · Verify

## Which events add text to context

| Event | Output enters context | Frequency |
|---|---|---|
| `SessionStart` | yes (stdout or `additionalContext`) | on startup, resume, clear and after each compaction |
| `UserPromptSubmit` | yes | every prompt |
| `PostToolUse`, `PreToolUse` | when the hook returns context or feedback | every matching tool call |
| `SubagentStart` | yes, into the subagent's context | every subagent started, which multiplies in agent-heavy work |
| `Stop`, `SubagentStop` | only when the hook blocks with a reason | end of turn |
| `PreCompact`, `Notification` | usually no | rare |

The transcripts record injected text as `hook_additional_context` attachments with the hook event, which is what `node scripts/usage.mjs` groups in its hook table.

## Find them

1. The script's hook table: event, the first 48 characters of the text, fires, average and total tokens. The text prefix identifies the hook.
2. `hooks` blocks in `~/.claude/settings.json`, the project's `.claude/settings.json` and `.claude/settings.local.json`.
3. Plugin hooks: for each enabled plugin (`claude plugin list`), the `hooks/hooks.json` in its folder under the Claude config directory's `plugins/cache/`. `claude plugin details <plugin>` lists the hook events it registers.
4. Read each hook command to see exactly what it prints and under which condition.

## Measure them

- Tokens per prompt = average tokens of the `UserPromptSubmit` rows, summed over hooks. The script prints "PER-PROMPT hooks add about N tokens to every prompt".
- Window cost = fires times average tokens, plus roughly (turns remaining) cache reads of the same text. Ranking by total tokens is enough.
- For `SubagentStart`, multiply by the number of subagents your workflow starts; the script shows the fire count.

## Fix them

Pick the cheapest change that keeps the behaviour the owner values:

1. **Delete the reminder** if the instruction is already in `CLAUDE.md` or a skill. Duplicated rules are the common case.
2. **Move to `SessionStart`** if it only needs to be stated once. Remember it re-fires after each compaction, which is usually right.
3. **Inject on change only.** The hook keeps a small state file (session id plus a hash of what it printed) and prints nothing when nothing changed. Mode-style hooks ("mode is X") only need to print when the mode changes or after a compaction.
4. **Shorten** to one line of fewer than 50 tokens. Name the rule, not the explanation.
5. **Disable the plugin or the hook** if the owner does not value it. For a plugin, `claude plugin disable <name>`; for a settings hook, remove that entry. Use the `update-config` skill for settings edits.
6. **Use a stronger place for always-on rules**: a short line in `CLAUDE.md` costs the same every session but is not repeated per prompt.

Things not to do: do not remove a hook that enforces a guard (blocking destructive commands, secret scans) just because it prints; make it print only on a block. Do not edit a third-party plugin's files in the cache (they are overwritten on update); change the plugin's own setting if it has one, or disable it.

## Safe patterns for a hook the owner writes

Print only when needed, keep state outside the conversation, and print nothing otherwise. Sketch (Node, cross-platform):

```js
// UserPromptSubmit: emit the reminder once per session and again only after it changes
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
const input = JSON.parse(readFileSync(0, 'utf8'))          // hook input has session_id
const text = 'Rule: run tests before saying done.'
const mark = join(tmpdir(), `reminder-${input.session_id}`)
if (!existsSync(mark) || readFileSync(mark, 'utf8') !== text) { writeFileSync(mark, text); console.log(text) }
```

For a `SessionStart` hook, prefer `matcher` values so it does not run where it is not wanted (startup, resume, clear, compact).

## Verify

Start a new session, send three prompts, and run `node scripts/usage.mjs --session <id-prefix>`: the hook row should show the expected number of fires and the new average. Hook changes apply to new sessions, so measure there. If a behaviour the hook enforced regresses (the agent forgets a rule), the cut was too deep: restore the rule once at `SessionStart` instead of deleting it.
