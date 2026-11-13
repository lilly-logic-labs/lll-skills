# Web notes

Applies to React, Vue, Svelte, Angular, Solid, Astro and plain HTML. Frameworks differ in syntax, not in what makes a good page. Check current browser support (`caniuse`, MDN, or the `context7` docs tool) before relying on a recent CSS feature.

## 1. Semantics before ARIA

- Use the element that already does the job: `<button>`, `<a href>`, `<input>`, `<select>`, `<dialog>`, `<details>`, `<label>`, `<nav>`, `<main>`, `<ul>`. A clickable `<div>` or `<span onClick>` is a finding: no keyboard, no role, no focus.
- Landmarks on every page: one `<main>`, `<header>`, `<nav>` (labelled when more than one), `<footer>`. A "Skip to content" link first in tab order.
- Headings form an outline with no skipped levels; one `<h1>`. Choose the level by structure, style it with CSS.
- ARIA only fills gaps native HTML cannot: `aria-expanded`, `aria-controls`, `aria-current`, `aria-live`, `aria-invalid`, `aria-describedby`. The first rule of ARIA is to not need it.
- Do not hand-roll comboboxes, menus, dialogs, tabs, date pickers or tooltips. Use the platform (`<dialog>`, `popover` attribute, `<details name>`) or an accessible primitive library (Base UI, Radix, React Aria, Headless UI, Ark, Melt, Zag). Toasts, drawers, command menus, OTP inputs and animated numbers have specialist libraries too: `libraries.md`.
- Links navigate, buttons act. A button that navigates, or a link that submits, is wrong.
- Images: meaningful ones have specific `alt`; decorative ones `alt=""`; icon-only buttons have an accessible name (`aria-label`).

## 2. Modern CSS worth using

| Need | Use |
|---|---|
| Fluid type and space | `clamp(min, preferred, max)` |
| Component-level responsiveness | `@container` queries |
| Light/dark values | `color-scheme` plus `light-dark()` or custom properties switched by `prefers-color-scheme` |
| Tints and states from one colour | `color-mix(in oklch, ...)`, relative colour syntax |
| Focus ring | `:focus-visible` with `outline` and `outline-offset` |
| Parent styling by child state | `:has()` |
| Layering of resets, components, utilities | `@layer` |
| Balanced headings | `text-wrap: balance`; paragraphs `text-wrap: pretty` |
| Full-height sections | `min-height: 100dvh`, not `100vh` |
| Safe areas | `env(safe-area-inset-*)` with `viewport-fit=cover` |
| Scroll snap, sticky headers | `scroll-snap-type`, `position: sticky`, `scroll-margin-top` for anchors |
| Auto-growing textarea | `field-sizing: content` |
| Entry/exit animation | `@starting-style`, `transition-behavior: allow-discrete` |
| Page/element morph | View Transitions API (feature-detect; keep non-animated fallback) |
| Native control tinting | `accent-color` |
| Hover only for real pointers | `@media (hover: hover) and (pointer: fine)` |

- Prefer logical properties (`margin-inline`, `padding-block`, `inset-inline-start`) so right-to-left works.
- Layout with grid and flex; spacing with `gap`. Avoid margin hacks and fixed pixel heights on text containers.
- Specificity: one naming approach (BEM, utility classes, CSS modules). Watch for a type selector like `.section` and an element selector cancelling each other's padding.

## 3. Frameworks and styling

- **Tailwind.** Use theme tokens (`bg-surface`, `text-muted`, `p-4`) mapped to the project's variables. Arbitrary values (`mt-[13px]`) are a smell; each one needs a reason. Extract repeated clusters into components, not `@apply` piles. v4 uses `@theme` in CSS for tokens.
- **CSS modules / vanilla-extract / styled-components.** Keep tokens in CSS custom properties so themes switch without re-render.
- **React.** State of the UI as a union, not booleans. Keys on lists. Suspense and error boundaries give loading and error states by construction. Server components: stream the shell, then the data.
- **Vue / Svelte / Angular.** Same rules: keyboard-reachable controls, `v-model` or bindings do not replace validation messages, transitions use `prefers-reduced-motion`.
- **Component kits** (shadcn/ui, MUI, Chakra, Mantine, Ant): theme them to the project's tokens; do not fork three button variants in feature code. Match the kit's density and radius to the brand or you get "default kit" look. Prefer kits that install by CLI or registry, so the source is in the repo and editable.
- **Icons:** one set, one stroke weight, one size grid (16, 20, 24). SVG, `currentColor`. No emoji as icons.
- **Images:** `width` and `height` or `aspect-ratio`, `loading="lazy"` below the fold, `fetchpriority="high"` on the LCP image, AVIF or WebP with `srcset`/`sizes`, `decoding="async"`.

## 4. Performance targets that people feel

LCP under 2.5 s (aim 2.0), INP under 200 ms, CLS under 0.1. Practical levers: reserve space for media and ads, avoid late-injected banners, preload the hero image and primary font, inline critical CSS or keep it small, split routes, defer analytics, avoid layout thrash in scroll handlers (use `IntersectionObserver`, `requestAnimationFrame`). Detailed performance audits belong to `lll:audit` (perf lens) or `lll:cloudflare` on Cloudflare-hosted sites.

## 5. Head and ship hygiene (full documents)

- `<title>`, meta description, `<meta name="viewport" content="width=device-width, initial-scale=1">` (never `user-scalable=no`), favicon, `theme-color`, social tags on shareable pages. Indexing and schema are `lll:seo`.
- Every `href` goes somewhere real: no `href="#"`. A control with no target is disabled.
- `target="_blank"` links carry `rel="noopener"`.
- Forms: `name`, `autocomplete`, correct `type`, labels, `novalidate` only when you provide your own accessible validation.
- No lorem ipsum, no fake logos, no invented numbers.

## 6. Web-specific states and quirks

- Back/forward restore scroll and filters; URL holds state.
- Prefetch on intent (hover/focus) not on every link in view.
- Offline: service worker only when the product needs it; otherwise a clear offline message.
- Third-party widgets (chat, consent) must not cover primary actions on small screens.
- Cookie consent and legal links are product decisions with legal weight; ask the owner.
- Print stylesheet for invoices, receipts and docs when people print them.

## 7. Verify in a browser

At 375, 768, 1024 and 1440 px: no horizontal scroll, text readable, tap targets 44 px, nothing overlapping. Light and dark. Keyboard only: tab order matches reading order, every control reachable, focus visible, `Esc` closes overlays and returns focus. Reduced motion on. 200 percent zoom. Throttled network. Console clean.
