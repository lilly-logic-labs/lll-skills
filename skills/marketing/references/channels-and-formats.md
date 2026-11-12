# Channels and formats

Platform limits and ranking behaviour change every few months. Treat the numbers below as the last known values, confirm anything that matters in the platform's own help page, and use `node scripts/postcheck.mjs <platform> <file>` for counts (its limit table is at the top of the script; update it when a limit changes).

## Quick map

| Channel | Best for | Main formats | Cadence (solo) | Link policy |
|---|---|---|---|---|
| Instagram | Consumers, local business, visual products, creators | Reels, carousels, Stories | 3 Reels and 1 carousel a week | Link in bio or Story link; caption links are not clickable |
| LinkedIn | B2B, hiring, professionals, founders | Text posts, document carousels, native video, newsletter | 3 a week | Put the link in the last line or the first comment; test both |
| X | Developers, news, build-in-public, fast conversation | Short posts, threads, replies | Daily replies, 1 to 2 posts a day | Links reduce reach for some accounts; give the value in the post |
| YouTube Shorts | Discovery by search and recommendation, how-to | Vertical video up to 3 minutes | 3 a week | Pin a comment with the link; put the link in the description |
| WhatsApp | Local, repeat, high-trust customers; India-first audiences | Broadcast list, Channel, Status, click-to-chat, business API templates | 1 to 2 broadcasts a week | Plain link; consent first |
| Facebook and Threads | Groups, communities, older and tier-2 and tier-3 audiences | Groups, Reels reposts, text | 2 a week | Group rules decide |
| Community (Reddit, Discord, forums, Telegram) | Niche problems, developer tools | Answers, tutorials, show-and-tell | When asked or when useful | Follow the rules; never post an ad as a post |

## Instagram

- **Reels** (the reach engine). Vertical 9:16, 15 to 45 seconds for most products. Open on the result or the problem in the first second with on-screen text, because many people watch muted. Captions burned in. End with one action.
- **Carousels** (saves and shares). One idea per slide, 6 to 10 slides, slide 1 is the hook, the last slide is the action. Large text, phone-readable.
- **Stories** (warm audience). Polls, question boxes, behind the scenes, link stickers. Use to reach people who already follow.
- **Caption.** First line is the hook (it shows before "more"). Up to 2,200 characters. Use 3 to 5 relevant hashtags or none; keyword phrases in the caption and on-screen text help search. Check the hashtag rule before posting.
- **Profile.** One line on who it is for and what they get, one link, a pinned post that explains the offer.
- **Do not:** reuse a watermarked clip from another app, post a wall of hashtags, or promise results in the caption that the video does not show.

## LinkedIn

- **Text post.** About 150 to 250 words. The first two lines show before "see more" (around 200 characters), so the hook must work there. One line per idea, white space between, no hashtag block (up to 3 at the end).
- **Document carousel.** A PDF of 6 to 12 slides. Good for frameworks, checklists, teardown posts. Build with `anthropic-skills:pptx` or `anthropic-skills:pdf`.
- **Native video.** 30 to 90 seconds, subtitles.
- **Personal profile beats company page** for reach. The owner posts as a person; the company page reposts.
- **Comments are half the work.** Reply to every comment in the first hour and comment on five relevant posts a day with substance.
- **Do not:** "I am humbled to announce", engagement bait ("agree?"), tag-farming, fake stories.

## X

- **Post.** 280 characters on a free account; links count as 23 characters. One idea per post. Lead with the claim.
- **Thread.** 5 to 9 posts. Post 1 states the payoff, each post stands alone, the last post asks for one action. Never number "1/" if the first post cannot win without it.
- **Replies and quote posts** drive growth for small accounts more than original posts.
- **Build in public.** Numbers, screenshots and mistakes from the repo and the dashboard (with owner approval) outperform opinions.
- **Do not:** reply-guy spam, link-only posts, hashtag stacks.

## YouTube Shorts

