# Agent loops

Two cases. (A) You, the running agent, are stuck repeating yourself. (B) The bug is inside an LLM or agent system you are building or operating.

## A. Catch your own loop

You are in a loop when any of these is true:
- The same command ran twice with the same result and you are about to run it a third time.
- An edit was made, reverted and made again.
- Each fix creates a new failure that the previous fix had solved.
- You are changing tests, flags, timeouts or retries to make a failure go away without a cause.
- You cannot state the current hypothesis in one sentence.
- Your last three messages say "let me try" or "one more".
- You are reading the same file for the third time without a new question.

### Break it

1. **Stop editing.** Make no further change until step 4.
2. **Write the state in five lines**: goal; what is failing (exact message); what you tried (one line each, with result); what each attempt assumed; what you have not looked at.
3. **Test the shared assumption.** The attempts usually share one: "the bug is in this file", "the input is valid", "the environment is clean", "the test is correct", "the dependency works as documented". Check that one with a probe that cannot be satisfied by luck.
4. **Change the kind of action.** If you have been editing, read. If you have been reading, run something. If you have been running the whole suite, run one test. If you have been guessing, instrument.
5. **Shrink.** Build the smallest reproduction outside the main project: one file, one function, one command.
6. **Look for what is different** from a case that works (`git stash` is not allowed in a shared checkout; use a clean worktree or a fresh clone to compare).
7. **Ask for help with evidence.** After three failed hypotheses, tell the user: the goal, the exact failure, what is ruled out, the shared assumption you found, and the two or three options with a recommendation. One question, not a dump.

### Guard rails against loops

- Cap attempts: three per hypothesis class, then change class.
- Keep a short ruled-out list in the conversation and consult it before trying anything.
- Do not loosen assertions, add retries, widen timeouts, or skip tests to get green. That is hiding the failure.
- Do not widen the scope ("rewrite the module") unless the evidence says the design is the cause, and then ask first.
- Long outputs: read the decisive lines, do not paste the whole log back and forth.
- If context is nearly full, write the state (the five lines) into a scratch note outside the repository before continuing or handing off.

## B. Debugging an LLM or agent system

Treat the model as a component whose input and output you can record. Reproduce first, then change one thing.

### 1. Capture the run

- Record per step: full prompt (system, tools, retrieved context, history), model id and version, parameters (temperature, max tokens, seed if supported), raw output, tool calls with arguments and results, latency, tokens, cost, stop reason.
- Keep a trace id across the whole task. Without traces you are guessing.
- Redact secrets and personal data before storing or sharing traces.

### 2. Classify the failure

| Failure | Typical cause | First check |
|---|---|---|
| Wrong answer, confident | Missing or wrong context; prompt ambiguity; retrieval miss | Was the needed fact in the prompt? If no: retrieval or prompt assembly bug |
| Ignores instruction | Instruction buried, contradicted or too long | Move to the end/system; remove conflicts; shorten |
| Hallucinated tool or arguments | Tool schema vague or too many tools | Tighten schemas, enums, descriptions; reduce tool list per step |
| Tool call loop | No progress signal, error text unhelpful, no cap | Read the last N tool results; add step cap, repeated-call detection, clearer errors |
| Malformed output | Free text where structure is needed | Use structured output / schema validation, one repair attempt, then fail |
| Refusal or empty reply | Policy trigger, prompt injection defence, bad stop condition | Read the stop reason and the exact text |
| Truncated output | `max_tokens` too low, long context | Check stop reason `length`/`max_tokens` |
| Regression after a model or prompt change | Behaviour shift | Replay the same inputs on old and new version; diff |
| Flaky between runs | Sampling | Lower temperature, fix seed if offered, run N samples and measure the rate |
| Cost or latency spike | Longer context, retries, loop | Per-step tokens; retries count; cache hit rate |
| Injection or data exfiltration | Untrusted text treated as instruction | Separate data from instructions; least-privilege tools; hand to `lll:security` |

### 3. Isolate

- Replay the recorded prompt directly against the model with no framework. Same output? Then the bug is in the prompt. Different? Then it is in the code that builds or handles it.
- Bisect the prompt: remove sections until the behaviour flips.
- Bisect the history: truncate turns until it works.
- Swap one variable at a time: model, temperature, tool set, retrieval on/off.
- Test the tools without the model: call each with the arguments the model gave. Many "model bugs" are tool bugs.

### 4. Fix with evals, not vibes

- Turn the failing trace into a test case: input, expected property (contains, schema valid, tool called, no tool called, under N steps).
- Run the case N times; report pass rate before and after. One lucky pass proves nothing.
- Prefer deterministic fixes in code (validation, caps, retries with limits, better tool errors) before prompt wording.
- Guards to add: max steps, max tokens, max spend per task, repeated-tool-call breaker, schema validation, timeouts, a human checkpoint before irreversible actions.
- Keep a regression set of past failures and run it on every prompt or model change.

### 5. Report

Failing trace id, cause class from the table, evidence (the prompt segment or tool result), the fix, pass rate before and after over N runs, and the guard added. For prompt or model design questions beyond debugging, use `lll:ai`.
