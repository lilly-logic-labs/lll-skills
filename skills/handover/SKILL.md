---
name: handover
description: "Build the client handover pack when a project ends or changes hands: run, build, test and deploy steps, environments, env var names and where secrets live, account ownership transfer, backups, monitoring, known issues, care terms, sign-off. Use when handing over, transferring ownership or wrapping up a client project. Not for learning a repo (lll:onboard) or restore tests (lll:backup-drill)."
metadata:
  origin: lll
---

# Handover

Produces the pack that lets a client or the next team own a project without us: how to run, build, test and deploy it, where it lives, which accounts change hands, where each secret is kept (never the value), what to watch, what is broken, and what support continues.
Every statement in it is marked verified or unverified. Nothing in it is a secret, so it can be emailed.

## When to use

- A project is finished and the client takes over code, hosting and accounts.
- A project moves to another agency, an in-house team or a new maintainer.
- "Make the handover doc", "what do I need to give the client", "transfer ownership", "wrap up this project", "offboarding", "sign-off checklist", "who owns the domain".
- A client asks for run instructions, an env var list, an account list or a support-terms summary.
- Before the final invoice or release of code, to check nothing is missing.

## When not to use

- Learning an unfamiliar repo: `lll:onboard` (this skill calls it when the project is new to you).
- Proving a backup restores: `lll:backup-drill`. This pack only records the backup facts and the last drill date.
- Go-live and day 1, 7, 14 checks: `lll:launch`.
- A security audit or secret scan of the code and history: `lll:security`.
- Keeping README, CLAUDE.md and docs current after code changes: `lll:docs`.
- Estimating or quoting: `lll:scope`.
- Producing the PDF or Word file: `anthropic-skills:pdf`, `anthropic-skills:docx` (this skill writes the content).

## Modes

- **Guidance** (default): answer in chat. Say what must be handed over for this project, which items are missing, and what to do next. Read-only: the repo, `node scripts/env-names.mjs`, and docs. No files written, no subagents, nothing run that installs or builds.
- **Full**: only when the user asks for the handover pack, a written handover or an end-to-end run. Writes `docs/handover/<YYYY-MM-DD>.md` (add `-2` if taken) from [the template](references/handover-template.md), verifies the run steps in a throwaway copy ([verification](references/verification.md)), and produces a PDF or Word file on request. May use subagents for a wide repo (`../../shared/agents.md`).

Follow `../../shared/ground-rules.md`. In addition:

1. **No secret values, anywhere.** Names, purposes and storage locations only. Not in the doc, chat, commits or logs.
2. **Account and remote changes belong to the owner and the client.** This skill lists, checks and prepares. It never transfers, invites, rotates, deletes or pays. A read-only look at a dashboard needs the owner's go-ahead in this conversation.
3. **Verified or unverified.** A command is verified only if it ran in a clean copy or CI shows it. An account fact is verified only if the owner or a dashboard confirmed it. Everything else says unverified.
4. **Honest about the state.** Known bugs, debt and weak spots go in the doc with severity and a next step. A handover that hides them moves the risk onto the client.
5. **Contract gates.** Read the company playbook and contract terms for what must happen before handover (payment, sign-off, bug window, ownership of the work). If they make release conditional, confirm the status with the owner before releasing code or credentials.
6. **Two audiences, one doc.** A one-page plain-language summary for the business owner on top, the technical runbook below.

## Steps

1. **Frame.** Who receives it (business owner, their developer, another agency, in-house IT), what changes hands (code, hosting, accounts, operations, support), the handover date, the contract and payment status, and the format (markdown, PDF, Word). Ask only what you cannot find.
2. **Learn the project.** `../../shared/stack-detect.md`. If it is new to you, run `lll:onboard` in guidance mode first. Reuse existing docs by pointing at them, but check them against the code; a wrong README is a handover bug. For tool versions and support dates, use current docs (Context7 MCP tools if configured, else the vendor site), not memory.
3. **Inventory.** Run `node scripts/env-names.mjs <repo>`: every environment variable and platform binding name, where it is used and declared, real env files that exist or are tracked by git, secret-like names, and secrets in client-shipped variables. Then list from manifests, CI, deploy files and docs: environments and hostnames, hosting, database and storage, queues and cron, email and DNS, third-party services, store identifiers, analytics ids. Ask the owner for what code cannot show (registrar, payment dashboard, mailbox provider, store accounts, social, password manager).
4. **Verify the runbook.** Follow [verification](references/verification.md): rehearse install, test, build and start from a clean copy as the recipient would. Describe the deploy and rollback exactly; never run them. Fix the doc or the code for every failure and record it. Stack-specific wording and the production-readiness list are in [runbook by stack](references/runbook-by-stack.md).
5. **Secrets and access.** For every secret-like name: where it lives (secret manager, platform dashboard, CI secret, password manager entry), who can change it, when it was last rotated, and whether it is rotated at handover. Plan rotation of everything the vendor ever saw. Tracked env or key files: report location and type only and hand the content check to `lll:security`.
6. **Accounts and ownership.** Fill the transfer table for every asset from [account transfer](references/account-transfer.md): current owner, new owner, method, who acts, status, how it is verified, and our own exit (remove our access after the care period).
7. **Data and backups.** Where data lives, what is backed up, how often, how long kept, where copies sit, who can restore, how to restore, and the date a restore was last proven. Never proven: say so and recommend `lll:backup-drill` before sign-off.
8. **Monitoring and operations.** Uptime check, error tracking, logs, alert recipients, analytics, what normal looks like. Routine tasks with steps: deploy, roll back, rotate a secret, renew a domain, add a user, restore data, update dependencies. First steps in an incident and who to call.
9. **Known issues and debt.** From `lll:onboard` risks, `lll:audit` findings and the open bug list: each with severity, impact, workaround, suggested next step and whether it falls under the warranty. Add runtime and dependency end-of-life dates that arrive within a year.
10. **Support terms.** Warranty or bug window, care plan options, what is covered and not, response times, how to ask, end dates, recurring costs and renewal dates. Take the wording from the playbook or contract ([care and warranty](references/care-and-warranty.md)); if absent, ask the owner and mark it unconfirmed.
11. **Assemble and check.** Fill [the template](references/handover-template.md). Run the secret sweep from [verification](references/verification.md) on the finished doc. Re-read as the recipient: could they run, deploy and recover the project from this alone?
12. **Deliver and close.** The owner reviews. PDF or Word on request via `anthropic-skills:pdf` or `docx`; a shared, commentable copy via `anthropic-skills:docs`. Send the document and the secrets by different channels (doc by email, secrets through a shared password manager vault, never chat or email). The client's contact signs the sign-off list; keep the signed copy. Then: remove our access per the transfer table, close the project in the owner's tracker, and schedule the follow-up check (`lll:launch` day 14 audit if it fits).

## Output

- **Guidance**: gap list and next actions in chat: what is ready, what is missing, what only the owner or client can do.
- **Full**: `docs/handover/<YYYY-MM-DD>.md`; optional PDF or Word file; a chat summary of what is ready, owner actions still open (with the item ids), unverified items, known issues rated high or above, and the exact blocker for anything not done.
- Hand-offs: restore proof via `lll:backup-drill`; secret scan via `lll:security`; docs sync via `lll:docs`; post-handover checks via `lll:launch`.
