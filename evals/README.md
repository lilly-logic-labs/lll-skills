# Evals

Run with the Claude Code eval runner from the repository root:

```
claude plugin eval . --ablation none --runs 1            # all cases, trigger checks scored
claude plugin eval . --ablation none --tag trigger       # trigger cases only
claude plugin eval . --tag outcome                       # outcome cases, with the no-plugin baseline arm
```

`--ablation none` matters for trigger cases: under the default with/without run, `tool_used: Skill` graders are shown as a plugin-fired indicator and not scored.

## Layout

One folder per case: `evals/<skill>/<case>/prompt.md` plus `graders/*.md`.

### Trigger case (every skill: at least two positive prompts and one near-miss)

`evals/audit/trigger-db-health/prompt.md`:

```markdown
---
max_turns: 5
allowed_tools: [Skill, Read, Glob, Grep]
tags: [trigger]
---

Can you check the health of the database in this project? Indexes, migrations, that kind of thing.
```

`evals/audit/trigger-db-health/graders/loads-audit.md`:

```markdown
---
type: tool_used
tool: Skill
input_match: "lll:audit"
min: 1
---
```

Near-miss case: the same shape, a prompt that belongs to a neighbouring skill, and a grader with `input_match: "lll:<neighbour>"` and `min: 1` (or `input_match: "lll:audit"` with `min: 0` and `max: 0`; without `min: 0` the runner defaults to `min: 1` and the grader can never pass).

### Outcome case (security and audit)

`prompt.md` names a fixture repository and asks for the work; graders use `type: regex` on the last message, `type: file_exists` for the report, and `type: llm` with `criteria:` for judgement.

Grader types the runner accepts: `regex` (`pattern`, `target`, `match: contains | not_contains | count:N`), `tool_used` (`tool`, `input_match`, `min`, `max`), `tool_order` (`before`, `after`), `file_exists` (`path`, `exists`), `llm` (`criteria`, `focus`), `baseline`. Every grader takes `weight`.
