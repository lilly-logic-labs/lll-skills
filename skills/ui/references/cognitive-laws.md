# Cognitive-load laws, applied

Use these as questions to ask of a design, not as slogans. Each has a use, a way it gets abused, and a quick test. Cite the law only when it explains a specific finding.

| Law | What it says | Apply as | Misuse | Test |
|---|---|---|---|---|
| **Jakob's law** | People expect your product to work like the others they use most. | Conventions are the floor: logo top-left, search as a magnifier, back where back goes. | Copying a competitor's flaws; refusing all novelty. | Would a first-time user need a tutorial for the navigation? |
| **Hick's law** | Decision time grows with the number and complexity of choices. | Fewer choices at the critical moment (checkout, onboarding, pricing); group; highlight a default. | Hiding capability power users need. | Count visible options at each decision point; more than about 5 to 7 competing actions is a smell. |
| **Fitts's law** | Time to hit a target grows with distance and shrinks with size. | Large targets for frequent or critical actions; place near where attention already is; use screen edges and corners on desktop. | Giant buttons for rare actions; tiny close boxes next to destructive ones. | Can a thumb reach the primary action on the largest phone? |
| **Miller's law (chunking)** | Working memory holds a handful of items. | Chunk long strings (card numbers, codes) and group lists; do not demand memory across screens. | Treating "7 plus or minus 2" as a menu-size rule. | Does the user have to remember something from the last screen? |
| **Progressive disclosure** | Show what is needed now; reveal depth on demand. | "Advanced", expandable sections, wizards, details on tap. | Hiding things people need often, so users hunt. | Is the common 80 percent visible and the rare 20 percent one step away? |
| **Tesler's law** | Complexity cannot be removed, only moved. | The system should carry what it can (tax, time zones, conversions, defaults). | Moving all the complexity to settings. | If people keep a spreadsheet or copy-paste workaround, the complexity sits in the wrong place. |
| **Doherty threshold** | Responses under about 400 ms keep people in flow. | Respond immediately (optimistic UI, skeletons, instant press feedback). | Fake speed that lies about success. | Does a tap show an effect within 100 ms? |
| **Peak-end rule** | People judge an experience by its peak and its end. | Make the finish (success, receipt, handoff) clear and kind; fix the worst moment first. | Delight confetti after a painful flow. | What is the last screen and what is the worst moment? |
| **Zeigarnik / goal gradient** | People want to finish started things; effort rises near the goal. | Progress indicators, resume points, "2 of 3 done". | Fake progress, dark-pattern streaks. | Does the progress show real remaining work? |
| **Law of proximity and similarity** | Near or alike items are seen as a group. | Spacing and consistent styling express structure. | Dividers everywhere instead of spacing. | Cover all borders: does grouping still read? |
| **Aesthetic-usability effect** | Attractive interfaces feel easier. | Polish builds trust and patience. | Polish used to hide a broken flow. | Does it still work when ugly? |
| **Postel's law** | Be liberal in what you accept. | Accept phone numbers with spaces and dashes; trim whitespace; parse dates in several formats. | Accepting ambiguity in money or legal fields. | Does any valid input get rejected for formatting? |
| **Serial position effect** | First and last items in a list are remembered. | Put key items first and last in menus and tab bars. | Burying the primary destination in the middle. | Where is the most important item? |

## Behaviour facts to design with

- People scan, they do not read. Billboards at 60 mph: strong headings, short lines, bold key terms.
- People satisfice: they take the first reasonable option. The right choice must be the most visible choice.
- People muddle through: they do not learn the "right" way once something works. Do not rely on them discovering a better path.
- People do not read instructions. Guidance must be brief, timely and unavoidable, or it will not be seen.
- Clicks do not matter; thinking does. Three obvious clicks beat one ambiguous one.
- Clarity beats consistency. If a small inconsistency makes something clearly clearer, take the clarity.
- Mobile is the same rules with higher stakes: no hover, small targets, interrupted attention.

## Goodwill reservoir

Each person starts with a limited amount of patience. Friction drains it; kindness refills it.

- Drains: hiding information they want (price, contact, delivery), forced tours and interstitials, rejecting input over formatting, asking for data you do not need, sloppy visuals, ambiguous choices.
- Refills: obvious top tasks, specific error recovery, being upfront about costs and limits, saved steps (defaults, autofill, deep links), a clear apology when you fail.
- In a flow review, narrate it first person ("I tap Sign up... a modal asks for my phone number... I don't know why") and note each drain and refill.

## Using the laws in a review

1. Walk the main flow as a first-time user. Write down every moment of hesitation.
2. Match each hesitation to a law or behaviour fact. If none fits, it may be a taste note, not a finding.
3. Fix by removal first (fewer choices, fewer fields, fewer words), then by reordering, then by adding guidance.
