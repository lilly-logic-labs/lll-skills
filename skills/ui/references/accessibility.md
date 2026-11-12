# Accessibility basics for UI work

The floor every screen meets while you build or review it. A full, code-wide audit with a report is `lll:audit` (a11y lens). Target: WCAG 2.2 level AA, plus the platform's own guidelines.

## 1. The ten checks

1. **Name, role, state.** Every control exposes a name (what it is), a role (button, link, switch) and its state (checked, expanded, selected, busy, invalid). Icon-only controls have a text name.
2. **Keyboard.** Everything reachable and operable without a mouse or touch. Tab order matches reading order. No keyboard traps. `Esc` closes overlays and returns focus to the trigger. Custom widgets follow the standard key patterns (arrows in tabs, menus, radio groups).
3. **Focus visible.** A clear indicator on every focusable item, at least 3:1 against its surroundings, not clipped by `overflow: hidden`. Never remove the outline without a replacement. Focus is not hidden behind sticky headers.
4. **Contrast.** Body text 4.5:1, large text and UI parts 3:1, in every theme and state (see the type and colour guidance).
5. **Target size.** 44 pt / 48 dp preferred; 24 CSS px minimum with spacing (WCAG 2.2 target size minimum).
6. **Text scaling and zoom.** Usable at 200 percent browser zoom, 400 percent reflow at 320 px wide, and the largest system text size. No fixed-height text boxes, no clipped labels.
7. **Not colour alone.** Errors, status, charts and links carry a second cue: icon, text, pattern or underline.
8. **Motion and time.** Reduced motion honoured; nothing flashes more than 3 times a second; auto-updating or timed content can be paused, extended or turned off; session timeouts warn first.
9. **Forms.** Visible labels programmatically tied to inputs, instructions before the field, errors identified in text, linked to the field, announced, and suggested fixes offered. Autocomplete tokens for personal data.
10. **Structure.** Headings, landmarks (web), list semantics, table headers and captions. Language of the page set; changes of language marked.

## 2. Screen reader behaviour

- Order: DOM/view order equals visual order. CSS reordering that differs from DOM order is a finding.
- Announcements: dynamic updates (toast, validation, search results count, loading complete) use live regions (`aria-live="polite"`, `role="status"`; `role="alert"` for urgent errors; Android `liveRegion`; iOS `UIAccessibility.post(notification:)`). Do not announce every keystroke.
- Dialogs: focus moves in on open, is trapped inside while modal, returns to the trigger on close; the background is inert (`inert` attribute or `aria-modal` with the platform's modal behaviour).
- Single-page apps: announce route changes and move focus to the new page heading or main region.
- Group related controls (`fieldset`/`legend`, `role="group"`, Compose `semantics { }`, SwiftUI `accessibilityElement(children: .combine)`), and hide decorative content from assistive tech.
- Loading: set `aria-busy` on the region and announce completion; do not leave the user in silence.
- Tables: real table markup with `th scope`; do not use tables for layout. Sortable columns expose sort state (`aria-sort`).
- Drag and drop and gestures have a single-pointer or keyboard alternative (move up/down buttons).
- Custom components expose the pattern they imitate (combobox, tablist, tree) with all required properties, or use a vetted primitive.

## 3. Cognitive and sensory

- Plain language, short sentences, consistent terms and consistent placement of help and navigation.
- No time pressure unless essential. Error prevention for money, legal and data-loss actions.
- Do not rely on sound alone (captions, visual alert) or on shape or position alone ("the round button on the right").
- Autoplay media off or muted with controls.
- Support platform preferences: reduced motion, reduced transparency, increased contrast, bold text, dark mode, large text, inverted colours (do not invert images twice).
- Touch: avoid precision gestures and path-based gestures as the only way; allow cancel (pointer up outside).

## 4. Platform quick map

| Need | Web | iOS | Android |
|---|---|---|---|
| Name | `aria-label`, visible text, `alt` | `accessibilityLabel` | `contentDescription`, `semantics` |
| Role | native element or `role` | `accessibilityTraits` | `Role`, `semantics.role` |
| State | `aria-expanded`, `aria-checked`, `aria-selected` | `accessibilityValue`, traits | `stateDescription`, `toggleable` |
| Live update | `aria-live`, `role=status` | `UIAccessibility.post` | `liveRegion` |
| Heading | `<h1-6>` | `.isHeader` trait | `heading()` |
| Reduce motion | `prefers-reduced-motion` | `accessibilityReduceMotion` | animator duration scale |
| Large text | rem units, zoom | Dynamic Type | `sp`, font scale |
| High contrast | `forced-colors`, `prefers-contrast` | Increase Contrast | high contrast text, large display |

## 5. How to test in ten minutes

1. Tab through the page or screen with the keyboard only. Note anything unreachable, unlabeled or trapped.
2. Run the automated check as a starting point (axe DevTools, Lighthouse, or Accessibility Inspector; Android Accessibility Scanner). Automation finds roughly a third of issues, so treat clean results as "not obviously broken".
3. Turn on a screen reader (VoiceOver, TalkBack, NVDA or VoiceOver on Mac) and complete the primary task with the screen off or ignored.
4. Zoom to 200 percent and set the largest text size; look for clipping and overlap.
5. Turn on reduced motion, increased contrast and dark mode.
6. Simulate colour blindness on charts and status colours.

Report what was not tested (no screen reader available, no device).

## 6. Common findings with fixes

| Finding | Fix |
|---|---|
| `<div onClick>` as a button | `<button>` |
| Placeholder as the label | visible `<label>` |
| `outline: none` on focus | `:focus-visible` ring |
| Icon button with no name | `aria-label` or visually hidden text |
| Toast not announced | `role="status"` container present before the message is inserted |
| Modal leaves background focusable | `inert` on siblings, focus trap, return focus |
| Colour-only error | add icon and message text |
| Fixed-size text container | min-height and wrapping |
| Custom select without keyboard support | native `<select>` or a primitive |
| Auto-advancing carousel | pause control or remove autoplay |
| Link text "click here" | text that names the destination |
| Low-contrast grey text | raise to 4.5:1 |
