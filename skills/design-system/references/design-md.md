# DESIGN.md

The one document that tells people and agents how the product looks and why. Lives at the repository root (or the project's existing location). Prose explains rationale; tokens live in code and are summarised here. Keep it short enough to read in ten minutes.

## 1. Rules for the file

- Write it from decisions and code, not from imagination. Extract values from the real token files; link to them.
- One source of truth for values: the token files. `DESIGN.md` states roles, rationale and usage, and shows values for reading convenience.
- Reasons beside decisions ("X because Y"), and a decision log for rejected alternatives.
- Preserve an existing `DESIGN.md`'s structure and locked decisions; update rather than replace. Keep a backup before a large rewrite.
- Link it from `CLAUDE.md` or `AGENTS.md` with one line: "UI work follows DESIGN.md. Extend tokens and components; do not fork."
- Keep it honest: `lll:docs` can check it against the code after changes.

## 2. Template

```markdown
# <Product> design system

## Overview
- Product: <one sentence>
- People and use scene: <who, where, under what light>
- Memorable thing: <one sentence all decisions serve>
- Adjectives: <3 to 5>   Never: <2 to 3>
- Surfaces and their register: app (Do), marketing (Sell), docs (Read) ...
- Reference products: <named, or "none checked">

## Principles
1. <principle and what it rules out>
2. ...

## Colour
- Strategy: <restrained | committed | full | drenched> because <reason>
- Default theme: <light | dark | system> because <use scene>
| Role | Light | Dark | Use |
|---|---|---|---|
| bg | #... | #... | page background |
| surface | ... | ... | cards, panels |
| text | ... | ... | body text |
| text-muted | ... | ... | secondary text (4.5:1 checked) |
| accent | ... | ... | primary actions and key states |
| accent-on | ... | ... | text on accent |
| danger / warning / success / info | ... | ... | status, always with icon and text |
Contrast: all text/background pairs pass AA in both themes (checked <date>).
Tokens: <path to token file>

## Typography
| Role | Family | Source and licence | Weights | Use |
|---|---|---|---|---|
Scale: ratio <1.25>, base 16 px. Styles: display, h1 to h4, body, small, label, code (table of size / line height / weight / tracking).
Loading: <self-hosted, swap, preload ...>. Fallbacks: <stack>. Scripts covered: <...>.

## Layout and spacing
Base unit 4 px; scale <list>. Max content widths <...>. Breakpoints <...>. Density <compact | comfortable | airy>. Grid <...>.

## Shape and depth
Radius scale <...>; nested radius = outer - inset. Elevation levels <...>; dark uses surface tint. Borders <...>.

## Motion
Durations <...>; easing <...>; springs <...>. One authored moment per page. Reduced motion: <behaviour>. Never: transition: all, scale(0) entrances, ease-in on UI.

## Components
| Component | Status | Variants | States | Notes |
|---|---|---|---|---|
Rules: tokens only; all states; a11y per component; strings from i18n.

## Voice
Three voice lines with example; do/don't table; error, empty and success patterns; terms list (one name per action). (see voice notes)

## Accessibility
AA target; focus ring spec; target sizes; reduced motion; text scaling; colour-blind checks; testing routine.

## Do and don't
Short list of the ten things most likely to go wrong in this product.

## Decisions log
| Date | Decision | Reason | Rejected alternatives |
|---|---|---|---|

## Open questions
- <question for the owner>
```

## 3. Variations

- **Small product:** collapse to Overview, Colour, Type, Spacing, Components, Voice, Decisions. Under 150 lines.
- **Multi-brand:** add a Brand contract section (tokens each brand must provide) and one sub-table per brand.
- **Native app:** add platform notes (SwiftUI, Compose) and a map from tokens to asset names.
- **Agent-facing:** keep an "Agent rules" block at the top with 8 to 10 imperative lines (use tokens, no raw hex, all states, no glass on glass, copy from i18n).
- **Machine-readable tokens:** keep values in the project's token files (CSS variables, DTCG JSON, theme module). Do not duplicate them in YAML front matter unless tooling reads it.

## 4. Worked mini-example (fictional)

```markdown
# Fieldnote design system

## Overview
- Product: a field-notes app for ecologists who log observations outdoors.
- People and use scene: researchers on phones in bright sun, gloves, patchy network.
- Memorable thing: it feels like a well-used field notebook that never loses a page.
- Adjectives: tactile, sturdy, calm. Never: techy, playful.

## Principles
1. Readable in sunlight: contrast over subtlety; 7:1 for body text.
2. Large targets: 56 px minimum for primary controls (gloves).
3. Offline is a first-class state, always named.

## Colour
- Strategy: committed; one deep green owns surfaces; neutrals derive from it. Light default because direct sun.
| Role | Light | Dark | Use |
| bg | #f4f1e8 | #10150f | page |
| text | #16200f | #e7ecdf | body (14.9:1 light) |
| accent | #1f5c3a | #7fc79b | primary actions |
(Dark exists for night observation; warm red-shifted accent in "night mode" later.)
```

Note the example shows how the use scene (sun, gloves, offline) drives light default, 7:1 contrast and 56 px targets. Those are the reasons the file exists.

## 5. Checks before saving

1. Every value traces to a token file or a contrast check.
2. Every decision has a reason.
3. Fonts have a source and licence or "pending verification".
4. Both themes complete.
5. Open questions captured, nothing invented.
6. Linked from `CLAUDE.md` or README.
