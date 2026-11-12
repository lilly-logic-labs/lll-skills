# Dashboards

A dashboard is a set of recurring questions with owners and thresholds. A wall of charts nobody acts on is waste.

## 1. Start from decisions

Ask, in order:

1. **Who looks at it, how often, on what device?** (founder weekly on a laptop; ops daily on a phone)
2. **What decisions does it feed?** Each panel must map to one decision or alert.
3. **What would make you act?** Define the threshold: the number or change that triggers an action. No threshold, no panel.
4. **What is the source of truth for each number?** (analytics tool, database, payment gateway, Search Console)
5. **How fresh must it be?** Real time, daily, weekly. Most business questions need daily or weekly.

## 2. Layout: four bands, top to bottom

| Band | Content | Example panels |
|---|---|---|
| 1. Headline | 4 to 6 numbers with change vs previous period and a target | revenue, new customers, conversion rate, active users, churn |
| 2. Funnel and flow | where people drop | acquisition to activation to purchase; step conversion |
| 3. Diagnosis | why a headline moved | by channel, device, country, landing page, plan |
| 4. Health | data and system quality | tracking volume vs expected, errors, speed, consent rate |

Keep to one screen for the headline and one scroll for the rest.

## 3. Panel spec

Write one for each panel before building it:

```
Title (states the question or finding): Are sign-ups holding up?
Metric and definition: new accounts created (server events), UTC+5:30 days
Source: <table or report>
Chart: line, 7-day average, last 90 days
Comparison: previous period and same period last year
Threshold: alert if below 70 percent of the 4-week median for 2 days
Owner: <name or role>
Action when red: <what to check first>
```

## 4. Templates by business

| Business | Headline | Funnel | Diagnosis | Health |
|---|---|---|---|---|
| Brochure or lead-gen site | leads, lead rate, cost per lead | visit to form view to submit to qualified | channel, landing page, device | form errors, page speed, consent rate |
| E-commerce | revenue, orders, AOV, conversion, refund rate | view item to cart to checkout to purchase | channel, category, new vs returning | payment failures, stock-outs, site speed |
| SaaS | MRR, new trials, activation rate, churn, net revenue retention | visit to signup to activated to paid | plan, channel, cohort | uptime, error rate, support tickets |
| Content or publisher | sessions, engaged sessions, returning share, newsletter signups | landing to second page to subscribe | topic, source, device | page speed, indexing, bot share |
| Mobile app | DAU/MAU, D1/D7/D30 retention, installs, revenue | install to onboarding to activation to purchase | version, country, acquisition source | crash-free rate, ANR, review rating |
| Open-source or CLI tool | weekly active installs, downloads, stars, issue response time | install to first successful run | version, OS | error rate by version |
| Marketplace | GMV, take rate, liquidity (searches with a result), repeat rate | search to contact to transaction | supply and demand side | fraud flags, dispute rate |

## 5. Alerts

- Few and meaningful. Each alert names an owner and a first check.
- Types: absolute (zero events for 24 hours), relative (below 70 percent of the same weekday median), freshness (data older than expected), anomaly (the tool's built-in detection, tested for false alarms).
- Delivery: the team's chat or email; avoid alert fatigue by merging related alerts.
- GA4 has custom insights; PostHog, Mixpanel and Looker Studio support alerts; for warehouse data use scheduled queries plus a webhook.

## 6. Build options

| Option | Good for | Notes |
|---|---|---|
| Tool-native dashboards (GA4, PostHog, Mixpanel, Plausible) | quick, no build | stay inside one tool's data |
| Looker Studio | GA4, Search Console, Sheets, BigQuery in one view | free; share by link permissions; watch data-source quotas |
| Metabase, Grafana, Superset | database and warehouse sources | self-host or cloud |
| Spreadsheet | tiny teams | refresh by connector or paste; version it |
| Custom page | one repo or team, specific design | static HTML reading a JSON or API; use the artifact Dashboard type when the host lists it |

For a published dashboard artifact, call the Artifact tool with `action: "quickstart"` first; if the result says to start from the Dashboard type, start there. Data on the page belongs in a data source or the artifact database, not in the HTML source.

## 7. Chart rules (see the `dataviz` skill for the full method)

- Title states the finding or question, not the metric name.
- Line for time, bar for comparison, table when exact numbers matter, no pie charts beyond three slices, no 3D, no dual axes.
- Start bars at zero. Label directly rather than with a legend where possible.
- Same colour means same thing across the dashboard. Do not use red and green alone (colour-blind readers); add icons or labels.
- Show the comparison and the target on the chart.
- Mark incidents, releases and campaign starts as annotations.
- Mobile first for operator dashboards; test at phone width.

## 8. Test the dashboard

- Recompute three numbers by hand from the source.
- Check time zone, currency, and filters match the definition.
- Check what happens with missing data (zero or gap?) and partial periods (today).
- Ask the intended reader what decision they would take from each panel. Remove the ones they cannot answer.
- Review every quarter; delete unused panels.
