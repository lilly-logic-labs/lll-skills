# Experiments and decisions

Use a test when a change is cheap to randomise, the outcome is measurable and fast, and the decision would change with the result. Otherwise decide with judgement and watch a leading indicator.

## 1. Is a test worth it?

Check sample size first:

```
node scripts/analytics-check.mjs sample --baseline 0.04 --mde 0.004 --daily 1200 --variants 2
```

- `--baseline` current rate, `--mde` smallest absolute change worth detecting (add `--relative` for a percentage), `--alpha` default 0.05, `--power` default 0.8, `--daily` visitors per day across all variants.
- Output: visitors per variant and days needed.
- If the run time is more than about 4 weeks, or traffic is tiny, do not test. Ship the change that follows evidence from interviews, session replays, support tickets or best practice, and compare before and after with caveats.

## 2. Hypothesis and pre-registration

Write before launch, in one block:

```
Change: <exact difference between control and variant>
Because: <evidence that suggests it will help>
Primary metric: <one metric, one definition, one window>
Guardrails: <metrics that must not get worse: revenue per visitor, error rate, speed, refund rate>
Population: <who is in, who is out>
Sample size and stop date: <from the calculator; not "until it looks good">
Decision rule: <ship if..., hold if..., kill if...>
```

Do not change the metric, split or stop date after seeing data.

## 3. Prioritise ideas with ICE

Score each 1 to 10, then Impact times Confidence divided by Effort.

| Idea | Impact (size if it works) | Confidence (evidence) | Effort | Score |
|---|---|---|---|---|
| shorten checkout form | 8 | 7 | 3 | 18.7 |

Highest scores first. Impact on a step with little traffic is small, however big the lift. Confidence must name its evidence.

## 4. Run it right

- Randomise by user or device, not by session; keep assignment sticky.
- Run whole weeks to cover weekly cycles.
- Sample ratio check (SRM): if a 50/50 split shows 5,300 vs 4,700, the assignment is broken; do not read the result. A chi-square test on the counts at p < 0.001 is a stop sign.
- No peeking decisions. Looking is fine; stopping on the first significant result inflates false wins. If you must stop early, use a sequential method (the tool you run it in may offer one) and say so.
- One change per test where possible. If several changes ship together, call it a package test and do not claim which part worked.
- Do not run overlapping tests on the same step with the same users unless the tool handles interaction.
- Watch the guardrails daily; stop early only for harm.

## 5. Read the result

```
node scripts/analytics-check.mjs ab --a 5000,200 --b 5000,245
```

Format is `visitors,conversions` per arm. It returns rates, absolute and relative lift, a 95 percent confidence interval and a two-sided p-value (pooled two-proportion z-test).

Rules:
- Report the interval, not only p. A "significant" lift with an interval from 0.1 percent to 9 percent means little precision.
- Compare to the minimum worth acting on. A true but tiny lift may not pay for its maintenance.
- Revenue per visitor and other non-binary metrics need a different test (t-test, bootstrap) and enough orders; use the experiment tool's report or the warehouse, and still state the interval.
- Check segments only for explaining a result, not for rescuing a null one.
- Novelty and primacy: effects often shrink; hold back a part of traffic after shipping, or check the metric after a month.

## 6. Decide

| Result | Action |
|---|---|
| Primary up, interval clear of zero, guardrails fine | ship to everyone; record the effect with the interval |
| Primary flat, interval narrow around zero | keep the simpler version; record "no effect found, effect larger than X ruled out" |
| Primary flat, interval wide | inconclusive; either run longer (if cheap) or decide on other grounds; say it was not decided by the test |
| Primary up but a guardrail down | do not ship; find the trade-off in money terms |
| Primary down | kill; note the hypothesis was wrong and why you think so |

## 7. Decision log (keep what you learn)

Write one entry per test or significant decision. Patterns matter more than events. Look through earlier entries before writing a new one, and update an existing pattern instead of adding a near-duplicate.

```
## <date> <short name>
Question: ...
What we did: ...
Result: numbers, interval, sample, dates
Surprise: what contradicted our expectation
Pattern: what this suggests for the next decision (a rule of thumb, with how sure we are)
Next time I will: ...
Failures first: if it did not work, say that in the first line
```

Where to keep it: a `docs/experiments.md` in the repo, or the team's knowledge base. A short, searchable log beats a long report no one opens.

## 8. Feature flags and gradual rollout

Use flags for safe rollout, then analyse the rollout as a natural experiment when you cannot randomise. PostHog, Statsig, GrowthBook, LaunchDarkly, Firebase Remote Config and Cloudflare-based flags can all assign variants; the wrapper in `./implementation.md` should send the variant as an event property (`experiment_id`, `variant`) on the exposure event.

Exposure event: log it when the user actually sees the difference, not at assignment, otherwise unexposed users dilute the effect.

## 9. When not to test

- Legal, safety, accessibility fixes: just do them.
- Obvious bug fixes.
- Brand, price and positioning decisions with long feedback loops: use research and judgement; pricing needs its own method (`lll:pricing`).
- Very low traffic: use qualitative research, then before-and-after.
