# lll skill pack

27 house skills for [Claude Code](https://claude.com/claude-code) from [Lilly Logic Labs](https://lillylogiclabs.com), covering the whole job: plan, build, debug, review, ship, audit, secure, launch, hand over. They also cover the work around the code: design, SEO, marketing, pricing and client scoping.

Every skill is project-agnostic. It reads your repo's own `CLAUDE.md`, `AGENTS.md`, README and manifests at runtime, so it works on any stack. Any agent that reads `SKILL.md` files can use the pack.

## Install

```sh
claude plugin marketplace add https://github.com/lilly-logic-labs/lll-skills.git
claude plugin install lll@lll
```

Start a new session. Skills load on their own when a request matches, or call one directly with `/lll:<name>`.

Update: `claude plugin marketplace update lll`. Remove: `claude plugin uninstall lll@lll`.

### Hacking on it locally

Clone it and link the clone as a skills folder. Edits load in the next new session:

```sh
git clone https://github.com/lilly-logic-labs/lll-skills.git
ln -s "$PWD/lll-skills" ~/.claude/skills/lll
```

## Skills

| Skill | What it does |
|---|---|
| `lll:plan` | Turns an idea into an approved design and a task-by-task plan, or reviews a plan |
| `lll:build` | Implements a change or runs a plan, inline or with a subagent per task: TDD, lean builds, safe refactors |
| `lll:debug` | Finds the root cause of a bug, flaky test, slowdown or incident before fixing it, then proves the fix |
| `lll:review` | Reviews a diff, PR or commit and reports findings by severity, each with a failure scenario |
| `lll:ship` | Proves the work is done, then commits, opens the PR, merges, deploys and watches |
| `lll:audit` | Audits a codebase by lens (bugs, db, deps, perf, a11y, tests, dead code, migrations) and fixes what it confirms |
| `lll:security` | Answers security questions and runs focused reviews, full audits or pen tests, then fixes confirmed holes |
| `lll:docs` | Syncs README, CLAUDE.md, API docs, changelog and ADRs with the code, or reports drift |
| `lll:onboard` | Maps an unfamiliar codebase: how to run it, architecture, key flows, risks, a code tour |
| `lll:tokens` | Measures and cuts what Claude Code spends: context, memory, skill and MCP listings, hooks, cache misses |
| `lll:pack` | Maintains this pack: which skills fire, plus adding or fixing a skill, evals and release |
| `lll:ai` | Designs, builds and reviews LLM features: prompts, RAG, agents, evals, guardrails, cost |
| `lll:cloudflare` | Workers, wrangler, D1, KV, R2, Queues, Durable Objects, Workflows, Containers, email, Turnstile |
| `lll:mobile` | Expo/React Native, Kotlin, SwiftUI and Flutter apps: signing, store releases, push, offline, crashes |
| `lll:ui` | Builds, reviews or polishes a screen or flow with every state, motion and a11y |
| `lll:design-system` | Brand discovery, tokens, light/dark themes, component inventory, DESIGN.md |
| `lll:logo` | Logos and marks: concepts, geometric SVG, size and one-colour tests, favicon and app icons |
| `lll:launch` | Takes a site or app live: readiness, smoke test, day 1/7/14 checks, SPF/DKIM/DMARC |
| `lll:backup-drill` | Restores backups into a safe target, verifies them, measures RPO/RTO, writes a runbook |
| `lll:handover` | Builds the client handover pack: run/deploy steps, envs, secrets locations, ownership transfer |
| `lll:analytics` | Tracking plans, GA4/GTM, Plausible, PostHog, consent (DPDP, GDPR), funnels, A/B results |
| `lll:seo` | Crawl and indexing, schema, Core Web Vitals, local and AI search, keyword clusters, briefs |
| `lll:marketing` | Positioning, content calendars, social posts, reel scripts, campaigns, email and ads |
| `lll:research` | Gathers and cross-checks the web, docs, GitHub, Reddit and YouTube, and browses or QAs live sites |
| `lll:business` | Strategy: demand, market size, competitors, business model, go-to-market, investor material |
| `lll:pricing` | Pricing model, tiers, willingness to pay, competitor prices, GST and app-store fee math |
| `lll:scope` | Estimates client work and writes the proposal and the internal estimate |

Each `skills/<name>/SKILL.md` says when to use the skill and which neighbour to use instead.

## Hooks

The plugin installs two hooks. Read them before you install it, since they run on your machine:

- **SessionStart** (`hooks/session-start.mjs`) prints `hooks/house-style.md` (working rules) and `hooks/router.txt` (a one-line map of the skills) once per session.
- **Stop** (`hooks/excuse-check.mjs`) blocks the stop once if the last reply waves off a problem ("pre-existing bug", "out of scope", "skipped the tests"), and asks for a fix or the exact blocker.

Both are plain Node scripts that make no network calls.

## Contributing

- Rules every skill follows: [`CONTRACT.md`](CONTRACT.md). Shared rules: [`shared/`](shared/).
- Before a PR:

  ```sh
  node scripts/check.mjs       # contract and every relative link
  node scripts/selftest.mjs    # scripts and hooks
  claude plugin validate .     # manifest
  ```

- After changing a skill description, run `node scripts/gen-router.mjs`.
- Evals: [`evals/README.md`](evals/README.md). Every skill needs 2 trigger prompts and 1 near-miss.
- Vendored upstream copies: `bash scripts/sync-vendor.sh`, then review the diff.

## License

[MIT](LICENSE). The vendored third-party material keeps its own licence (MIT or Apache-2.0); see [`NOTICE`](NOTICE).