- Vertical, up to 3 minutes; 20 to 40 seconds retains best for most how-to content.
- Title up to 100 characters, written for search ("How to remind clients on WhatsApp automatically"), not for clicks.
- First frame is the payoff or the problem. Loop the ending into the opening line when natural.
- Description: one sentence, tracked link, 2 or 3 keywords. Playlists group a series.
- Longer YouTube videos are a pillar piece, not a Short.

## WhatsApp

- **Consent first.** Message only people who opted in (a form, a QR, a chat they started). Marketing broadcasts to people who did not opt in get numbers blocked and accounts banned.
- **Surfaces.**
  - *Status*: daily proof and offers, no opt-in needed for viewers who saved your number.
  - *Channel*: one-way updates, public and discoverable; good for a brand audience.
  - *Broadcast list*: recipients must have your number saved; open rates are high, so keep it rare and useful.
  - *Click-to-chat link* (`wa.me/<number>?text=<prefilled>`): put it on every ad, post and QR. Pre-fill the message with the source ("Hi, I saw your Reel about reminders").
  - *Business API with templates*: needed for bulk or automated messages beyond the 24-hour customer window. Categories (marketing, utility, authentication, service) are priced and approved differently; check the current rules and pricing.
- **Message style.** One idea, 2 to 4 short lines, first name if known, one link or one reply instruction, a way to opt out. Under about 500 characters; templates have stricter limits (use the checker).
- **Cadence.** At most one marketing message a week to the same person, unless they asked for more.
- **Reply fast.** A reply within minutes closes more than any copy. Save quick replies for common questions.

## Facebook, Threads and communities

- Facebook Groups and local pages still carry tier-2 and tier-3 audiences in India. Post video natively, answer in comments, join before you post.
- Threads rewards conversation: short opinions and questions.
- Reddit, Discord, Telegram, forums: read the rules, give a complete answer first, mention the product only where it truly answers the question and say you built it. If the community bans promotion, do not post.

## Reel and Short scripts

### Beat sheet (30 seconds)

| Seconds | Beat | What the viewer sees and hears |
|---|---|---|
| 0 to 2 | Hook | On-screen text plus one spoken line: the problem or the result |
| 2 to 8 | Tension | The cost of the problem, with a number or a relatable moment |
| 8 to 22 | Payoff | Show the fix on screen in 2 to 4 steps, one cut per step |
| 22 to 28 | Proof | A result, a count or a real reaction |
| 28 to 30 | Action | One instruction: "Comment REMIND and I will send the link" or "Link in bio" |

### Script template

```
Title (working): 
Audience:           
Hook (spoken):      
Hook (on-screen):   
Shots:              1. ...  2. ...  3. ...
Voice-over:         (read aloud, count words: about 2.5 words a second)
Proof element:      
CTA:                
Caption (first line is the hook):
Tracked link:       
Why this will work: (one line)
```

### Example (fictional product, 30 seconds)

- Hook: "Your client said yes on Monday. By Friday they forgot." On-screen: "No-shows cost a salon 6,000 a month."
- Tension: a diary page with three crossed-out names.
- Payoff: open the app, pick the booking, tap the reminder, a WhatsApp message appears on the client's phone.
- Proof: "This salon went from 1 no-show in 5 to 1 in 12 in six weeks." (only if the owner confirms the count and permission)
- CTA: "Comment REMIND for the free trial link."

### Hook variants to give the owner

Offer three, each a different formula from the hook table in the content engine: a number, a mistake and a before-and-after. Do not give three rewordings of one hook.

## Formats by goal

| Goal | Best formats |
|---|---|
| Reach new people | Reels or Shorts with a clear hook; creator collaboration; community answers |
| Build trust | Demo, customer story, teardown, "how it works" carousel |
| Get sign-ups | One offer, one link, a fixed deadline that is real, a direct message trigger |
| Keep existing users | WhatsApp or email tips, release notes, referral asks |
| Hire or raise | LinkedIn founder posts, build-in-public updates |

## Accessibility and brand safety

- Captions on video, alt text on images, high contrast text, no information only in audio.
- Do not use music, clips or images you do not have rights to. Use platform-licensed audio only for the account type allowed.
- Check any person in a clip has agreed to appear.
