# UX, failure handling and operations

## Streaming UX

- Stream the answer as it is generated; show a typing or progress indicator immediately (under 200 ms) even before the first token.
- Render partial Markdown safely: buffer incomplete code fences, tables and links; escape HTML; do not execute or fetch anything from partial output.
- Controls: stop, retry/regenerate, copy, give feedback (thumbs plus optional text). Keep the user's input after a failure.
- Show sources as chips or footnotes when the answer used retrieval. Make them link to the exact passage.
- Streaming structured data: parse incrementally or wait for the complete object; never act on a partial tool call.
- Scroll behaviour: do not yank the view if the user scrolled up; announce completion to screen readers (live region) without reading every token.
- Mobile: handle backgrounding mid-stream (resume or restart), flaky networks, and battery. Server-Sent Events or WebSocket reconnect with a resume token.
- Long jobs (minutes): move to a job with progress, notification and a result page rather than holding a connection.

## States every AI screen needs

| State | Behaviour |
|---|---|
| Empty | Example prompts, what the AI can and cannot do |
| Loading | Immediate indicator, expected wait, cancel |
| Partial | Streaming text, safe to stop |
| Success | Answer, sources, feedback |
| Refusal / out of scope | Say why in plain words and what to do instead |
| Low confidence | Say so; offer to search or ask a person |
| Error | What failed, whether to retry, preserved input |
| Rate limited / quota | Clear limit, reset time, upgrade path |
| Offline | Disable AI controls with an explanation; queue if sensible |

## Failure handling

| Failure | Handle by |
|---|---|
| Timeout | Per-call timeout; retry once if safe; then fallback or error |
| Rate limit (429) | Backoff using `Retry-After`; queue; reduce concurrency; tell the user if it lasts |
| Provider overload or 5xx | Retry with jitter; fall back to another tier or provider if evaluated; degrade the feature gracefully |
| Truncated output (hit max tokens) | Detect the stop reason; continue, shorten, or fail clearly; never use truncated JSON |
| Empty or refusal | Detect; rephrase once if appropriate; else show the refusal path |
| Invalid structure | Repair retry once with the error, then fallback |
| Context too long | Truncate/summarise by plan; retrieve less |
| Tool failure | Return an informative error to the model; limit retries; surface to the user if it blocks |
| Provider outage | Circuit breaker: stop calling, show status, queue work, recover automatically |
| Model deprecated | Track deprecation notices; migrate with evals; keep the model id in config |

Circuit breaker: after N consecutive failures within a window, open for a cool-off period; allow a trial call; close after a success. Surface breaker state in logs and the status page.

## Observability

Per request, record (redacted):

- trace id, user or tenant id (hashed), feature, prompt id and version, model id, parameters
- input and output token counts, cached tokens, cost
- latency: queue, first token, total; retries; stop reason
- tool calls with names, argument summaries, durations, errors
- retrieval: query, top ids and scores
- validation result, fallbacks used, user feedback

Rules

- Do not log raw prompts and outputs by default if they can hold personal data; sample under a policy with retention limits and access control.
- Link each log row to the eval case type so failures become test cases.
- Dashboards: calls, p50/p95 latency, error and refusal rate, cost per outcome, cache hit rate, quality score from the sampled judge, feedback ratio.
- Alerts: cost spikes, error rate, latency, validation failure rate, refusal rate shifts, a drop in the sampled quality score.
- Provider status feeds belong in the runbook.

For analytics events and consent wording use `lll:analytics`.

## Rollout

1. Feature flag per tenant or per percentage; kill switch that disables the AI path and leaves a non-AI fallback.
2. Shadow mode first when replacing existing behaviour.
3. Canary (a few percent), watch quality, cost and errors, then widen.
4. Pin the model version; upgrade behind the eval gate; keep the previous config for rollback.
5. Document: purpose, data flow, limits, owner, on-call steps for provider outage, how to rotate the key.

## Review checklist for a full-mode AI review

Findings use `../../../shared/findings.md`; every finding needs a failure scenario.

Contract and quality
- [ ] Job and success bar written down; golden set exists, versioned, with a hold-out
- [ ] Baseline numbers recorded; CI gate on prompt, model and retrieval changes
- [ ] Prompts in versioned files with ids; no scattered literals
- [ ] Outputs validated by schema and business rules; repair loop capped
- [ ] Deterministic work done in code

Safety and privacy
- [ ] Untrusted content delimited; tools least-privileged; permissions checked in code
- [ ] Human approval on irreversible actions
- [ ] Output escaping and link/image allow-list in clients
- [ ] Tenant isolation in retrieval, caches, logs
- [ ] Personal data minimised and redacted; retention and deletion defined; provider terms checked by the owner
- [ ] Disclosure to users and in store privacy forms

Cost and latency
- [ ] Per-call usage logged; budgets and limits enforced
- [ ] Tier chosen by evals; caching and batching considered
- [ ] Timeouts and retries bounded and idempotent

Operations
- [ ] Streaming, refusal, error and offline states designed
- [ ] Circuit breaker or fallback exists; kill switch exists
- [ ] Dashboards and alerts exist; sampled human review exists
- [ ] Model ids in config; deprecation tracked

Severity hints: a prompt-injection path to a destructive tool or cross-tenant data is `critical`; unbounded spend or a missing fallback on a core flow is `high`; no eval set for a shipped feature is `medium`; missing feedback control is `low`.
