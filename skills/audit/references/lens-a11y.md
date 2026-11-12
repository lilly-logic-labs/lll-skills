# Lens: a11y

Whether people using keyboards, screen readers, zoom, switch access or reduced motion can complete the product's core flows. Target: WCAG 2.2 AA on the web; TalkBack and VoiceOver on Android and iOS.

## Covers

- Names, roles and states of controls; text alternatives; headings, landmarks and reading order.
- Keyboard and switch access, focus order, visible focus, focus traps, focus restored after dialogs.
- Colour contrast for text and for UI parts; information not carried by colour alone.
- Zoom, reflow and text scaling (browser zoom, Android font scale, iOS Dynamic Type).
- Forms: labels, instructions, error identification and suggestions, autocomplete, redundant entry.
- Motion, flashing and auto-playing media; status messages announced to assistive tech.
- Touch target size; dragging alternatives; accessible authentication.

Building or restyling components with accessibility in mind is `lll:ui`. This lens audits what exists.

## Method

1. **Pick the flows.** Sign-up, sign-in, the main task, search, checkout or save, settings, error recovery. Every finding names the flow it blocks.
2. **Automated pass.** Run the tools below on each flow's screens. Automated checks catch roughly a third of issues; treat a clean run as a start, not a pass.
3. **Code pass.** Grep for the patterns below and read each component in context.
4. **Manual pass,** per flow:
   - Keyboard only: Tab and Shift+Tab reach every control in a sensible order; Enter and Space activate; Escape closes overlays; focus is always visible and never hidden behind sticky headers; focus returns to the trigger after a dialog closes.
   - Screen reader (VoiceOver on macOS or iOS, NVDA on Windows, TalkBack on Android): every control announces a name, role and state; images are described or hidden; errors and status changes are announced.
   - Zoom to 200 % and a 320 CSS px wide viewport: no lost content, no two-direction scrolling for text.
   - Platform text scaling at its largest setting: text wraps instead of truncating important content.
   - Reduced motion setting: large animations stop or reduce.
5. **Write findings** with the success criterion, the flow, who is blocked and how.

## Web checks (WCAG 2.2 AA)

| Criterion | Check |
|---|---|
| 1.1.1 Non-text content | Informative images have `alt`; decorative ones `alt=""`; icon-only buttons have an accessible name |
| 1.3.1 Info and relationships | Headings in order, lists as lists, table headers, labels tied to inputs, landmarks |
| 1.3.5 Identify input purpose | `autocomplete` on personal-data inputs (name, email, tel, address, one-time-code) |
| 1.4.3 Contrast (minimum) | 4.5:1 for text, 3:1 for large text |
| 1.4.4, 1.4.10, 1.4.12 Resize, reflow, text spacing | 200 % zoom and 320 CSS px width without loss; no `user-scalable=no` or `maximum-scale=1` |
| 1.4.11 Non-text contrast | 3:1 for focus rings, input borders, icons that carry meaning |
| 2.1.1, 2.1.2 Keyboard, no trap | Every action works by keyboard; no element traps focus |
| 2.4.3, 2.4.7 Focus order, focus visible | Logical order; visible indicator; no positive `tabindex` |
| 2.4.11 Focus not obscured (minimum) | Focused control not fully hidden by sticky headers, footers or banners |
| 2.5.7 Dragging movements | Every drag action has a single-pointer alternative |
| 2.5.8 Target size (minimum) | Targets at least 24 by 24 CSS px, or enough spacing |
| 3.3.1, 3.3.3 Errors | Errors identified in text, tied to the field, with a suggestion |
| 3.3.7 Redundant entry | Information already given is not asked for again in the same process |
| 3.3.8 Accessible authentication | No memory or puzzle test without an alternative; paste and password managers allowed |
| 4.1.2 Name, role, value | Custom widgets expose role and state (`aria-expanded`, `aria-selected`, `aria-checked`) |
| 4.1.3 Status messages | Toasts, async results and form errors announced through live regions |

Also 2.2.2 (moving or auto-updating content can be paused), 2.4.2 (page titles), 3.1.1 (`lang` on `html`), 3.2.6 (help in a consistent place).

Code greps (leads):

