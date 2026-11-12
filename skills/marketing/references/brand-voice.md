# Brand voice

A voice guide lets any writer (or any model) produce copy that sounds like the brand and lets a reviewer say "no" with a reason. Build it from real writing, not from adjectives.

## 1. Build from evidence

1. **Collect 10 to 20 real samples** the owner is proud of: posts, emails, replies to customers, a landing page, a founder note. Prefer writing by the owner or the best support person. If the repo has voice rules (`BRAND.md`, `docs/brand*`, `company/brand/`), start from them; they win.
2. **Read for patterns.** For each sample note: sentence length, first-person or "we", questions vs statements, humour, jargon, how numbers appear, how it ends, what it never says.
3. **Place it on four sliders** (mark a point, then add one example line for each):

   | Slider | One end | Other end |
   |---|---|---|
   | Formality | Casual, spoken | Formal, precise |
   | Energy | Calm, steady | Excited, punchy |
   | Directness | Gentle, explaining | Blunt, instructing |
   | Warmth | Professional distance | Friend-like |

4. **List the vocabulary.** Words and phrases the brand uses, words it avoids, how it names the product, the customer and the problem (use the customer's own words).
5. **Write the guide** (template below), then test it: have someone write a new post from the guide only and ask the owner "is this us?". Fix the guide until the answer is yes without edits.

## 2. Voice guide template

```
# <Brand> voice
One line: We sound like <a person>, talking to <audience>, about <topic>.

Sliders: formality _/5, energy _/5, directness _/5, warmth _/5

Do
- <rule + one real example>
- ...
Do not
- <rule + one real example>

Words we use:      ...
Words we avoid:    ...
Names:             product = ..., customer = ..., problem = ...
Numbers:           how we write money, dates, percentages, units
Language mix:      English only | Hinglish | regional language + English; script rules
Emoji and punctuation: ...
Examples:
  Before (off-voice): ...
  After (on-voice):   ...
Claims we never make: (link to the compliance gate in SKILL.md step 6)
```

## 3. Checking copy against the voice

Mark each draft line as on-voice, off-voice or neutral. For each off-voice line, quote it and say which rule it breaks. Then fix only those lines; do not rewrite what is fine. Stop when no line breaks a rule.

Typical drift to look for:
- Feature talk where the customer's problem should lead.
- Corporate stock phrases ("seamless", "robust", "leverage", "empower", "unlock", "game-changer", "cutting-edge", "in today's fast-paced world").
- Three-item lists and neat symmetrical contrasts ("not just X, but Y") in every paragraph.
- Em dashes, rhetorical questions and exclamation marks at a rate the owner never uses.
- Promises with no proof, praise with no example.

Run the final text through `anthropic-skills:humanizer`, then re-check the facts: a rewrite must not change a number or a claim.

## 4. Language and script notes (India and multilingual audiences)

- Decide the language per channel and audience, not per brand. A tier-2 audience may take Hindi or the state language on WhatsApp and English on LinkedIn.
- **Hinglish** (Hindi in Roman script mixed with English) is natural in casual posts, reels and chats. Keep one spelling convention (for example "kya", "nahi", "hai") and do not mix scripts inside one sentence.
- **Native script** (Devanagari, Tamil, Telugu, Bengali and others): have a native reader check the copy; machine translation reads stiff and misses idiom. Check rendering on a low-end phone and in the platform's font.
- Numbers: Indian digit grouping (1,00,000; lakh and crore) for local audiences; international grouping for global. Currency symbol before the number, consistently.
- Honorifics and form of address (aap or tum, "ji") are part of the voice; pick one and keep it.
- Subtitles in the spoken language, and a second subtitle track when the audience is mixed.
- Respect festivals and regional sensitivities; ask a local reader to check humour.

## 5. Keeping the guide alive

- Store it where the repo's docs live (`docs/marketing/voice.md` or the brand folder) so every session reads it.
- Review after 90 days or when the audience or product changes. Add the new "Before and after" pairs from real edits the owner made.
- Visual identity (logo, colour, type) is not voice: `lll:design-system`, `lll:logo`.
