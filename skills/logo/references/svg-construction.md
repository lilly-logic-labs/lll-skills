# Building logos in SVG

How to turn a concept into clean, portable SVG that a developer, a printer and a vector editor can all use. Describe the construction in words first, write the markup second, render and look third.

## 1. File conventions

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" role="img" aria-labelledby="t">
  <title id="t">Brand logo</title>
  <path fill="#0f7c80" d="..."/>
</svg>
```

- `viewBox` first, on an integer canvas: 256 x 256 (or 512) for symbols; for lockups keep the height 256 and let the width follow (for example `0 0 960 256`). `width` and `height` are optional; leave them off so the file scales.
- Padding: 4 to 8 percent inside the viewBox for symbols, or crop tight on purpose and handle spacing with clear space rules. Be consistent across the set.
- Integer or one-to-two-decimal coordinates. `127.99999` bloats the file and hides misalignment.
- Include a `<title>`. Group logically: `<g id="symbol">`, `<g id="wordmark">` so lockups recompose.
- Name files predictably: `brand-symbol-black.svg`, `brand-logo-horizontal-color.svg`.
- Presentation attributes (`fill="#0f7c80"`) over `<style>` blocks, so colours are visible to tools and survive copy-paste.

## 2. Think in primitives

Before writing path data, describe the build in words, with numbers:
- "Circle r 96 centred at 128,128. Remove a 45-degree wedge at upper right. A circle r 24 sits in the gap as a dot."
- "Letter L: vertical bar 40 wide from y 48 to y 208; horizontal bar 40 high from x 48 to x 208; corner joined; foot extended 4 units for overshoot."

Pick a grid unit (8 or 16 on a 256 canvas) and snap main dimensions to multiples. The mark feels systematic and later gridding is trivial. Keep a list of the radii, angles and stroke widths you use, and reuse them.

Choose the simplest element for each part: `<circle>`, `<ellipse>`, `<rect rx>`, `<polygon>` for primitives; `<path>` for everything else and for the final merged silhouette.

## 3. Writing paths

- Commands: `M` move, `L` `H` `V` lines, `A` elliptical arc, `C` cubic, `Q` quadratic, `Z` close. Absolute (uppercase) while designing; relative is fine for final minimising.
- Arcs for circular geometry: `A rx ry rotation large-arc sweep x y`. Radii stay consistent and are easy to verify. A semicircle cap: `M64 128 A64 64 0 0 1 192 128`. Sweep 1 is clockwise on screen. A full circle needs two arcs (or a `<circle>`).
- Cubic curves for organic forms: put anchors at extrema (top, bottom, left, right of a curve) with handles horizontal or vertical there. A quarter circle as a cubic uses handle length about 0.5523 x radius.
- Few anchors. Each extra point is a chance for a wobble. If a curve needs many points, split it into arcs.
- Exact angles: build diagonals from 0, 15, 30, 45, 60, 90 degrees. At 45 degrees the x and y offsets are equal; at 30 and 60 they use 0.5 and 0.866. "Almost" angles (44 degrees, 2 degrees off vertical) read as mistakes; the checker flags them.
- Close filled shapes with `Z`.

## 4. Negative space and compound shapes

- Put outer contour and holes in one path with `fill-rule="evenodd"`, so holes appear where subpaths overlap an odd number of times:

```svg
<path fill-rule="evenodd" d="M128 24 A104 104 0 1 1 127.9 24 Z M128 88 A40 40 0 1 0 128.1 88 Z"/>
```

- Design the negative shape first (the arrow, the letter), then build the positive around it. A hidden figure between two shapes is only as good as the gap's consistency.
- Gaps between elements must be wide enough to survive 16 px: at least 1/32 of the mark's height, preferably 1/24.
- Prefer true holes to white shapes on top, which break on coloured backgrounds.

## 5. Strokes versus fills

- Strokes are convenient while exploring (monoline marks). For the master, expand strokes to outlines (in a vector editor: Object > Path > Outline Stroke, Inkscape: Stroke to Path, Figma: Outline stroke). A stroked master changes weight when scaled in some tools.
- If you keep a stroke version for web, use `vector-effect: non-scaling-stroke` only intentionally and `stroke-linejoin`/`stroke-linecap` explicitly.
- One stroke width system per mark. If two weights appear, they need a ratio (for example 1:2).

## 6. Type in SVG

- Exploration: live `<text>` with a stated typeface is fine, flagged "to be outlined".
- Final: convert letters to paths. Do it with a font tool (fonttools, opentype.js, Inkscape, Figma) or draw the letters from primitives. Never ship a master that needs a font installed.
- Custom letters (cuts, joins, new terminals) are what make a wordmark ownable. Draw them on a baseline, cap-height and x-height grid.
- Check the font licence allows logo use and outlining; the owner must confirm.

## 7. Colour, gradients, variants

- Black first. Add colour after the form works. One or two colours.
- No gradients, filters, shadows or opacity in a master. If a gradient is wanted, supply a flat fallback and decide it is not needed to recognise the mark.
- Variants live in separate files: colour, black, white, brand-mono, plus small-size cut (see the delivery notes).

## 8. Recipes (all verified with the checker)

Ring with a notch (abstract mark):

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><title>Ring</title>
  <path fill="#0f7c80" fill-rule="evenodd" d="M128 24 A104 104 0 1 1 127.9 24 Z M128 88 A40 40 0 1 0 128.1 88 Z"/></svg>
```

