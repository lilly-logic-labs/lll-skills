# Paid ads basics (Meta and Google)

Ads buy reach for a message that already works organically. Setting up the account, budget and creative is covered here. Spending is the owner's act: prepare the structure, the copy and the numbers; do not create campaigns, change budgets or enter payment details unless the owner asks for that exact step and approves it.

## 1. Preconditions (do not spend before these)

- [ ] The landing page loads in under 3 seconds on a mid-range phone and states the offer above the fold. Page quality: `lll:ui`, `lll:launch`.
- [ ] The conversion is tracked end to end: click, landing, sign-up or purchase. Tracking: `lll:analytics`.
- [ ] Consent is handled where the law requires it before tags fire.
- [ ] A follow-up exists: welcome email or WhatsApp reply, within minutes.
- [ ] The organic version of the message got a response (saves, replies, clicks). Ads multiply a message, they do not fix it.
- [ ] A kill rule is written.

## 2. Choosing the platform

| Situation | Start with |
|---|---|
| People already search for the solution | Google Search |
| People do not know they need it; visual product; local business | Meta (Instagram and Facebook) |
| Local lead who prefers chat | Meta click-to-WhatsApp ads |
| B2B, narrow job titles, high deal value | LinkedIn ads (costly per click; only when one customer pays for hundreds of clicks) |
| Mobile app installs | Meta app promotion, Google App campaigns, with a tested store page |
| Brand-new category with a demo video | YouTube |

One platform at a time until it produces a result at an acceptable cost.

## 3. Meta (Instagram and Facebook)

**Structure.** One campaign per objective, one ad set per audience, 3 to 5 ads (creatives) per ad set.

**Objective.** Pick the one that matches the result you want counted.

| You want | Objective |
|---|---|
| Messages or calls | Engagement or Leads with a messaging destination (WhatsApp, Messenger, Instagram) |
| Form leads | Leads (instant form, with a clear promise and a phone verification step) |
| Sign-ups or sales on your site | Sales or Leads, with the pixel and server-side events set up and the event verified |
| App installs | App promotion |
| Awareness only | Awareness (rarely right for a small budget) |

**Audience.** Start broad inside the country and language, age range of the buyer, and let the creative do the targeting. Add narrow interests only for a clear niche. Exclude existing customers. Build lookalikes from at least a few hundred real customers or high-quality leads, not from page likes.

**Budget.** Enough for the algorithm to learn: roughly the cost of 50 target events a week per ad set. If the cost per result is 400 rupees, that is about 20,000 rupees a week per ad set; a smaller budget needs a cheaper event (a click or a message) or fewer ad sets. Do not change the budget more than 20 to 30% at once or edit ads in the learning phase for no reason.

**Creative.**
- Vertical video 9:16 for Reels and Stories placements, 4:5 for the feed. 15 to 30 seconds. Hook in the first second.
- Test one variable at a time: hook, then offer, then format. 3 variants of the hook first.
- Text on image under about a fifth of the frame; subtitles on video.
- Primary text: first line carries the point (check with `../scripts/postcheck.mjs meta-primary`), headline under about 40 characters, a clear button.
- Use real people and real screens. Stock images and AI faces lower trust.

**Placements.** Automatic is a fine start; look at placement reports after enough spend and cut obvious waste.

**Special ad categories.** Credit, financial products, employment, housing, social issues and similar topics need a declaration and restrict targeting in some regions. Read the policy before creating.

## 4. Google

**Search campaign.**
- Structure: one campaign per goal, ad groups by intent theme (5 to 15 tightly related keywords each).
- Match types: start with phrase and exact; use broad only with strong conversion tracking and smart bidding.
- Negative keywords: add from day one ("free", "jobs", "course", "download", competitor names you do not want) and prune weekly using the search terms report.
- Responsive search ad: up to 15 headlines (30 characters each) and 4 descriptions (90 characters each). Put the keyword in 2 or 3 headlines, a number in one, the CTA in one, a differentiator in one. Check with `../scripts/postcheck.mjs google-headline`.
- Landing page must match the ad promise and the keyword.
- Bidding: begin with maximise clicks or maximise conversions with a cap, switch to a target cost per action after 30 conversions.

**Performance Max and Demand Gen.** Only after Search works and conversion data exists. They need asset groups (images, videos, headlines) and good conversion values; they hide where spend went, so set brand exclusions and watch for brand-search cannibalisation.

**YouTube.** Skippable in-stream or Shorts ads with the same hook rules as organic. Judge by view rate and cost per action, not views.

**Financial services and similar sensitive topics.** Some regions, including India for financial products, require advertiser verification before ads run. Check Google's current policy.

## 5. Tracking

- UTM every link: `utm_source` (meta, google), `utm_medium` (cpc, paid_social), `utm_campaign` (one name per campaign), `utm_content` (creative id), `utm_term` (keyword if used). Lowercase, no spaces, one written scheme.
- Browser pixel plus server-side events (Meta Conversions API, Google enhanced conversions) improve match rates as browsers restrict cookies. Send a stable event id to de-duplicate.
- Define one conversion event per campaign. Count the sign-up or purchase, not the page view.
- For WhatsApp ads, the "conversion" is a started chat; count qualified chats in a sheet, and mark sales back so you learn the real cost per customer.
- Compare platform numbers with your own database weekly. Platform dashboards over-credit themselves.

## 6. Metrics and what they mean

| Metric | Formula | Use |
|---|---|---|
| CPM | spend / impressions x 1000 | Auction price of attention |
| CTR | clicks / impressions | Hook and relevance |
| CPC | spend / clicks | Traffic cost |
| Landing conversion | conversions / clicks | The page and offer |
| CPA | spend / conversions | The number that decides |
| ROAS | revenue / spend | Only when revenue is tracked |
| Payback | CPA / gross profit per month | Months to earn back the spend (unit economics in `lll:pricing`) |

Diagnose in this order: low CTR means the hook; good CTR with low landing conversion means the page or the offer; good conversion with high CPA means the audience or the price.

## 7. Kill and scale rules

- Give each ad enough exposure to judge: at least 1,000 impressions or about 2 to 3 times the target CPA in spend, whichever is larger.
- Kill an ad with CPA over 2 times the target after that spend, or CTR far below the account average.
- Scale a winner by 20 to 30% every few days, or duplicate it into a new ad set. Do not double overnight.
- Refresh creative every 2 to 4 weeks, or when frequency passes about 3 to 4 for the same audience.
- Pause everything and look if CPA doubles for a day with no change on your side: check tracking, page speed, payment, stock.

## 8. India notes

- WhatsApp click-to-chat ads and Instagram are the strongest low-cost starts for local services.
- Creative and copy in the buyer's language (Hindi, Tamil, Telugu, Bengali, Marathi, Kannada, Malayalam, Gujarati and others) often beats English by a wide margin outside the metros; test it. Native-script text is easy to mis-render; check on a low-end Android phone.
- Offer UPI and cash on delivery when relevant; show the final price including GST for consumers.
- Many users are on slow data: short videos, small landing pages.
- Advertising rules (ASCI code, consumer protection, finance and health claims): see the India notes in the routing table of SKILL.md.

## 9. Ads plan to hand over

```
Goal and conversion event:
Daily budget and 14-day cap:
Platform, objective, optimisation event:
Audience (include and exclude):
Ads: 3 hooks x 1 offer, with exact copy, creative notes and tracked links
Landing page and tracking checks done: yes/no each
Review dates: day 3 (delivery only), day 7, day 14
Kill rule / scale rule:
Owner actions (account, billing, verification):
```
