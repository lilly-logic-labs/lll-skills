---
name: logo
description: Design logos and brand marks: brief, concepts across mark types, clean geometric SVG, optical refinement, colour and type, tests (16 px, one-colour, reversed), delivery (SVG, PNG, favicon, app icons) and a mini guide. Use when asked for a logo, wordmark, monogram, symbol, app icon, favicon, or a logo critique or refresh. Not for brand colours/fonts/tokens (lll:design-system) or screens (lll:ui).
metadata:
  origin: lll
---

# Logo

Design a logo that identifies instead of explains: one clear idea, built in clean SVG, proven at 16 px and in one colour, delivered as files a developer and a printer can use. The output is a recommended mark plus the evidence it works.

## When to use

- A new logo, wordmark, lettermark, monogram, symbol or emblem for a company, product or project.
- An app icon, favicon or social avatar, new or from an existing mark.
- A critique, comparison or refresh of an existing logo ("looks bad when small", "feels dated").
- Delivery variants and a short usage guide for a mark that already exists.

## When not to use

- Brand colours, fonts, tokens, voice, `DESIGN.md`, "show me looks for the site": `lll:design-system`.
- Screens, components, illustrations inside the product UI: `lll:ui`.
- Naming the business, positioning, trademark advice: `lll:business`; a trademark search needs a professional.
- Social posts, campaigns, ad creative: `lll:marketing`.
- Photo, video or 3D brand assets: out of scope; say so.

## Modes

**Guidance (default).** Brief, concepts, critique and advice in chat. Concept SVGs are drawn in a scratch folder outside the repository, rendered, looked at, and shown (pasted SVG or an image); nothing is written into the project. No subagents. Stop at the concept checkpoint.

**Full.** Only after the owner picks a direction and asks for the kit (or asks for an end-to-end run). Writes the final files into the project's brand folder (`brand/logo/`, or the folder the project already uses): masters, variants, favicon and app-icon sets, test sheet, mini guide. Delivery list and file names: `references/delivery.md`. Subagents are optional; one wide brief for rendering and export chores at most (`../../shared/agents.md`).

## Tasks

| Task | Trigger | Read |
|---|---|---|
| design | new logo | `references/brief.md`, `references/mark-types.md`, `references/concepts.md` |
| build | turn a concept into SVG | `references/svg-construction.md`, `references/optical-refinement.md` |
| critique | feedback on an existing logo | `references/critique-redesign.md`, `references/testing.md` |
| redesign | modernise or replace | `references/critique-redesign.md`, then design |
| assets | variants, favicon, app icons | `references/delivery.md`, `references/app-icons.md` |
| present | show concepts, write a guide | `references/presentation-guide.md` |

## Hard rules

1. A logo is an identifier, not an explanation. One idea, sayable in one sentence. A sentence that could describe a competitor's logo is not a concept.
2. Learn before drawing: the exact name spelling, what the business does, who for, three to five adjectives, competitors, constraints. Existing equity (colours, shapes people know) is respected unless the owner says otherwise.
3. Build in black first. Colour comes after the form works. No gradients, shadows or effects to rescue a weak form.
4. Look at your work. Drawing SVG blind is the main source of bad marks. Render and view every iteration.
5. Never trace, imitate or "update" a recognisable existing mark. If it feels familiar and is not the client's, it is someone else's.
6. Finals are vector: text converted to outlines, strokes expanded, no raster, no filters, no scripts.
7. Never claim trademark clearance or font-licence cover. Say which fonts you assumed and that the owner must clear the mark with a professional search.
8. Stop at the concept checkpoint. Show three concepts and a recommendation, then wait. Build the full kit only for the chosen direction. Skip the pause only when the owner says not to check in.
9. Tests are results, not intentions: report what passed, what you changed and what is left for the owner.
10. Write only generic content. Never put another client's names or marks in a deliverable.

## Steps

