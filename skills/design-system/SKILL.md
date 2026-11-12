---
name: design-system
description: Build or extract a design system: brand discovery, consultation, tokens (colour, type, spacing, radius, elevation, motion), light/dark themes, component inventory, DESIGN.md, "show me options" variants. Use when asked for brand colours/fonts/vibe, dark mode tokens, a system pulled from an existing app, or 3 directions. Not for one screen (lll:ui), logos (lll:logo), marketing plans (lll:marketing).
metadata:
  origin: lll
---

# Design system

Turn a product's purpose and audience into a coherent, documented visual system, or recover the system an existing app already has. You get decisions with reasons, tokens that code can consume, and a `DESIGN.md` the whole team follows.

## When to use

- Brand discovery or design consultation: "help me pick colours, fonts and a vibe", "what should this feel like".
- Tokens: colour scales, type scale, spacing, radius, elevation, motion, z-index; dark mode and theming; multi-brand.
- Extract: "we have 14 greys and 6 button radii", "pull the system out of the codebase", "document what we have".
- Write or refresh `DESIGN.md`, a component inventory, a variant matrix.
- Variant exploration: "show me three directions", "options for the landing page look", "compare these styles".
- Brand voice and microcopy rules for the product.

## When not to use

- Building, reviewing or polishing one screen, component or flow: `lll:ui`.
- Logos, wordmarks, app icons, favicons: `lll:logo`.
- Marketing plans, campaigns, social posts: `lll:marketing`. Positioning, pricing: `lll:business`, `lll:pricing`.
- SEO or schema: `lll:seo`.
- A spec or plan that has no visual direction yet and needs scoping: `lll:plan`.
- Charts: the `dataviz` skill owns data-visualisation palettes.

## Modes

**Guidance (default).** Answer in chat: a direction with reasons, a token set pasted inline, a comparison of options in words or ASCII, a consolidation plan. Write no files, start no subagents.

**Full.** Only when the user asks for the written system, a preview page, token files, a whole-app extraction or an end-to-end run.
1. Inventory the codebase with `references/extract.md` (a small, fast subagent may do the grep work; the parent decides).
2. Write `DESIGN.md` from `references/design-md.md` and token files per `references/tokens.md`, in the project's own format and location.
3. Build a preview page (HTML artifact or a local story) showing palette, type, components and states in light and dark; open it with the browser tools and look at it.
4. Run the contrast checks in step 6 and paste real output.
5. Do not push, merge or deploy. Report per `../../shared/report.md` only if the user asked for a report. Model choice for subagents: `../../shared/agents.md`.

## Tasks

| Task | Trigger | Read | Deliverable |
|---|---|---|---|
| discover | new brand or product, "help me pick" | `references/discovery.md` | one-page brief |
| consult | "propose a design direction" | `references/consultation.md` | proposal with safe choices and risks |
| tokens | define, refactor, dark mode | `references/tokens.md`, `references/colour.md`, `references/typography.md`, `references/theming.md` | token set |
| extract | "pull the system out" | `references/extract.md` | inventory and consolidation plan |
| document | "write DESIGN.md" | `references/design-md.md` | `DESIGN.md` |
| components | inventory, variants, states | `references/components.md` | matrix, anatomy notes |
| variants | "show me options" | `references/variants.md` | 3 distinct directions and a pick |
| voice | tone, microcopy rules | `references/voice.md` | voice section |

Several can chain: discover, consult, tokens, document. Stop at the first one the user asked for.

## Hard rules

