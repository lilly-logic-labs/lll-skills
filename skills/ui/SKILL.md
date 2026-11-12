---
name: ui
description: Build, review, polish or restyle a screen, component or flow (web, SwiftUI, Compose, React Native, desktop) with all states, motion and a11y. Use when asked to "make this look better", "review the UI/UX", "polish", "feels janky", add loading/empty/error states, animate, or fix a confusing flow. Not for tokens, brand, options (lll:design-system), logos (lll:logo), code-wide a11y audits (lll:audit).
metadata:
  origin: lll
---

# UI

Build, review, polish or restyle one screen, component or flow on any platform. You get working code or a ranked fix list, with every state designed and nothing that looks generated.

## When to use

- Build a screen, component, sheet, form, list, dashboard, landing section or onboarding step.
- Review or critique a UI or UX from code, a screenshot, a URL or a running app: "does this feel right", "users get stuck here".
- Polish or restyle: hierarchy, spacing, type, colour, alignment, "make it look better", "looks like AI made it".
- Add or fix states: loading, empty, error, success, offline, partial, permission denied, long content.
- Motion: animate, transition, gesture, spring, "feels sluggish", "janky".
- Platform idiom: Liquid Glass, Material 3, SwiftUI, Compose, React Native, Flutter, Electron or Tauri UI.

## When not to use

- Tokens, palettes, type scales, `DESIGN.md`, brand direction, "show me options": `lll:design-system`.
- Logos, wordmarks, app icons, favicons: `lll:logo`.
- Whole-codebase accessibility, performance or bug audit with a report: `lll:audit`.
- A plan or spec that has no code yet (design review of the plan): `lll:plan`.
- Executing a large UI plan with tests, or a surgical patch: `lll:build`.
- Page SEO and AI-search work: `lll:seo`. Copy-only marketing writing: `lll:marketing`.
- Chart design: the `dataviz` skill draws the chart; this skill handles the screen around it.

## Modes

**Guidance (default).** Do the one task asked, on the named target. Build, polish, motion and states edit only the files that task needs. Review is read-only. No report file, no subagents.

**Full.** Only when the user asks for a whole-app, every-screen, end-to-end or written-report pass.
1. Inventory screens and flows from routes, navigators and storyboards (a small, fast subagent may do this).
2. One review brief per screen group, using `references/review-and-polish.md`. Findings follow `../../shared/findings.md`; failure scenario = what the person does and what goes wrong. Taste notes go in a separate "Polish notes" list, not in findings.
3. Verify each finding with a fresh reader (`../../shared/findings.md`, Verification). Model choice: `../../shared/agents.md`.
4. Write the report per `../../shared/report.md`. Fix confirmed findings per `../../shared/fix-phase.md`. Run `lll:docs` if documented behaviour changed.

## Tasks

| Task | Trigger | Deliverable | Read |
|---|---|---|---|
| build | new screen or component, restyle | code plus a five-line design note | `references/hierarchy-layout.md`, `references/states.md` |
| review | "review", "critique", screenshot, diff | ranked table plus verdict | `references/review-and-polish.md` |
| polish | "make it look better", "feels off", pre-ship | edits in a fixed order | `references/review-and-polish.md` |
| motion | animate, gesture, "janky" | code plus gate result | `references/motion.md` |
| states | blank screens, spinners, errors, forms | every state specified and built | `references/states.md`, `references/forms-nav-copy.md` |
| expressive | landing, pricing, portfolio, campaign, "make it bolder", mockup to code | five-line plan, then code | `references/expressive.md` |
| explore | "what do the best apps do for X" | table plus consensus and best divergence, no code | `references/calibrate-and-verify.md` |

Build plus review requested: build, then review your own result as a fresh reader.

## Hard rules

1. Project design docs (`DESIGN.md`, `docs/design/`, `brand/`, a Figma link in the README) outrank this skill. Read them first.
2. Extend the codebase's tokens, components and spacing scale. A parallel system is a defect. Missing token: add it to the existing token file, not inline.
3. Prefer the platform's native or the project's existing component over a custom one. Custom needs a stated reason.
4. Every screen ships its states. A fetch with no loading or error state, a list with no empty state, a form with no error state is unfinished.
5. Real content and real numbers. No lorem ipsum, no invented testimonials, logos, prices or metrics. Missing proof: leave the slot out or mark it `[needs real content]`.
6. User-facing strings live where the project keeps copy (i18n files, string resources). Point at them. Do not rewrite legal, pricing or claims copy; ask.
7. Keyboard, screen reader, reduced motion and contrast ship with the feature, not after.
8. One most obvious thing per view. Two competing primary actions: one is wrong.
9. Make the call. State the reason in one line. Show a menu of options only when the user asks (then hand to `lll:design-system`, variants).
10. Delete before adding. The strongest fix is often to remove a card, border, animation, field or sentence.

## Steps

