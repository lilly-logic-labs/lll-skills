# Theming: light, dark, high contrast, multi-brand

## 1. Principles

- Themes remap **semantic** tokens. Components never change between themes.
- Dark is a designed theme, not an inversion. High contrast and forced colours are accessibility modes, not skins.
- Default to the system preference; allow a stored user override (light, dark, system). Choose the product default from the use scene.
- Every image, logo, illustration and chart has a defined behaviour in each theme.

## 2. Light and dark

| Concern | Light | Dark |
|---|---|---|
| Background | white or near-white | near-black with a hint of brand hue; pure black only if the platform idiom is true black (OLED) |
| Elevation | shadow and border | lighter surface per level (about +4 to 8 percent lightness per step); shadows barely visible |
| Text | neutral 900 | about 87 percent white primary, 60 percent secondary, 38 percent disabled |
| Accent | brand 600 | brand 300 to 400, chroma reduced 10 to 20 percent |
| Borders | neutral 200 | neutral 800; hairlines can need 1 px instead of 0.5 |
| Semantic colours | step 600 text on step 50 | step 300 text on step 950 |
| Images | as is | lower brightness slightly, or provide dark variants; transparent PNG logos need a dark variant |
| Shadows with colour | tint toward background hue | replace with outline or surface tint |

Rules:
- Re-check contrast for every pair in dark; a colour that passes on white often fails on dark.
- Avoid large areas of saturated colour in dark (vibrates); avoid pure white text blocks.
- Charts: use a dark-tuned palette with lightness-separated series.
- Screenshots and marketing images shown inside dark UI need dark treatments.

## 3. Switching without a flash (web)

1. Set `color-scheme: light dark` on `:root` so native controls follow.
2. Define tokens under `:root`, override under `@media (prefers-color-scheme: dark)` guarded by `:root:not([data-theme="light"])`, and again under `:root[data-theme="dark"]`.
3. A tiny inline script in `<head>` reads the stored preference and sets `data-theme` before first paint.
4. A toggle writes the preference (wrap storage in try/catch for private windows) and updates `data-theme` and `<meta name="theme-color">`.
5. Avoid transitions on theme change for all properties; a short colour transition on background and text is enough, or none.
6. SSR frameworks: render without theme-specific markup, or use cookies so the server knows; avoid hydration mismatch with a `suppressHydrationWarning` on `<html>` only.

## 4. Native

- **SwiftUI/UIKit:** asset catalog colours with Any/Dark (and High Contrast) variants; semantic system colours; `.preferredColorScheme` only for deliberate overrides; test with Increase Contrast.
- **Compose:** `lightColorScheme` and `darkColorScheme`, `isSystemInDarkTheme()`, dynamic colour optional; custom roles via `CompositionLocal`.
- **Flutter:** `ThemeData.light()`/`dark()` from `ColorScheme.fromSeed`, `themeMode: ThemeMode.system`, `ThemeExtension` for custom tokens.
- **React Native:** `useColorScheme`, a theme context, never import raw colours in components.
- **Desktop:** follow OS appearance and accent colour; support high contrast themes.

## 5. High contrast and forced colours

- Web: `@media (forced-colors: active)` removes backgrounds; keep borders and outlines (`border: 1px solid` for controls, `outline` for focus), use system colour keywords (`CanvasText`, `Canvas`, `LinkText`, `ButtonText`, `Highlight`) where needed, `forced-color-adjust: none` only for essential graphics.
- `prefers-contrast: more`: strengthen borders and text contrast, remove translucency.
- iOS Increase Contrast: provide high-contrast variants in the asset catalog. Android: high contrast text and large display.

## 6. Multi-brand and white-label

- One component library, one semantic token contract, N brand token sets. Brands change primitives and a few semantic mappings; they do not fork components.
- Keep a **brand contract**: the list of tokens a brand must provide (accent, accent-on, logo variants, display font, radius scale).
- Automate contrast checks per brand and per theme (the pairs checker on each brand's token file).
- Limit surface area: brand may change colour, type, radius, logo; not layout, spacing rhythm or component behaviour.

## 7. Density and size themes

Compact, comfortable and spacious are also themes: remap spacing and control-size tokens (control height 32/40/48; row padding 8/12/16). Offer them only if users need them (data-heavy tools).

## 8. Test matrix

For each key screen: light, dark, high contrast, largest text, RTL if localised. Capture all and compare. Look for: invisible borders, unreadable muted text, glaring white images, missing dark logo, shadows that vanish, focus ring lost.
