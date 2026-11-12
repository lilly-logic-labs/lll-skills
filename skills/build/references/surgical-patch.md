# Surgical patch

A bug or a small behaviour change fixed at the narrowest layer that owns the wrong behaviour, with proof that it is fixed and that nothing next to it moved. Use when the cause is known. If it is not, stop and use `lll:debug`.

## Procedure

1. **Capture the failure.** Reproduce it with a failing test when that is cheap. Otherwise capture the strongest evidence available: the exact command and output, the request and response, the log line, the screenshot. Without it you cannot say later that it is fixed.
2. **Name the owning layer.** Trace from the symptom to the mechanism that is wrong: the function that computes the bad value, not the screen that shows it. Ask which layer is the single place every caller routes through (validation at the boundary, the shared helper, the query, the reducer).
3. **Map the blast radius before editing.** Grep every caller and every consumer of the thing you will change. Read the sibling call sites and the code three hops downstream: a default that moves, an order that changes, a format another service reads. Write down the one fact that makes the change safe ("this path only sees entries already validated"). If you cannot, the change is not yet understood.
4. **Write the regression test first** at the layer that owns the behaviour. It fails now for the reported reason. For platform glue that cannot be unit tested, record why in the commit body and use the nearest honest check.
5. **Make the narrowest change** that turns it green. Preserve unrelated behaviour, formatting and other people's uncommitted changes. No renaming, no tidying, no drive-by abstractions, no "while I am here" improvements. If the cause turns out to be wider than the layer (the bug is in a contract two modules disagree about), say so and re-scope; do not paper over it in one of them.
6. **Prove it.** Focused test green; the old reproduction now passes; the adjacent happy path passes; then the project's gates. Show that the new test fails without the fix (revert the fix, run, restore) when the bug was a regression or the test is non-obvious.
7. **Stop** when the failure is fixed and the regression proof passes. Report anything noticed but not changed.

## Guards

- Fix at the source of the bad value, not where it explodes. Add validation at the other layers the value passes only when the bug class is "invalid data got through"; one defensive layer per boundary, not per line.
- More than five files touched: the patch is probably not surgical. Stop and ask whether the cause spans them (route to a plan) or split the critical-path fix from the rest.
- A fix that needs a new dependency, a new config key or a schema change is not a patch. Route to `lll:plan` or the migration route.
- Three failed fix attempts: stop. Write down the premise the attempts share and test it; likely a wrong architecture or a wrong cause (`lll:debug`).
- Do not change the test to match the new behaviour unless the behaviour change is the request.

## Commit message

`fix(<scope>): <what now works>`, body: the symptom, the cause in one line, the regression test, the one fact that makes it safe. Security fixes, data fixes and reverts always get a body.
