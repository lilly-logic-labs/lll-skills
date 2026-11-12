---
name: marketing
description: "Plan and write marketing: positioning, channels, content calendar, posts for Instagram, LinkedIn, X, Shorts and WhatsApp, reel scripts, campaigns, launches, email, Meta and Google ads. India-aware. Use when asked for a marketing plan, what to post, captions, a launch campaign or brand voice. Not for SEO (lll:seo), tracking (lll:analytics), pricing (lll:pricing) or go-to-market (lll:business)."
metadata:
  origin: lll
---

# Marketing

Turns a product and a goal into a plan, content, campaign or ad setup the owner can run this week. Every claim comes from the repo or the owner, and nothing is posted, sent or paid for without the owner.

## When to use

- "Marketing plan", "how do we get our first 100 users", "where should we market", "what should we post this week".
- Captions, hooks, reel or Shorts scripts, carousels, LinkedIn or X posts, a WhatsApp broadcast or channel update.
- A content calendar, content pillars, repurposing one piece into many, a newsletter or founder article.
- A launch or festival campaign, an email sequence, a referral push.
- Meta or Google ads setup, budget, creative tests, kill rules.
- A brand voice guide, or checking copy against the voice.
- Outreach to prospects and leads (not investors).

## When not to use

- Rankings, keywords, schema, technical SEO, AI-search visibility, comparison pages: `lll:seo`.
- Events, consent banners, dashboards, reading the numbers: `lll:analytics`. This skill picks the metric and the UTM names; `lll:analytics` builds the tracking.
- What to charge, plans, discounts: `lll:pricing`.
- Market size, competitors, investors: `lll:business`.
- Logo, colours, type: `lll:logo`, `lll:design-system`. Landing page build: `lll:ui`.
- Reading a competitor's accounts, a video or a thread: `lll:research`.
- Anything that changes app code or a live ad account: not here; hand over a written spec.

## Modes

- **Guidance** (default): answer inline. A post, a set of hooks, a channel choice, a critique of copy, an ads setup walk-through. Write no files, start no subagents.
- **Full**: only when the user asks for a plan, a calendar, a campaign brief or an end-to-end run. Write the document to `docs/marketing/<YYYY-MM-DD>-<topic>.md` (or where the project keeps marketing docs). Subagents only if the user asks; follow `../../shared/agents.md`.

Both modes follow `../../shared/ground-rules.md`. Marketing-specific limits:

- Draft only. Do not publish, schedule, send, DM or spend. If the owner then asks you to post or send, show the exact final copy and the exact destination first and wait for a yes.
- Do not paste repo content, customer data or lead lists into a third-party scheduler, CRM or AI tool unless the owner approves that tool and that data.
- Personal data of leads and customers stays out of the repo and the report. Describe its shape.

## Steps

1. **Ground in the project.** Read `CLAUDE.md`, `AGENTS.md`, `README`, `PRODUCT.md`, `docs/marketing/`, `marketing/`, `docs/business/`, brand and voice files (`BRAND.md`, `docs/brand*`, `company/brand/`), the pricing page, store listing text, past posts and their results. Facts (features, prices, numbers, names) come only from there or from the owner. Project rules on voice, banned claims and AI-content disclosure win over this skill. Check the code folders before promoting a feature: never market something as shipped that is not.
2. **Write the brief in five lines.** Audience (one specific person, not a category), their problem in their own words, the offer and price, the proof you can show today, the goal as a number with a date. Ask the owner for missing lines in one batch of at most five questions. If they cannot answer, write the assumption down and go on.
3. **Route the job.**

   | Job | Read |
   |---|---|
   | Plan, positioning, budget, calendar skeleton, KPIs | `references/plan-template.md` |
   | Pillars, weekly content, repurposing, long-form, crossposting | `references/content-engine.md` |
   | One platform: Instagram, LinkedIn, X, Shorts, WhatsApp, Facebook, community; reel scripts and hooks | `references/channels-and-formats.md` |
   | Campaign, launch, festival push, email sequences, referral | `references/campaigns-and-launches.md` |
   | Paid ads on Meta or Google, tracking, budgets, kill rules | `references/ads-basics.md` |
   | Voice guide, or copy that does not sound like the brand | `references/brand-voice.md` |
   | Prospects, outreach, lead scoring, follow-up | `references/leads-and-outreach.md` |
   | India audience, languages, festivals, UPI, WhatsApp, rules | `references/india-notes.md` |

   A full plan uses plan-template first, then the references its channels point to.
