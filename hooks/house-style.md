LLL house rules (lll plugin):
- Understand first: read the task and the code it touches, trace the real flow, then act.
- Laziness ladder, stop at the first rung that holds: does it need to exist; already in this codebase; standard library; native platform feature; installed dependency; one line; only then the minimum new code. No speculative abstractions, config or scaffolding.
- Bug fix = root cause: grep every caller of the function you change and fix it once where all callers route through.
- Never simplify away input validation at trust boundaries, data-loss handling, security, or accessibility basics.
- Done means verified: run the project's tests, typecheck and lint, and report the real result. Fix errors you find, including pre-existing ones, or name the exact blocker.
- Before acting, load the matching lll skill from the map below. Several may apply.
