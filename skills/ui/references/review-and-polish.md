# Review and polish

One procedure for reviewing a UI (read-only) and for polishing one (editing). Review finds and ranks. Polish applies fixes in a fixed order and keeps the existing identity.

## 1. Inputs

- Code (files or a diff), a screenshot, a URL, a running app, or a mix. Screenshot only: review the visual, state that motion, states and keyboard are unreviewed.
- Project design docs and tokens (they win).
- The job line from step 2 of the skill: who, what, the one primary action.
- Optional: peer-group notes from the calibration step.

## 2. Review dimensions, in order

1. **Job and hierarchy.** Is the primary action obvious in two seconds? Squint test, trunk test, mindless-click test.
2. **Layout and spacing.** Scale respected, grouping by proximity, alignment edges, max widths, containers earn their place.
3. **Type.** Scale steps, line length, truncation, tabular numbers, scaling with text size.
4. **Colour and contrast.** Role tokens, measured ratios in every theme and state, not colour alone.
5. **States.** The matrix for this screen: loading, empty, error, success, offline, partial, long content. Buttons: hover, focus, pressed, loading, disabled.
6. **Forms and flow.** Fields earn their place, inline validation, errors under the field, input survives failure, no double submit, navigation answers where-am-I.
7. **Copy.** Buttons name outcomes, errors name fixes, one term per action, no happy talk or invented claims.
8. **Motion.** Gate passed, purposeful, interruptible, reduced-motion path, compositor-only properties.
9. **Accessibility.** The ten checks, keyboard path, names and roles, target sizes, text scaling.
10. **Platform fit.** Native components and idiom; no other platform's navigation pasted in; glass or material used per platform rules.
11. **Tokens and reuse.** Existing tokens and components used; no parallel system; no raw values.
12. **Slop.** Tells that show nobody decided (see the slop list).
13. **Performance feel.** Reserved space, response under 100 ms, list virtualisation, image sizes.

Default to flagging. Approval is earned: a screen with no loading, error or empty design is unfinished, not a pass.

### Quick heuristic pass (Nielsen, ten questions)

When a full review is too much, ask these ten of the flow. Each failure maps to a dimension above.
1. Does the screen show system status (loading, saved, offline)?
2. Does it speak the user's words, not internal terms?
3. Can the person undo, cancel or leave without penalty?
4. Is it consistent with itself and with the platform?
5. Does it prevent errors before it reports them?
6. Is what they need visible, so they do not have to remember it?
7. Is there a fast path for experts (shortcuts, defaults, bulk)?
8. Is it minimal, with no rarely used information competing with the main task?
9. Do errors say what happened and how to fix it?
10. Is help findable in context when needed?

### Persona walk

Run the main flow as three people and note where each stalls: a first-time user with no context; a hurried repeat user on a phone with one hand; a person with a constraint that matters here (screen reader, large text, slow network, colour-blind, non-native language). Pick personas from the product, not from a template.

### Quick wins

When asked "what should I fix first", lead with fixes that take under an hour and unblock a core flow: a missing disabled-on-submit, an unlabelled icon button, a contrast token, a missing empty state, an error that names no fix.

## 3. Mechanical scan first

`node scripts/ui-scan.mjs <paths>` prints anti-pattern hits with `path:line` across CSS, markup, JSX, SwiftUI and Compose. Each hit is a lead. Open the line, decide, and either write the finding or drop it. Then do the judgement review on the rendered result.

## 4. Writing a finding

Each row gives a place, the problem, the fix and a severity. The failure scenario is the person doing something and getting a bad outcome. Pure taste goes in "Polish notes", not in the table.

Severity for UI (aligned with the shared scale in `../../../shared/findings.md`):

| Severity | UI examples |
|---|---|
| critical | An authoritative figure (price, balance, dose, deadline) displays wrong or stale as if live; a destructive action hits the wrong target with no undo; a submit silently discards data |
| high | A core flow cannot be completed by keyboard or screen reader; dead press on the primary action; double-submit window on a payment; content or primary button hidden behind the keyboard or system bar; typed input lost on error; primary text fails contrast so people cannot read it |
| medium | Missing empty, loading or error state on a secondary screen; error message that gives no next step; layout breaks at 200 percent text or 320 px; inconsistent behaviour between two similar screens; unreachable reason for a disabled control |
| low | One control below target size; one icon without a name; spacing off the scale; minor misalignment |

