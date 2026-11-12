# Habits that keep spend down

Slash commands belong to the user: tell them what to run, do not run them for them. Everything else the agent can do itself.

## For the user

| Moment | Do |
|---|---|
| Starting an unrelated task | `/clear`, or a new session |
| Finished exploring, about to build | `/compact` with a line on what to keep ("keep the plan, the file list and the open questions") |
| Context above about 60% and the task is not done | `/compact` now rather than at the automatic limit |
| Task done, new topic next | write what matters to a notes file or memory, then `/clear` |
| Session idle for a while | decide: finish, or `/clear`; the cache will have expired |
| Starting a heavy task | pick the model and effort first; changing them later loses the cache |
| Setup feels heavy | `/context` and paste it; then ask for the token audit |
| Editing `CLAUDE.md`, memory or settings | do it between sessions |

## For the agent

- Read slices, not files: ranges, `head`, counts first, then the lines that matter. State what you expect to find before a wide search.
- One wide subagent for broad exploration beats ten narrow ones, and beats reading thirty files in the parent.
- Batch independent tool calls in one turn; each extra turn re-reads the whole context.
- Do not re-read a file already read this session unless it changed; keep notes of facts.
- Do not echo large outputs back; summarise and cite `path:line`.
- Keep replies short: lead with the answer, no preamble or recap, code and paths over description.
- Stop a command that is producing noise; add filters before re-running.
- Ask before pulling very large data (full logs, whole databases, big binary files) into the conversation.

## Signals that a habit is costing money

- Cache hit ratio under about 90% in long sessions: idle gaps, prefix edits or model switches.
- More than a handful of compactions per day: sessions too long, or large outputs.
- The same file read many times in one session.
- One tool dominating result tokens: a missing slice or filter.
- Peak request context near the limit on routine tasks: noisy hooks or oversized instruction files.
- Subagent share of cost very high on small tasks: too many or too chatty subagents.
