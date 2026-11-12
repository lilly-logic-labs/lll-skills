# Verification

How to make "verified" mean something in a handover pack. Three checks: the runbook works from a clean copy, no secret value is in the document, and access is closed on our side after transfer.

## 1. Clean-copy rehearsal of the runbook

Follow the recipient's path, not ours. Needs the owner's go-ahead because it installs and runs.

1. Make a throwaway copy outside the shared checkout: `git clone --local <repo> <scratch>/handover-check` (non-git projects: copy the folder without dependency and build folders). It contains only committed files, which is the point: anything that works only because of an untracked file on our machine fails here.
2. Use only the handover doc. Do not use memory, shell history or our environment variables. Provide the variables from the register with sandbox or dummy values; never use production credentials.
3. Run install, test, build, start, in the doc's order. Record in Appendix A: command, result, time, and any step the doc skipped.
4. Hit the health check and one read-only page or endpoint (the built-in `run` skill can start and drive the app for this).
5. For deploy and rollback: read the doc's steps against the CI file or platform config and check each referenced file, script, job name and environment exists. Do not deploy. Mark deploy steps `[unverified: not run]` unless the owner confirms a recent run.
6. Fix the doc (or the code, as a reported finding) for every failure; repeat from step 2 until a full pass has no unwritten steps.
7. Leave the scratch copy for the owner and say where it is.

Common failures: undocumented system library, wrong runtime version, a script that assumes a file ignored by git, a migration order issue, a variable required but missing from the register, a README command that was renamed in package scripts, a seed step nobody wrote down.

## 2. Evidence table

Appendix A of the doc. Each row: what was checked, the command or action, where run, result in one line, date. Account facts: who confirmed (owner, client, dashboard screenshot) and when.

| Claim | Verified how | Counts as verified |
|---|---|---|
| Install, test, build, start work | rehearsal in a clean copy | yes |
| CI is green on the default branch | CI run link and date | yes |
| Deploy steps are right | read against CI and config only | no: unverified unless a recent real deploy is cited |
| Backup runs nightly | job config and the latest backup timestamp seen by the owner | yes, if seen |
| Restore works | `lll:backup-drill` report date | yes, with the date |
| Domain is in the client's name | registrar page seen by the client | yes |
| Variable list is complete | env-names scan plus the clean-copy start | yes |

## 3. Secret sweep on the finished doc

Run on the handover doc and any file produced for the client (Git Bash; in PowerShell use `Select-String -Pattern` with the same expression):

```
grep -nEi "(password|passwd|secret|token|api[_-]?key)[\"' ]*[:=][\"' ]*[A-Za-z0-9_/+=.-]{8,}|-----BEGIN [A-Z ]*PRIVATE KEY|AKIA[0-9A-Z]{16}|sk_(live|test)_[A-Za-z0-9]{8,}|ghp_[A-Za-z0-9]{20,}|xox[abp]-[A-Za-z0-9-]{10,}|eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\." docs/handover/*.md
```

Any hit is a leak or a false positive. A leak: remove it, tell the owner to rotate that credential, and say where it appeared (file and line, never the value). Also search the doc for connection strings with embedded credentials (`://user:pass@`), personal emails and phone numbers that do not belong, and screenshots with visible tokens.

This sweep covers the document only. A content scan of the repository and its history is `lll:security`; if nobody has run one, say so in section 10.

## 4. Access removal on our side (after the transfer, on the agreed date)

For each system in section 6:

- [ ] our user removed, or reduced to the support role with an end date
- [ ] our personal access tokens and API keys revoked
- [ ] SSH keys and deploy keys of ours removed from repos and servers
- [ ] OAuth apps and integrations we authorised revoked
- [ ] CI tokens we created replaced
- [ ] shared logins (if any existed) changed and the new value placed only in the client's vault
- [ ] our devices removed from two-factor and trusted-device lists
- [ ] local copies of production data, dumps and keys on our machines deleted, in line with the contract
- [ ] the vendor's password manager entries for the client moved to the client's vault and removed from ours

Each tick needs the owner or client to confirm; record who and when.

## 5. After handover

- Day 1: the client confirms they can log in to every account and receive alerts.
- Day 14 (or the end of the bug window): run the follow-up audit (`lll:launch`), collect any bug list, close the project.
- Before the support period ends: remind the owner of renewal dates and care plan options.

## 6. Say what you could not verify

Appendix B lists every item skipped or unverified with the reason ("no access to the registrar", "no staging environment", "deploy not run by agreement"). A visible gap is a finding for the owner; a silent one is a risk for the client.
