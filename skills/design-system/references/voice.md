# Brand voice and interface language

Voice is how the product sounds; tone is how that voice flexes by moment. Define it in a few lines people can apply, then show examples.

## 1. Discover the voice

Inputs: the brief's adjectives and anti-adjectives, existing copy (landing page, emails, app strings, support replies), how the founders actually talk, and the audience's own vocabulary (support tickets, reviews, forum posts).

Ask: if the product were a person at a desk, how would they greet a customer, explain a fee, and apologise for an outage? Write those three sentences. The voice is in them.

## 2. Voice pillars

Three pillars, each a pair "we are X, not Y", each with a line of example:

```
Plain, not simple-minded: "Your invoice is overdue by 4 days." not "Oops! Looks like something slipped!"
Warm, not chatty: "Thanks, we've got it." not "Woohoo, you're all set!!!"
Exact, not hedging: "Sync fails on files over 2 GB." not "Some large files may sometimes have issues."
```

Each pillar has a limit: what we never do ("no exclamation marks in errors", "no jokes about money or health").

## 3. Tone by moment

| Moment | Tone | Rule |
|---|---|---|
| Onboarding | encouraging, brief | one idea per screen; the next step is obvious |
| Everyday actions | quiet, neutral | confirm in a few words |
| Success | warm, proportionate | match the weight of the action |
| Errors | calm, helpful | what happened, what to do; never blame |
| Waiting | honest | say what is happening and roughly how long |
| Destructive or financial | serious, precise | no humour; name the object and the consequence |
| Empty states | inviting | one next action |
| Marketing | confident, specific | claims you can prove |
| Support and email | personal | a person's name, plain words |

## 4. Writing rules for the interface

- Name things by what the person understands; avoid internal terms.
- Buttons: verb plus object, sentence case ("Save changes", "Send invoice"). One name per action across the product.
- Active voice, short sentences, plain verbs. Cut filler and happy talk.
- Numbers: specific and locale-formatted. Dates: relative with exact on hover.
- Errors: what happened, why if useful, what next. No codes in the headline.
- No buzzwords (seamless, effortless, supercharge, streamline, unlock, revolutionise). Say what it does.
- No invented claims, testimonials, statistics or legal text.
- Inclusive language; no idioms that do not translate; leave room for 30 to 40 percent text expansion.
- All strings through the project's i18n; no concatenated sentences; plural rules.

## 5. Terms list

Keep a small glossary in `DESIGN.md`: the product's nouns and verbs with the one approved form and the forbidden synonyms.

| Use | Not |
|---|---|
| Workspace | Account, Org, Team (unless distinct) |
| Archive | Delete (when recoverable) |
| Send | Submit, Dispatch |

## 6. Patterns to define

- Error message pattern and 5 examples (validation, network, permission, not found, server).
- Empty state pattern with 3 examples.
- Confirmation dialog pattern (title = action, body = consequence, buttons = verbs).
- Success toast pattern (past-tense verb that matches the button).
- Loading text ("Saving…", "Syncing 3 of 12").
- Onboarding and permission prompts (why we ask, what you get).
- Email subject and signature conventions.

## 7. Do and don't samples

| Don't | Do |
|---|---|
| "Oops! Something went wrong." | "We couldn't save your changes. Check your connection and try again." |
| "Are you sure?" | "Delete 'Q3 report'? This can't be undone." |
| "Welcome to Fieldnote, your all-in-one solution." | "Log an observation in two taps, even offline." |
| "Click here" | "Download the sample report" |

## 8. Checks

1. Voice described by pillars with limits, not adjectives alone.
2. Examples written for each pillar.
3. Tone mapped to moments, including the serious ones.
4. Terms list exists and is used in UI strings.
5. Nothing invented about the company; ask for facts.
6. For long-form human-sounding copy, `anthropic-skills:humanizer` can remove machine-sounding phrasing.
