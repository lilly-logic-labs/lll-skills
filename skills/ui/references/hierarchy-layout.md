# Hierarchy, layout, spacing, responsive

Method and checks for the structure of a screen. Platform-neutral first, then per-platform notes.

## 1. Hierarchy

Hierarchy is what the eye does in the first two seconds. Decide it before styling.

1. Name the one thing the person came to do on this view. That is rank 1.
2. Name rank 2 (the support: result, context, next step) and rank 3 (everything else).
3. Give rank 1 the most contrast, size or space. Not all three at once. Use the cheapest lever that works: weight, then size, then colour, then space.
4. Everything unranked is noise until proven otherwise. Remove it, fold it behind a disclosure, or demote it to quiet text.

Tests (run on a screenshot, not in your head):
- **Squint test.** Blur the screenshot or view it at 10 percent size. The three heaviest masses should be the three things you ranked.
- **Two-second test.** Cover the screen after two seconds. Can you say what it is, what page this is, and what to do next?
- **Trunk test** (navigation). Drop in with no context. You can say: what product, which page, the major sections, my options here, where I am, how to search.
- **Mindless-click test.** Each button, link and menu choice should be an obvious click. A choice that needs thought about whether it is the right one is a finding.

Signs hierarchy is lying: two same-size bold headings side by side; a primary button the same weight as the secondary; a decorative image heavier than the title; an "info" banner louder than the form under it.

## 2. Grouping and proximity

- Related things are closer to each other than to unrelated things. Spacing between groups is at least 1.5 to 2 times the spacing inside a group.
- A heading sits closer to the content it introduces than to the content above it. Space above a heading is 1.5 to 2 times the space below it.
- Prefer spacing and alignment to borders and boxes. Add a divider or container only when proximity alone cannot separate the groups.
- Align to a small number of edges. Every extra left edge is visual noise. One text column per list: rows with and without a leading icon share one text start.

## 3. Spacing

- Use the project's scale. With none, use a 4 px base: 4, 8, 12, 16, 24, 32, 48, 64, 96. Every gap is a step. A gap that is not on the scale needs a comment saying why.
- Density is a product decision. Do tools (tables, editors) run denser (8 to 12 px row padding). Sell and Read surfaces breathe (24 to 64 px between sections).
- Padding scales with the thing it pads: a 40 px control gets 12 to 16 px horizontal padding, a card 16 to 24 px.
- Large or bold elements need 10 to 20 percent more surrounding space than their numeric box suggests.
- Inside a rounded container, nested radius = outer radius minus the gap between them (24 px card, 16 px padding, 8 px inner image).

## 4. Layout

- Layout first with flex, grid, stack and lazy-list primitives. Never position by measuring in JavaScript when CSS, SwiftUI stacks or Compose layouts do it.
- Max content width. Reading text 60 to 75 characters; forms 480 to 640 px; app content often 1200 to 1440 px. Full-bleed body text is a finding.
- Pick a column system and obey it. 12 columns web; 4/8/12 columns by Material window size class; 16 pt margins on iPhone, larger on iPad.
- Sections do one job. One purpose, one heading, one short supporting line. A section you cannot name in four words is two sections.
- Cards are a tool, not a default. Use a card only when the object is a unit that can be acted on, moved, compared or selected. A page made of stacked cards is not a layout. A card inside a card is always wrong.
- Lists beat grids when items vary in length. Tables beat card grids when people compare values across rows.
- Primary action placement: where the eye ends the task. Forms and dialogs: bottom-right on desktop (or bottom full width on phone), the destructive action never next to the primary without separation.

## 5. Surface-specific structure

| Surface | Structure that works | Common failure |
|---|---|---|
| Do: dashboard | one primary workspace, nav, secondary context, one accent colour; headings that state the area ("Open invoices") | wall of KPI cards, every number the same weight |
| Do: settings | grouped lists, the setting and its control adjacent, destructive rows last, search if over about 15 items | one long form with no groups |
| Do: list/detail | list left or top, detail right or pushed; selection state obvious; empty detail state designed | detail pane blank on first load |
| Do: form | single column, labels above fields, one primary submit | two-column forms that break reading order |
| Sell: landing | first screen = brand, one headline naming the outcome, one supporting sentence, one action, one real visual; then proof, how it works, objections, repeat the action | hero, three-up feature grid, testimonials, pricing, CTA with identical rhythm |
| Read: docs | one column 65 ch, sticky local nav, search, prev/next | hero banner on a docs index |
| Explore: gallery | work fills the screen, controls fade, one transition | template crop of the work to fit a grid |

## 6. Responsive behaviour

Design from the smallest shipped size up (content first), then add structure as space allows. A mobile layout must make design sense, not just stack desktop columns.

- Breakpoints are driven by content breaking, not device names. Common anchors: 375 (phone), 768 (tablet portrait), 1024 (laptop), 1440 (wide).
- Web: prefer container queries for components, `clamp()` for fluid type and space, `min-height: 100dvh` for full-height sections, `gap` for spacing, `env(safe-area-inset-*)` for notches.
- Navigation changes form by size: tab bar or bottom nav on phones, sidebar or rail on tablets and desktop, top bar on the web marketing layer.
- Touch needs visible affordance: no hover-only discovery. Hover is an enhancement gated by `(hover: hover) and (pointer: fine)`.
- Tables on phones: turn rows into stacked key-value blocks or allow horizontal scroll with a sticky first column. Never shrink text under 12 px to fit.
- Keyboard and viewport: inputs scroll above the on-screen keyboard; the primary submit is reachable; no `user-scalable=no` or `maximum-scale=1`.
- Orientation and window changes (iPad split view, Android multi-window, foldables, resizable desktop windows): the layout reflows without losing state.
- Test the real copy at every size. Long German words, a 60-character name, a 6-digit price, right-to-left text, 200 percent zoom.

## 7. Performance feel

Perceived speed is part of the layout.

- Reserve space: set `width` and `height` or `aspect-ratio` on images, skeletons the shape of the content. Layout shift (CLS above 0.1) reads as broken.
- Above-the-fold content renders without waiting for non-critical scripts; fonts use `font-display: swap` with a size-matched fallback.
- Interactions respond in under 100 ms (INP under 200 ms). Defer heavy work, debounce typing, virtualise long lists, paginate or stream results.
- Optimistic updates for low-risk actions (toggle, reorder, like) with a visible rollback on failure.
- Native: avoid layout in `body` recomputation storms (SwiftUI), unstable parameters and missing `key` in lazy lists (Compose), and large images decoded on the main thread.

## 8. Quick review questions

1. What is rank 1, and is it the heaviest thing?
2. Is every gap a step on the scale?
3. Could one container, border or card be deleted without losing grouping?
4. Does the mobile layout reflow by design or just stack?
5. What happens with the longest and the emptiest real content?