1. **Learn the project.** Read `../../shared/stack-detect.md` basics, then look for existing logos (`public/`, `assets/`, `brand/`, `*.svg`, app icon sets, `manifest.json`), `DESIGN.md`, README and landing copy. Note the exact name, platforms (web, iOS, Android, desktop), colours already in use.
2. **Brief.** Fill the brief (`references/brief.md`): name, offering, audience, adjectives and anti-adjectives, competitors, constraints, where the mark must work. Fast track: at most five questions in one message, or state assumptions and go. Adjectives are the most valuable input.
3. **Scan the category.** List the clichés (fintech: shields and upward arrows; coffee: beans and steam; AI: sparkles and brains). Treat them as off limits unless you give them a fresh form. Look at competitor marks with the browser tools when allowed, read-only.
4. **Concepts.** Write 8 to 12 one-sentence concepts across at least two mark types (`references/mark-types.md`, `references/concepts.md`). Score them on idea clarity, distinction, simplicity, relevance and small-size strength. Keep the three strongest and most different. Cheap to write, expensive to build: build only three.
5. **Build black-first SVG** for each of the three (`references/svg-construction.md`). Describe the construction in words (primitives, radii, angles, grid unit), then write the SVG. Save each iteration (`a-v1.svg`, `a-v2.svg`).
6. **Check and refine, at least two loops.**
   - `node scripts/svg-check.mjs check a.svg` reports structure, colours, strokes, near-miss angles and centring.
   - `node scripts/svg-check.mjs sheet a.svg -o sheet-a.html` builds a test sheet: size ladder, 16 px and 32 px, one-colour, reversed, backgrounds, squint, mirror, favicon tab, app tile, avatar crop.
   - Open the sheet with a browser tool and look. Fix what fails (`references/testing.md`, `references/optical-refinement.md`). Repeat.
7. **Checkpoint.** Show the three concepts side by side in greyscale at large and small sizes, one line each, a recommendation with one honest risk per concept (`references/presentation-guide.md`). Offer the kit. Wait for the answer. If they want changes, return to step 5.
8. **Kit (Full mode, after approval).** Final geometry and small-size cut; colour (one or two colours, one-colour and reversed versions, `references/colour-type.md`); type and lockups (horizontal, stacked, symbol only, wordmark only); delivery files (`references/delivery.md`); app icons (`references/app-icons.md`); mini guide (`references/presentation-guide.md`). Make black, white and mono copies with `node scripts/svg-check.mjs variants logo.svg`, app-icon canvases with `node scripts/svg-check.mjs icon logo.svg --kind ios -o ios.svg`, and pack favicon sizes with `node scripts/svg-check.mjs ico 16.png 32.png 48.png -o favicon.ico`.
9. **Close out.** Run the final checklist (`references/testing.md`). List open items for the owner: trademark search, font licence, print proofing, colour matching.

## Which mark type, in one table

| Type | Choose when | Watch out |
|---|---|---|
| Wordmark | distinctive name, mostly seen in text | weak at 16 px; needs a compact companion |
| Lettermark / monogram | long name, initials known or short | generic unless the letterform is customised |
| Pictorial symbol | a simple, ownable object fits the idea | literalness, clichés |
| Abstract mark | broad or intangible offering | needs meaning built over time |
| Emblem / badge | heritage, craft, institutions | fine detail dies when small |
| Combination | most new brands; symbol plus wordmark in lockups | must work apart as well as together |
| Dynamic / system | many touchpoints or products | needs a rigid core; not for tiny brands |

Reasoning and decision guide: `references/mark-types.md`.

## Output

- **Guidance:** brief and assumptions, three concepts (rendered image or pasted SVG, one line each), recommendation, test results so far, open items. Nothing written into the repository.
- **Full:** folder of final files with a manifest, the test sheet, the mini guide, real output of `svg-check` for each master, and the list of what the owner must still do.
- Say what was not run: no render, no device test, no print proof, no trademark search.
- Next steps: two to four bullets (pick a direction, run a trademark search, apply the mark in the site and app with `lll:ui`, set brand colours with `lll:design-system`).
