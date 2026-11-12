# Variant exploration: "show me options"

Visual brainstorming. Produce several genuinely different directions fast, show them side by side with real content, collect structured feedback, converge. This is exploration, not review.

## 1. Gather context (two rounds at most)

Pre-fill from the repo, then ask only for gaps.
1. **Who** is the design for (persona, skill, device)?
2. **Job to be done** on this screen or page.
3. **What exists**: components, tokens, `DESIGN.md`, the current page (screenshot it when the owner says "I don't like how this looks").
4. **Flow**: how people arrive and where they go next.
5. **Edge cases**: long names, zero results, errors, mobile, first-time vs power user.
6. **How many**: default 3; up to 5 for an important screen.

If `DESIGN.md` exists, follow it: keep its fonts and palette, vary layout, composition and emphasis. Diverge on visual language only if the owner says so. Without one, vary font family, colour palette and layout approach.

## 2. Write the concepts before building

Lettered list, one line each, each a distinct direction:

```
A) "Ledger"   - dense table-first layout, mono numerals, cool greys, no imagery
B) "Postcard" - one big image per screen, serif headings, warm palette, generous space
C) "Console"  - dark, keyboard-first, command bar at the top, accent only on state
```

Distinctness tests:
- Swap the headline between two variants. If nobody notices, they are too similar.
- Could two have been made by the same designer on different days? Rework the weaker.
- Vary the **page archetype** for landing and pricing pages (classic hero with sections, long-form story, minimal conversion, comparison) and keep the one primary action identical across variants.

Confirm the concepts with the owner in one question (go, change some, add, drop) before spending effort. Maximum two rounds.

## 3. Build each variant

- HTML/CSS is the quickest honest medium for web; for native, SwiftUI or Compose previews; for early ideas, a described layout plus ASCII wireframe is enough.
- Real content from the repo (names, numbers, copy, states); no lorem ipsum.
- Each variant shows: the default state, one empty or error state, a mobile width, and the primary action.
- Self-contained files (one HTML per variant, inline CSS), named `variants/a-ledger.html`, in a scratch folder or `docs/design/variants/` if the owner wants them kept. Do not touch product code.
- View every variant in a browser at 375 and 1440 px before showing anything. Tools: browser skills from the host, or `lll:research` for browser QA.

## 4. Comparison board

Present in one place so the owner can compare:
- A single HTML page (or artifact) with the variants side by side or in tabs, with the concept name, one-sentence idea, palette chips, type specimens, and the trade-offs.
- Or, in chat, a table:

| | A Ledger | B Postcard | C Console |
|---|---|---|---|
| Feels | precise | warm | fast |
| Best for | power users | first-time buyers | developers |
| Costs | dense on mobile | needs photography | niche look |
| Risk | dull | image dependence | alienates casual users |

Publishing the board for others to see is optional; use the Artifact tool only when the owner wants a shareable page.

## 5. Feedback loop

Ask for structure, not "which do you like": for each variant, **keep** (what works), **change** (what to adjust), **cut** (what to drop); then a choice: pick one, blend named parts, or reject all with a reason. Accept "none of these" as a result and ask what is missing.

Iterate on the chosen direction with targeted edits, not regeneration. Stop after two rounds and decide; unlimited iteration burns time.

## 6. Decision log

After a choice, record in `DESIGN.md` (Decisions log): the chosen direction and why, the rejected ones and why, the keep/change/cut notes, and the date. This is the taste memory: next time, bias toward approved choices and away from rejected ones, and flag when a new request contradicts a strong earlier signal ("last time you rejected dark and neon; this time you ask for it; one-off or update?").

## 7. Converge

Hand the chosen direction to:
- `lll:ui` to build it properly (states, responsive, accessibility),
- the tokens task in this skill to turn it into a system,
- `lll:logo` if the mark needs to follow.

## 8. Checks

1. Variants differ in aesthetic, palette, type and layout, not tints.
2. Each uses real content and shows more than the happy state.
3. Viewed in a browser at phone and desktop widths.
4. Feedback captured as keep/change/cut.
5. Decision and rejections logged.
