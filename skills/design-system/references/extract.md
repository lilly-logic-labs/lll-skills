# Extract the system from an existing app

Recover the design system the product already has, measure how far it drifts, and propose the smallest consolidation that makes it consistent. Read-only until the owner approves the plan.

## 1. Scope and ground rules

- Read-only: no edits, installs or builds that write into the tree until the plan is approved. Follow `../../../shared/ground-rules.md`.
- Describe what is rendered and coded, not what a doc claims. When doc and code disagree, the code is the fact and the drift is a finding.
- Skip vendored and generated paths (`node_modules`, `dist`, `build`, `.next`, `Pods`, generated `android/` and `ios/` in Expo projects, minified bundles).
- Do not copy personal data from screenshots or fixtures into notes.

## 2. Inventory commands (adapt to the stack)

Use the Grep tool or `rg`. Count first, then read samples.

| Question | Search |
|---|---|
| Hex colours in use | `#[0-9a-fA-F]{3,8}\b` in `*.css,*.scss,*.tsx,*.vue,*.svelte,*.swift,*.kt,*.dart` |
| Other colour syntaxes | `rgba?\(`, `hsla?\(`, `oklch\(`, `Color\(red:`, `Color\(0x`, `UIColor\(` |
| Font families and sizes | `font-family`, `font-size`, `fontFamily`, `.font(`, `fontSize =`, `TextStyle(` |
| Spacing values | `padding`, `margin`, `gap`, `.padding(`, `Modifier.padding`, `EdgeInsets` |
| Radii | `border-radius`, `rounded-`, `cornerRadius`, `RoundedCornerShape`, `BorderRadius` |
| Shadows | `box-shadow`, `shadow-`, `.shadow(`, `elevation` |
| Z-index | `z-index`, `z-` |
| Breakpoints | `@media`, `min-width`, `breakpoints` |
| Motion | `transition`, `animation`, `@keyframes`, `withAnimation`, `animate*AsState`, durations and easings |
| Existing tokens | `:root`, `--color-`, `theme.extend`, `Theme.kt`, `Assets.xcassets`, `ThemeData`, `tokens` |
| Components | the components folder; repeated markup patterns |

For a running web app, query computed styles in the browser (distinct `font-family`, colours, font sizes on headings, sizes of tappable elements under 44 px) instead of guessing from source. Cap element scans at a few hundred nodes.

Mechanical help: `lll:ui` ships a scanner that lists raw colour sprawl and common anti-patterns with `path:line`; use it as a lead generator.

## 3. Cluster and decide

1. **Colours:** group near-duplicates (within about 3 percent lightness and the same hue). Count usages. Name the neutrals and the accent. Flag: more than about 12 non-grey colours; mixed warm and cool greys; one-off brand-adjacent blues; colours failing contrast as text.
2. **Type:** list distinct families and size/weight pairs with counts. Flag: more than two families; sizes off any ratio; headings within a step of body; body under 16 px.
3. **Spacing:** list distinct values. Flag values off a 4 or 8 px base; the most common 6 to 8 values usually form the real scale.
4. **Radius, shadow, z-index, motion:** same approach; the top few values by usage form the scale.
5. **Components:** cluster by purpose; note variants and states each has; find near-duplicates ("six button styles").
6. **Decide canonical values:** prefer the most-used value that passes contrast and scale rules. If the most-used is wrong, name the replacement and why.

## 4. Classify each drift

| Class | Meaning | Fix |
|---|---|---|
| missing token | a repeated value with no token | add the token |
| one-off | an existing token or component should be used | replace with it |
| conceptual mismatch | similar screens behave or look different on purpose or by accident | ask the owner |
| local defect | incomplete or inconsistent implementation | fix in place |
| intentional exception | a documented, justified departure | record in `DESIGN.md` |

## 5. Output of the extraction

1. **Inferred system** (a table per group): canonical value, count, files, notes.
2. **Drift list**: each item with `path:line`, class, and the proposed replacement.
3. **Component inventory**: keep, merge, missing, delete.
4. **Proposed tokens** in the project's format, ready to paste.
5. **Migration plan**: order (colour, then spacing, radius, type, components), batches by folder, how to verify each batch (visual capture before and after, lint rule against raw values).
6. **Questions for the owner**: where intent is unclear.
7. **Offer**: "Want me to write this up as `DESIGN.md` and apply the first batch?"

Example summary:

```
Colours: 71 distinct hex values; 23 non-grey. 9 greys within 3 percent lightness of each other.
Canonical proposal: 11 neutrals, 1 accent (#2563eb, used 148x), 4 semantic. 
Type: 3 families (Inter, system-ui, Georgia in one email template); body 14 px in 62 places.
Spacing: values 5, 7, 10, 13, 15, 18 appear 41 times; the real scale is 4, 8, 12, 16, 24, 32.
Radius: 3, 4, 5, 6, 8, 10, 12, 16, 24; proposal: 4 (control), 12 (card), 9999 (pill).
```

## 6. Applying (only after approval)

- Fix in a separate worktree per `../../../shared/fix-phase.md`; one commit per token group; before and after captures at the same sizes.
- Add a guard: lint rule or CI grep failing on raw hex or off-scale spacing in component folders.
- Update `DESIGN.md` and the docs (`lll:docs`).
- Do not change brand colours or logo-derived values without the owner's say.

## 7. Native notes

- iOS: inventory `Assets.xcassets` colour sets; `Color(` and `UIColor(` literals; `.font(.system(size:` fixed sizes.
- Android: `res/values/colors.xml`, `themes.xml`, `Color.kt`, `dimens.xml`; literal `Color(0x...)` and `dp` text.
- Flutter: `ThemeData`, `Color(0x...)` literals, `TextStyle` with fixed sizes.
- React Native: `StyleSheet.create` values, inline styles.

## 8. Checks

1. Counts reported, not impressions.
2. Canonical values chosen with reasons.
3. Every proposed token has at least one consumer.
4. Contrast verified for proposed text pairs.
5. Nothing edited before approval.