Square with one rounded corner (block symbol):

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><title>Block</title>
  <path fill="#1b2a41" d="M32 32 H224 V224 H96 A64 64 0 0 1 32 160 Z"/></svg>
```

Diamond with a centred dot (exact 45-degree edges):

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><title>Diamond</title>
  <path fill="#c4472d" fill-rule="evenodd" d="M128 32 L224 128 L128 224 L32 128 Z M128 104 A24 24 0 1 1 127.9 104 Z"/></svg>
```

Letter L built from one path plus a square dot (lettermark; a flat-footed L has no round parts, so no overshoot is needed):

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><title>L</title>
  <path fill="#222222" d="M64 32 H112 V176 H192 V224 H64 Z"/><rect x="152" y="32" width="40" height="40" fill="#222222"/></svg>
```

Quarter-grid mark built from four quarter-circles (rule-based):

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><title>Quarters</title>
  <path fill="#0f7c80" d="M32 128 A96 96 0 0 1 128 32 V128 Z"/>
  <path fill="#0f7c80" d="M224 128 A96 96 0 0 1 128 224 V128 Z"/></svg>
```

## 9. What to avoid in a master

- Live text, embedded raster (`<image>`), filters, masks and clip paths, patterns, `<script>`, `<foreignObject>`, external references, event handlers.
- Hairlines and details below about 1/48 of the mark's height.
- Overlapping unmerged shapes of the same colour (they print fine but cut badly; merge them with a boolean union in an editor when producing the final).
- Inconsistent angles, radii or stroke widths.
- Hand-traced bezier lumps: re-draw with arcs and extrema anchors.

## 10. Check and look

```
node scripts/svg-check.mjs check a.svg
node scripts/svg-check.mjs sheet a.svg -o sheet-a.html
```

`check` reports root and viewBox problems, forbidden elements, colour count, strokes, excess precision, anchor count, near-miss angles and the bounding box centre offset. It does static analysis only: it does not render, so always look at the sheet or a PNG too. To render: open the HTML sheet with a browser tool; or use an installed renderer (resvg, rsvg-convert, Inkscape, ImageMagick) or a headless browser screenshot. Do not run an unpinned `npx` download to render. If you truly cannot render, say so and keep the geometry extra simple.

## 11. Boolean operations and cleanup

You will sometimes need unions, subtractions and outline expansion that raw markup does poorly. Use an installed tool (Inkscape CLI actions, Illustrator, Figma, Affinity, or `paper.js` already in the project) rather than hand-computing intersections. After any tool pass, re-run the checker and re-look at the render: tools can add transforms, extra precision and clip paths.
