# Finding calibration

How to decide what to report, how loud to be, and how to avoid both missed bugs and noise. Finding format, severity and verdict definitions live in `../../../shared/findings.md`; this file is the practice.

## 1. Every finding needs a scenario

Write one sentence: "when <specific input or state>, <wrong result>". Examples:
- Good: "When two requests with the same `orderId` arrive together, both pass the `exists` check and the customer is charged twice."
- Not a finding: "This could have concurrency issues." Ask the author a question, or investigate until you can write the sentence.

If you cannot produce the scenario after reading the callers, the item goes under Questions.

## 2. Severity from consequence

Ask three things: what breaks, for whom, how often.

| Severity | Typical examples in a review |
|---|---|
| Critical | Tenant data readable by another tenant; auth check missing on a write route; secret committed; destructive query without scope; money computed wrong; migration that drops data |
| High | Core flow fails on common input; crash on startup or on a popular screen; data written incorrectly in a normal case; fails open; breaking API change without versioning; race on a hot path |
| Medium | Edge case bug; error swallowed so work is lost; missing validation on a rare path; missing index on a growing table; contract mismatch on a rare path; test that cannot fail |
| Low | Minor glitch; dead code that misleads; missing test for a risky but unchanged path; small a11y gap; naming |

A nit that is purely taste is not a finding. Put it under "Optional" in one line, or leave it out.

## 3. Confidence is separate from severity

- **High**: you traced it from input to bad outcome and checked callers.
- **Medium**: the logic is wrong on the paths you read, but one fact outside the code (config, data, runtime) could change it. Name that fact.
- **Low**: pattern match only. Do not report as a finding; ask.

A critical-severity idea at low confidence is a question to the owner with the exact missing fact, marked `needs_validation`.

## 4. Do not flag

- Things the linter, formatter, type checker or CI already enforce, unless the gate is bypassed in this change.
- Pre-existing problems unrelated to the change, unless the change makes them worse, depends on them, or the user asked for a wide review. If you mention one, label it `pre-existing`.
- Style that matches the surrounding code and the project's conventions.
- A different design you would have chosen, when the chosen one works and fits the project. A real downside with a scenario is a finding; a preference is not.
- Hypothetical future requirements.
- Anything the project's ADRs or locked decisions settle (`../../../shared/ground-rules.md`, Authority).
- Test code held to production standards (but tests that cannot fail are a finding).
- Generated files and vendored code, except when they were hand-edited.
- The same issue repeated in ten places: report once, list the locations.

## 5. Sideways sweep

A defect is rarely alone. After each confirmed defect:
1. Grep the repository for the same pattern (same function, same idiom, same field).
2. Check sibling files in the folder, other platforms (web/mobile/backend), other environments.
3. Check docs, fixtures and tests that encode the old behaviour.
4. Report the extra locations in the same finding as `also:` lines.

For value completeness (new enum member, status, role, flag, route): list every consumer found and name the ones that do not handle it.

## 6. Gate integrity

A change that makes the gates pass by weakening them is a finding on its own. Look for:
- Skipped, focused (`.only`), commented-out or deleted tests; `xit`, `@Ignore`, `t.Skip`, `#[ignore]`, `pytest.mark.skip`.
- Assertions loosened (exact value to "truthy", count to "at least one"), snapshots regenerated without review, tolerances widened.
- Lint or type rules disabled, `// @ts-ignore`, `# type: ignore`, `eslint-disable`, `allow(...)` additions, coverage thresholds lowered.
- Retries or longer timeouts added to a failing test; sleeps added.
- `--no-verify`, CI steps made non-blocking (`continue-on-error`), required checks removed, hooks bypassed.
- Mocks added around the code that was failing.
Severity: medium by default; high when the weakened gate protected a core flow or security.

## 7. Verification

1. The finder never verifies its own finding (`../../../shared/findings.md`, Verification).
2. The verifier gets only the finding block, plus read access. It tries to disprove: re-read the code, every caller, both sides of any contract, config, and tests.
3. Verdict: `confirmed` (with the final severity), `needs_validation` (one named unresolved fact, no severity, not auto-fixed) or `rejected` (one line of reasoning, kept so it is not re-reported).
4. Guidance mode has no verifier. Do your own second read after a break from the finding: could any caller make this impossible? Mark anything you could not close as `needs_validation`.

## 8. Wording

- Lead with the consequence, then the location, then the fix.
- One finding, one issue. Quote the code. Suggest the smallest fix at the responsible layer.
- Questions end in a question mark and name the fact that would settle them.
- Praise is allowed in one line when something was done well (a careful migration, a good regression test). Keep it factual.
- Never rewrite the author's approach in a comment unless the approach has a defect.
- Do not use "just", "obviously", "simply". Do not guess at motives.

## 9. Count and rank

- Order: severity, then confidence.
- More than 15 findings: the top ten in full, the rest as one line each. If most are low, say the change is generally sound and list the few that matter.
- Report what was not covered (files skipped, generated code, platforms not reviewed, gates not run).