1. What exists wins. An existing `DESIGN.md`, token file, Figma library or brand guide is the spec. Extend it; never fork it. A rule that looks wrong is a question for the owner.
2. Every choice carries a reason in one line: "X because Y". Reasons trace to the product, its users, or the use scene, not to taste.
3. Never invent brand facts: customers, awards, taglines, legal names, claims. Ask, or leave a marked slot.
4. Contrast and scale numbers are computed, not eyeballed. Use `scripts/colour.mjs` (step 6).
5. Fonts: name the licence and the source. Verify that a family, its weights and its licence exist on the named source before adopting it (Google Fonts, Fontshare, foundry page). Offline: mark "pending verification". Never invent a family or URL.
6. Light or dark default comes from the use scene (who, where, under what light), not from the product category.
7. Tokens are named by role (`color.text.muted`), not by value (`grey-600`), in components. Primitive scales exist underneath. A token with no consumer is deleted.
8. Propose at least two deliberate risks beside the safe choices, each with what it gains and what it costs. Coherence alone looks generic.
9. Vary across projects. If the proposal is the one you would give any product in the category, redo it.
10. Accept the owner's final choice. State a coherence concern once, then honour the decision.
11. Colour, type and spacing are decisions about people: contrast, legibility, scaling, colour-blindness. They are not decoration.

## Steps

1. **Learn the project.** Follow `../../shared/stack-detect.md`. Then find: `DESIGN.md`, `docs/design/`, `brand/`, token files (`tailwind.config`, CSS variables, `theme.ts`, `Theme.kt`, asset catalogs, `ThemeData`), Figma or Storybook links, the component folder, the logo files. List what exists before proposing anything.
2. **Choose the task and depth.** Match the request to the Tasks table. A request for "options" is variants; "what we have" is extract; "what should it be" is discover then consult. Quick question: answer it inline.
3. **Brief.** Product, users, use scene, memorable thing, three to five adjectives, anti-references, constraints (existing logo colours, platforms, languages, accessibility needs). Ask at most five questions in one message with the host's question tool, recommended option first; otherwise state assumptions and proceed. Template: `references/discovery.md`.
4. **Research when it pays.** Look at 5 to 10 products in the space only if the owner agrees or the category is unfamiliar. Use the browser or search tools read-only; strip private data from queries. Summarise what the category does so you can depart on purpose.
5. **Propose with reasons.** Direction, palette, type, shape, spacing, motion, voice, and how they reinforce one another. Safe choices and risks listed apart. Check coherence (`references/consultation.md`). Adjust to feedback.
6. **Build the tokens.** Primitives to semantic roles to component tokens (`references/tokens.md`). Generate colour scales and run contrast on every text and control pair in every theme:
   - `node scripts/colour.mjs contrast "#1a1a1a" "#ffffff"`
   - `node scripts/colour.mjs scale "#2563eb" --name brand`
   - `node scripts/colour.mjs pairs tokens-check.json`
   Run `node scripts/colour.mjs --selftest` only when changing the script.
7. **Document.** Write `DESIGN.md` in the project's location (`references/design-md.md`), link it from `CLAUDE.md` or README, and add the one-line rule: "UI work follows DESIGN.md; extend tokens, do not fork."
8. **Prove it.** Apply the system to two real screens (or a preview page) in light and dark and view them. A system that has not met real content is a guess. Hand screens to `lll:ui`.
9. **Hand off.** `lll:ui` applies it to screens; `lll:logo` for the mark; `lll:docs` keeps `DESIGN.md` honest as code changes; `lll:analytics` has no role here.

## Variant exploration in one paragraph

Three directions that differ in aesthetic, palette, type and layout, not three tints of one idea. Test: swap the headline between two variants; if nobody notices, they are too similar. Name each, show it (real content, HTML in a browser, side by side), collect structured feedback (keep, change, cut), then converge in at most two rounds. Details and a comparison-board format: `references/variants.md`.

## Output

- **Guidance:** the proposal or answer in chat, reasons attached, two risks marked, assumptions listed, next steps.
- **Full:** `DESIGN.md`, token files in the project's format, preview page path, real contrast output, list of screens checked, open questions for the owner.
- State what was skipped or unverified: fonts not licence-checked, no device, no browser, real content missing.
- Next steps: two to four bullets (apply with `lll:ui`, commission the mark with `lll:logo`, keep docs in sync with `lll:docs`).