- Clickable non-controls: `git grep -nE '<(div|span|li|img)[^>]*onClick'` without `role`, `tabIndex` and a key handler.
- Positive tab order: `git grep -nE 'tab[iI]ndex=\{?.?[1-9]'`.
- Removed focus styles: `git grep -nE 'outline:\s*(none|0)'` without a `:focus-visible` replacement.
- Hidden but focusable: `git grep -nE 'aria-hidden=.true'` on buttons, links or inputs.
- Placeholder as label: inputs with `placeholder` and no `<label>`, `aria-label` or `aria-labelledby`.
- Zoom blocked: `git grep -nE 'user-scalable=no|maximum-scale=1'`.
- Images: `git grep -nE '<img\b' | grep -v 'alt='` (multi-line tags need a read).
- Motion: animations without a `prefers-reduced-motion` branch; `autoplay` media.

## Android checks (TalkBack)

- Views: `contentDescription` on `ImageView`, `ImageButton` and icon buttons; decorative images `importantForAccessibility="no"`; `labelFor` on labels of inputs.
- Compose: `contentDescription` on `Icon` and `Image` (null only when decorative); `Modifier.semantics` with `role`, `stateDescription`, `heading()`; `mergeDescendants = true` for rows read as one item; custom clickables use `Modifier.clickable(role = ...)` or `toggleable`.
- Touch targets at least 48 dp (`minimumInteractiveComponentSize` in Compose).
- Text in `sp`, layouts that survive font scale 200 %; no fixed heights on text containers.
- Live updates: `accessibilityLiveRegion` or Compose `liveRegion`.
- Tools: `./gradlew lint` (ContentDescription and touch-target checks), Accessibility Scanner on a device, Espresso `AccessibilityChecks.enable()` in instrumented tests.

## iOS checks (VoiceOver)

- `accessibilityLabel` on icon-only buttons and images that carry meaning; decorative images `accessibilityHidden(true)` or `Image(decorative:)`.
- Traits: `.isButton`, `.isHeader`, `.isSelected`; grouped rows `accessibilityElement(children: .combine)`; custom actions for swipe-only gestures.
- Dynamic Type: system text styles or `@ScaledMetric`; no fixed font sizes on body text; layouts that switch to vertical at accessibility sizes.
- Targets at least 44 by 44 pt.
- Reduce Motion: `@Environment(\.accessibilityReduceMotion)` respected for large transitions.
- Tools: Xcode Accessibility Inspector audit; `XCUIApplication().performAccessibilityAudit()` in UI tests (Xcode 15 and later).

## Cross-platform

- React Native: `accessibilityLabel`, `accessibilityRole`, `accessibilityState`, `accessible` grouping, `hitSlop` for small icons, never `allowFontScaling={false}` on body text, `importantForAccessibility` on decorative views.
- Flutter: `Semantics` with labels, `ExcludeSemantics` for decoration, `MergeSemantics` for rows; tests with `meetsGuideline(androidTapTargetGuideline)`, `iOSTapTargetGuideline`, `labeledTapTargetGuideline` and `textContrastGuideline`.

## Tools

| Platform | Tool |
|---|---|
| Web, automated | axe-core through Playwright (`@axe-core/playwright`) or a pinned `@axe-core/cli`; pa11y; Lighthouse accessibility category |
| Web, lint | `eslint-plugin-jsx-a11y`, `eslint-plugin-vuejs-accessibility`, Angular ESLint template accessibility rules, Svelte compiler warnings |
| Web, live | browser accessibility tree through the `chrome-browser` or `built-in-browser` skills |
| Android | Android lint, Accessibility Scanner, Espresso accessibility checks |
| iOS | Accessibility Inspector, `performAccessibilityAudit()` |
| Flutter | accessibility guideline matchers in widget tests |

Manual screen reader and device checks need a person or device the run may lack: list them under Owner actions with the exact flow to test.

## Severity calibration

- **high:** a core flow cannot be completed by keyboard or screen reader (unlabelled submit button, focus trapped in a modal, custom select unusable by keyboard); sign-in requires a puzzle with no alternative; zoom disabled on a mobile web app.
- **medium:** body text below 4.5:1; no visible focus indicator across the app; form errors not announced or not tied to fields; Dynamic Type or font scale truncates primary content.
- **low:** one decorative image announced; one icon button without a name on a secondary screen; heading levels skipped.

## False-positive traps

- Contrast rules do not apply to disabled controls, logos or purely decorative text.
- `alt=""` on decorative images is correct, not missing.
- Target-size exceptions: inline links in text, controls with an equivalent larger target, sizes set by the user agent.
- axe "needs review" items are questions, not failures.
- Content hidden on purpose (closed menus, inactive tabs) should be hidden from assistive tech too.
- A design choice documented in the project's design rules is the spec; report only where it breaks a criterion.
