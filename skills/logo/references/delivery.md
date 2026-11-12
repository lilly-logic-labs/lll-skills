# Delivery: variants, exports, favicon set

What to hand over, how to name it, and how to produce each file. Write into the project's brand folder (`brand/logo/` if none exists), and only in Full mode after the owner approved a direction.

## 1. Folder layout

```
brand/logo/
  svg/
    brand-logo-horizontal-color.svg
    brand-logo-horizontal-black.svg
    brand-logo-horizontal-white.svg
    brand-logo-stacked-color.svg
    brand-symbol-color.svg
    brand-symbol-black.svg
    brand-symbol-white.svg
    brand-symbol-small.svg          (only if a small-size cut exists)
    brand-wordmark-color.svg
  png/
    brand-symbol-512.png  brand-symbol-1024.png  brand-logo-horizontal-1200.png ...
  web/
    favicon.ico  icon.svg  apple-touch-icon.png  icon-192.png  icon-512.png  icon-maskable-512.png  site.webmanifest
  app/
    ios-1024.png  android-adaptive/ (foreground.svg, background.svg, monochrome.svg)  play-store-512.png
  sheet/test-sheet.html
  README.md  (guide, see presentation notes)
```

Follow an existing folder convention if the project has one. Do not scatter files across the repository.

## 2. Variants to produce

| Variant | Purpose |
|---|---|
| Colour | default use on light surfaces |
| Black | one-colour print, stamps, fax-like contexts |
| White (reversed) | dark surfaces, photos |
| Brand-mono | single brand colour, merch |
| Dark-surface colour | if the colour version needs different tints on dark |
| Horizontal and stacked lockups | headers and square spaces |
| Symbol only | icons, avatars, favicon |
| Wordmark only | where the symbol is nearby |
| Small-size cut | 16 to 32 px |
| Outline/container version | busy photos, low contrast surfaces |

Each is a separate SVG file with the same viewBox logic. Check each with `node scripts/svg-check.mjs check brand/logo/svg/*.svg`.

Shortcut for the one-colour set: `node scripts/svg-check.mjs variants brand-symbol-color.svg` writes `brand-symbol-color-black.svg` and `-white.svg` copies next to the source (rename to the layout above; add `--mono "#0f7c80"` for a brand-mono copy). It repaints every fill and stroke, so it suits flat marks; check the result, since a mark that relies on two tones needs a hand-made one-colour version.

## 3. PNG exports

Render from the SVG at exact sizes with transparency. Options, in order of preference: an installed renderer (resvg, rsvg-convert, Inkscape, ImageMagick with an SVG delegate), a headless Chromium/Edge screenshot of an HTML page with a transparent background, or a browser tool. Do not `npx` an unpinned package. If nothing renders locally, deliver the SVGs and the commands for the owner to run, and say PNGs were not produced.

Typical sizes: symbol 512 and 1024; horizontal 600, 1200 and 2400 wide; social avatar 400 x 400; open graph image 1200 x 630 (symbol or logo centred on a brand surface; text rendering belongs to the page, not the logo).

Examples (adapt to the available tool):
```
rsvg-convert -w 512 brand-symbol-color.svg -o brand-symbol-512.png
inkscape brand-symbol-color.svg --export-type=png --export-width=512 --export-filename=brand-symbol-512.png
magick -background none -density 384 brand-symbol-color.svg -resize 512x512 brand-symbol-512.png
```

## 4. Favicon and web icon set

The small modern set that covers current browsers and platforms:

| File | Size | Notes |
|---|---|---|
| `favicon.ico` | 32 x 32 (optionally 16, 48 in the same file) | legacy and default request; pack with `node scripts/svg-check.mjs ico 16.png 32.png 48.png -o favicon.ico` |
| `icon.svg` | any | the small-size cut or symbol; can adapt to dark mode with `prefers-color-scheme` inside the SVG |
| `apple-touch-icon.png` | 180 x 180 | opaque background, no transparency; the logo about 70 to 75 percent of the width |
| `icon-192.png`, `icon-512.png` | 192, 512 | web app manifest, purpose `any` |
| `icon-maskable-512.png` | 512 | purpose `maskable`; the logo inside the central safe zone (a circle of diameter 80 percent of the icon), background filled to the edges |

`<head>`:
```html
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="#0f7c80">
```

`site.webmanifest`:
```json
{
  "name": "Brand", "short_name": "Brand",
  "icons": [
    { "src": "/icon-192.png", "type": "image/png", "sizes": "192x192" },
    { "src": "/icon-512.png", "type": "image/png", "sizes": "512x512" },
    { "src": "/icon-maskable-512.png", "type": "image/png", "sizes": "512x512", "purpose": "maskable" }
  ],
  "theme_color": "#0f7c80", "background_color": "#ffffff", "display": "standalone"
}
```

Frameworks: put files where the framework serves static assets (`public/`, `static/`, `app/` for Next metadata files such as `favicon.ico`, `icon.svg`, `apple-icon.png`). Match the project's convention and update head tags in its layout, not a new file. Platform-hosted sites (Cloudflare Pages/Workers assets, Vercel, Netlify) just need the files in the static root.

A favicon at 16 px should be the small-size cut or a simplified symbol, not the full lockup. Check it in a real tab (the test sheet has a tab mock).

App-icon canvases from the same symbol: `node scripts/svg-check.mjs icon brand-symbol-color.svg --kind maskable --bg "#0f7c80" -o icon-maskable.svg` (kinds `ios` 1024, `android-fg` 108 with the 66 dp safe circle, `maskable` 512 with the 80 percent circle, `plain` 1024; `--fit` sets the artwork share of the safe area, `--dy` nudges it). The output wraps the artwork in a `transform`, so `check` skips its bounding-box tests on it. Render it to PNG with an installed renderer.

## 5. Social and other surfaces

- Avatar: symbol on a solid brand surface, centred, 70 percent of the height; survives a circular crop.
- Open graph / social card: 1200 x 630 PNG; logo and name large, plenty of margin.
- Email signature: 2x PNG of the horizontal logo at 120 to 160 px display width.
- Print: supply SVG or PDF vectors; tell the printer to use the black or Pantone version; do not rasterise.
- Documents and slides: PNG at 2x or the SVG; keep clear space.

## 6. Manifest of what was made

Write `brand/logo/README.md` (the guide) listing each file, its purpose and the minimum size. Include the real output of the checker for the masters. State which files were not produced and why.

## 7. Safety and hygiene

- SVGs shipped on the web must have no script, event handlers or external references (the checker fails on them).
- Do not embed fonts or raster data.
- Keep the master (colour) SVG editable; do not commit minified-only versions.
- Do not commit large PNG exploration folders; keep exploration in a scratch folder outside the repository.
