# Components: inventory, variants, states, documentation

A design system is tokens plus the components that use them. Inventory what exists, define each component's variants and states once, and make the code and the document agree.

## 1. Inventory

List every component the product uses, from code and from the rendered UI. For each: name, where defined, where used (count), variants found, states found, tokens used, owner. Sources: component folder, Storybook, Figma library, grep for repeated markup, the screens themselves.

Group by level:
- **Foundations:** colour, type, space, icon, motion.
- **Primitives:** button, link, input, checkbox, radio, switch, select, textarea, badge, avatar, tooltip, spinner, skeleton, divider.
- **Composites:** form field (label, control, hint, error), card, list item, table row, dialog, sheet, menu, tabs, toast, banner, empty state, pagination, breadcrumb, command palette.
- **Patterns:** page header, filter bar, settings group, onboarding step, error page, data table with toolbar, list-detail.

Mark each: keep, merge (near-duplicate), missing (needed, not built), delete (unused).

## 2. Define one component well

Use this template; a component is documented only when all parts exist.

```
Name: Button
Purpose: triggers an action. (Links navigate; buttons act.)
Anatomy: container, label, optional leading icon, optional trailing icon, loading indicator.
Variants: primary, secondary, tertiary/ghost, destructive. Sizes: sm 32, md 40, lg 48.
States: default, hover, focus-visible, pressed, loading, disabled (+ reason).
Tokens: color.accent.*, radius.control, space.control.x, text.label, motion.duration.fast.
Behaviour: pointer-down feedback; loading disables repeat press; keyboard Enter/Space; min target 44.
Content rules: verb + object; sentence case; max ~3 words; no punctuation.
Accessibility: native button; name = label; icon-only needs aria-label; disabled uses aria-disabled when reason must stay focusable.
Do / Don't: one primary per view region; destructive not adjacent to primary without separation.
Platform notes: web button element; SwiftUI ButtonStyle; Compose Button with state layers.
```

## 3. Variant and state matrix

Every interactive component fills a grid. Gaps are findings.

| | default | hover | focus | pressed | loading | disabled | error |
|---|---|---|---|---|---|---|---|
| Button primary | | | | | | | n/a |
| Text input | | | | | | | |
| Select | | | | | | | |
| Checkbox | | | | | | | |
| Switch | | | | | | | n/a |
| Row (list) | | | | | | | |

Add component-specific states: selected, expanded, checked, indeterminate, dragging, read-only, busy, empty, skeleton.

## 4. Consistency rules

- One API shape: same prop or parameter names across components (`size`, `variant`, `disabled`, `loading`, `onChange`).
- Variants are a closed set (`primary | secondary | ghost | destructive`), not free-form props or class names.
- Composition over configuration: build form fields from label, control and message parts rather than one component with 30 props.
- Components accept content, not copy. Strings come from the caller or i18n.
- Controlled and uncontrolled behaviour follow the framework's idiom.
- No component fetches data; no feature component lives in the system library.
- Dependencies point one way: patterns use composites use primitives use tokens.

## 5. Choosing build vs adopt

| Situation | Do |
|---|---|
| Need accessible behaviour (dialog, menu, combobox, tabs, date picker) | adopt a headless primitive library (Base UI, Radix, React Aria, Headless UI, Zag; specialist picks in `../../ui/references/libraries.md`) or the platform component; style with tokens |
| Need a full kit fast | a styled kit (shadcn/ui, MUI, Chakra, Mantine, Material 3, SwiftUI native) themed to tokens; pin the density and radius to your brand |
| Brand-defining component (hero, signature chart) | build custom, once, well |
| Native apps | platform components first; custom only where the brand needs it and a11y is preserved |

A kit left at its defaults is recognisable as that kit. Theme radius, type, colour and density at minimum.

## 6. Documentation surfaces

- `DESIGN.md` carries the rules and the component list with status.
- Storybook (or a platform equivalent: SwiftUI Previews, Compose Previews, Widgetbook) shows every variant and state live, including dark mode, large text and RTL.
- Figma library (if used) and code share names. Keep a mapping table when names differ.
- Visual regression tests (Playwright screenshots, Chromatic, snapshot tests) lock states; they are the permanent proof, not a one-off screenshot.

## 7. Governance (lightweight)

- New component or variant: justify with two real uses; otherwise reuse.
- Deprecate with a date and a replacement; remove after migration.
- Review checklist for additions: tokens only, all states, a11y checked, responsive, documented, story added.
- Track usage counts; delete what nothing uses.

## 8. Checks

1. Inventory lists keep, merge, missing, delete decisions.
2. Every interactive component has the full state grid.
3. Names and props consistent across components.
4. Accessibility behaviour specified per component.
5. Docs, stories and code agree.
