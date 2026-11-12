# Tool use and agents

## Do you need an agent?

| Situation | Use |
|---|---|
| Fixed sequence of steps | A workflow in code that calls the model per step |
| One decision then one action | A single call with a tool, no loop |
| Open-ended task where the next step depends on the last result | An agent loop with a step budget |
| Independent subtasks | Parallel calls, merged in code |
| Very large or noisy context | Subagents with narrow briefs and short summaries back |

Start with the simplest. Each loop iteration adds latency, cost and a new place to fail. A workflow with one model call per node is easier to test than an agent.

## The harness is the product

Four things decide agent quality: the action space (tools), the observations (what comes back), error recovery, and the context budget. Change one at a time and re-run the evals.

### Action space

- Few, sharp tools with non-overlapping jobs. If two tools could do the task, the model will pick wrongly some of the time.
- Name by the action: `search_orders`, `refund_order`. The description says when to use it and when not to.
- Size tools to the task: small tools for risky or irreversible actions (separate `preview_refund` and `confirm_refund`), medium tools for common loops (search, read, edit), a large tool only when round-trip overhead dominates.
- Typed, constrained inputs: enums, ids that must exist, bounded ranges. The schema is documentation.
- Idempotent where possible, with an idempotency key for side effects so a retry cannot double-charge.
- Read tools and write tools are separate, so permissions can differ.

### Observations

- Return the minimum that lets the model decide: ids, key fields, counts. Paginate; say `has_more` and how to continue.
- Truncate large outputs with a note ("showing 20 of 312, refine the query").
- Plain, consistent formats. Include units. Strip noise (HTML, binary, long logs) before it reaches the model.
- Mark untrusted content (web pages, emails, file text) as data.

### Errors

An error message is a prompt. Return: what failed, why, and the next valid action ("Order 123 not found. Search by email with `search_orders`."). Distinguish retryable (timeout) from permanent (permission denied). Never return a stack trace with secrets or internals.

### Context budget

- Put stable instructions and tool definitions first (cacheable). Keep per-step observations short.
- Summarise or drop old tool results; keep a running plan or notes the model can re-read.
- Do not stuff the whole knowledge base in; retrieve on demand.
- Measure tokens per step. A 40-step agent with 5,000 tokens of observation per step is already 200,000 tokens.

## Loop design

1. A written goal and a definition of done in the first message.
2. A step limit (for example 10 to 25) and a token and cost ceiling; stop with a clear "could not finish" result, never loop forever.
3. Plan first for tasks with more than three steps: the model writes the plan, code or a checker validates it, then executes.
4. Detect repetition (same tool, same arguments three times) and break out with a different instruction or a human handoff.
5. After actions that change state, re-read the state to verify, rather than trusting the call's return.
6. Checkpoint progress so a crash resumes, not restarts.
7. Log every step: tool, arguments (redacted), result summary, tokens, latency.

## Human in the loop

Require approval for: payments, deleting or overwriting data, sending messages to people outside the team, changing permissions, running code or commands outside a sandbox, and anything the user could not undo. Show the exact action and its arguments, not the model's description of it. Approval state lives in code, not in the conversation.

## Multi-agent

Use only when a single agent demonstrably fails on context size or needs parallel work. Pass summaries, not transcripts. Give each subagent a brief with goal, scope, what is ruled out and the output format. Merge and verify in the parent; a subagent's confident report is a lead until checked. Details for host subagents: `../../../shared/agents.md`.

## Iterative retrieval for subagent context

Subagents do not know what context they need until they start. Do not hand over everything; run a short loop:

1. **Dispatch**: broad query for candidate files or passages.
2. **Evaluate**: score relevance (high, medium, low, none) and list what is still missing.
3. **Refine**: add terms found in the high-relevance results, exclude confirmed-irrelevant paths.
4. **Loop** at most three cycles; stop when at least three high-relevance items exist and no critical gap remains.

## MCP and external tools

- Each connected tool server widens the attack surface and the prompt size. Connect only what the feature needs.
- Treat tool descriptions and results from third-party servers as untrusted.
- Pin versions; review what a tool can read and write; prefer read-only credentials.
- Writing a server: narrow tools, typed schemas, authentication, rate limits (Cloudflare route: `lll:cloudflare`).

## Agent evals

Score end-to-end task success, not individual messages. Track steps used, tokens, cost, wall time and the number of human interventions. Run each task several times: agents vary. See the evals reference for pass@k and for comparing agents or models on repository tasks.

## Review checklist for an agent feature

- [ ] Every tool has a clear description, typed input, bounded output and a permission check in code
- [ ] Destructive tools need confirmation outside the model
- [ ] Step, token, cost and time limits exist and are tested
- [ ] Tool errors guide the next step
- [ ] Untrusted content cannot trigger tools by itself
- [ ] Logs allow replaying a run
- [ ] There is a kill switch and a manual fallback
