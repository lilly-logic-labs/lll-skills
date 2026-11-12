# Campaigns, launches and email

Use for a product launch, a feature announcement, a festival or seasonal push, a referral drive, or an email sequence.

## 1. Campaign brief

One page. Nothing starts without the first six lines.

```
Campaign:        <name>
Objective:       <one number and date, e.g. 300 trial sign-ups by 20 Nov>
Audience:        <one segment, where they are>
Offer:           <what they get, price, any real deadline>
Single message:  <one sentence>
Proof:           <what we can show today>
Channels:        <max two primary, rest repurposed>
Assets needed:   <list with owner and date>
Timeline:        <dates, see phases below>
Budget:          <money and hours>
Tracking:        <UTM names, event, dashboard>
Approvals:       <who signs copy and claims>
Risks:           <claims, capacity, support load>
Decision rule:   <what we do on day 3, day 7, day 14>
```

Before launch, confirm the product can take the load: sign-up works, payment works, the welcome message sends, support has an answer ready. Ask `lll:launch` for the pre-launch and day 0/1/7/14 checks of the site, email and DNS.

## 2. Launch phases

| Phase | When | Purpose | Pieces |
|---|---|---|---|
| Seed | T minus 14 to 8 | Build a waiting list of real people | Problem posts, a form or WhatsApp opt-in, 5 to 10 personal invites |
| Tease | T minus 7 to 2 | Make the date and the outcome known | Behind the scenes, demo clip, early-access offer to the list |
| Announce | T day | One clear event | Founder post, email, WhatsApp broadcast, Reel, community post where allowed |
| Prove | T plus 1 to 7 | Turn interest into trust | First users' results, screenshots (with permission), answers to the top 5 questions |
| Close | T plus 7 to 14 | Convert the undecided | Deadline that is real, FAQ, a last call, a thank you |
| Learn | T plus 14 to 21 | Keep what worked | Review against the decision rule, write the post-mortem |

Launch-day plan, hour by hour: who posts what at what time, who replies to comments, who watches sign-up and errors, who answers messages. The owner should not also be the only one fixing bugs.

## 3. Festival and seasonal campaigns

- Start planning three weeks ahead; production and approvals are the delay, not the posting.
- Tie the offer to a real need of the season (stocking up, gifting, travelling, exams, tax filing, new accounting year), not just a greeting.
- One festival post of goodwill is fine; do not attach a discount that cannot be sustained or reversed.
- Do not use religious imagery in a way the community may find disrespectful. Have someone from the community read it.
- Festival dates and the seasonal calendar: the India notes (routing table in SKILL.md).

## 4. Email sequences

Each email has one job, one link, one subject line and a plain-text version. From name is a person. Send from a domain with SPF, DKIM and DMARC set (`lll:launch` checks this; `lll:cloudflare` covers Cloudflare email setup).

### Welcome (3 emails over 5 days)

| Day | Job | Subject idea | CTA |
|---|---|---|---|
| 0 | Confirm, set expectation, give the first win | "You are in. Do this first (2 minutes)" | One setup step |
| 2 | Show the feature that causes retention | "The setting most people miss" | Try it |
| 5 | Social proof and an easy reply | "How [named customer type] uses this" | Reply with a question |

### Launch (5 emails over 8 days)

1. Announcement: what it is, who it is for, the offer.
2. Proof: demo or customer result.
3. Objection: top question and the honest answer.
4. Deadline: only if real.
5. Last call, short.

### Trial or onboarding

Trigger emails by behaviour, not by date alone: no setup after 24 hours, first value reached, trial ends in 3 days, trial ended. Each says what the user can do now and how to get help.

### Win-back

After 30 to 60 days of silence: one email with what is new and one with a direct question ("What stopped you?"). Then stop; remove non-openers after 90 days.

### Rules

- Subject under about 50 characters, preview text 40 to 90 characters; check with `../scripts/postcheck.mjs email-subject`.
- Plain, one column, one primary button, mobile first.
- Consent and unsubscribe in every marketing email; honour opt-outs at once. The India notes (routing table in SKILL.md) list the rules that apply.
- Measure: delivered, opened (unreliable), clicked, replied, converted. Judge by clicks and conversions, not opens.
- A/B test one thing at a time (subject or CTA), only with enough volume; otherwise just ship the better guess.

## 5. Referral and community mechanics

- Ask at the moment of success ("You just saved 3 hours. Know someone who needs this?").
- Reward both sides with something that costs you little and the user values (extra month, credit, feature), and put a clear cap on it.
- Give a unique link or code and track it as `utm_medium=referral`.
- Check the incentive against the platform and local rules for promotions and contests (a "lucky draw" has legal rules in many places).
- Watch for abuse: self-referrals, fake accounts. Pay out after the referred user is active, not at sign-up.

## 6. Post-mortem template

```
Campaign:           
Goal vs actual:     number, number
Spend:              money and hours
What worked:        top 3 pieces and why (hook, format, timing)
What did not:       bottom 3 and why
Surprises:          
Claims log:         anything flagged, how it was resolved
Keep, stop, change: one line each
Next test:          one hypothesis, one metric, one date
```