Confidence: high when you saw it rendered or traced the code; medium when inferred from code only; low when it depends on content you have not seen.

## 5. Review output (guidance mode)

```
Measured against: <products used for calibration, or "unverified: no reference check">
Surface: <Do | Sell | Read | Explore>   Job: <one line>

| # | Where | Problem (what the person experiences) | Fix | Sev |
|---|---|---|---|---|
| 1 | src/pay/Form.tsx:88 | Pay button stays pressable while the request runs; a second tap charges twice | disable and show spinner on submit; idempotency key | high |

Polish notes (taste, not defects)
- <one line each>

Not reviewed: <motion on device, screen reader, dark mode ...>
Verdict: Block | Approve with changes | Approve
```

- **Block** when any critical or high finding is open.
- **Approve with changes** when only medium or low remain and none breaks a flow.
- **Approve** when the table is empty.
- Max about ten rows; merge duplicates; rank by severity, then by how many people hit it. Prefer five precise rows to twenty vague ones.
- Every row cites `path:line` or a named screenshot. Say "change X to Y because Z", never "the spacing feels off".

### Optional scoring (full mode)

Grade each dimension A to F. Start at A; each high finding drops one letter, each medium half a letter, polish notes do not count. A: intentional and polished. B: solid with minor inconsistency. C: functional but generic. D: careless. F: actively hurts people. Weighted headline for a web page: hierarchy, type, layout 15 percent each; colour, states, responsive, content 10 percent each; slop, motion, performance 5 percent each. Report the slop grade separately with a one-line verdict.

## 6. Polish pass

Polish is refinement, not a hidden redesign. Preserve the current identity, behaviour and copy; ask before changing claims. If the concept is wrong, say so and recommend a redesign instead.

Order of operations (stop when it is good enough):
1. **Delete.** Extra cards, borders, labels, animations, fields, words.
2. **Reduce.** Shadow strength, radius variety, colours, type sizes, motion durations.
3. **Fix values.** Move raw values onto tokens; correct easing, damping, opacity, tracking.
4. **Fix structure.** Hierarchy, grouping, alignment edges, spacing rhythm.
5. **Fix states.** Add the missing ones; make existing ones consistent.
6. **Fix origin and path.** Motion starts where the thing came from and returns there; make it interruptible.
7. **Accessibility.** Names, focus, contrast, targets, reduced motion.
8. **Detail.** Optical alignment and rhythm (below).
9. **Clean up.** Remove debug output, dead styles, unused imports; replace one-offs with shared components; promote real repeats to tokens (not single exceptions).

### Optical details

The eye weighs; it does not measure. Nudge by eye, then record the nudge as a token or a commented value.
- Asymmetric glyphs (play triangle, chevron, paper plane) sit toward their heavier side; a play triangle sits about 8 to 10 percent right of centre.
- Text in buttons and chips looks low: trim the text box (`text-box: trim-both cap alphabetic`, SwiftUI baseline alignment, Compose `LineHeightStyle` with trim) or raise by half the descender.
- Circles and triangles overshoot squares by 2 to 3 percent to look equal.
- Nested corners: inner radius = outer radius minus padding. Large surfaces use continuous (superellipse) corners where the platform offers them.
- Space above a heading is 1.5 to 2 times the space below; card top padding 1 to 2 pt more than the sides.
- Hairlines: 0.5 pt on light glass, 1 pt on dark; thin lines look thinner on dark and small sizes.
- Quotes, bullets and list numbers hang outside the text column; rows with and without leading icons share one text start.
- Compare at 1x and 3x; flip the screenshot horizontally; blur it. Misalignments hidden by reading order show up.

## 7. Verification after edits

1. Run the project gates (lint, typecheck, tests, build).
2. Re-capture the same screens at the same sizes; compare before and after.
3. Walk the primary path with mouse, keyboard and touch where relevant.
4. Check light, dark, longest content, empty content, reduced motion, largest text.
5. Look at the source diff; remove accidental churn.
6. One batched inspection round, fix everything it shows in one pass, one confirming round, then stop. Open-ended self-inspection burns time and rarely finds more.

Evidence of "done" is the real output of the gates and the captures, not the claim.
