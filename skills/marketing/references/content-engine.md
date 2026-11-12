# Content engine

A repeatable way to produce a week of content from real material, then spread it across channels without pasting the same text everywhere.

## 1. Pillars

Pick three to five. Each answers one question the audience already has.

| Pillar | What it does | Typical share of the week |
|---|---|---|
| Teach | Solves a small problem with no purchase needed | 35 to 40% |
| Prove | Results, demos, before and after, customer stories | 25% |
| Show | The product in use, behind the scenes, how it is made | 15 to 20% |
| Story | Founder or customer moment, a mistake, a decision | 10 to 15% |
| Offer | How to start, price, a real deadline | 10% |

Shares are a starting point. After four weeks keep the pillars whose posts earn replies, saves and clicks, and cut the rest.

## 2. Sources of real content

Posts built on real material beat posts built on prompts. Mine these in order:

1. Support chats and emails: every repeated question is a post.
2. Sales and onboarding calls: the exact words buyers use. Quote their phrases in hooks.
3. Release notes and commits: each shipped change is a "what changed and why you care" post (read from the repo, never invent).
4. Product numbers the owner approves: usage, time saved, counts, with the date.
5. Founder knowledge: ask ten questions and record the answers.
   - What did you believe a year ago that you no longer believe?
   - What is the most common mistake your customers make?
   - What does a good week for your customer look like?
   - What would you tell a friend starting in this field?
   - What is the dumbest thing that cost you money?
6. Screenshots, screen recordings and raw demos: the cheapest proof there is.

Keep an idea bank (a plain file) with the source, the date and the pillar. Aim for 20 ideas banked before planning a month.

## 3. The repeat chain

One pillar piece a week, then cut it down.

```
Pillar piece (60 to 120 s video, or 600 to 900 word post, or newsletter)
  -> 2 to 3 short clips (Reels, Shorts), each with its own hook
  -> 1 carousel or image post (the steps or the numbers)
  -> 2 text posts (LinkedIn, X): the claim, then the proof
  -> 1 WhatsApp broadcast or status: one line and one link
  -> 1 email or newsletter section
  -> 1 FAQ answer for the pinned or highlight slot
```

Rules:
- Each derived piece gets a new hook and a new first line. Do not shorten the original and repost it.
- The derived pieces point back to one tracked link.
- Record which cut performed best; the next pillar piece starts with that format.

## 4. Cadence a solo owner can keep

| Level | Pillar pieces | Posts per week on the main channel | Time |
|---|---|---|---|
| Minimum | 1 | 3 | 3 to 4 hours |
| Steady | 1 | 4 to 5 | 6 hours |
| Push | 2 | 7 | 10 hours, only for a launch |

Choose the minimum if unsure. Missing a posted day costs more trust than posting less often. Batch: one day to script and shoot, one short session to edit and schedule drafts, ten minutes a day to reply.

## 5. Calendar template

One row per piece. Keep it in `docs/marketing/` as a table or a CSV.

| Date | Channel | Pillar | Format | Hook | CTA | Link (UTM) | Asset | Owner | Status | Result |
|---|---|---|---|---|---|---|---|---|---|---|

Status values: idea, scripted, shot, edited, approved, posted. "Approved" means the owner saw the exact final copy.

## 6. Hook formulas

Use these to generate variants, then pick the one that is true and specific.

| Formula | Example shape |
|---|---|
| Number plus outcome | "11 missed bookings a month. Here is how one salon got it to 3." |
| Mistake | "The mistake that cost me 40 hours a month." |
| Contrarian | "You do not need a website to start selling." |
| Question the audience asks | "Why do my customers say yes and never pay?" |
| Before and after | "Same shop, same stock. Only the billing changed." |
| Quote their words | "'I forget half my udhaar.' Fixed in 5 minutes." |
| Secret cost | "What a missed reminder really costs a clinic." |
| Show the result first | Open on the finished screen, then rewind |
| Rule of the trade | "Three things every tuition teacher forgets to track." |

Weak openers to cut: greetings, "As a founder", "Did you know", "In today's fast-paced world", any sentence that could start any post.

## 7. Long-form pieces (articles, newsletters, founder posts)

For articles meant to rank in search, use `lll:seo`. For thought-leadership, newsletters and founder essays:

1. **Thesis.** One sentence the reader could disagree with. If nobody could disagree, it is a topic, not a thesis.
2. **Reader.** One person and what they do after reading.
3. **Outline.** Hook, the problem as the reader lives it, the claim, three proof points (story, number, example), what to do next. One idea per section.
4. **Evidence.** Each number has a source and a date. Quote real customers only with permission.
5. **Draft fast, then cut 20%.** Delete throat-clearing, hedges and repeated points.
6. **Headline.** Write ten, keep the one that is specific and true. Make a short version for each channel.
7. **Finish.** `anthropic-skills:humanizer`, then `../scripts/postcheck.mjs` for length where a platform limit applies.

Newsletter shape: one idea, one story, one action, one link. Under 500 words unless the audience asks for more.

## 8. Crossposting rules

| From | To | Change |
|---|---|---|
| Reel or Short | The other short-video platform | Remove platform watermarks, re-export, rewrite the caption and the hook text |
| Reel or Short | LinkedIn | Post as native video with a written first line about the lesson, not the visuals |
| LinkedIn post | X | Cut to the claim and one proof; a thread only if each post stands alone |
| X thread | LinkedIn | Merge into one post, keep line breaks, move links to the first comment or end |
| Any post | WhatsApp | One line, one link, plain text, first name basis; send to opted-in contacts only |
| Video | Newsletter | Add the part you left out of the video |

Never post identical text on two channels within the same hour. Stagger by at least a day for the same audience. Do not tag people who did not ask to be tagged.

## 9. Weekly review (15 minutes)

1. List the top three and bottom three pieces by the goal metric (clicks or sign-ups), then by saves or replies.
2. For each: what was the hook, the format, the length, the post time, the pillar?
3. Write one rule to keep and one to stop.
4. Fill next week's calendar with two repeats of the winning pattern and one new test.

If a pattern repeats for three weeks, make it a series with a name.