1. **Learn the project.** Run the detection in `../../shared/stack-detect.md`. Then find: design docs, token files (`tailwind.config`, `theme.ts`, CSS variables, `Theme.kt`, asset catalogs), the component folder, the icon set, the i18n files, and two screens next to the target that already look right. Note the UI library (shadcn, MUI, Radix, Chakra, Material, SwiftUI native, Flutter Material).
2. **Pin the job.** One line each: who uses this, what they want done, the one primary action, where they came from and go next. The code and README usually answer it. If they do not, decide, state the assumption in one line, and continue.
3. **Classify the surface**, per section when mixed:
   - **Do** (app UI, dashboards, settings, editors): scanning speed, consistency and platform idiom beat expression. Brand lives in details.
   - **Sell** (landing, pricing, campaign): one offer, one action, one proof. Expression is allowed; the first screen reads as one composition.
   - **Read** (docs, articles, help, changelog): measure, headings, wayfinding, search.
   - **Explore** (portfolio, gallery, showcase): the work owns the first screen; chrome recedes.
4. **Calibrate.** For a new pattern, look at how three or more strong products solve it before designing. Use Mobbin when the MCP tools are connected; otherwise name the products from knowledge and mark them "unverified". Procedure: `references/calibrate-and-verify.md`. Skip for a tweak to an existing, consistent screen.
5. **Do the task.** Follow the Read column. For build and polish, work in this order and stop when it is good enough:
   1. Structure and hierarchy (what is first, second, third).
   2. Layout and spacing on the project's scale.
   3. Type and colour from tokens.
   4. States and edge content (long, empty, missing, localised).
   5. Interaction, focus and motion.
   6. Responsive and platform fit.
6. **Look at it.** Run the app and capture it. Web: 375, 768, 1024 and 1440 px wide, light and dark, keyboard only, reduced motion on. Mobile: smallest and largest shipped device, large text size, dark mode, offline. Tools: the `run` skill, `anthropic-skills:built-in-browser` or `chrome-browser`; deeper browser QA is `lll:research`. If nothing can run, say what is unverified. Detail: `references/calibrate-and-verify.md`.
7. **Scan.** `node scripts/ui-scan.mjs <paths>` lists mechanical anti-patterns with `path:line` (web CSS and markup, SwiftUI, Compose). Treat each hit as a lead: confirm in context or discard. Run `node scripts/ui-scan.mjs --selftest` only when changing the script.
8. **Close out.** Run the project's lint, typecheck and tests (gates from step 1). Then `/simplify` for code cleanliness if you wrote a lot, and `/code-review` when the change touches logic. Report per Output.

## The floor

A screen below any of these is not done. Numbers are the common minimums; the project's tokens may be stricter.

| Check | Floor |
|---|---|
| Text contrast | body 4.5:1; large text (24 px, or 19 px bold) 3:1; icons, borders of controls, focus ring 3:1 |
| Touch target | 44 pt iOS, 48 dp Android, 44 px web touch UI; 24 px hard minimum on pointer UI |
| Body size | 16 px web, 17 pt iOS body, 14-16 sp Android; captions never under 12 |
| Line length | 45 to 75 characters, about 65 ideal |
| Spacing | one scale (4 or 8 base), related items closer than unrelated ones |
| Feedback | a press changes something within 100 ms; indicator only past about 300 ms |
| Focus | visible on every control, never `outline: none` without a replacement |
| Motion | purposeful, interruptible, `transform` and `opacity` only on web, reduced-motion variant |
| States | default, loading, empty, error, success; buttons also hover, pressed, disabled |
| Wayfinding | where am I, where can I go, how do I get out |
| Text resize | usable at 200 percent zoom and the largest system text size |
| Layout | no horizontal scroll at 320 px wide; nothing hidden behind the keyboard or system bars |

## Slop to refuse

Detail and fixes: `references/slop.md`. The brief's own words can earn any of these; defaulting to them cannot.

- Cards of icon, heading and two lines, repeated three across, as page structure. Cards inside cards.
- Gradient text, gradient primary buttons, purple-to-blue gradients, glow, blob and wave decoration.
- Everything centred. One radius, one soft shadow on everything.
- Emoji or Unicode glyphs standing in for an icon set.
- "Welcome to", "Unlock", "Seamless", "Get started" with no outcome; three hero numbers with tiny labels.
- Frosted glass as the default surface, not as chrome.
- Happy path only: no empty, loading, error or long-content design.
- A modal for something that needs neither interruption nor focus trap.

## Output

- **Build, polish, motion, states:** the code in place, then at most five lines: what the surface is for (job and surface class), reference products or "unverified", token and component reuse, states covered, what still needs a real device or real content.
- **Review:** the table and verdict from `references/review-and-polish.md`. Every row has `path:line` or a screenshot reference.
- **Full:** report path, branch and worktree, counts by severity, top five findings, owner actions.
- Always say what was not run: no browser, no device, no screen reader, no real data.
- Next steps: two to four bullets.
