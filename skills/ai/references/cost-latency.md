# Cost and latency

Prices, cache lifetimes, minimum cacheable sizes and batch discounts change; get them from the provider's current docs (for Anthropic, the `claude-api` skill) and never from memory.

## Choose a model and tier

Do this once per feature step, with evidence.

1. List the requirements: task difficulty, input size, output size, languages, tool use, structured output, images or audio, latency target, volume, privacy terms and region, rate limits, availability needs.
2. Shortlist two or three candidates across tiers (small and fast, mid, large or reasoning-heavy). Include an open-weight or on-device option only if privacy, offline use or cost at volume requires it.
3. Run your golden set on each with the same prompt. Record quality, p50 and p95 latency, cost per call and failures.
4. Pick the smallest tier that clears the quality bar with some margin. Record why, the date, the eval scores and the next tier up as the escalation target.
5. Put the model id in config. Use a dated or pinned version for production; an alias that changes silently can change behaviour overnight. Subscribe to deprecation notices and re-run the evals before moving.
6. Decide the fallback: the same model on another region, a smaller tier, or a non-AI path. Test it.

| Step type | Usual tier |
|---|---|
| Classification, routing, extraction from short text, formatting | Small and fast |
| Summaries, drafting, retrieval-grounded answers, straightforward tool use | Mid |
| Multi-step reasoning, hard code or analysis, ambiguous long documents, agent planning | Large, or a reasoning mode on a mid model |

Reasoning modes cost output tokens and time; enable them per step where evals show gains, not globally. Provider model lists and capabilities change often, so take ids, limits and prices from the current docs (for Anthropic, the `claude-api` skill).

## Measure first

Per call log: feature, prompt version, model id, input tokens, output tokens, cached input tokens, latency (time to first token and total), retries, outcome. Compute:

- cost per call = input tokens x input price + cached tokens x cached price + output tokens x output price
- cost per successful outcome = total spend / successful outcomes (retries and failures count)
- monthly forecast = calls per user per month x users x cost per call, at expected and at 10x usage

Cut the biggest line first. Usually it is input tokens (long prompts, retrieved context, history) or output tokens on a large tier.

## Levers, biggest first

1. **Route by difficulty.** A cheap tier handles easy items (short input, clear rules, high-confidence classification); escalate to a larger tier when a trigger fires. Triggers: input length or item count above a threshold, low classifier confidence, validation failure, user-visible high stakes. Choose thresholds from your eval set; record the share routed to each tier.
2. **Cache the stable prefix** (below).
3. **Shorter context**: retrieve fewer, better passages; summarise old turns; drop boilerplate; compress tool outputs.
4. **Shorter outputs**: ask for the schema only, cap `max_tokens`, no preamble, no repeated input.
5. **Batch offline work** through the provider's batch interface when latency of hours is fine (typically discounted).
6. **Cache responses** for identical or normalised inputs where answers do not depend on the user; key includes prompt version, model and tenant. Set a time to live.
7. **Avoid calls**: deterministic code, regex-first hybrid, dedupe repeated inputs, debounce typing.
8. **Fine-tune or distil** a small model only after the above, when volume justifies and evals prove parity.

## Prompt caching

Providers can reuse the processed prefix of a prompt across calls at a lower price and lower latency. It only works when the prefix is byte-identical.

Order the prompt from most stable to least stable:

```
tools and schemas -> system prompt -> static reference docs -> few-shot examples -> conversation history -> latest user input
```

Rules

- Mark cache breakpoints after the stable blocks if the provider requires explicit markers; otherwise keep the prefix stable.
- Put nothing variable early: no timestamps, request ids, user names or random ordering in the system prompt or tool list.
- Keep tool definitions in a fixed order; a changed tool list invalidates the cache.
- Append to history; do not rewrite earlier turns.
- There is a minimum prefix length and a cache lifetime; keep traffic regular enough to stay warm, or use a longer-lived option if offered.
- Verify: the response usage fields report cache writes and cache reads. Track hit rate = cached input tokens / total input tokens. If it is low, find which block changes between calls (diff two prompts).
- Cache writes can cost more than normal input; caching a prefix used once loses money.
- Per-tenant data inside the cached prefix means one cache entry per tenant; share only the common part.

## Latency

| Lever | Effect |
|---|---|
| Stream tokens to the user | Perceived latency falls to time to first token |
| Smaller tier for easy steps | Faster and cheaper |
| Parallelise independent calls | Total time = slowest call |
| Shorter prompt and output | Output length dominates generation time |
| Cached prefix | Less processing before the first token |
| Fewer sequential steps (merge, or start step two on partial output) | Cuts round trips |
| Place compute near data and the provider; reuse connections | Removes network overhead |
| Speculative work (prefetch likely retrieval while the user types) | Hides wait; costs extra calls |
| Skeleton UI, optimistic progress, cancel button | Makes waits tolerable |

Set a latency budget per feature (for example first token under 1.5 s, complete under 8 s) and measure p50 and p95, not the average.

## Budget guard (provider-neutral sketch)

```ts
type Usage = { inTok: number; outTok: number; cachedTok: number; cost: number }

class Budget {
  constructor(readonly limit: number, readonly spent = 0) {}
  add(u: Usage): Budget { return new Budget(this.limit, this.spent + u.cost) } // immutable: no shared mutation
  get exceeded() { return this.spent >= this.limit }
}

// before each call in a loop:
if (budget.exceeded) return fail('budget_exceeded')
```

Rules: a budget per request, per user per day and per tenant per month; stop with a clear message rather than silently degrading; alert at 80 percent.

## Retry policy

- Retry only transient errors: network failures, timeouts, rate limits (`429`), server errors and overload (`5xx`, provider-specific overload codes). Respect `Retry-After`.
- Never retry authentication errors, validation errors, content-policy refusals or context-too-long errors without changing the request.
- Exponential backoff with jitter; maximum 2 to 3 attempts; total timeout shorter than the user's patience.
- Make the call idempotent from your side (request id) where it triggers side effects.
- Fall back to a smaller tier or another provider only if evals cover it.

## Token hygiene

- Count tokens before sending large inputs (tokeniser or the provider's counting endpoint) and truncate with a plan, not an error.
- Trim whitespace, boilerplate, signatures, quoted email threads, HTML.
- Convert large JSON to compact text when the model only needs a few fields.
- Do not echo the whole input in the output.
- Keep a conversation memory summary, not the whole transcript, after a threshold.

## Worked example (structure, not prices)

A support-triage feature handles 50,000 tickets a month. Average input 600 tokens plus a 900-token stable prompt; output 80 tokens.

1. Baseline: every ticket on a large tier, no caching. Spend = tickets x (1,500 in + 80 out) at large-tier prices.
2. Cache the 900-token prefix: 60 percent of input tokens become cached reads at the cached price.
3. Route: a small tier handles tickets that match clear rules (about 70 percent in the eval set, with the same pass rate); the rest go to the large tier.
4. Cap output at 120 tokens with the JSON schema only.
5. Recompute with real price numbers from the docs; confirm with the golden set that quality held; record the saving as a percent and per month.

## Cost review checklist

- [ ] Per-call usage logged and attributable to a feature and tenant
- [ ] Largest cost line identified with numbers
- [ ] Model tier chosen by eval, not default
- [ ] Prefix stable and cache hit rate measured
- [ ] `max_tokens`, step limits and per-user budgets set
- [ ] Retries limited and idempotent
- [ ] Batch used for offline jobs
- [ ] Forecast at 10x usage reviewed by the owner
- [ ] Alerts on spend spikes
