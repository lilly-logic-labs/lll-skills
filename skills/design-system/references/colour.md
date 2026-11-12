# Colour: palette, roles, contrast, accessibility

## 1. Build a palette

1. **Anchor.** Start from the brand colour if one exists (logo, existing UI), otherwise from the subject's world (materials, places, objects) and the memorable-thing sentence. Do not start from the category cliché.
2. **Strategy.** Choose one: restrained (neutrals plus one accent; colour is rare and meaningful), committed (one hue owns the surface, neutrals derive from it), full palette (primary, secondary and semantic colours for hierarchy), drenched (colour is the main design tool).
3. **Neutrals.** Tint toward the anchor hue by 2 to 6 percent chroma so greys belong to the brand. Pick warm or cool and stay with it. Make 9 to 11 steps from near-white to near-black.
4. **Accent.** One. A second accent needs a job (data series, a brand moment).
5. **Semantics.** Success, warning, danger, info. Keep conventional hues (green, amber, red, blue) so meaning is immediate; adjust lightness and chroma to the palette. Each gets background, border and text tokens.
6. **Scales.** Generate 11-step tonal scales with the checker (`node scripts/colour.mjs scale "#hex" --name brand`). It works in OKLCH, keeps the hue, shapes chroma and keeps your exact input as one step. Review by eye; adjust steps where a hue shifts oddly (yellows and cyans need care).
7. **Roles.** Map scale steps to roles (see below); never use scale steps directly in components.

## 2. Role map (starting point)

| Role | Light theme | Dark theme |
|---|---|---|
| `bg` | neutral 50 or white | neutral 950 |
| `surface` | white | neutral 900 |
| `surface-raised` | white with border or shadow | neutral 850 to 800 (lighter than bg) |
| `border` | neutral 200 | neutral 800 |
| `border-strong` | neutral 300 to 400 | neutral 700 |
| `text` | neutral 900 | neutral 100 (not pure white) |
| `text-muted` | neutral 600 | neutral 400 |
| `accent` | brand 600 | brand 400 (desaturated 10 to 20 percent) |
| `accent-on` | white or neutral 950, whichever passes | likewise |
| `focus` | brand 500, 3:1 against adjacent colours | brand 300 |
| `danger/warning/success/info` | step 600 text, step 50 bg, step 200 border | step 300 text, step 950 bg, step 800 border |

## 3. Contrast

Compliance measure: WCAG 2.2 contrast ratio. Targets for AA:

| Pair | Minimum |
|---|---|
| Body text on its background | 4.5:1 |
| Large text (24 px, or 18.66 px bold) | 3:1 |
| UI component edges, icons carrying meaning, focus rings, chart marks vs neighbours | 3:1 |
| Text on a coloured button | 4.5:1 |
| Placeholder and helper text | 4.5:1 |

Aim higher for long reading (7:1 is comfortable). APCA is a useful second opinion for body-text readability but is not the compliance measure.

Check every pair, in every theme, and for hover, pressed, selected and disabled:

```
node scripts/colour.mjs contrast "#6b7280" "#ffffff"
node scripts/colour.mjs pairs tokens-check.json
```

`tokens-check.json` format: `{ "themes": { "light": { "text": "#111827", "bg": "#fff" }, "dark": { ... } }, "pairs": [["text","bg",4.5],["muted","bg",4.5],["accent-on","accent",4.5]] }`. The command exits 1 when any pair fails.

Text over images or gradients: measure at the worst point, or add a scrim; prefer a solid panel.

## 4. Colour-blind safe

- About 8 percent of men have a red-green deficiency. Never encode state with hue alone: add an icon, label, pattern or position.
- Check status colours and chart series with a simulator (deuteranopia, protanopia, tritanopia). Pick series that differ in lightness as well as hue.
- Do not pair red and green as the only difference; avoid blue/purple confusion for adjacent series.

## 5. Dark palette

Not an inversion. Raise surfaces with lightness for elevation; lower chroma on accents; use off-white text at about 87 percent and secondary at 60; check each pair again. Details in the theming notes.

## 6. Semantics and meaning

- Red is danger and destruction, not "sale". Green is success, not "go" in every context. Yellow/amber needs dark text.
- Reserve the accent for the primary action and key interactive states. If everything is accent, nothing is.
- Cultural meaning varies (red and white, mourning colours). Check the markets served.

## 7. Charts and data

Data palettes follow different rules (categorical, sequential, diverging; colour-blind safe; consistent per series). Use the `dataviz` skill for chart palettes instead of improvising from brand colours.

## 8. Reproduction (when print or merch matters)

Screen hex is not print. For print, ask the printer for CMYK or Pantone matches and check gamut (vivid screen blues and greens do not print). Provide a one-colour and a greyscale version of any mark.

## 9. Common mistakes

- Brand colour used for text on white without checking contrast (many brand blues and oranges fail 4.5:1 as small text; use a darker step for text).
- Placing white text on a mid-tone accent (4.1:1 fails); either darken the accent or use dark text.
- A different grey per file; mixed warm and cool neutrals.
- Pure black text on pure white for long reading, or low-contrast "clean" grey.
- Using opacity to make muted text (contrast changes with the background).
- No visible difference between disabled and enabled.
