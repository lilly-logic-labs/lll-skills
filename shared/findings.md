# Findings

One format for every defect any `lll` skill reports. `lll:security` full audits also write `findings.json` against `skills/security/engine/report-schema.json`; everything else uses this markdown block.

## Finding block

```
### [<SEVERITY>] <title>
- Id: <lens>-<short-slug>            (stable across runs; never a line number)
- Lens: <bugs | security | db | deps | perf | a11y | tests | cleanup | drift | migration | release | agent-config | ...>
- Location: path:line   (add "also: path:line" for each other place)
- Evidence: `quoted code` or the command and its decisive output line
- Failure scenario: <specific input or state> leads to <wrong result, crash, loss, leak or exploit>
- Fix: <one or two lines; the smallest change at the layer responsible>
- Confidence: high | medium | low
- Verdict: confirmed | needs_validation | rejected
```

A finding without a failure scenario is a style note and is not reported. If the scenario cannot be stated yet, it is a question for the owner and goes in the report's Questions section.

## Severity

Severity follows the failure scenario: what happens, to whom, how often. It is separate from confidence.

- **critical**: data loss or corruption; money, health or legal figures shown wrong as if authoritative; secret exposed; authentication or authorisation bypass; one user or tenant reading or writing another's data; remote code execution; a deleted record silently coming back.
- **high**: likely failure in a core flow (sign-up, sign-in, checkout, sync, save, publish); privacy leak; crash on common input; production config that fails open; a migration that can lose data.
- **medium**: edge-case bug; missing error handling that loses user work; client and server contract mismatch on a rare path; an inconsistency that will cause bugs; a slow path users will notice.
- **low**: minor glitch; misleading dead code; missing test for a risky path; a11y issue on one control.

## Verdicts

Borrowed from Cloudflare's security-audit skill.

- **confirmed**: complete trace from source to the bad outcome, checked by someone other than the finder by re-reading the code and its callers. Has a severity.
- **needs_validation**: one exact unresolved fact stands between the candidate and confirmation ("depends on whether `X` is ever null in production"). Has no severity. Never auto-fixed.
- **rejected**: the verifier disproved it. Keep one line of reasoning; it stops the next run reporting it again.

## Verification

1. The finder never verifies its own finding.
2. The verifier gets the finding block only, not the finder's reasoning, and tries to disprove it: read the code, every caller, both sides of any client and server contract, config and tests.
3. The verifier returns the verdict and one line of reasoning. Material changes to the finding (new location, new scenario) get one more independent verification.
4. Only `confirmed` findings go to the fix phase.

## Dedupe and rerun

- Merge duplicates across lenses, keep the most specific location and list both lenses.
- If an earlier report exists in the report directory, mark each finding `new`, `persisting` or `gone`, matched by `Id`.
