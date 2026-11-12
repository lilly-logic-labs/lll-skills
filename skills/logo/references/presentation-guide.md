# Presenting concepts and writing the mini guide

## 1. Present so the right things get judged

- Show the three concepts together, large and small, greyscale first. Colour sparks taste debates before the idea is judged.
- Lead with the idea and the reasoning tied to the brief ("it fits calm and precise because ..."). Name one honest risk per concept.
- Always include a small-size row (64, 32, 16 px) and a one-colour row. Never present only a large mark on white.
- Give one recommendation with reasons. Do not hand over a menu without a view.
- Ask for feedback against the brief ("does it feel calm and precise to you?"), not "do you like it". Collect: keep, change, cut.
- Then stop. Build the kit only for the chosen direction.

How to make the concept image: build the test sheet (`node scripts/svg-check.mjs sheet a.svg -o sheet-a.html`) or a small HTML page with the three marks side by side, open it with a browser tool and screenshot it. When no browser is available, paste the three SVGs inline with the one-line ideas, and say they were not rendered.

## 2. Mockups that matter

Show the mark where it will live, relevant to the business (4 to 6, one consistent style):

| Business | Mockups |
|---|---|
| Café or bakery | cup, paper bag, window sticker, menu header, app icon |
| Software or developer tool | README header, terminal banner, docs site header, favicon in a tab, app icon, dashboard top-left |
| Professional services | letterhead, email signature, card, website header |
| Retail or goods | label, packaging, tag, shopping bag, social avatar |
| Community or non-profit | poster, T-shirt, social post, stamp |

Mockups can be simple HTML/CSS/SVG panels built from the logo files. Keep them honest: no stock photo composites that imply approvals or clients. Never use another company's marks.

## 3. Handling feedback

- Translate taste into variables: "friendlier" means rounder terminals, wider spacing, warmer colour; show one change at a time with before and after.
- If two people disagree, return to the brief's adjectives and the criteria used to score concepts.
- Protect the idea; be flexible on the details. Do not blend concepts into a camel; if elements of two are wanted, check the result still has one idea.
- Keep iterations as numbered files so you can go back.

## 4. The mini guide (one page, `README.md` in the logo folder)

```markdown
# <Brand> logo guide

## The mark
<one sentence idea>. Symbol, wordmark, and the lockups below.
<image or file names for horizontal, stacked, symbol, wordmark>

## Files
| File | Use |
|---|---|
| brand-logo-horizontal-color.svg | default on light surfaces |
| brand-logo-horizontal-white.svg | on dark surfaces and photos |
| brand-symbol-color.svg | app icon, avatar |
| brand-symbol-small.svg | favicon and 16 to 32 px |
| ... | ... |

## Clear space
Keep a margin of <X> (the height of the <element>) on all sides.

## Minimum size
Full logo: 120 px wide on screen, 30 mm in print. Symbol: 16 px (use the small cut below 24 px), 8 mm in print. Tagline lockup: 200 px wide.

## Colour
| Name | HEX | RGB | CMYK (to proof) | Use |
| Brand | #0f7c80 | 15 124 128 | to be proofed | primary |
| Ink | #1b2a41 | ... | ... | text and wordmark |
| Paper | #f7f5f0 | ... | ... | backgrounds |
One-colour versions: black, white. Accessible pairings: <list with ratios>.

## Typography in the wordmark
<family, foundry, licence, customised letters>. The wordmark is outlined artwork; do not retype it.

## Backgrounds
Approved: white, brand paper, brand colour (use white logo), dark ink (use white logo), photos (use white logo on a darkened area or the container version).

## Misuse
Do not: stretch, rotate, recolour outside the palette, add effects, outline, place on low-contrast backgrounds, rebuild the wordmark in another font, crowd the clear space.

## Open items
Trademark search: not done. Font licence: confirm with <foundry>. Print colour proof: pending.
```

## 5. Handover notes

Add to the guide or the pull request description: the rationale in three lines, the test results (what passed and what was adjusted), the list of files produced and not produced, the open items. Link the checker's output for the masters.

## 6. After the logo

- Set brand colours, fonts and tokens with `lll:design-system`, deriving from the logo's colours.
- Apply the mark in the site and app UI with `lll:ui` (header lockup, loading, empty states).
- Update the favicon and head tags per the delivery notes.
- Keep `DESIGN.md` and the guide in sync (`lll:docs`).
- For a PDF version of the guide, use a PDF skill if one is installed; otherwise hand over the Markdown and the SVGs.

## 7. Honesty and limits

- No trademark clearance; recommend a professional search and a reverse image search.
- Font licences must allow logo use; say which fonts were assumed.
- State what was rendered and viewed, and what was not (no print proof, no device test).
- Do not claim that a mark is "unique". Say what was checked.
