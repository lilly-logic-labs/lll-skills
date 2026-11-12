# Type and colour in an interface

How to set and check text, colour, contrast and theming while building or reviewing UI. Choosing a brand's typefaces and palette is `lll:design-system`; here you apply and verify what the project already has, and extend it carefully.

## 1. Type

### Scale and hierarchy
- Use the project's scale. With none, use a ratio of 1.2 to 1.25 for app UI and up to 1.333 for editorial pages. Example (16 px base, 1.25): 12.8, 16, 20, 25, 31, 39.
- Hierarchy is size, weight, leading and colour taken together. Make levels differ by more than weight alone: a heading within one step of body size is flat.
- Two weights are enough for most UI (400 and 600). A third only for display.
- Display type: tight leading (1.05 to 1.15) and slight negative tracking (about -0.01 to -0.02 em above 28 px). Body: leading 1.4 to 1.6, tracking 0. Small caps and all-caps labels: +5 to +10 percent tracking. Never add tracking to lowercase body text.
- Display over about 6 rem on a page that is not a poster is size standing in for hierarchy.

### Readability
- Body 16 px or larger on the web, system body on native. Captions and labels not below 12 px.
- Line length 45 to 75 characters (65 ideal). Serif body gets slightly more leading than sans.
- Headings: `text-wrap: balance`; paragraphs: `text-wrap: pretty`. No single word alone on the last line of a heading.
- Left-align long text. Centre only short, symmetrical blocks (a hero line, an empty state).
- Numbers in tables and prices: tabular figures (`font-variant-numeric: tabular-nums`, SwiftUI `.monospacedDigit()`, Compose `fontFeatureSettings = "tnum"`), right-aligned.
- Truncation is designed: `text-overflow: ellipsis` or `line-clamp` with the full text reachable; names and titles never break layout at 60 characters.
- Curly quotes, a real ellipsis character, a non-breaking space between a number and its unit.
- Links are recognisable without hover: underline or distinct colour, and visited links differ.

### Fonts in code
- Web: at most two families (one is enough). Self-host or a trusted CDN, `font-display: swap`, preload the one face used above the fold, subset to the scripts used, variable fonts when two or more weights are used. Match fallback metrics (`size-adjust`) to avoid shift.
- A system font stack is a valid, fast choice for app UI (`system-ui`). As the display voice of a brand page it signals no decision was made.
- Native: SF Pro on Apple platforms with Dynamic Type text styles; Roboto or the Material typography scale on Android with `sp`. Custom fonts must support Dynamic Type or font scaling via `UIFontMetrics` or `sp`.
- Scripts: check Devanagari, Arabic, CJK and Hebrew fallbacks for line height and clipping. Right-to-left needs mirrored layout, not just text direction.

## 2. Colour

### Roles, not swatches
Define colour by role: background, surface, surface-raised, border, text, text-muted, accent (primary action), accent-on (text on accent), and the semantic four (success, warning, danger, info). Use the role tokens in components, never raw hex.

- One accent colour does the work. A second accent needs a job (data series, a brand moment).
- Neutrals lean slightly toward the brand hue. Do not mix warm and cool greys.
- Secondary text on a coloured surface takes a tint of that surface's hue, not a neutral grey.
- Semantic colours keep one meaning everywhere: red is danger, not "sale".
- Never colour alone: pair with an icon, a label or a pattern (about 8 percent of men have a red-green deficiency).

### Contrast numbers (WCAG 2.2 AA)
| Item | Minimum ratio |
|---|---|
| Body text, placeholder text, helper text | 4.5:1 |
| Large text (24 px, or 18.66 px bold) | 3:1 |
| Icons that carry meaning, control borders, focus rings, chart marks | 3:1 against adjacent colours |
| Disabled controls | exempt, but keep them legible |

`lll:design-system` includes a contrast calculator for exact ratios; browser dev tools also measure. Check every state (hover, pressed, disabled, selected) and every theme. Text on images or gradients: measure at the worst pixel, or add a scrim.

### Dark mode
- Dark is a second theme, not an inversion. Surfaces use elevation (lighter as they rise), not the same grey everywhere.
- Text is off-white (about 87 percent for primary, 60 for secondary), not pure white on pure black. Avoid pure black backgrounds on OLED unless the platform idiom is true black.
- Desaturate accents about 10 to 20 percent so they do not vibrate. Re-check contrast; a colour that passes on white often fails on dark.
- Shadows lose effect on dark; use borders or lighter surfaces for separation.
- Web: set `color-scheme` so form controls and scrollbars follow; use `prefers-color-scheme` as the default and a stored override; avoid a flash of the wrong theme by setting the theme before first paint.
- Pick light or dark default from the use scene (who, where, under what light), not from the product category.
- Test images, logos and illustrations in both themes. A dark logo on a dark surface is the classic miss.

### Other modes
- Increased contrast: borders defined, near-solid backgrounds, no translucent text on glass.
- Windows high contrast and forced colours: `@media (forced-colors: active)`; keep borders and focus outlines because backgrounds are removed.
- Colour-blind check: simulate deuteranopia and protanopia on charts, status badges and form validation.

## 3. Browser and platform surfaces

The parts nobody drew still carry the design. Theme them from the palette:
- Web: `::selection`, `caret-color`, `accent-color` on native checkboxes and radios, scrollbar colours (`scrollbar-color`), `:focus-visible` ring, underline offset and thickness, `color-scheme`, `theme-color` meta.
- iOS: tint colour, `UIColor` semantic system colours, accent colour in the asset catalog, status bar style.
- Android: dynamic colour on Android 12 and up when the brand allows it, `colorScheme` roles, system bar icon contrast.

## 4. Anti-patterns

- A different grey in every file. Fix by adding the missing token and replacing.
- More than about 12 non-grey colours on one screen.
- Text colour set by opacity on a coloured background (contrast becomes unpredictable).
- Pure `#000` text on pure `#fff` for long reading (strain), or a light grey on white because it "looks clean".
- Status shown only by a red or green dot.
- Gradient text as emphasis. Use weight or size.
- Using the brand colour for everything interactive and everything decorative, so nothing signals "press here".

## 5. Check list

1. Every text and control pair measured, in light and dark, in every state.
2. Role tokens only; no raw hex in components.
3. Type levels differ by more than weight; body at least 16 px on web.
4. Numbers aligned with tabular figures where compared.
5. Text scales to 200 percent / largest system size without clipping.
6. Browser or system surfaces themed.
