# Design lens ("design review of a plan")

Find the UX and interaction decisions the plan leaves open, before an implementer settles them by accident. Review only: no code, no pixels. Skip the lens if the plan has no UI.
For building or critiquing the real UI use `lll:ui`; for brand, tokens and type use `lll:design-system`.

## Method

Rate each pass 0 to 10 and say what would make it a 10. Resolve each gap with the user one at a time, recommendation first. Apply only the chosen fix, re-rate, repeat until 10 or "good enough, move on". A gap already listed in the plan is still an open finding until decided. Trace every judgment to a broken principle; never "this feels off".

Principles to cite:
1. Empty states are features: warmth, a primary action, context.
2. Every screen has a hierarchy: first, second, third thing seen.
3. Specificity beats vibes: name the font, spacing scale and interaction pattern.
4. Edge cases are user experiences: long names, zero results, errors, first-time vs daily use.
5. Generic patterns are the enemy: the card grid, the stock hero, the three-column feature row.
6. Responsive means a designed layout per viewport, not "stacked on mobile".
7. Accessibility is specified in the plan or it does not exist.
8. Subtract by default: an element that does not earn its space is cut.
9. People scan, they do not read; the default path must be the right one; each confusion spends goodwill; mobile raises every stake (thumb reach, 44 px targets, no hover).

Simulate the user (bad signal, one hand, first use vs the thousandth) and storyboard the journey, not single screens.

## Pass 1: information architecture

What does the user see first, second, third? Fix: a structure sketch per screen and the navigation flow. If you can only show three things, which three?

For a page meant to persuade (landing, pricing, waitlist): one named primary action with nothing competing above the fold; the visitor's top objections answered where they arise; proof next to each claim (a supplied customer, quote or figure, otherwise the claim is cut); a risk reversal the business really offers; an index or noindex decision.

## Pass 2: interaction state coverage

Add the table. Describe what the user sees, not what the backend does.

```
FEATURE        | LOADING | EMPTY | ERROR | SUCCESS | PARTIAL
---------------|---------|-------|-------|---------|--------
<each feature> | <spec>  | <spec>| <spec>| <spec>  | <spec>
```
Also: offline, permission denied, first run, very long content, slow response (spinner vs skeleton vs optimistic), and what a retry does.

## Pass 3: journey and emotional arc

```
STEP | USER DOES       | USER FEELS | PLAN SUPPORTS IT WITH
-----|-----------------|------------|----------------------
1    | lands on page   | <emotion>  | <element>
```
Check three horizons: five seconds (first impression), five minutes (doing the task), five years (would they recommend it).

## Pass 4: generic-UI risk

Rate whether the plan describes specific, intentional UI or generic patterns. Classify the surface first: persuade (landing, pricing), operate (dashboards, admin, editors), read (docs, articles), experience (portfolio, showcase). Judge each by its own rules: persuade is brand-first with one action; operate prizes scanability, calm hierarchy, utility language; read prizes a 65 to 75 character column and wayfinding; experience puts the work first.

Flag: a generic card grid as first impression; strong headline with no clear action; carousel with no narrative; app screens made of stacked cards instead of layout; purple gradient defaults; icon-in-circle feature rows; centred everything; uniform bubbly radius; decorative blobs; emoji as decoration; generic hero copy ("Welcome to...", "all-in-one solution"); system font as the display voice. Replace vague plan text with decisions: "clean, modern UI" means nothing, "dashboard with widgets" needs what makes it not every other dashboard.

## Pass 5: design system alignment

Does the plan use the project's tokens and components (look for a DESIGN file, tokens in code, Storybook)? Name any new component and whether it fits the vocabulary. No system exists: flag the gap and recommend `lll:design-system`.

## Pass 6: responsive and accessibility

Per viewport (phone, tablet, desktop): the layout change, not "stacks". Keyboard path and focus order, screen reader labels and landmarks, contrast (4.5:1 body text), touch targets at least 44 px (iOS) or 48 dp (Android), reduced motion, text scaling, no label-in-placeholder as the only label, visited vs unvisited links. Platform notes: web (semantic HTML first, ARIA second), SwiftUI (Dynamic Type, VoiceOver traits), Compose (semantics, TalkBack), desktop (keyboard shortcuts, high-DPI, window resize).

## Pass 7: unresolved decisions

For each, cite the in-scope element and the missing decision. Do not invent controls the plan does not contain.

```
DECISION NEEDED                   | IF DEFERRED, WHAT HAPPENS
----------------------------------|----------------------------------
What does the empty state say?    | the engineer ships "No items found."
Mobile navigation pattern?        | desktop nav hides behind a hamburger
```

## Outputs

Scores per pass (before and after), the state table, the journey table, the unresolved-decisions table, items deferred with reasons, and a verdict. After building, a live visual check with `lll:ui` or `lll:research` browser QA catches what only rendered output shows.
