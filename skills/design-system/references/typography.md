# Typography for a system

Choose faces by procedure, set a scale, verify licensing and loading, and define text styles that components share.

## 1. Choosing faces: a procedure

1. **Name the audience's world** and the surface mode: Sell (marketing), Do (app), Read (long content), Explore (immersive). The register differs per mode. Name the publications, notations, signage or objects they read.
2. **Shortlist** three candidate faces per role: display (headlines), body (reading and UI), mono (code and data, if any).
3. **Exclusions:** drop faces that are novelty or overused for the role (see section 4), and faces whose character contradicts an anti-adjective.
4. **Verify each candidate** on its official source: exact family name, available weights and italics, scripts supported (Latin Extended, Devanagari, Arabic, CJK as needed), licence (SIL OFL, Apache, commercial), and loading method. Offline: mark "pending verification". Never invent a family or a URL.
5. **Pair or not.** One family in several weights is often enough. If two, make them clearly distinct (serif with sans, or grotesk with mono), not near-twins. Test the pairing at real sizes.
6. **Decide the loading strategy** (section 5) and the fallback stack.

## 2. Roles and the scale

| Role | Typical use | Notes |
|---|---|---|
| Display | hero headlines, large numbers | the personality; tight leading (1.05 to 1.15), slight negative tracking above 28 px |
| Heading | h1 to h4 | same family as display or body; weights 600 to 700 |
| Body | paragraphs, UI | 16 px base on web; leading 1.4 to 1.6 |
| Label / UI | buttons, tabs, inputs | 14 to 16 px; weight 500 to 600; no letter-spacing on lowercase |
| Small / caption | helper text, metadata | not below 12 px |
| Mono | code, IDs, tabular data | enable tabular figures |

Build a scale from a ratio (1.125 dense, 1.2 to 1.25 default, 1.333 editorial) anchored on 16 px, rounded to whole pixels. Bundle each step into a **text style** (family, size, weight, leading, tracking) and use styles, not raw sizes, in components.

Fluid type (`clamp()`) for marketing headings; fixed steps in dense app UI. Cap line length (45 to 75 characters).

## 3. Script and platform realities

- Native platforms: San Francisco on Apple and Roboto (or the Material typography) on Android are excellent choices for app UI and carry Dynamic Type and font scaling. Use brand faces for display and marketing, system faces for dense UI, unless the brand is the product.
- Indic, Arabic, CJK and Hebrew scripts need fallback checks: line height, vertical clipping, weight availability. Do not assume a Latin face has other scripts.
- Right-to-left: mirror layout; pick faces with RTL support.
- Numerals: tabular figures for tables and prices; old-style figures only in editorial text.

## 4. Role lists

These lists are starting points; verify current availability before use.

- **Overused as a display voice** (not wrong, but a default signal): Inter, Roboto, Arial, Helvetica, Open Sans, Lato, Montserrat, Poppins, Space Grotesk, Playfair Display, DM Sans, Plus Jakarta Sans, Outfit, Geist. They are fine as body or UI faces in an app when the system says so.
- **Banned in any role** (reads as unconsidered or dated): Papyrus, Comic Sans, Lobster, Impact, Jokerman, Brush Script, Hobo, Courier New as a body face.
- Prefer faces with: a stated character that matches the brief, enough weights, a real italic, open licensing for web and app embedding.
- Do not memorise a "good fonts" list and reuse it; that is how everything converges. Choose from the brief, verify, record the reason.

## 5. Loading and performance (web)

- Self-host or a trusted CDN; `font-display: swap` (or `optional` for non-critical); preload the one face used above the fold; subset to needed scripts (`unicode-range`); prefer variable fonts when two or more weights of a family are used.
- Match fallback metrics (`size-adjust`, `ascent-override`) to avoid layout shift.
- Native apps: bundle fonts in the app (register in `Info.plist` / `res/font`); check licence covers app embedding. Support Dynamic Type via `Font.custom(_:size:relativeTo:)` / `UIFontMetrics` / `sp` units.
- Email: use web-safe stacks; custom fonts are unreliable.

## 6. Licences

State the licence beside each family in `DESIGN.md`. Common cases: SIL Open Font License (free to use and embed; keep the licence file), Apache 2.0 (free), commercial desktop/web/app licences (seat or page-view limits; the owner buys), system fonts (use only on their own platform). Fonts for a logo need a licence that allows logo use, and outlines. Flag anything uncertain to the owner; do not decide legal questions.

## 7. Type in the system document

Record: families with roles and source, scale table (step, size, line height, weight, tracking, use), text styles, loading approach, fallback stack, script coverage, licences, and one line on why these faces suit the brief.

## 8. Checks

1. Body 16 px or larger on web; captions at least 12 px.
2. Levels differ by more than weight.
3. Line length within 45 to 75 characters in reading contexts.
4. Fonts verified, licensed and loaded without layout shift.
5. Scripts the product serves render correctly.
6. Text styles cover every component; no one-off sizes.
