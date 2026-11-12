# Expressive surfaces, mockups and page patterns

For Sell and Explore surfaces (landing, pricing, campaign, portfolio, showcase), for turning a mockup into code, and for common frontend page patterns. A Do surface (app UI) stays plain and fast; take only the dials table and the patterns from here.

## 1. Two-pass plan for an expressive surface

Pass 1, decide on paper before code (five lines in the design note):
1. **Offer and proof.** One offer, one action, one proof. Proof is real or the slot is left out.
2. **First-screen idea.** The single most characteristic thing in the subject's world: the product working, a real artefact, a specific claim. Not a stock template.
3. **Pacing.** Order sections by the visitor's objections, not by a template. Name where the scale changes (one loud section, the rest quiet).
4. **Dials** (table below): set each once.
5. **Restraint.** One signature move (a type treatment, a layout break, one motion). Not five.

Pass 2, build and look:
1. Build mobile-first, then widen. The first screen reads as one composition at 375 and at 1440.
2. Add states and content edge cases (long headline, missing image, slow network, no JS where reasonable).
3. Capture, compare against the five lines, then delete the weakest flourish.
4. Run the floor table and `node scripts/ui-scan.mjs`.

## 2. Dials

Set each as low, mid or high with a reason tied to the brief. Mid on everything is what makes a Sell page look generated.

| Dial | Low | High | Pushes |
|---|---|---|---|
| Density | airy, one idea per screen | packed, many items visible | tools and finance go high; luxury and story go low |
| Contrast of scale | gentle type steps | huge headline against small text | landing and editorial go high; app UI low |
| Colour energy | neutral plus one accent | several saturated areas | one accent is the safe default; more needs a reason |
| Motion | none or fades | scroll-linked, choreographed | always gated by `./motion.md`; high needs a reduced-motion path |
| Ornament | flat, no decoration | texture, illustration, borders | high only when the brand already owns it |
| Formality | friendly, rounded | strict, sharp | follows audience and risk, not taste |

Three dials high at once is a finished look; seven is noise. Pick the few that carry the idea.

## 3. Mockup to code

1. Read the mockup for structure first: regions, repeats, states shown, states missing. List the missing states and design them.
2. Map values to the project's tokens: nearest spacing step, type step, colour role. Do not copy pixel values into code. Off by one step is fine; a new value needs a reason.
3. Identify repeats and reuse an existing component before building one.
4. Build the structure with real semantic elements (landmarks, headings, buttons, lists) before styling.
5. Compare the render against the mockup at the mockup's width, then check the widths it does not show (320 px, tablet, 1440 px, large text).
6. Images in the mockup are placeholders unless provided; use real assets, an explicit placeholder, or leave the slot labelled.
7. Report what the mockup did not answer and what you decided.

## 4. Page patterns, short

| Pattern | Rule |
|---|---|
| Hero | one headline that says what it is and for whom, one primary action, one visual that shows the product; no carousel |
| Navigation | few top-level items, current page marked, the primary action distinct, works by keyboard and on a phone without hover |
| Pricing | plans comparable at a glance, same rows in the same order, the recommended plan marked once, what is billed and when stated up front, no hidden fees |
| Social proof | real names, real numbers, real links; none is better than invented |
| Footer | wayfinding and legal; not a second navigation puzzle |
| Table | right-align numbers, tabular figures, sticky header on long tables, sort and filter only if used; below 640 px, become a list of rows |
| Dashboard | the few figures a person acts on, with trend and context; filters in one place; empty and stale-data states |
| Settings | grouped by task, immediate effect or one clear Save, destructive actions last and separated |
| Auth | one task per screen, social and email as peers, password manager and paste allowed, errors name the fix |
| Onboarding | ask only what the next screen needs, show value before sign-up if possible, skippable, resumable |
| Search | visible, forgiving (typos, partials), results show why they matched, a useful no-results state |
| Long page | anchor navigation or a table of contents, headings that scan |

## 5. Choosing the output channel

- Code in the project is the default deliverable.
- A throwaway preview or a mockup someone will look at or share: build a single static HTML file and publish it as a private Artifact (load the `artifact-design` skill first when the Artifact tool is available). Say it is a preview, not production code.
- Correctness bugs in the diff you wrote: run `/code-review` after you finish. `/simplify` is for cleanliness.
