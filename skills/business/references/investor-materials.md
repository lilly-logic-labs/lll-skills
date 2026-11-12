# Investor materials

Deck outline, one-pager, memo, financial model checklist and data room list. Every number comes from the repo, a dated source or the owner. Anything else is `TBD`. Never invent traction, customers, quotes, valuations, competitor figures or investor names. Raising money, securities rules and tax are for the owner's lawyer and accountant; flag them, do not advise.

## 1. Before writing

Collect, in this order, and list the gaps:

| Need | Source |
|---|---|
| What the company does, in one sentence a stranger repeats | Owner; product docs |
| Problem, with evidence (interviews, usage, data) | `docs/business/`, forcing-questions read-out |
| Product: what is live, what is next | Code and roadmap (live vs proposed) |
| Customers: names allowed to be shown, counts, revenue | Owner; billing |
| Market: size with sources | Market research report |
| Competition and positioning | Competitor report |
| Business model and pricing | Pricing work |
| Traction: revenue, growth, retention, pilots, waitlist (labelled as waitlist) | Billing, analytics |
| Team: roles, relevant history, gaps | Owner |
| Ask: amount, instrument, use of funds, runway, milestones | Owner |
| Legal: entity, cap table summary, IP, key contracts | Owner and lawyer |

Stage decides emphasis: idea or prototype (team, insight, early proof); early traction (growth, retention, unit economics); scale (efficiency, repeatability, moat).

## 2. Deck outline (10 to 12 slides)

One idea per slide, big headline that states the point, one visual, one proof.

| # | Slide | Answers | Proof to show |
|---|---|---|---|
| 1 | Title | Name, one-line description, contact | Logo, tagline |
| 2 | Problem | Who hurts, how much | A quote, a number, a story |
| 3 | Solution | What you built and why it works | Screenshot or 30-second demo |
| 4 | Why now | What changed | Dated trend, rule or technology shift |
| 5 | Product | How a customer uses it, the narrow wedge | Flow, screens |
| 6 | Traction | Evidence people want it | Chart: revenue, users, retention, pilots (dated) |
| 7 | Market | Size and how you win the first segment | Bottom-up chain with sources |
| 8 | Business model | How you make money, unit economics | Price, margin, CAC payback |
| 9 | Go-to-market | How the next 100 customers come | Channel, early results |
| 10 | Competition | Why you win | Honest matrix or map |
| 11 | Team | Why you | Relevant experience, roles, gaps you are hiring |
| 12 | Ask | Amount, use, milestones, runway | Table: money to milestone |

Appendix: financial model summary, product detail, customer stories, risks.

Rules:
- Slides must stand alone when forwarded without you.
- Charts show the real scale; label axes and dates; no hockey stick without a basis.
- Label waitlists, letters of intent, pilots and revenue differently.
- Say what you do not know; investors respect a clear list of risks with plans.
- Build the file with `anthropic-skills:pptx` or Gamma after the owner approves the text outline. Charts: `dataviz`.

## 3. One-pager

```
<Company>: <one-line description>
Problem (2 lines)          Solution (2 lines)
Traction (3 bullets, dated)         Market (1 line, sourced)
Business model (1 line)             Team (1 line each)
Ask: <amount>, <instrument>, <use>, <milestones>, <runway>
Contact: <name, email>      Link: <site / demo>
```

Fits one page. Produce a PDF with `anthropic-skills:pdf` or a document with `anthropic-skills:docx`.

## 4. Memo (2 to 4 pages)

Sections: Summary (5 lines), Problem, Solution and why it wins, Customer evidence, Market, Business model and economics, Go-to-market, Competition, Team, Financials and plan (12 to 24 months), Risks and mitigations, The ask. Use the same facts as the deck; write in plain sentences; cite sources in footnotes with dates.

## 5. Financial model checklist

- Inputs on one sheet: price, customers, churn, CAC, cost to serve, headcount, salaries, tools, taxes, fundraising date and amount.
- Monthly for 24 months, annual for 5 years only if asked.
- Revenue from customers x price (not top-down percentages of a market).
- Costs: cost to serve scales with customers; hiring is a plan with dates.
- Outputs: revenue, gross margin, burn, runway, break-even month, cash at the end of each quarter.
- Three scenarios (base, low, high) and a sensitivity table (price, churn, CAC).
- Every assumption has a source or a test.
- Reconcile to actuals when they exist; show actuals in a different colour.
- Compute with a script or a spreadsheet (`anthropic-skills:xlsx`) and the `lll:pricing` calculator; do not do the arithmetic in prose.

## 6. Metrics investors ask for

| Stage | Look for |
|---|---|
| Pre-product | Interviews done, named pilots, founder-market fit |
| Early | Paying customers, MRR, growth rate month on month, retention, pilot conversion |
| Growth | ARR, net revenue retention, gross margin, CAC payback, burn multiple |
| Consumer | Daily and weekly actives, retention curves (day 1, 7, 30), share paying, ARPU, referral share |
| Marketplace | GMV, take rate, repeat rate, supply and demand balance |

Define each metric in a footnote (MRR excludes one-offs and tax; say whether churn is logo or revenue) and use one source of truth.

## 7. Data room list

Company: incorporation papers, cap table summary, founder agreements, board and shareholder agreements, IP assignments. Financial: P&L, balance sheet, bank statements summary, tax filings, the model. Product and customers: roadmap, security summary, key customer contracts, pricing, usage data (aggregated, no personal data). Legal and compliance: licences, privacy policy, terms, data-protection posture. Team: org chart, key hires, option pool. Share through a view-only link with access logging; no personal data of customers.

## 8. Instruments and terms (flag for a lawyer)

Common early instruments: equity, convertible notes, SAFEs, CCPS or similar locally. Valuation caps, discounts, pro-rata rights and information rights matter. In India, recognition schemes, FDI rules for foreign investors, and tax treatment of share issues have changed repeatedly: check current rules and use a lawyer. Do not state a valuation as a fact; show how it was reasoned (comparables, stage, traction) and mark it as the owner's proposal.

## 9. Honesty checks before sending

- [ ] Every number traced to a source and a date.
- [ ] Live vs proposed features labelled.
- [ ] Customer names and logos used only with permission.
- [ ] Forecasts labelled as forecasts, with assumptions.
- [ ] Competitor claims dated and sourced.
- [ ] Nothing confidential from another client or company included.
- [ ] A reader outside the company can tell what the product does after one slide.
