# Competitor and alternative analysis

Turns "who else is there" into decisions: where to position, which features matter, what to say to a buyer comparing options.

## 1. Classify

| Class | Definition | Why it matters |
|---|---|---|
| Direct | Same job, same buyer | Sets the reference product and price |
| Indirect | Different product, same budget or same job done differently | Competes for the same money |
| Status quo | Spreadsheet, notebook, WhatsApp, a person, doing nothing | Usually the biggest competitor |
| Potential entrant | A large player that could add the feature | Defines the risk to your wedge |
| Substitute from another category | Bank app, marketplace, platform feature | Gives the job away free |

Find them from the repo's earlier research, then search (web, app stores, review sites, directories, "alternatives to X" pages, communities). Do not stop at names you remember; companies in fast markets start and die every quarter.

## 2. Collect per competitor (dated, cited)

| Field | Source |
|---|---|
| Positioning line, target segment | Their home page, store listing |
| Product scope and key features | Docs, help centre, changelog, demos |
| Pricing and limits | Pricing page (method in `lll:pricing`) |
| Distribution | Channels, partners, app stores, sales motion |
| Traction signals | Installs, ratings count, funding, team size, customer logos shown (public only) |
| Strengths and weaknesses | Reviews, forum threads, your own test of the product with a normal sign-up |
| Recent moves | Launches, funding, acquisitions, shutdowns, price changes, leadership changes, with dates |
| Platform stack and integrations | When platform choice matters (see section 5) |

For many pages, reviews or videos, use `lll:research` or `anthropic-skills:deep-research`. Do not use a logged-in account you do not own, scrape personal data, or sign up as a customer to get a quote without the owner's say-so.

## 3. Feature matrix and gap labels

Rows are capabilities in the customer's words; columns are you and four to six competitors. Cell values: yes, partial, no, unknown (never guess). Then label each gap:

| Label | Meaning | Action |
|---|---|---|
| Table stakes | Most competitors have it and buyers expect it | Build or buy; do not market it as a feature |
| Differentiator | Few have it, buyers ask for it | Candidate for the core message and roadmap |
| Not for us | Conflicts with a product principle, a law, or the target segment | Say which principle; the owner can still choose |
| Not wanted | Rivals have it, buyers do not use it | Skip |

Rank candidate features with RICE:

```
Score = (Reach x Impact x Confidence) / Effort
Reach: customers per quarter     Impact: 0.25, 0.5, 1, 2, 3
Confidence: 50%, 80%, 100%        Effort: person-weeks (estimate from the code)
```

Estimate effort from the repo: a feature that reuses existing modules costs less than one that needs a new platform integration. Present the top three to five with a one-line reason each. They are candidates; turning them into a plan is `lll:plan`.

## 4. Sentiment mining

1. Take 50 to 100 recent reviews per main competitor across stars.
2. Tag each: complaint (reliability, price, missing feature, support, trust, performance), praise, wish.
3. Count tags; keep two short quotes per top tag with links and dates.
4. Separate "what they cannot do" from "what they do badly". The second is cheaper to beat.
5. The one- to three-star reviews show unmet needs; the five-star reviews show what to protect.

## 5. Platform and vendor comparisons

When the question is "which platform, tool or vendor should we build on or buy":

1. List must-have requirements from the repo and the owner, each tied to a reason.
2. Score candidates 0 to 3 on each requirement with a source.
3. Add non-feature criteria: price at your expected scale, lock-in and export, support, security posture, regional availability and compliance, stability and momentum (release cadence, funding, community), team skills.
4. Run a time-boxed proof of concept on the top two for the riskiest requirement.
5. Record the decision, the runners-up and what would reverse it (decision memo format).

## 6. Positioning

- Positioning map: choose two axes that buyers actually trade off (price vs depth, self-serve vs managed, local vs global, simple vs configurable). Plot you and rivals. Look for an empty, valued corner.
- One-sentence positioning: for whom, what problem, why you instead of the named alternative, proved by what.
- Messaging against the status quo comes first; against a rival only where buyers already compare.
- Do not position on a feature that is table stakes.

## 7. Battlecard (one page per main rival)

```
Rival: ...   Class: ...   Updated: <date>
Their pitch in one line:
Where they win:
Where we win:
Landmines to set (questions that favour us):
Landmines to defuse (questions that favour them):
Price comparison (normalised):
Proof we can show:
Objections and answers:
```

## 8. Competitive report structure

```
1. Answer: recommended position and the one move to make
2. Landscape: classes, count, a map or table
3. Comparison: feature matrix, price table, gap labels
4. Customer voice: sentiment findings with quotes
5. Rival profiles: five or fewer, with recent moves
6. Positioning options and recommendation
7. Risks: entrants, copying, platform changes
8. Next steps: tests, features (RICE), messages
9. Sources and dates
10. Not covered
```

## 9. Watch for

- A rival's marketing claims are claims, not capabilities: test the product or find user evidence.
- Missing or hidden pricing is data (enterprise-only, or unstable).
- Survivorship: look at the failed and the acquired.
- Do not disparage a competitor in public material; compare facts with dates.
