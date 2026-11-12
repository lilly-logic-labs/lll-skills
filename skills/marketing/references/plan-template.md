# Marketing plan template

Use for "marketing plan", "go-to-market for marketing", "how do we get users". Fill every block from the repo and the owner; mark gaps as assumptions. A plan is short: if it runs past four pages, nobody runs it.

## 1. Inputs to collect

| Input | Source | If missing |
|---|---|---|
| Product in one line, what is live today | README, `PRODUCT.md`, code folders | Ask; never promote unbuilt features |
| Who pays and who uses (can differ) | `docs/business/`, pricing page | Ask; write as assumption |
| Price and offer | Pricing page, store listing | Ask; do not invent |
| Proof available now (numbers, testimonials, demos, screenshots) | Repo, owner | Plan to collect it first |
| Goal: number and date | Owner | Propose one, mark as assumption |
| Budget: money per month and owner hours per week | Owner | Plan for zero money and 5 hours |
| What was tried and the result | Past posts, ad accounts, notes | Say "no history" |

## 2. Positioning worksheet

Answer in this order. Each answer is one or two lines.

1. **Alternatives.** What does the buyer do today if your product did not exist? Include "nothing", a spreadsheet, a notebook, WhatsApp groups, an agency, a rival app.
2. **Unique attributes.** What do you have that those alternatives lack? Features, price, speed, language, support, trust.
3. **Value.** What does each attribute let the buyer do or avoid? State it as an outcome with a number where possible (minutes saved, rupees recovered, calls avoided).
4. **Best-fit customer.** Who cares most about that value, today? Name a segment small enough to find in one place (a WhatsApp community, a trade association, a subreddit, a street market).
5. **Frame.** The category that makes the value obvious ("a billing app for salons", not "a platform").

Write the result as one sentence and test it with the owner:

> For **[segment]** who **[problem in their words]**, **[product]** is a **[frame]** that **[main outcome]**. Unlike **[main alternative]**, it **[differentiator]**, shown by **[proof]**.

Check: could a competitor sign this sentence? If yes, it is too generic. Could the buyer repeat it to a friend? If no, shorten it.

## 3. Messaging pillars

Three at most. Each pillar is a claim, the proof, and the doubt it removes.

| Pillar | Claim | Proof now | Objection it answers |
|---|---|---|---|

Every post, ad and email maps to one pillar. A piece that maps to none is cut.

## 4. Channel choice

Score each candidate channel 1 to 5 on the five columns, add them, take the top two.

| Channel | Audience is there | Format fits the product | Cost to start | Owner can sustain | Time to first signal |
|---|---|---|---|---|---|

Rules of thumb:
- Local or trade-based buyers: WhatsApp (broadcast lists, status, channel, click-to-chat), Instagram, YouTube.
- Professionals and B2B: LinkedIn, email, communities, direct outreach.
- Developers: X, GitHub, Hacker News and Reddit (give value, do not advertise), docs and demos.
- Consumers who must see it work: short video (Reels, Shorts), creators.
- Search intent already exists: `lll:seo` first, ads second.

Per-channel detail: the channels and formats reference (routing table in SKILL.md).

## 5. Budget

Time is the first budget. Count owner hours per week, then money.

| Line | Share of money (small budget) | Notes |
|---|---|---|
| Main channel (proven or best guess) | 60 to 70% | Paid reach or creator fees or tools |
| Test channel | 20 to 25% | Fixed for 4 weeks, then keep or kill |
| Production (design, editing, voice) | 10% | Reuse assets across channels |
| Reserve | 5 to 10% | For a festival, a viral post, a fix |

Rules: no test below the spend needed to read a result (for ads, read the ads reference first); never spend on reach before the landing page and the follow-up exist; keep the cost per result and payback in view (`lll:pricing` for unit economics).

## 6. Calendar skeleton (4 weeks)

| Week | Theme | Pieces | Goal |
|---|---|---|---|
| 1 | Problem and who it is for | 3 posts, 1 pillar piece | Reach and profile visits |
| 2 | Proof: demo, before and after, customer story | 3 posts, 1 pillar piece | Trust and clicks |
| 3 | Offer: how to start, price, limited bonus if real | 3 posts, 1 email or broadcast | Sign-ups |
| 4 | Objections, FAQ, results so far | 3 posts, 1 pillar piece | Conversions and referrals |

Calendar columns and the weekly loop are in the content engine reference.

## 7. KPI tree

Pick one goal metric. Under it, two leading signals you can read weekly.

```
Goal: 100 paying customers by 31 March
  Sign-ups per week (lagging)         <- from tracked links
    Link clicks per post (leading)    <- UTM per piece
    Profile visits (leading)
  Sign-up to paid rate (conversion)   <- product analytics
```

Vanity numbers (likes, followers) are context, not the goal. Tracking build: `lll:analytics`.

## 8. Risks and kill rules

| Risk | Signal | Action |
|---|---|---|
| Message does not land | Reach fine, clicks under 0.5% | Change hook, then promise, then audience, in that order |
| Landing page leaks | Clicks fine, sign-up rate low | Fix page before more reach |
| Owner burnout | Missed two posting days in a row | Cut cadence by a third, not the channel |
| Claim risk | Reviewer or platform flag | Pull the piece, log it, tighten the gate |

State a kill rule for every channel: "if after 4 weeks and X spend there are fewer than Y sign-ups, stop and move the budget".

## 9. Worked example (fictional)

Product: a booking and reminder app for single-chair salons. Goal: 60 paying salons in 90 days. Budget: 15,000 rupees per month, 6 hours per week.

- Alternatives: paper diary, WhatsApp chats, a free calendar app.
- Value: fewer no-shows. Proof available: one pilot salon cut missed bookings from about 1 in 5 to 1 in 12 over six weeks (pilot owner's own count; ask permission to quote).
- Segment: women-owned home salons in two cities, reachable through local WhatsApp groups and Instagram.
- Positioning: "For one-chair salons tired of missed bookings, [product] is a booking app that texts your clients a reminder on WhatsApp. Unlike a paper diary it never forgets, shown by one pilot salon's six-week count."
- Channels: Instagram Reels (demo and before and after) and WhatsApp (broadcast list for leads, status for daily proof).
- Budget: 9,000 rupees to boosting the two best Reels, 3,500 to a creator trade, 1,500 to editing, 1,000 reserve.
- Pillars: no-shows cost money (number), it works on the phone you have (demo), others like you use it (stories).
- Kill rule: if fewer than 15 trial sign-ups after 4 weeks, rewrite the hook and repeat once, then change the segment.
- Measure: UTM per Reel, trial sign-ups per week, trial to paid rate, reviewed each Monday.

## 10. Plan file skeleton (full mode)

```
# Marketing plan: <product> (<date>)
## Brief            five lines, assumptions marked
## Positioning      worksheet answers and the one sentence
## Pillars          table
## Channels         scores, the two chosen, the ones deferred and why
## Budget           money and hours
## Calendar         4 weeks, link to the calendar file if separate
## Measurement      goal, leading signals, UTM scheme, review day, decision rules
## Risks            table with kill rules
## Assumptions      each with the cheapest test and the date to check
## Not covered      what was skipped and why
```
