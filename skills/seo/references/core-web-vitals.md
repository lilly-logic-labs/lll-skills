# Core Web Vitals and page speed

## Facts

| Metric | Good | Needs improvement | Poor |
|---|---|---|---|
| LCP, Largest Contentful Paint | 2.5 s or less | 2.5 to 4.0 s | over 4.0 s |
| INP, Interaction to Next Paint | 200 ms or less | 200 to 500 ms | over 500 ms |
| CLS, Cumulative Layout Shift | 0.1 or less | 0.1 to 0.25 | over 0.25 |

- INP replaced FID in March 2024. FID is gone from Chrome's field tools. Never cite FID as current.
- A page passes when 75 percent of real visits meet "good" for all three. Google assesses per page and per origin.
- CWV is a light ranking signal. Relevance and content win when quality differs a lot. Do not promise rankings from speed work; promise better user experience and a passing report.
- Thresholds have not changed. Ignore blog claims of "CWV 2.0", "visual stability index" or a 2.0 s LCP target.
- Field data (real Chrome users, 28-day window) is what counts. Lab data (Lighthouse, one run on a fixed device) is for debugging. A site with too little traffic has no field data: use lab as a proxy and say so.
- Single-page apps: route changes ("soft navigations") are not measured by field CWV today. Measure the first load, and test route changes with DevTools.

## Measure

1. **Field**: Search Console > Core Web Vitals report (mobile and desktop, grouped URLs); PageSpeed Insights top section (CrUX, URL then origin); CrUX API or CrUX Vis for history. The `web-vitals` JS library with attribution gives your own field data and can send it to the analytics tool (set that up with `lll:analytics`).
2. **Lab**: PageSpeed Insights "diagnose" section, Lighthouse in DevTools, `npx lighthouse <url> --only-categories=performance --output json` (pinned version), WebPageTest. Run on mobile profile first. Run three times and take the median.
3. **PageSpeed Insights API**: `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=<url>&strategy=mobile` (key optional at low volume). Read `loadingExperience` (URL field), `originLoadingExperience` and `lighthouseResult`.
4. **LCP breakdown**: TTFB, resource load delay, resource load time, element render delay. The biggest part tells you which fix to try. Most LCP problems are the delay phases, not download size.
5. **INP debugging**: DevTools Performance panel with the interaction track; Long Animation Frames; `web-vitals` attribution build to log the worst interaction target and which phase (input delay, processing, presentation) is slow.
6. **CLS debugging**: DevTools Performance > Layout Shifts; the `layout-shift` entries list the shifted nodes.

## LCP fixes

| Cause | Fix |
|---|---|
| Slow server (TTFB over about 800 ms) | cache HTML at the edge, reduce server work, avoid redirects before the page, enable HTTP/2 or 3, compress |
| LCP image discovered late | put it in the HTML (not CSS background or JS-injected); `<link rel=preload as=image fetchpriority=high>` or `fetchpriority="high"` on the `<img>` |
| LCP image lazy-loaded | remove `loading=lazy` from the above-the-fold image |
| Oversized image | right-size with `srcset` and `sizes`; AVIF or WebP; see `./images.md` |
| Render-blocking CSS or JS | inline critical CSS, defer or async scripts, split bundles |
| Web font delay | `font-display: swap` or `optional`, preload the one critical font, self-host, subset |
| Client-side rendering of the hero | render the LCP element on the server |
| Third-party tags before content | load after interaction or idle; tag managers hide cost, see `lll:analytics` |

## INP fixes

- Break long tasks under 50 ms (`scheduler.yield()` or `setTimeout` chunks), move heavy work to a Web Worker.
- Keep event handlers short: do the visual update first, defer analytics and state syncing.
- Cut hydration cost: smaller bundles, partial or island hydration, lazy-load below-the-fold components, avoid giant global state updates on each keystroke.
- Reduce DOM size (a few thousand nodes is the point where trouble begins), avoid layout thrashing, use `content-visibility: auto` for long lists, virtualise lists.
- Third-party scripts (chat widgets, A/B tools, tag managers, ad scripts) are the most common cause on marketing sites. Audit with the Performance panel's third-party grouping and delay the heavy ones.

## CLS fixes

- `width` and `height` (or `aspect-ratio`) on every image, video, iframe and embed.
- Reserve space for ads, banners, cookie notices, late-loading widgets. A consent banner should overlay or sit in reserved space, not push content.
- Font swap shift: preload the font, use `size-adjust` or a metric-matched fallback.
- Never insert content above existing content after load. Animate with `transform`, not `top` or `height`.

## Per-stack notes

| Stack | Notes |
|---|---|
| Next.js | `next/image` with `priority` for the LCP image; `next/font`; keep the hero a Server Component; `next/script` with `strategy="lazyOnload"` for non-critical tags; check hydration cost with the React Profiler |
| Astro, Eleventy, Hugo | ship zero JS by default; hydrate islands only where needed; image components handle sizes |
| React, Vue, Svelte SPA | code-split routes; prerender public pages; avoid client-only fetch for above-the-fold data |
| WordPress | page cache plus image optimisation plugin; remove unused plugins and page builders' bloat; defer plugin scripts; avoid heavy sliders in the hero |
| Shopify | theme app embeds and review or popup apps drive INP and LCP; remove unused apps; use `image_url` width filters; preload hero |
| Server-rendered backends (Rails, Django, Laravel, .NET, Go, Spring) | fragment and full-page caching; database query count; gzip or brotli; CDN in front; HTTP caching headers |
| Cloudflare | Cache rules for HTML, Early Hints, Polish, Smart Placement and Workers tuning belong to `lll:cloudflare` |
| Mobile apps | Core Web Vitals do not apply; use Android vitals and Xcode Organizer, see `lll:mobile` |

## Report format

```
Field data (CrUX, 28 days, p75): LCP x.x s | INP xxx ms | CLS 0.xx   [URL | origin | not enough data]
Lab (Lighthouse mobile, median of 3): Performance xx
Worst phase: <LCP subpart or INP phase>   Culprit: <element or script>
Fix list ordered by expected gain, with the failure check: re-measure field data in 28 days.
```
