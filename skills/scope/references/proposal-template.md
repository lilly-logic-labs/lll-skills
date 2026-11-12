# Proposal template (client-facing)

File: `proposal.md` in the scope folder. This is the only document the client sees. It holds no internal rates, margins, risk padding or review notes. Figures come from the rate card and the script; each one is traceable (see the checklist at the end).

Tone: plain and specific, short sentences, the client's own words for their business, no hype, no jargon without a gloss. Say what happens, who does it, by when, and what it costs. Promise only what we control.

```markdown
# Proposal: <what we will build, in the client's words>

Prepared for: <client company and contact>      Prepared by: <our company, project lead>
Date: <YYYY-MM-DD>      Valid until: <date from the rate card's validity rule>
Currency and tax: <INR, excluding GST | USD, excluding tax> (as the rate card states)

## 1. Summary
Three to five sentences: the problem in your words, what we will deliver, the main result you can expect, the total price and the target launch date.

| | |
|---|---|
| Total price | <amount> (<fixed | estimated, capped at amount>) |
| Start (after advance) | <date> |
| Target launch | <date>, assuming the client dates in section 6 |
| Support after launch | <bug window length>, then <care plan option> |

## 2. What we will deliver
For each deliverable:

### 2.1 <Deliverable name>
- What it is: one or two sentences.
- You can: bullets in the user's terms.
- Accepted when: checkable criteria ("a visitor can pay by card and receive an email receipt; tested on the latest two versions of Chrome, Safari and the Android and iOS browsers").
- Milestone: M<n>. Price: <amount>.

## 3. What is not included
Explicit list. Include the plausible things a client would assume are included: content writing, photography, translation beyond the listed languages, ongoing ads or SEO work, data entry, third-party fees, features that appear only in the "optional" list.

## 4. Optional extras
Priced separately, not in the total: <item>, <price>, <effect on date>.

## 5. Milestones, dates and payments
| Milestone | What you get | Target date | Payment due |
|---|---|---|---|
| M1 | | | |
Payment terms as the contract states them: <split, due dates, late payment>. Invoices are sent from <our invoice process>.

## 6. What we need from you
| What | By when | Why it matters |
|---|---|---|
| One named person who approves work | before kickoff | <approval rule from the playbook or contract> |
| Content, images, logos | <date> | later delivery moves the launch date by the same number of days |
| Access to <accounts, systems> | <date> | |
| Feedback on each stage | within <n> working days | <review and silence rule from the playbook or contract> |

## 7. Assumptions
Numbered, each checkable: "The payment provider issues sandbox keys within 5 working days of the advance." "Content is supplied as final text and images." "No more than <n> product variants per item." If an assumption turns out false, the scope, price or date changes through a change request.

## 8. Changes and revisions
- Revisions: <definition of a revision round, free rounds per item, price of extra rounds: from the rate card or playbook>.
- Change requests: <what counts as one, and the rule that it gets a written price and date before work starts: from the playbook or contract>.
- Both are confirmed in writing.

## 9. After launch
- Bug window: <length and what it covers, from the playbook or owner>. Say what is not a bug (new changes).
- Care plan options: <names, what each covers, price, minimum term, from the rate card>.

## 10. Ownership, accounts and data
State each point in the wording of the playbook or contract; do not improvise legal terms.
- Whose name the domain, hosting, store, analytics and payment accounts are in, who pays, and how access is shared.
- When the client owns the delivered work (usually on final payment), and what the vendor keeps (reusable tools) and licenses back.
- How client data is handled and whether third-party AI tools may touch it.
- What the client receives at the end: a handover pack (`lll:handover`) covering how to run, build and deploy, accounts and access, backups, known issues.

## 11. Risks we have planned for
Only risks the client should know about, each with what we do: "Provider approval can take longer than planned. We apply on day 1; if approval slips past <date>, the launch moves by the same days."

## 12. Next steps
1. Reply to confirm scope and price. 2. We send the contract and the advance invoice. 3. Work starts when both are done. 4. We email the milestone plan within <n> working days.

Accepted by: <name, role>      Date: <date>
```

## Writing the deliverables

| Weak | Strong |
|---|---|
| "User accounts" | "A person can sign up with email, verify it, sign in, reset a forgotten password and delete their account." |
| "Admin dashboard" | "Staff with the admin role can list, search, edit and deactivate customers and export the list as CSV." |
| "Fast website" | "The home page loads in under 2.5 seconds on a mid-range phone on 4G, measured with <tool> on <date>." (only if we can control it) |
| "SEO" | "Titles, descriptions, sitemap, redirects and structured data are set up for the 12 listed pages. We do not promise rankings." |

## Checklist before it leaves (owner reviews)

1. Every number is traceable: rate card (file and date), the script's output, or the owner's words. The total equals the sum of the lines (`node scripts/estimate.mjs`).
2. No internal rate, cost, margin, contingency or risk register line appears.
3. Every deliverable has acceptance criteria and a milestone. Out of scope and optional lists exist.
4. Every assumption is checkable and has an owner; open questions are listed in the chat summary, not hidden in the text.
5. Dates are stated relative to the advance and the client's inputs, and the third-party lead times are in them.
6. Payment, revision, change, delay and ownership wording matches the playbook or the contract. Legal text is the lawyer's template, only referenced.
7. No promise about rankings, followers, sales, store approval dates or third-party uptime.
8. Currency and tax are stated. "From" prices are not shown as fixed prices.
9. A person other than the author read it cold and could explain the scope in a minute.
10. The owner approved it. Nothing has been sent.

Offer `anthropic-skills:humanizer` for the prose pass and `anthropic-skills:docx` or `anthropic-skills:pdf` to produce the file.