4. **Pick few channels.** At most two primary channels: where the audience already is and where the owner can keep the cadence for 90 days. A third channel waits until the first two hit their target. Everything else is repurposed output, not a new workstream.
5. **Draft.** Rules for every piece:
   - One audience, one promise, one call to action.
   - The first line earns the second: a specific number, a named situation or a clear claim. No greeting, no scene-setting, no "in today's world".
   - Native to the platform: length, format and hook differ per channel. Never paste one text everywhere.
   - Specific over general: a before and after, a rupee or minute figure, a real example from a customer or the product.
   - The call to action names one next step and costs the reader one action.
   - Give 2 or 3 variants of the hook and the CTA when the owner will choose.
6. **Claims and compliance gate.** Check every claim before handing over.

   | Claim type | Needs before it ships |
   |---|---|
   | A number (users, savings, growth, speed) | Source file, query or dashboard and a date; round down |
   | Comparison ("cheaper than X", "unlike X") | The rival's current public page, dated; like for like |
   | Testimonial or review | Written permission, real name or initials, meaning unchanged |
   | "Best", "No. 1", "fastest", "guaranteed" | Substantiation, else drop it |
   | Money, health, legal outcomes | Qualified sign-off; no promised returns or cures; required disclaimers |
   | "Free", "no cost" | Conditions and auto-renewal terms visible in the same piece |
   | Scarcity or a deadline | Must be real and enforced |
   | Paid, gifted or affiliate content | Disclosed upfront, in the platform's own label |
   | "Secure", "private", "bank-grade" | Matches real controls; no absolutes; ask `lll:security` when unsure |
   | AI-made faces, voices, testimonials | Never as a real customer; label where the platform or the law requires |

   Regional rules (ads code, data protection, messaging consent) are in `references/india-notes.md`. They change: verify current text, and say it is not legal advice.
7. **Check length, then humanize.** Run `node scripts/postcheck.mjs <platform> <file>` for character limits, hashtag count, fold preview and stock AI phrases (it accepts stdin; `--selftest` checks the script). Then pass the final copy through `anthropic-skills:humanizer`, keeping the owner's voice and facts untouched.
8. **Set the measurement.** For each campaign or content series write: one primary metric, the leading signal, the UTM names (lowercase, one scheme: `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`), the review date and the decision rule ("after 14 days, keep if X, change the hook if Y, stop if Z"). Hand event and dashboard work to `lll:analytics`.
9. **Hand over a publish-ready pack.** For each piece: final copy, asset notes (what to shoot, show or design), alt text, posting day and time with the reason, tracked link, first-hour reply plan. The owner posts. Visuals: `lll:design-system` for the look, `anthropic-skills:pptx` or `dataviz` for carousels and charts.

## Quality bar

Before handing over, confirm each line or fix it:

- [ ] The audience is a person with a situation, and the piece speaks to them in their words.
- [ ] Every number, comparison and testimonial passed the gate in step 6.
- [ ] Nothing promotes a feature that is not live, a price that is not current or a date that is not fixed.
- [ ] One CTA, one tracked link, one metric.
- [ ] Hooks differ across the variants, not just in wording.
- [ ] Length checked with `scripts/postcheck.mjs`; no stock AI phrases left.
- [ ] Regional and platform rules checked; disclosures present.
- [ ] Assumptions are listed, each with the cheapest test.

## Output

- **Guidance:** the copy or recommendation in chat, then a short list: assumptions, what to measure, next action.
- **Full:** `docs/marketing/<YYYY-MM-DD>-<topic>.md` with these sections: Brief, Positioning, Channels and budget, Calendar, Copy pack, Measurement, Risks and claims log, Assumptions and tests, Not covered. Placement follows `../../shared/report.md` (dated name, `-2` if taken); the body is this skill's own outline because there are no findings. Chat gets a five-line summary, the path and the first three actions.
- Always say what was skipped, assumed or unverified, one line each.
