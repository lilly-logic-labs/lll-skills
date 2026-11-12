# Image SEO and delivery

Images affect rankings through Google Images, Discover, page speed (LCP, CLS) and accessibility. Fix delivery first, then discoverability.

## Checks

| Check | Pass | Notes |
|---|---|---|
| Alt text | meaningful images have a short description of what is shown; decorative images use `alt=""` | describe, do not stuff. A good alt works as the replacement text for a blind user |
| File name | descriptive, hyphenated, lowercase (`blue-running-shoes.webp`) | `IMG_1234.jpg` wastes a signal |
| Format | AVIF or WebP for photos, SVG for logos and icons, PNG only when needed | keep a JPEG fallback through `<picture>` if you serve AVIF |
| Weight | content image under about 100 KB, hero under about 200 KB, thumbnail under about 50 KB | targets, not laws. Judge by the LCP result |
| Dimensions | `width` and `height` attributes (or `aspect-ratio`) on every `<img>` | prevents layout shift |
| Responsive | `srcset` and `sizes` match the layout | do not ship a 3000 px file to a 400 px slot |
| Loading | `loading="lazy"` below the fold only; never on the LCP image | |
| LCP image | in the HTML, `fetchpriority="high"`, preloaded if needed, not lazy | see `./core-web-vitals.md` |
| Decoding | `decoding="async"` on non-critical images | |
| Delivery | CDN, long `Cache-Control` with fingerprinted file names | |
| Indexable | image URLs not blocked by robots.txt; `<img src>` or `<picture>` in HTML, not CSS backgrounds, for content images | CSS background images are not indexed as page images |
| Context | image sits near relevant text, with a caption when useful | page context is a strong Google Images signal |

Lazy-loading by library (`data-src`, `lazyload` classes) is fine: count it as lazy, and check that the first image is not delayed.

## Markup

```html
<picture>
  <source srcset="hero-800.avif 800w, hero-1600.avif 1600w" type="image/avif" sizes="100vw">
  <source srcset="hero-800.webp 800w, hero-1600.webp 1600w" type="image/webp" sizes="100vw">
  <img src="hero-1600.jpg" alt="Technician replacing a heat pump filter" width="1600" height="900"
       fetchpriority="high" decoding="async">
</picture>
```

Below the fold: same shape with `loading="lazy"` and no `fetchpriority`.

## Google Images and Discover

- Discover and large previews need big images: at least 1,200 px wide, and `<meta name="robots" content="max-image-preview:large">`. Do not use a logo as the only image.
- Image sitemap (`image:image` / `image:loc`) helps images that load through JavaScript or galleries.
- Licensable badge: add `ImageObject` with `license` and `acquireLicensePage`, or IPTC licensor metadata.
- IPTC creator and copyright metadata shows in Google Images but is not a ranking factor. EXIF camera data and IPTC keywords do nothing for SEO.
- Visual search (Lens, Circle to Search) reads the picture itself; sharp, unobstructed, well-lit product photos help more than metadata.

## AI-generated images

If the site sells through Merchant Center, check the current Merchant Center policy: images made with generative AI are expected to carry the IPTC `DigitalSourceType` value `trainedAlgorithmicMedia` (other values: `compositeSynthetic`, `compositeWithTrainedAlgorithmicMedia`, `algorithmicMedia`, `digitalCapture`). AI-written product titles and descriptions have their own feed labelling rule. This is a feed policy requirement, not a ranking factor.

```
exiftool -XMP-iptcExt:DigitalSourceType="https://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia" file.webp
exiftool -if 'not $XMP-iptcExt:DigitalSourceType' -filename *.webp      # find unlabelled files
```

Provenance marks such as C2PA content credentials and SynthID are transparency signals, not extra feed fields.

## Commands (run in a copy, never overwrite originals)

```
cwebp -q 82 -metadata all in.jpg -o out.webp
avifenc --min 20 --max 30 in.jpg out.avif
magick in.jpg -resize 800x -quality 82 out-800.webp
exiftool -IPTC:By-line="Brand" -IPTC:CopyrightNotice="(c) 2026 Brand" in.jpg
```

Node projects can batch with `sharp`; Python with `Pillow` plus `pillow-avif-plugin`. Use the build step the project already has before adding a tool.

## Per-stack

| Stack | Notes |
|---|---|
| Next.js | `next/image` with `sizes`, `priority` on the LCP image, `remotePatterns` for CDNs |
| Astro | `astro:assets` `<Image>` and `<Picture>` |
| WordPress | core adds `srcset`; use an image optimiser plugin; check the theme's lazy-load on the hero |
| Shopify | `image_url: width:` filters and `srcset`; check app-injected galleries |
| Django, Rails, Laravel | `sorl-thumbnail` / `django-imagekit`, Active Storage variants, Intervention Image; store original plus generated sizes |
| Cloudflare | Images and Polish do resizing and format conversion at the edge (`lll:cloudflare`) |

## Output

Table: total images, missing alt, no dimensions, oversized, wrong format, lazy on LCP. Ranked list by bytes saved. Lens `seo-images`.
