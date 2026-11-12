# Trigger evals for a skill

Format and grader types are in `evals/README.md` at the pack root. This note covers how to write prompts that test something, and how to read the result.

Contents: Cases to write · Writing the prompts · Graders · Running · Reading results · When to add outcome cases

## Cases to write

Per skill, under `evals/<skill>/`:

- Three positive cases, `trigger-<slug>/`, each a different way into the skill: a symptom, a command-like request, an outcome request.
- One near-miss case, `trigger-near-miss-<slug>/`, whose prompt shares vocabulary with this skill but belongs to its nearest neighbour. Its grader expects the neighbour (`input_match: "lll:<neighbour>"`, `min: 1`). Add a second grader with `input_match: "lll:<skill>"` and `max: 0` when the wrong load is costly.

## Writing the prompts

- Write as a busy founder or developer types: lowercase, fragments, no polite preamble, real detail ("our staging db restored in 40 min last time, no idea about prod").
- Never name the skill or use its exact trigger phrase every time; at least one case should use none of the description's words.
- Make them self-contained: the case runs with only Skill, Read, Glob and Grep, so no prompt may need a repository to exist.
- One request per prompt. Leave out secrets, client names and real hostnames.
- Near-miss prompts must be honestly ambiguous at the word level and clear at the intent level ("our site just went live, run the go-live checklist" belongs to launch; "push this fix to production" belongs to ship).

## Graders

Prompt file:

```markdown
---
max_turns: 3
allowed_tools: [Skill, Read, Glob, Grep]
tags: [trigger]
---

<the prompt>
```

Grader `graders/loads-<skill>.md`:

```markdown
---
type: tool_used
tool: Skill
input_match: "lll:<skill>"
min: 1
---
```

For a near-miss, use the neighbour's name. For "must not load", use the skill's own name with `max: 0`.

## Running

From the pack root:

```
claude plugin eval . --ablation none --tag trigger --runs 3 --no-publish
claude plugin eval . --ablation none --case "launch/*" --runs 3 --no-publish
```

- `--ablation none` is needed for trigger scoring; under the default with-and-without run, `tool_used: Skill` graders are only an indicator.
- `--runs 3` because triggering varies between runs.
- `--no-publish` keeps the HTML report local; without it the run may publish the report to claude.ai when the account supports it. Prompts are in the report, so publish only when the owner agrees.
- Each run is a real model call on the owner's account. Use `--concurrency` sparingly and `--max-cost-usd` for a ceiling, and run only the cases for the skills you changed.
- The first run in an untrusted folder asks for confirmation; `--trust-plugin` answers it for CI. Only pass it for a plugin you would run yourself.

## Reading results

- Positive passes in 2 of 3 runs or more: acceptable. One of three: the description is weak. Zero: the phrase space is wrong.
- Look at which skill the failing run called. If it is another lll skill, fix the collision (see the collisions notes in the description guide). If it is another suite's skill, add the vocabulary or accept it. If none, the description does not describe the situation.
- A near-miss that loads this skill means a phrase here is too wide.
- Do not change a grader to make a case pass. Change the description or delete a case that was badly written, and say so.

## When to add outcome cases

Add an outcome case (graders `regex`, `file_exists`, `llm`) only where the result is checkable: a script's output format, a report file path, a verdict on a planted fixture. They cost more, and they need a fixture repository kept inside `evals/`, never a real project.
