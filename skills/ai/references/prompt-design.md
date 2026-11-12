# Prompt design

Model-specific tricks age quickly: measure on your eval set, do not copy folklore.

## Structure of a good prompt

Order from stable to variable, so the stable part can be cached and the task is read last.

1. **Role and goal** in two sentences: who the model is for this task and what the output is for.
2. **Rules and constraints**: what to do, what never to do, what to do when unsure. Positive statements first.
3. **Output contract**: format, schema, length, language, tone. Show an example of a valid output.
4. **Reference material** (policies, style guide, glossary), clearly delimited.
5. **Examples** (few-shot): 2 to 5 that cover the common case and the awkward edge, drawn from real data.
6. **Dynamic input** in delimiters, labelled as data: `<document>...</document>`, `<user_message>...</user_message>`.
7. **The task, restated**, at the very end for long inputs.

## Writing rules

- Say what you want, not only what to avoid. "Answer in at most three sentences" beats "do not be verbose".
- Give the reason for a rule; models generalise from the reason.
- One job per prompt. If the prompt has "and also", split it into steps or calls.
- Define terms the model could read two ways ("active customer = purchase in the last 90 days").
- Specify the unknown-answer path: "If the context does not contain the answer, reply `UNKNOWN` and nothing else."
- Tell the model its inputs are untrusted data when they come from users or documents (see guardrails).
- Use the same words for the same thing throughout. Synonyms read as different concepts.
- Prefer plain prose and short lists over heavy markup unless the output needs it.
- Reasoning: for multi-step problems let the model reason before answering (a reasoning mode if the provider has one, or a short "think then answer" field), then extract only the final answer. Do not show raw reasoning to end users unless it is designed for them.
- Temperature and sampling: lower for extraction and classification, higher for brainstorming. Provider defaults and allowed parameters differ by model; check current docs.

## Review procedure for an existing prompt

Work through these in order; write the result as a before/after diff plus a one-line reason per change.

1. **Intent**: state in one sentence what the prompt is for. If you cannot, the prompt is unclear.
2. **Failure cases**: collect five outputs that were wrong. Name the failure type (format, missing fact, wrong rule, refusal, verbosity, hallucination).
3. **Missing context**: does the model have everything a new human employee would need? What is assumed but unstated?
4. **Output contract**: is the format specified and validated in code, or hoped for?
5. **Conflicts**: rules that contradict each other, or an example that violates a rule.
6. **Ordering and length**: key instruction buried in the middle? Redundant paragraphs? Cut anything no failing case needs.
7. **Test**: rerun the eval set; keep the change only if the score improves and nothing else regresses.

## Example

Before:

```
You are a helpful assistant. Summarise this support ticket and tell me the priority and make it good.
```

After:

```
You triage support tickets for a billing product. Read the ticket and return JSON only.

Fields:
- summary: one sentence, under 25 words, no customer names
- priority: "urgent" if money was taken wrongly or the customer cannot log in; "normal" otherwise
- needs_human: true if the ticket mentions legal action, a refund above 500, or is not in English

If a field cannot be determined, use null. Do not add fields.

<ticket>
{{ticket_text}}
</ticket>
```

What changed: audience and domain named, output made a schema, priority defined by observable rules, unknown path defined, input delimited.

## Examples (few-shot) guidance

- Real, anonymised examples beat invented ones. Cover each label or branch at least once.
- Order matters mildly: put the most typical last. Do not make all examples share a surface feature (length, first word) or the model will copy it.
- Keep examples consistent with the rules; a single contradicting example outweighs a paragraph.
- For classification, include a "none of the above" example.
- Measure with and without examples. Drop them if no gain; they cost tokens on every call.

## Long inputs

- Put long documents before the question, the question last.
- Label and number sources so answers can cite them.
- If the answer is one fact in a large file, retrieve first instead of pasting (see RAG).
- Do not rely on exact recall from the middle of very long contexts; verify with tests that bury a known fact at different positions.

## Prompt injection hygiene in the prompt itself

- Put instructions in the system or developer message, data in the user turn inside delimiters, and say that text inside the delimiters is data.
- Never build instructions by concatenating user text into the system prompt.
- Do not paste secrets or API keys into prompts.
- This is mitigation, not protection. Real protection is least-privilege tools and output validation (see guardrails).

## Versioning prompts

- Keep prompts in files or config, not in scattered string literals. One owner per prompt.
- Give each prompt an id and version; log them with each call.
- A prompt change is a code change: review it, run the evals, note the scores in the pull request.
- Keep the previous version available for rollback.

## System prompt checklist

- [ ] One-sentence goal; audience; tone
- [ ] Hard rules (safety, legal, brand) listed once
- [ ] Output contract and a valid example
- [ ] What to do when the request is out of scope, ambiguous, or the data is missing
- [ ] Data-versus-instruction boundary stated
- [ ] No secrets, no per-user data in the stable part
- [ ] Token length known; stable part first for caching
