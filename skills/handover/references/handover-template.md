# Handover doc template

Write to `docs/handover/<YYYY-MM-DD>.md` in the project repository (or where the owner says; if the repo belongs to the client, that is fine, because the doc holds no secrets). Delete a section only if it truly does not apply, and say "not applicable: <why>" instead of leaving it out silently.

Mark each fact `[verified]` or `[unverified]`. Where an answer needs the owner or client, write `OPEN: <question>` and list it in the summary.

```markdown
# Handover: <project> (<YYYY-MM-DD>)

Prepared for: <recipient and role>     Prepared by: <team>
Delivered version: <tag or commit, build numbers for apps>     Handover date: <date>
Status: draft | reviewed | signed

## 0. Summary for the owner (one page, plain language)
- What was built and where it runs: <live URLs, store links>
- What you now own: <repository, hosting, domain, accounts, designs>
- Do in the first 30 days: <three to five actions with dates: accept account ownership, renew domain on <date>, check the backup, add a second admin>
- Watch for: <what alerts exist, who receives them, what a bad day looks like>
- Weak spots and unfinished work: <top three from section 10>
- Support: <bug window ends on <date>; care plan options: <names>>
- Who to contact for what: <role: name, channel>

## 1. What is delivered
| Item | Where | Version | Verified |
|---|---|---|---|
| Source code | <repo URL, branch, tag> | | |
| Production site or app | <URL or store listing> | | |
| Design files | <link> | | |
| Documentation | <this file, README, docs/> | | |

## 2. Architecture in one page
<five bullets or a diagram: what the pieces are, how a request flows, where data lives, what external services are used. Link to docs/onboarding if present.>

## 3. Run, build, test, deploy
### 3.1 Prerequisites
| Tool | Version | Pinned in |
|---|---|---|
### 3.2 Run locally
<exact commands, expected output, first-time setup, seed data>
### 3.3 Test
<command; what the tests cover and what they do not>
### 3.4 Build
<command; output location; build variants (staging, production, store builds)>
### 3.5 Deploy
<who can deploy, from where (CI or laptop), exact steps or the CI workflow name, environment protection, expected duration, how to confirm the right version is live>
### 3.6 Roll back
<exact steps, the previous-version location, the database compatibility rule, how to confirm>

## 4. Environments
| Environment | URL | Hosted on | Deploys from | Data | Who can deploy |
|---|---|---|---|---|---|
| local | | | | | |
| staging | | | | | |
| production | | | | | |

## 5. Configuration and secrets register (names only, never values)
Start from the env-names scan (the handover skill's script), then complete by hand. Remove this line from the finished doc.
| Name | Purpose | Environments | Secret | Where it lives | Who can change it | Rotated at handover | Last rotated |
|---|---|---|---|---|---|---|---|
| `STRIPE_SECRET_KEY` | server-side payments | production | yes | provider dashboard -> password manager entry "<name>" | client admin | yes | <date> |
Platform bindings: <databases, buckets, queues, KV, and their names>.
Rule: new secrets go in the secret store, never in the repository, chat or email.

## 6. Accounts and ownership transfer
| Asset | Provider | Current owner | New owner | Method | Done by | Status | Verified by and date |
|---|---|---|---|---|---|---|---|
| Domain | <registrar> | | | | | | |
| DNS | | | | | | | |
| Hosting | | | | | | | |
| Source repository | | | | | | | |
| CI | | | | | | | |
| Database | | | | | | | |
| App store (Apple) | | | | | | | |
| App store (Google) | | | | | | | |
| Analytics and tag manager | | | | | | | |
| Search Console | | | | | | | |
| Email (mailboxes and sending) | | | | | | | |
| Payment provider | | | | | | | |
| Error tracking and monitoring | | | | | | | |
| Password manager vault | | | | | | | |
Our access is removed after: <date or event>. Credentials we have seen are rotated: <date>.

## 7. Data, backups and restore
| Data | Store | Backup method | Frequency | Retention | Copy location | Last restore proven |
|---|---|---|---|---|---|---|
Restore steps: <exact>. Who can run them: <role>. Estimated time: <n>. Personal data held: <categories only>, retention rule: <rule>.

## 8. Monitoring and alerts
| What | Tool | Alert goes to | Threshold | Link |
|---|---|---|---|---|
| Uptime | | | | |
| Errors | | | | |
| Logs | | | | where, how long kept |
| Cost or usage limits | | | | |
What normal looks like: <typical error rate, response time, traffic, queue depth>.

## 9. Routine operations
| Task | How often | Steps or link | Who |
|---|---|---|---|
| Deploy | | | |
| Roll back | | | |
| Rotate a secret | | | |
| Renew domain and certificates | | | |
| Add or remove a user or admin | | | |
| Restore data | | | |
| Update dependencies and runtime | | | |
First steps in an incident: <check status page and alerts, roll back if the last deploy is the cause, contact order>.

## 10. Known issues and technical debt
| Id | Issue | Severity | Impact and workaround | Suggested next step | Under warranty |
|---|---|---|---|---|---|
End-of-life dates within a year: <runtime, framework, store API level, certificates>.

## 11. Support, warranty and care plan
<bug window length and end date; what is covered and not; how to request; response time; care plan options and prices; renewal and exit terms. Wording from the contract or playbook.>

## 12. Costs and renewals
| Item | Provider | Cost | Billing cycle | Renewal date | Paid by |
|---|---|---|---|---|---|
Usage-based costs to watch: <API calls, storage, email volume, SMS, ads>.

## 13. Third-party code, licences and ownership
<open-source licences that need notices, paid licences and whose name they are in (fonts, themes, plugins, stock assets), who owns the delivered work and when, what the vendor keeps and licenses back. Wording from the contract.>

## 14. Contacts
| Role | Name | Channel | Covers |
|---|---|---|---|

## 15. Sign-off
- [ ] Recipient can run the project locally from section 3 on a clean machine
- [ ] Recipient can deploy to staging (or has watched a deploy) and knows how to roll back
- [ ] Every account in section 6 is owned by the new owner and verified
- [ ] Every secret in section 5 has a known location, and vendor-known credentials are rotated
- [ ] A backup exists and the restore steps were read; last proven restore date recorded
- [ ] Alerts in section 8 reach the new owner
- [ ] Known issues in section 10 are understood
- [ ] Support terms in section 11 are understood, including the end date
- [ ] Final payment and any contract conditions for handover are complete
- [ ] Our access has been removed or limited as listed

Accepted for the recipient: <name, role>   Date: <date>   Signature:
Delivered by: <name, role>   Date: <date>   Signature:

## Appendix A. Verification log
| What | Command or check | Where run | Result | Date |
|---|---|---|---|---|

## Appendix B. Not covered or unverified
<one line each, with the reason>
```

## Writing rules

- Commands are copy-pasteable and say where to run them. Output the reader should expect is shown for the first command of each section.
- Use the recipient's words for the owner summary (no stack jargon).
- One owner per row. "The team" is not an owner.
- Dates are absolute (2026-12-01), never "next month".
- If a row cannot be filled, keep it and write `OPEN: <question>`. A visible gap is better than a missing row.
- The doc must still make sense if the vendor is unreachable next year.
