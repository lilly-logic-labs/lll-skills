# Guardrails, injection defence and privacy

For a security audit of an LLM system, hand off to `lll:security`, whose attack-class guide is `../../security/engine/AI-AND-LLM.md`. This file is the build-time checklist an engineer applies while designing the feature.

## Threat model in four lines

1. Whoever can put text in front of the model can try to instruct it: users, web pages, emails, documents, tool results, other agents.
2. The model cannot reliably tell instructions from data. Mitigation reduces risk; it does not remove it.
3. Damage = what the model's tools and data access allow, multiplied by how much a person approves.
4. So: shrink the power, validate the output, keep a human on irreversible steps, and log.

## Controls, in order of value

| Control | What to do |
|---|---|
| Least privilege | Give tools the narrowest scope: read-only credentials, per-user tokens, allow-listed domains, row-level filters. The model never holds an admin key |
| Authorisation in code | Check "may this user do this to that record" in the tool implementation. Never rely on the prompt to enforce permissions |
| Separate data from instructions | System or developer messages carry rules; user and retrieved text go in delimited data sections; say that content inside is data |
| Output validation | Schema-check outputs; allow-list actions and arguments; reject unknown tools; sanitise anything rendered (HTML, Markdown links and images, URLs, SQL, shell) |
| Human approval | Required for payments, deletions, external messages, permission changes, running code |
| Egress control | The model's output must not trigger requests to arbitrary URLs. Markdown images and links can exfiltrate data; strip or allow-list them |
| Isolation | Run generated code in a sandbox with no secrets and no network by default |
| Rate and cost limits | Per user, per tenant and global; stops abuse and denial of wallet |
| Monitoring | Log tool calls, refusals, validation failures, unusual volumes; alert; keep an incident path |

Cross-context leaks: never place one user's data into another user's prompt, cache key, vector index or log stream. Cache keys include the tenant.

## Prompt injection checklist

- [ ] Every source of untrusted text is listed (users, uploads, web, email, tools, MCP servers).
- [ ] Untrusted text is delimited and labelled as data.
- [ ] No tool can both read untrusted content and take a sensitive action without a confirmation step.
- [ ] Tool results cannot add new tools or change permissions.
- [ ] Outputs that reach a browser are escaped; links and images are allow-listed.
- [ ] A canary string or the system prompt is not treated as a secret (assume it leaks); no credentials in prompts.
- [ ] Adversarial cases exist in the eval set ("ignore previous instructions", hidden text in documents, instructions in tool results) and are tagged `must-pass`.

## Content and safety policy

- Decide what the feature must refuse (medical or legal advice, self-harm, minors, hate, weapons, personal data of others) and test it.
- Add input and output classifiers (a moderation endpoint or a small model) where the audience or the risk warrants.
- Provide an escalation path to a person for sensitive topics.
- Tell users they are talking to an AI where law or trust requires it, and what the AI cannot do.
- High-stakes domains (health, finance, legal, safety) need review by a qualified person before launch; show sources and uncertainty; never present generated figures as authoritative without verification in code or a source.

## Privacy

Data minimisation

- Send only the fields the task needs. Redact names, emails, phone numbers, ids and secrets before the call where possible, and re-insert after.
- Do not send secrets, credentials or customer databases to a provider you have not approved.
- Prefer providers and plans that do not train on your data and offer a data processing agreement; confirm the actual terms, region and retention before use.

Retention and logs

- Decide how long prompts, outputs and embeddings are kept, and enforce it.
- Redact personal data in logs, traces and analytics; log ids and hashes instead of content when you can.
- Provide deletion: removing a user removes their conversations, derived summaries, embeddings and cached answers.
- Access to production prompts and outputs is limited and audited.

Consent and disclosure

- Privacy policy and in-app notices state that content is processed by an AI provider, which categories of data, and for what purpose.
- Store listings and privacy forms (Play Data safety, App Store labels) reflect AI providers as data recipients.
- For children, health, finance or workplace data, get a legal review before launch; this is a decision for the owner and counsel, not the engineer.
- On-device models avoid sending data off the device; say so only if true for every code path.

Regional rules differ (GDPR and similar laws, sector rules, India's DPDP Act, US state laws). Raise the question to the owner with the data flow written out; do not decide legal questions in code.

## Review the data flow

Draw one line per hop: user input, your server, redaction step, provider, response, storage, logs, analytics, backups. For each hop write what data, how long, who can read it. Anything unknown is a question for the owner.

## Honest failure

- A wrong confident answer is worse than a refusal in high-stakes flows: allow "I do not know", abstain on low retrieval score, and verify numbers in code.
- Never invent citations, quotes or links; verify them against the retrieved set.
- If a safety classifier or filter fails (timeout, error), fail closed for high-risk features and fail open with logging only where the owner has decided so.
