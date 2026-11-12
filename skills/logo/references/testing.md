# Testing a logo

A logo is finished when it survives these tests. Run them on every concept before presenting, and again on the final artwork. Report results as facts: passed, adjusted (with the numbers), failed, not run.

Tools: `node scripts/svg-check.mjs check a.svg` for structure and geometry; `node scripts/svg-check.mjs sheet a.svg -o sheet.html` for the visual tests. Open the sheet in a browser tool at 100 percent zoom and look. The rest needs judgement.

## 1. Scale

- [ ] **16 px (favicon, tab).** The core idea survives. If it turns to mush, draw a small-size cut: fewer elements, thicker strokes, bigger gaps.
- [ ] **24 to 32 px** (app lists, avatars): recognisable at a glance.
- [ ] **Very large** (billboard, building): curves are smooth, anchors do not lump, kerning holds; flaws invisible small are glaring large.
- [ ] **Minimum size:** shrink until identifying features are lost; the size just above is the documented minimum (px for screen, mm for print).
- [ ] Details and gaps are not smaller than about 1/48 of the mark's height; gaps between elements at least 1/32.

## 2. Colour and value

- [ ] One-colour black on white works.
- [ ] One-colour white on black works and does not look heavier (irradiation); if it does, supply a thinned reversed file.
- [ ] Works on the brand colour, on a photo and on a pattern (use an outline or a container version if not).
- [ ] Greyscale: colour segments separate by value; nothing relies on hue alone.
- [ ] Colour-blind simulation: still separable.
- [ ] CMYK/Pantone: noted for proofing if vivid.

## 3. Form

- [ ] **Squint test.** Blur the render: the silhouette alone is distinctive and balanced.
- [ ] **Mirror test.** Flipped, no proportion errors appear.
- [ ] **Rotation and unintended readings.** View at 90 and 180 degrees, tiny, and from a distance. Check for accidental letters, body parts, offensive or sexual readings, political or religious symbols, hazard-sign resemblance. Show it to someone who has not seen the brief.
- [ ] **Letter test.** Every customised letter still reads as the intended letter at first glance ("what letter is this?").
- [ ] **Junction check.** Zoom on every place strokes meet: no notches, slivers, lumps, hairline gaps.
- [ ] **Optical corrections applied:** overshoot, bone effect, thin horizontals, optical centring.
- [ ] **Geometry clean:** no near-miss angles, consistent radii and stroke widths (the checker flags near-miss angles).
- [ ] **Balance:** not accidentally tilted; near-square footprint for symbols.

## 4. Distinctiveness and originality

- [ ] **Shelf test.** Place it among competitor marks at the same size. It should stand out, not blend in. Collect competitors via the browser tools, read-only.
- [ ] **Familiarity test.** It does not remind you or anyone you ask of an existing mark. If it feels familiar and is not yours, it is someone else's.
- [ ] **Reverse image search** or a web search for the same subject plus technique, where tools allow.
- [ ] **Trademark:** recommend a professional search in the relevant classes and countries before launch. You cannot give legal clearance; say so.

## 5. Meaning and fit

- [ ] The idea can be said in one sentence.
- [ ] Tone matches the adjectives (sharp or round, heavy or light, warm or cool).
- [ ] It identifies rather than explains; it still fits if the business expands.
- [ ] Cultural meaning of colours and symbols checked for the markets served.
- [ ] Works without the tagline; symbols eventually work without the name.

## 6. Media and production

- [ ] Embroidery (no hairlines; gaps at least about 1 mm at chest size), engraving, vinyl cutting, signage, stamping.
- [ ] Dark mode, light mode, animation start/end frames if relevant.
- [ ] App icon: sits well inside the platform's mask and tile; no fine text.
- [ ] Social avatars: survives a circular crop.
- [ ] Master file: pure vector, text outlined, strokes expanded, no filters or raster, clean viewBox, checker reports no FAIL and no unexplained WARN.

## 7. Context

- [ ] Shown in 4 to 6 realistic mockups relevant to the business (a bakery: bag, window, sticker; a developer tool: README, terminal, docs header), in one consistent style. Never judge a logo only on a white artboard.
- [ ] Lockups (horizontal, stacked, symbol only, wordmark only) tested at intended sizes.

## 8. Final delivery checklist

1. Masters: colour, black, white, brand-mono, each vector, named predictably.
2. Small-size cut where needed.
3. PNG exports at the sizes listed in the delivery notes, with transparency.
4. Favicon set and app icons generated and visually checked.
5. Test sheet saved with the files.
6. Guide includes clear space, minimum sizes, colours, approved backgrounds, misuse.
7. Open items for the owner: trademark search, font licence, print proof, colour matching.

## 9. Recording results

Summarise in the handover: what passed, what was adjusted with numbers ("thinned the reversed version 3 percent; opened the counter gap from 6 to 10 units so it survives 16 px"), what failed and was accepted with a reason, and what the owner must still do. Never claim a test you did not run.
