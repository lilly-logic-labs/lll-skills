# Subagents

## When

- Guidance mode: no subagents unless the user asks.
- Full mode: subagents are allowed because the user asked for a full run. Use the fewest that cover the scope. One wide brief beats many narrow ones.
- If the host has no subagents, run each brief yourself, one after another, and keep notes in a scratch file outside the repository.

## Model choice

| Work | Model tier |
|---|---|
| Search, file location, mechanical edits, inventory | small and fast (Claude: `haiku`) |
| Implementation, routine lenses, tests, docs, routine review | mid (Claude: `sonnet`) |
| Security, money, auth, database and migrations, verification of findings, architecture, ambiguous debugging | strongest (Claude: `opus`) |

Never use a model tier the owner has excluded in their own instructions.

## Brief

Subagents see only their brief. Every brief contains:

1. The goal and the exact scope (file list or unit list).
2. The stack-detect block.
3. The ground rules that apply (`ground-rules.md`), pasted as lines, not as a link.
4. What has already been ruled out.
5. The output format (`findings.md` block, or the skill's own format) and a final line: `files read: <n>; unread in scope: <paths or none>`.

## After

- Treat a subagent's report as a lead until verified. Its mistakes look as confident as its findings.
- Merge, dedupe and verify in the parent.
