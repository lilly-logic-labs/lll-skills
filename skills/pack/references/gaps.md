# Finding gaps

A gap is a task where a skill should have helped and did not fire, or fired and misled. Transcripts show the first kind well, the second only through the user's corrections.

Contents: Signals · Method · Triage · Record · Retire or merge · Limits

## Signals

| Signal | Where it shows | Likely cause |
|---|---|---|
| A skill is typed (`/lll:x`) more often than it is auto-picked | usage tool, "typed more often than auto-picked" | Description does not match how people ask |
| Long sessions (many prompts) with no lll skill | usage tool, "sessions with no lll skill", with their tools | No skill for that work, or none that triggers |
| Another suite's skill called where an lll skill exists | usage tool, "other skills called", overlap column | Vocabulary or "Not for" collision; theirs is better or ours is weaker |
| A skill never used in 90 days | usage tool, "never used" | Redundant, mis-described, or a rare safety net (security, release) |
| The same shell commands and edit pattern across sessions | gap tools and shell commands lists | A repeated workflow that deserves a skill or script |
| The user corrects the agent ("you forgot X", "use the skill") | `--prompts` view or the user's own words | A rule is missing, or the skill did not load |

## Method

1. Window: `--since 90`, all projects, so one busy project does not dominate. Run `--prompts` to see how the quiet sessions began.
2. Group the no-skill sessions by what they did: tools and shell commands first, then the first prompts. Name the groups in plain words ("deploy fixes", "writing release notes", "SEO audit").
3. For each group, look for the existing skill that owns it (the router map, `node scripts/lint.mjs`).
4. Read one example prompt from a group and compare its words with that skill's "Use when" phrases. The difference is the fix.
5. Ask the user, in one question, for the tasks that hurt most. Their list beats inference, and it covers the machine-local limits below.

## Triage

For each gap:

1. A skill exists and should own it -> **description fix**: add the user's phrase, narrow a rival, sharpen "Not for". Add an eval for the prompt.
2. A skill exists but its method is wrong or missing a step -> **content fix** in that skill or a reference.
3. A built-in or `anthropic-skills:*` skill covers it -> **point to it** from the nearest lll skill's "When not to use". No new skill.
4. Nothing covers it and it recurs (three or more times in 90 days, or one costly failure) -> **new skill**, only if it passes the authoring fit test; otherwise a mode or reference in a neighbour.
5. One-off or personal -> **nothing**. Say so.

## Record

One line per gap, in chat (write a file only if asked):

```
gap: <pattern in plain words> | seen: <n sessions in 90 days> | owner today: <lll:x | built-in | none> | fix: <description | content | point-to | new skill | none> | eval: <prompt to add>
```

Rank by frequency times cost of the failure. Propose at most three changes per round; a pack that changes in many places at once cannot be evaluated.

## Retire or merge

A skill is a candidate when it was unused for 90 days, no one typed it, no safety role exists, and a neighbour covers the same trigger. Propose the merge (move its useful part into the neighbour's reference, drop its description from the router). Never delete without the owner. A major version bump follows a rename or removal.

## Limits

- Transcripts exist only for this machine and only for the retention period. A fresh install or a new machine shows nothing; say that and ask for examples.
- Auto and typed counts are lower bounds. Skills run inside subagents appear in the subagent transcripts; the tool includes them.
- Rare does not mean bad. A security or release skill can fire twice a year and still be right.
- Prompts can hold private text. Show 100 characters at most, mask keys, and keep them out of committed files.
