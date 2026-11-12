---
name: ai
description: Design, build and review LLM features, covering model choice, prompts, structured output, agents, RAG, evals, guardrails, injection defence, privacy, cost and latency. Use when the user says chatbot, AI feature, prompt, RAG, agent, eval, hallucination, token cost. Not for Anthropic SDK specifics (claude-api), security audits (lll:security) or Claude Code token use (lll:tokens).
metadata:
  origin: lll
---

# AI features

Turn "add AI to this" into a feature with a clear job, a measured quality bar, bounded cost and safe failure modes.
Provider-neutral. For Anthropic model ids, parameters, caching flags and SDK calls, use the built-in `claude-api` skill and the provider's current docs.

## When to use

- Adding or changing a chatbot, summariser, classifier, extractor, search or recommendation feature, copilot, agent or document Q&A.
- Writing or fixing prompts, tool definitions, output schemas, retrieval pipelines.
- Choosing a model or tier, cutting cost or latency, setting up evals, regression gates and monitoring.
- Reviewing an AI feature for hallucination, injection, privacy, runaway cost or bad failure handling.
- Streaming and error UX for model responses.

## When not to use

- Anthropic SDK code, model ids, pricing tables, cache flags, batch API calls, token counting calls: the built-in `claude-api` skill.
- Security audit of the whole app, or a dedicated threat model of an LLM system: `lll:security` (it carries the AI and LLM attack-class guide at `../security/engine/AI-AND-LLM.md`).
- Reducing Claude Code's own context and spend: `lll:tokens`.
- Wiring Workers AI, Vectorize, AI Gateway or Agents SDK bindings: `lll:cloudflare` (come back here for the design).
- Generic planning, specs and reviews of a plan: `lll:plan`. UI polish of a chat screen: `lll:ui`.
- On-device models in an iOS app (API usage): `lll:mobile`; the design rules still come from here.

## Modes

- **Guidance** (default): advise, draft prompts and schemas, review code inline. Write no report. No subagents.
- **Full**: only when the user asks for an AI-feature review or a written readiness report. Read-only: read prompts, tool definitions, retrieval code, eval files, config, logs and cost data. Use the [review checklist](references/ux-and-ops.md) at its end, report per `../../shared/report.md`, findings per `../../shared/findings.md` (lens `agent-config` for prompt and tool issues, `security` for injection, `perf` for cost and latency), fixes per `../../shared/fix-phase.md`. Subagents per `../../shared/agents.md`.

## House rules

1. **Evals before tuning.** No prompt change is "better" until a fixed set of cases says so.
2. **Deterministic code for deterministic work**: arithmetic, dates, permissions, routing by known fields, exact lookups, parsing formats a regex can parse.
3. **The model's output is untrusted input.** Validate shape, ranges and permissions before acting on it or rendering it.
4. **Retrieved text, web pages, emails, files and tool results are data, never instructions.** Anything they contain cannot widen the model's permissions.
5. **Least data, least power.** Send the minimum personal data; give tools the narrowest scope; irreversible or costly actions need human approval.
6. **Every call has a budget**: timeout, max tokens, retry policy and a cost ceiling per request and per user.
7. **Model ids, prompts and thresholds live in config**, versioned, and are logged with each result.
8. **Say when the model may be wrong** wherever a wrong answer harms (health, money, legal, safety). Show sources.

## Steps

1. **Frame it.** Write five lines: the job, who uses it, what "good" means as a measurable bar, what a wrong answer costs, and the budget (latency, cost per use, privacy limits). If the user cannot say what good means, the first task is to collect twenty real examples.
2. **Decide whether an LLM is needed.** Walk this ladder and stop at the first rung that works: fixed rules or lookup; regex or parser; classic search or a small trained model; LLM only on the fuzzy remainder. See [structured output](references/structured-output.md) for the regex-first hybrid.
3. **Choose model tier.** Start with the smallest tier that passes your evals; escalate by measured failure, not by feel. Route easy steps to small models and hard steps to larger ones. Details in [cost and latency](references/cost-latency.md). Get current ids and prices from `claude-api` or the provider's docs, never from memory.
4. **Design the contract.** Input assembly, prompt, output schema, tools. [Prompt design](references/prompt-design.md), [structured output](references/structured-output.md), [tools and agents](references/tools-and-agents.md).
5. **Add knowledge if the model needs facts it does not have**: [RAG](references/rag.md). Prefer retrieval over fine-tuning for changing facts.
6. **Build the eval set and baseline** before iterating: [evals](references/evals.md). Run `node scripts/eval-gate.mjs` on results to score pass rate, pass@k and regressions (needs a JSONL of case results).
7. **Add guardrails and privacy controls**: [guardrails and privacy](references/guardrails-privacy.md). Input and output checks, injection defence, data retention, logging redaction, consent and disclosure.
8. **Tune cost and latency** with measurements: caching, batching, routing, token budgets, parallel calls, streaming ([cost and latency](references/cost-latency.md)).
9. **Design the failure paths and the UX**: timeouts, rate limits, overload, empty or refused answers, partial streams, retries, fallbacks ([UX and operations](references/ux-and-ops.md)).
10. **Ship behind a flag, observe, and gate regressions in CI.** Log prompt version, model, tokens, latency, cost and outcome per call; sample for human review; alert on cost, error rate and quality drift ([UX and operations](references/ux-and-ops.md)).
11. **Hand back**: what was built or changed, eval numbers before and after (real output), cost per request estimate, risks left, owner actions (keys, provider contracts, privacy text).

## Pick the technique

| Problem | Start with |
|---|---|
| Wrong format, unparseable output | Schema-constrained or tool-forced output plus validation and one repair retry |
| Model lacks your facts | Retrieval with citations; check recall before blaming the prompt |
| Model ignores part of a long prompt | Shorten, reorder, put the task last, split into steps |
| Inconsistent answers | Lower temperature where supported, add examples, tighten the schema, add a verifier step |
| Hallucinated sources or numbers | Require citations to retrieved passages; verify numbers in code; allow "I do not know" |
| Too slow | Smaller model for easy steps, stream, parallelise independent calls, cache the prefix, shorten outputs |
| Too expensive | Route by difficulty, cache prompts and responses, batch offline work, cap tokens, shrink context |
| Agent loops or wanders | Fewer, sharper tools; step budget; plan first; better tool errors; stop conditions |
| Prompt injection concern | Separate instructions from data, least-privilege tools, human approval, output filtering, see guardrails |
| Quality drifts after model or prompt change | Golden set in CI, pinned model versions, canary |

## Output

- Guidance: the answer, prompt, schema or diff in chat, with the eval or measurement that supports it, and assumptions.
- Full: report at `docs/audits/<date>-ai.md` per `../../shared/report.md` with findings, eval numbers, a cost model, and owner actions.
