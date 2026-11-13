# Slop: the tells of generated UI, and what to do instead

"Slop" is UI that could belong to any product. The test: would a good studio ship this for this specific brief? Could someone guess the look from the product category alone? Each tell below is legitimate when the brief or the brand system asks for it; as a default it means no decision was made.

Method: name the tell, name the element, give the replacement. Do not rewrite a pinned brand look because of this list.

## 1. Structure

| Tell | Why it fails | Instead |
|---|---|---|
| Three-up feature grid: icon in a coloured circle, bold title, two lines, repeated | Equal weight for unequal content; the most recognisable generated layout | Lead with the one strongest benefit, shown as the real product; give unequal content unequal space |
| Cards as the container for everything; cards inside cards | Boxes replace hierarchy | Spacing, alignment and type for grouping; a card only when the object is acted on |
| Hero left, screenshot right, two buttons | First template every generator reaches for | Open with the most characteristic thing in the subject's world: the product working, a real artefact, a specific claim |
| Cookie-cutter rhythm: hero, 3 features, testimonials, pricing, CTA, all equal height | No pacing, no story | Order by the visitor's objections; vary section scale |
| Everything centred | No reading edge, no hierarchy | Left-align text; centre only a short single block |
| Dashboard of identical KPI tiles | Number theatre | Show the few figures the person acts on, with trend and context, and the work area |
| Every secondary action in a modal | Interrupts without need | Inline, side panel, popover or a new page |
| Carousel with no narrative | Hidden content, low engagement | Show the content, or a static comparison |
| Logo marquee that scrolls | Motion for its own sake | Still row of real customers, or cut |

## 2. Surface

| Tell | Instead |
|---|---|
| Gradient text; gradient primary buttons; purple-to-blue washes | One solid colour from the palette; emphasis by weight or size |
| Glow, halo, spotlight behind the hero; neon edges on dark | Offset plus soft shadows for depth; flat is fine |
| Blobs, waves, floating circles, grid-paper backgrounds | Better content, a real image, or empty space |
| One large radius and one soft grey shadow on every element | A radius scale tied to role; shadows only where something floats |
| Coloured left border on cards and alerts | A tinted background, an icon or a label to signal state |
| Frosted glass panels as the default surface | One translucent layer only where it explains depth (floating chrome) |
| Hard offset block shadows outside a brutalist brief | Real elevation or none |
| Sparklines, rings and fake avatars filling space | Real data or an honest empty state |
| Stock-photo hero or grey placeholder box | Product screenshot, real photography, or nothing |
| Generated SVG doodles and mascots | Commissioned or licensed art direction, or none |
| A component kit at its defaults (stock shadcn/ui greys, radius, Inter, card) | Theme radius, type, colour and density to the project's tokens |
| Several copy-in effects (Magic UI, Aceternity and the like) on one page | One standout per page, themed to tokens, with a reduced-motion variant (`libraries.md`) |

## 3. Type and colour

| Tell | Instead |
|---|---|
| Default sans (Inter, Roboto, system) as the display voice of a brand page | A deliberate face with a stated reason; system fonts are fine for app UI |
| One accented word in a headline (italic, colour) | Let the whole heading carry weight |
| ALL-CAPS tracked eyebrow above every heading; icon tile above every heading; pill chip above the hero | Delete the label; the heading is enough |
| Numbered section labels (01 / 02 / 03) | Only when the content is a real sequence |
| Mono font as a costume for "technical" | Mono for code, data and measurement only |
| Cream background, high-contrast serif, terracotta accent | Fine if the brief asked; otherwise derive colour from the subject's world |
| Near-black with one neon accent | Same; choose from the use scene (who, where, what light) |
| Light or dark picked by category ("dark because dev tool") | Pick from the use scene |
| Display type past 6 rem on a non-poster page | Scale by the grid, not by volume |

## 4. Content and copy

| Tell | Instead |
|---|---|
| "Welcome to X", "Unlock the power of", "Your all-in-one solution", "Built for the way you work" | A specific claim: what it does for whom |
| "Seamless", "effortless", "supercharge", "streamline", "revolutionise" | Say what happens |
| Three big stats with tiny labels ("10k+ users", "99.9%") | Real, sourced figures, or leave out |
| Testimonial row with avatars, stars and quotes nobody said | Named people with checkable claims, or cut |
| "Get Started" / "Learn More" as the only CTAs | Verb plus outcome: "Start free trial", "See a sample report" |
| Emoji as icons or bullets | A drawn icon set in one weight |
| Short. Punchy. Fragments. Every sentence a slogan. | Write like a person explaining something |
| Placeholder names and round numbers (John Doe, Acme, 1,000+, 99.99%) | Realistic, varied sample data |
| Lorem ipsum or invented claims | Real copy or a marked slot |

## 5. Behaviour

| Tell | Instead |
|---|---|
| Only the happy path designed | Loading, empty, error, offline, long content |
| Same fade-and-slide-up on every section; hover lift on every card | One authored motion moment; motion that answers an action |
| Bounce and overshoot everywhere | Critically damped by default |
| Toasts for errors that need action | Inline message with the action |
| Hand-built toasts, drawers, command menus or number tickers | The specialist library (`libraries.md`); they carry stacking, swipe, focus and reduced-motion details |
| Disabled buttons with no explanation | Explain, or enable with validation |
| Placeholder-as-label, hover-only affordances | Visible labels; visible controls |
| Hamburger on phone hiding the main destinations | Visible primary navigation |

## 5b. Instant fails

Any one of these is a finding on sight, brief or no brief:
- Text over an image or gradient with no measured contrast.
- A primary action that is not visually the primary action, or two that compete.
- A control with no visible label or accessible name.
- Lorem ipsum, placeholder names or invented metrics shipped.
- Content hidden until a scroll animation fires, with nothing visible without it.
- Horizontal scroll at 320 px; text that cannot scale; a layout that breaks at 200 percent zoom.
- A destructive action with no confirmation or undo.
- `outline: none` and no replacement focus style.
- A spinner or skeleton that never resolves into an error.

## 6. Judgement calls

- **Brief wins.** A pinned brand, era, material, font or palette overrides this list, even when it matches a tell. Mention the tradeoff once, then build it.
- **Refinement preserves; redesign replaces.** When polishing, keep the existing identity and fix execution. Do not smuggle in a new look. If the concept itself is wrong, say so and propose a redesign separately.
- **Spend boldness in one place.** One memorable move (a hero treatment, a type choice, a motion) with everything else quiet. Before finishing, remove one accessory.
- **Calibrate against the category.** If a competitor's page could swap in with only the name changed, you have not found the product's own voice. A deliberate alternative to the obvious is better than the obvious or its mirror image.
- **Litmus questions.** Brand unmistakable on the first screen? One strong visual anchor? Understandable by scanning headings alone? Each section one job? Are the cards necessary? Does motion improve hierarchy? Still premium with every decorative shadow removed?
