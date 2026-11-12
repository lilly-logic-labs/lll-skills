# Brainstorm question bank

Use with step 3 of `SKILL.md`. Questions are a territory to cover, never a script to read out.

## Ground to cover

| Area | What to learn | A question that works |
|---|---|---|
| Kind of thing | New product, feature, integration, rewrite, fix | "Is this a new capability or a change to something people already use?" |
| Why now | The pain or trigger | "What happened last time this went wrong?" |
| Who | Who uses it, who pays, who maintains it | "Walk me through the last person who hit this." |
| Success | Observable result, how it is measured | "In a month, what would you check to know it worked?" |
| Goals | The outcomes that matter, ranked | "If it could only do one of these well, which?" |
| Non-goals | Things it will not do | "What is tempting to add that you do not want?" |
| Anti-goals | What makes it a failure even if it works | "What would make you wince if I got it wrong?" |
| Constraints | Deadline, budget, platform, compliance, team skills | "Anything this must run on or must not touch?" |
| Current state | What exists, what was tried | "What do people do today, even badly?" |
| Prior art | Products or code the user liked or hated | "What have you seen elsewhere that got this right?" |
| How it gets made | Platform, language, libraries, build vs buy | "Do you want a say in the stack, or should I pick and tell you why?" |

When the repo already answers a row, skip it and state the answer as your reading.

## Question shapes

- Open, for unknown intent: one sentence, anchored in a moment or a picture. No menu.
- Closed, for a discrete choice: 2 to 4 options, recommended first with "(Recommended)" and one reason. Offer a short menu when the user is stuck.
- Guess to correct: "I am guessing this is because X keeps biting you. Right?"
- Stuck user ("just guess", "what do you think?"): propose something concrete and ask what is wrong with it.

Avoid: process jargon, questions with three example answers attached, asking for something you could grep, a second question in the same message.

## Playback

Every three answers, write 200 to 300 words: what it is for, who it serves, how one part behaves. Mark guesses as "my guess". Check whether the part is something the user will look at (a screen, page, report): if so, show a sketch or mockup next to the text (`lll:ui` for UI work). End with "what is wrong or missing?".

## Escape hatch

User says "just do it", is impatient, or has a fully formed plan with evidence:
1. Ask the one or two highest-value remaining questions at most, once.
2. State the how-it-gets-made choices in one line.
3. Still run the premise check and the approaches comparison (steps 4 and 5) in compressed form. A fully formed plan skips the interview, not the challenge.

## Premise check (use in step 4)

1. Is this the right problem? Could a different framing give a simpler or bigger result?
2. What happens if nothing is done? Real pain, or hypothetical?
3. What already partly solves it in this repo (helpers, patterns, config, a dependency)?
4. If the output is a new artifact (CLI, library, app, container, mobile build): how will users get it? Release channel, CI, store, versioning. Defer explicitly if deferred.
5. Which assumptions are unverified? List each as "assumed, not checked".

State the premises as numbered statements and ask agree or disagree for each. A disagreement reopens the interview for that point only.

## Product-demand check (only when the idea is a new product)

Four questions, one at a time. Push once for a specific answer. A named person, a number or a past event beats an adjective.
1. What evidence is there that someone wants this: paying, switching, complaining, building a workaround? Interest and waitlist signups are not demand.
2. What do they do today, and what does that workaround cost in time or money?
3. Who exactly needs it most, and what happens to them if it does not exist?
4. What is the smallest version someone would pay for this week?

Anything beyond this (market size, positioning, fundraising, competitors) goes to `lll:business`.

## Builder mode (side projects, tools, experiments)

Optimise for something shippable and delightful, not for strategy. Questions: What is the coolest version? Who will you show it to and what makes them say "whoa"? What is the fastest path to something you can use today? What is the closest existing thing and how is yours different? End with concrete build steps, not validation homework.

## Red flags in the user's answers

- "Everyone needs this": no one in particular does. Ask for one named user.
- "We need the whole platform first": the value is unclear. Ask for the one thing someone would pay for this week.
- "It should be seamless/modern/intuitive": undefined. Ask which step loses people and how that is measured.
- Requirements that contradict each other: say so, ask which wins.
