# Writing and tuning descriptions

Contents: Why it matters · Formula · Router limits · Vocabulary · Collisions · Over-triggering · Tune from evidence · Examples

## Why it matters

The description is the only text of a skill that is always loaded. The model picks a skill from it; the body loads only after the pick. The first sentence and the "Use when" list are also copied into the session-start router line, so they are paid for in every session.

## Formula

```
<Verb> <object>, <in a few words>. <One sentence of scope: what it covers>. Use when <4 to 8 phrases the user would type, separated by commas>. Not for <neighbour work> (lll:<neighbour>).
```

- At most 400 characters in total.
- Sentence 1 is short, about 60 characters or less. Verb first.
- Sentence 2 names the scope: artefacts and checks, not steps.
- "Use when" phrases are what a busy person writes: symptoms ("emails go to spam"), commands ("go-live checklist"), situations ("after merging a change"), not abstract nouns ("quality assurance").
- "Not for" names the nearest neighbour and its skill, so the model can choose between them.
- Describe when to use the skill, never the workflow it runs. If the description lists the steps, the model may follow the list and skip the body.

## Router limits

`../../../scripts/gen-router.mjs` builds one line per skill: sentence 1, then `; when `, then the text after "Use when" up to the first period, cut at 160 characters. So:

- No periods inside the "Use when" list. `CLAUDE.md`, `e.g.`, `v2.0` and `vs.` end the list early. Move such names to sentence 2 or the "Not for" line, or reword.
- Put the strongest trigger phrases first; the tail is cut when the line is long.
- Keep sentence 1 short, or it eats the trigger budget.
- Check the result with `node scripts/lint.mjs <name>` (it reports the router length) or run `gen-router.mjs` and read the line.

## Vocabulary

Mine the user's real words instead of inventing them.

1. `node scripts/skill-usage.mjs --prompts` shows how sessions that used no lll skill began. Take the nouns and verbs people use.
2. Typed commands (`/lll:x`) mean the user forced the skill: the auto trigger missed. Compare what they typed around it with the current phrases.
3. Include the short form and the symptom form of the same need ("is our backup real", "test backups").
4. Include the words of other suites that already own the habit ("go-live", "post-launch", "canary") when the lll skill is meant to take over.
5. Skip generic verbs that fit everything ("check", "review", "help", "improve") unless an object comes with them.

## Collisions

- Two skills with the same trigger phrase compete. `node scripts/lint.mjs` lists shared phrases. Give the phrase to one skill and rephrase the other.
- Each skill's "Not for" line must name the neighbour that wins the contested case.
- Other installed suites (gstack, superpowers, impeccable and others) also list skills. If the usage tool shows their skill called where an lll skill should fire, either add that vocabulary to the lll description, or accept that theirs is the better fit and retire the overlap.
- Built-in commands win for their own job (`/code-review`, `/security-review`, `/simplify`, `/init`). Say so in "Not for".

## Over-triggering

A skill that fires on near-misses wastes a load (thousands of tokens) and steers the work wrong.

- Narrow the object: "deploy" alone matches everything; "go-live checklist" does not.
- Add the neighbour to "Not for".
- Add a near-miss eval for the exact prompt that false-fired, with the neighbour as the expected skill.

## Tune from evidence

1. Write the three positive prompts and the near-miss first (the eval step in SKILL.md), then the description.
2. Run the trigger evals with `--ablation none` and several runs; triggering is probabilistic, so judge by rate, not one pass.
3. For each failing positive, find which skill fired instead (the eval output names the tool calls). Fix in this order: add the user's phrase; remove the phrase from the competitor; sharpen "Not for".
4. For a failing near-miss, narrow the phrase that matched.
5. Re-run. Stop when positives pass at least two of three runs and the near-miss never fires the wrong skill. For deep tuning over many iterations use `anthropic-skills:skill-creator`.

## Examples

Weak:

> Helps with documentation. Use when working with docs.

Why: no object, no trigger phrases, no neighbour.

Good:

> Sync docs with code. Updates README, agent instruction files, docs/, API docs, changelog, ADRs, env examples and memory after a change; a drift-check mode reports mismatches without editing. Use when docs are stale, update the docs, sync README, docs out of date, or after merging a change. Not for commit or PR text (lll:ship) or a first agent instruction file (/init).

Why: short first sentence, scope sentence, six real phrases, no periods in the list, neighbours named.
