# Design tokens

Tokens are named design decisions that code consumes. They make the system changeable in one place and let themes switch without touching components.

## 1. Three layers

| Layer | Example | Rule |
|---|---|---|
| Primitive (raw scale) | `blue.600 = #2563eb`, `space.4 = 16px`, `radius.2 = 8px` | values only; no meaning; not used in components |
| Semantic (role) | `color.accent.bg`, `color.text.muted`, `space.card.padding`, `radius.control` | what the value is for; components use these; themes remap these |
| Component | `button.primary.bg = {color.accent.bg}` | only when a component needs an override; optional |

Rules: components reference semantic tokens, semantics reference primitives, and nothing skips a layer. A new need adds a semantic token before it adds a raw value in a component.

## 2. Naming

- `category.role.variant.state`: `color.text.muted`, `color.border.focus`, `color.surface.raised`, `motion.duration.fast`. Lowercase, dot or hyphen separated, consistent.
- Name by role, never by value or appearance (`text-muted`, not `grey-600` or `light-blue`).
- States are suffixes: `bg`, `bg-hover`, `bg-pressed`, `bg-disabled`. Foreground-on-colour tokens use `on-`: `accent.on`.
- Keep the vocabulary small. If two tokens always change together, merge them.

## 3. What to define

| Group | Tokens | Notes |
|---|---|---|
| Colour | background, surface, surface-raised, surface-overlay, border, border-strong, text, text-muted, text-disabled, link, accent (bg, hover, pressed, on), focus ring, and semantic success/warning/danger/info each with bg, border, text | pairs must meet contrast; see the colour notes |
| Type | families (display, body, mono), sizes (a scale), weights, line heights, letter-spacing, and named text styles (display, h1 to h4, body, small, label, code) | text styles bundle size, weight, leading, tracking |
| Space | a 4 px base scale: 0, 2, 4, 8, 12, 16, 24, 32, 48, 64, 96, 128 | named steps (`space.1` ...) plus a few semantic (`inset`, `stack`, `gutter`) |
| Size | control heights (sm 32, md 40, lg 48), icon sizes (16, 20, 24), target minimum 44 | align with touch-target rules |
| Radius | none, sm, md, lg, full; role aliases `control`, `card`, `sheet` | nested radius = outer minus inset |
| Border | widths 1 and 2; hairline 0.5 on high density | |
| Elevation | levels 0 to 4 as shadow recipes (offset, blur, spread, colour) or tonal surfaces | dark themes use lighter surfaces, not shadow |
| Opacity | disabled, scrim, hover/pressed overlays | |
| Motion | duration (instant 0, fast 120, base 200, slow 320, slower 500), easing (standard, enter, exit, emphasised), spring presets | respect reduced motion |
| Z-index | base, sticky, dropdown, overlay, modal, toast, tooltip as a short scale | stops z-index wars |
| Breakpoints | content-driven, e.g. 640, 768, 1024, 1280, 1536; container query sizes | |
| Focus | ring width, offset, colour | consistent everywhere |

Do not create tokens speculatively. Each token needs at least one consumer, or it is deleted.

## 4. Scale recipes

- **Spacing:** 4 px base. Steps: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96. Use fewer: eight steps cover most products.
- **Type:** pick a ratio: 1.125 (dense app UI), 1.2 or 1.25 (default), 1.333 (editorial). Anchor at 16 px body. Round to whole pixels. Provide `clamp()` fluid values for headings on marketing pages only.
- **Radius:** 3 to 5 values. A control radius, a container radius, a full pill. Keep concentric: container = control + padding.
- **Elevation:** at most four. Shadows have an offset and a soft blur, with colour tinted toward the background hue. Zero-offset coloured halos are decoration.
- **Motion:** 4 durations, 3 curves, 2 spring presets.

## 5. Formats and where tokens live

Pick the project's existing format first. Common homes:

| Stack | Typical home |
|---|---|
| Plain CSS / any web | CSS custom properties in `:root` and theme selectors |
| Tailwind v4 | `@theme { --color-brand-600: ...; }` in the main CSS file; v3: `theme.extend` in `tailwind.config` |
| CSS-in-JS, vanilla-extract, Panda | a typed theme contract exporting CSS variables |
| React Native / Expo | a `tokens.ts` module plus a theme provider (`useColorScheme`) |
| SwiftUI | colour assets in the asset catalog (light, dark, high contrast), `Color` and `Font` extensions, spacing enum |
| UIKit | the same asset catalog plus `UIColor` extension |
| Compose | `Color.kt`, `Type.kt`, `Shape.kt`, `Theme.kt` feeding `MaterialTheme`; custom roles via `CompositionLocal` |
| Flutter | `ThemeData` with `ColorScheme`, `TextTheme`, `ThemeExtension` for custom tokens |
| Multi-platform or Figma-driven | W3C Design Tokens JSON (DTCG: `$value`, `$type`, `$description`) as the single source, transformed with Style Dictionary or a small script |

Use a build step (Style Dictionary or similar) only when two or more platforms consume the same tokens. For one platform, hand-written native tokens are simpler and clearer.

DTCG snippet:

```json
{
  "color": {
    "accent": {
      "bg": { "$type": "color", "$value": "{color.blue.600}" },
      "on": { "$type": "color", "$value": "#ffffff" }
    }
  },
  "space": { "4": { "$type": "dimension", "$value": "16px" } }
}
```

CSS snippet with a dark theme:

```css
:root { color-scheme: light dark; --color-bg: #fff; --color-text: #111827; --color-accent: #2563eb; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --color-bg: #0b0f14; --color-text: #e5e7eb; --color-accent: #6b9bff; } }
:root[data-theme="dark"] { --color-bg: #0b0f14; --color-text: #e5e7eb; --color-accent: #6b9bff; }
```

## 6. Migrating raw values to tokens

1. Inventory the raw values (see the extraction notes).
2. Cluster near-duplicates; choose canonical values; keep the one used most.
3. Add tokens, then replace usages in one commit per group (colours, then spacing, then radius, then type).
4. Add a lint rule or CI grep that fails on new raw hex colours or off-scale spacing in component code.
5. Delete the unused tokens and old constants.

## 7. Checks

1. Every semantic token resolves in every theme (no missing dark value).
2. Every text/background and control/border pair meets contrast in every theme (run the checker).
3. No component uses a primitive directly.
4. No token without a consumer; no raw value where a token exists.
5. Tokens documented in `DESIGN.md` with role, value per theme and usage note.
