# Critique and redesign

Use when someone asks for feedback on a logo, wants options compared, or wants to modernise or replace a mark.

## 1. Critique method

1. **Context first.** What the organisation does, for whom, what it should feel like. A logo can only be judged against its purpose. If unknown, ask one question or state assumptions.
2. **First impression (two seconds).** What do you see, feel and remember? What would a stranger call it?
3. **Technical pass.** If an SVG exists, run `node scripts/svg-check.mjs check logo.svg` and `node scripts/svg-check.mjs sheet logo.svg -o sheet.html`, then look at the sheet. For a raster, reason visually about the same checks, and say vector structure is unchecked.
4. **Principles pass.** Score each dimension below from 1 to 5 with one line of evidence.
5. **Prioritise.** The three changes with the largest impact, most important first, each actionable and specific ("open the counter of the e from 6 to 12 units").
6. **Demonstrate** (optional). Sketch the fix as an SVG revision when the owner wants it.

## 2. Scorecard

| Dimension | Question | Score 1 to 5 | Evidence |
|---|---|---|---|
| Idea | one clear, relevant idea, sayable in a sentence? | | |
| Simplicity | anything unnecessary? survives 16 px and a squint? | | |
| Distinction | stands apart from competitors and famous marks? | | |
| Memorability | one defining feature you would recall tomorrow? | | |
| Relevance and tone | shape, weight, colour and type match the brand? | | |
| Craft | clean geometry, optical corrections, consistent weights, spacing? | | |
| Versatility | one colour, reversed, small, large, embroidery, app icon, lockups? | | |
| Longevity | built on a concept rather than a trend? | | |
| Colour | few, purposeful, ownable, accessible, reproducible? | | |
| Typography | appropriate, customised, legible, spaced, at most two families? | | |

The total out of 50 is a rough guide; one fatal flaw (illegible small, looks like a competitor, offensive reading) outweighs a high total.

## 3. Common diagnoses

| Symptom | Likely cause | Fix |
|---|---|---|
| Mush at small sizes | too many elements, thin lines, small gaps | remove detail, thicken, open gaps, make a small cut |
| Looks generic or templated | stock typeface, cliché symbol | customise letters; find an ownable twist from the name or promise |
| Looks dated | gradients, bevels, shadows, trendy font | flatten, simplify, pick timeless type |
| Busy | two or three ideas competing | choose one idea; move the others into the identity system |
| Symbol and type unrelated | different geometry or weight logic | share radii, stroke weights and angles; rebalance sizes |
| Feels unstable | accidental tilt, top-heavy mass | widen the base, correct axes, check optical centre |
| Circle looks small beside letters | no overshoot | enlarge round forms 1 to 3 percent |
| Rounded rectangle looks pinched | bone effect | smooth the curvature transition |
| Reversed version looks bold | irradiation | thin the white version slightly |
| Fails on photos | no container or outline version | add one |
| Hidden meaning nobody sees | too subtle or too complex | make it a bonus, or simplify until it reads |
| Unfortunate reading | designer blindness | change the offending shape; test with fresh eyes |
| Looks like another brand | convergent category cues | depart on shape or idea, not just colour |

## 4. Critique output

```
Logo critique: <name>
First impression: <1 or 2 sentences>
What works: <2 or 3 bullets>
Scorecard: <table filled>
Top 3 changes, in order:
1. <change>: why, and how (specific)
2. ...
Tests run: <which, with results>   Not run: <which, why>
Verdict: keep as is | refine | redesign, with one reason
```

Be specific, kind and useful. Name what works as well as what fails.

## 5. Refresh or rebrand

Decide with the owner:

| Situation | Choose |
|---|---|
| Recognised mark, dated execution | **Refresh**: keep the idea, shapes and colours people know; fix craft, simplify, modernise type, produce a proper vector set |
| Recognised name, weak or wrong mark | **Evolve**: keep colour and name style, redraw the symbol |
| Brand direction changed, merger, wrong audience, name change | **Rebrand**: new idea; plan the transition |
| New product inside a recognised brand | **Sub-brand**: inherit the family structure |

### Equity audit before changing anything
- What do customers recognise (colour, shape, name treatment)? Ask the owner; look at how the mark is used.
- Where does the mark live (signage, packaging, app stores, domain, documents)? Each is a migration cost.
- What must stay? Write it down.

### Refresh techniques
- Simplify: remove effects, reduce details, flatten.
- Regularise geometry: snap to a grid, fix angles and radii.
- Modernise type: pick or customise a face with the same personality and better spacing.
- Reduce colours; fix contrast; add the missing variants (one colour, reversed, small cut).
- Keep a visible link to the old mark so recognition carries over, then retire the old assets.
- Show old and new side by side at several sizes.

### Rollout notes
Update in this order: digital first (favicon, app icons, social avatars, site header, email), then documents, then physical. Keep the old mark available for legacy uses for a transition period. Announce simply. The migration plan is the owner's decision; propose it, do not impose it.

## 6. Redesign steps

1. Critique the current mark with the scorecard.
2. Equity audit and the "must stay" list.
3. Decide refresh, evolve, or rebrand.
4. Run the design steps from the brief onward, starting from the decision, with the old mark as one of the competitors to beat.
5. Show old and new together at small and large sizes.
6. Provide the full delivery set and a migration checklist.
