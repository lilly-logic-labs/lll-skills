# Drift check mode

Read-only. Reports where docs and code disagree. Edits nothing, installs nothing, writes no file unless the user asked for a written report.

## Scope

- Named files or folders; or the docs touched by a change set; or the whole repository when the user asks for a sweep.
- Skip history (dated plans, audits, accepted ADRs, old changelog entries) and generated or vendored output. Say how many files were skipped.

## Procedure

1. Record the stack-detect block (`../../../shared/stack-detect.md`) in two lines.
2. Run the mechanical sweep: `node scripts/drift.mjs --root <repo> [--docs <list>]`. Treat each result as a lead.
3. Read the high-value docs against the code: `README` run steps, `CLAUDE.md`/`AGENTS.md` commands and architecture, the main architecture doc, the API docs, the env example file, `CONTRIBUTING`. Check each claim with the claim-check method linked from SKILL.md.
4. Confirm each lead or discard it. A lead becomes a finding only with evidence on both sides: the doc line and the code line.
5. Rank by harm to a reader: a wrong install or deploy command, a wrong security statement, a wrong API contract or a wrong default is worse than a stale screenshot.

## Finding format

Use the block from `../../../shared/findings.md` with lens `drift`:

```
### [MEDIUM] README run command names a script that no longer exists
- Id: drift-readme-dev-script
- Lens: drift
- Location: README.md:42   (also: docs/setup.md:10)
- Evidence: `npm run dev:all` ; package.json scripts has no "dev:all" (only "dev", "dev:api")
- Failure scenario: a new contributor follows the README, gets "missing script: dev:all", and cannot start the project
- Fix: replace with `pnpm dev` (package.json:12) in both files
- Confidence: high
- Verdict: confirmed
```

A doc line that is vague or merely old-fashioned with no wrong consequence is a style note, not a finding. Verdicts follow `../../../shared/findings.md`: unresolved facts are `needs_validation` (for example, a screenshot that may be out of date).

## Severity for drift

- **high**: a command, setup step or deploy instruction that fails; a security or permission statement the code contradicts; an API contract the docs state wrongly; a destructive command described as safe.
- **medium**: wrong default, wrong env var or config key, stale architecture description, missing documentation for new public surface, a broken link to a core doc.
- **low**: stale counts, renamed headings, outdated screenshots, comments that mention old names, orphan docs.

## Output

Chat list ordered by severity: `path:line`, what the doc says, what the code says, the suggested edit. End with totals, what was skipped (history, generated, unverifiable screenshots), and the offer: "Run the docs update on these?". If the user asked for a written report, put it at `docs/audits/<date>-docs-drift.md` using `../../../shared/report.md`.
