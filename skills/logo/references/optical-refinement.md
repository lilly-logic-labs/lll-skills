# Optical refinement

The eye weighs; it does not measure. A mark that is mathematically exact often looks wrong. Refine by eye on a rendered image, then record each correction so it is repeatable. Do it after the form is settled and before colour.

## 1. Overshoot

Round and pointed shapes look smaller than flat ones of the same size.
- Circles, rounded bowls and arcs overshoot flat edges by 1 to 3 percent of their height (a 256 unit circle sits 3 to 6 units beyond the square beside it).
- Triangles and pointed apexes overshoot more, 3 to 5 percent.
- Letters: round letters (O, C, S) extend slightly above the cap height and below the baseline; pointed letters (A, V, W) at the apex.
- When a circle sits in a row with squares, make it 2 to 3 percent larger.

## 2. Optical centring

- A symbol is centred on its visual mass, not its bounding box. Triangles and play shapes sit toward their heavier side (a right-pointing triangle sits about 8 to 10 percent right of the box centre).
- In a circular or rounded container, a symbol with weight at the top sits slightly lower; a symbol that is bottom-heavy sits higher. Most marks sit very slightly above geometric centre.
- Check at small sizes in a rounded tile and circular crop: the mark should not feel pushed to a side.
- Asymmetric lockups: balance the mass of symbol and wordmark; align on the wordmark's x-height or cap height, not the box.

## 3. Stroke compensation

- Horizontal strokes look heavier than vertical ones of the same width; thin horizontals by 3 to 8 percent.
- Where strokes meet (junctions, joins), the overlap looks darker; add small notches or reduce the stroke near the join (ink traps for small sizes) if it clogs.
- Diagonals look lighter than their numeric width; thicken slightly.
- Thin lines look thinner on dark and at small sizes; the reversed version needs lighter weight (white on dark looks bolder through irradiation), so thin it by 2 to 5 percent.

## 4. The bone effect (rounded rectangles)

A rounded corner that joins a straight side at a fixed radius looks pinched, like a bone. Ease the curvature in:
- Start the curve earlier along the straight side (about 1.3 x the radius before the corner) and use longer handles (about 0.6 x radius), or use a superellipse (continuous-curvature corner) as Apple icons do.
- Apply the same correction to inside corners and to counters.

## 5. Letter spacing and letterform fixes

- Space by area, not distance: the white space between letters should look equal. Straight-straight pairs need most, straight-round less, round-round less, diagonal pairs least.
- Check every pair, including capital I vs lowercase l, rn vs m, cl vs d, vv vs w, in the actual font.
- Tracking: tighten display sizes, open small sizes. An all-caps wordmark wants extra tracking.
- Customised letters: after a cut or join, redraw the neighbouring counters so the colour (density) stays even.
- Check the baseline: bowls and round forms overshoot; flat feet sit on the line.

## 6. Balance

- The mark should not look accidentally tilted or top-heavy. Squint or blur it: masses should sit where you intend.
- Flip it horizontally: errors hidden by familiarity show up.
- Rotate it 90 and 180 degrees: look for unintended shapes, letters, faces or symbols.
- Symbols that will live in squares should have a near-square footprint; very wide or tall marks shrink in icons.

## 7. Small-size cut

If the mark fails at 16 or 24 px even after refinement, draw a small-size version instead of shrinking the master:
- Fewer elements, thicker strokes, larger gaps, simpler counters.
- Remove detail that cannot be resolved; keep the silhouette and the main idea.
- Keep the same proportions and character so it reads as the same mark.
- Name it clearly (`brand-symbol-small.svg`) and say where it applies (favicon, 16 to 32 px).

## 8. Reversed version

White on dark spreads (irradiation). Thin strokes by 2 to 5 percent, open counters slightly, and check gaps remain visible. Provide a dedicated reversed file when the difference is visible.

## 9. Record the corrections

Keep a short list in the guide or a comment in the file: "circle 4 units larger than the square (overshoot)", "horizontal bar thinned 6 percent", "reversed version thinned 3 percent", "corner eased: radius 40, handles 24". These make the mark reproducible and defendable.

## 10. Process

1. Render at 512 px and at 32 px side by side.
2. Make one correction at a time, re-render, compare against the previous.
3. Stop when further changes are not visible at the sizes people will see.
4. Re-run the structural check; refinement often adds decimals and anchors.
