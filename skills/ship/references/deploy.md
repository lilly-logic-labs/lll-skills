# Deploy and release

Getting merged code in front of users safely. Every deploy is a production write: it happens only when the user asks for it in this conversation, using the project's own documented pipeline.

## 0. Learn how this project deploys

Read `CLAUDE.md`, `AGENTS.md`, README, CI config (`.github/workflows`, `.gitlab-ci.yml`, `Jenkinsfile`, `wrangler.toml`, `fly.toml`, `vercel.json`, `netlify.toml`, `Dockerfile`, Helm or Terraform folders, `eas.json`, `fastlane/`). Determine:
- Does merging to the default branch deploy automatically? (Then merging is the deploy.)
- Environments (preview, staging, production) and how promotion works.
- Who approves, and the documented rollback.
If the project has no documented process, say so and ask the owner; do not invent one.

## 1. Pre-deploy checklist

- [ ] Gates green on the exact commit being deployed (fresh run, or the CI run for that SHA).
- [ ] Whole-branch review done; no open critical or high findings.
- [ ] Migrations: expand-compatible with the currently running code, applied before the code that needs them; contraction not in this release (see `lll:build`, migration-safe route).
- [ ] Config and secrets exist in the target environment (names checked, values never printed).
- [ ] Feature flags default to the safe state; the kill switch works.
- [ ] Dependencies and build reproducible from the lockfile; no `latest` tags.
- [ ] Rollback written down: the exact command or revert, and what it does to data.
- [ ] Backup or snapshot exists for stateful changes (`lll:backup-drill` for restore proof).
- [ ] Timing: not Friday evening, not during peak, someone available to watch.
- [ ] Baseline captured for the canary (error rate, latency, key flows).
- [ ] Docs, changelog, status page or customer notice if user-visible.

Any unchecked item is stated to the user. A missing rollback plan blocks the deploy.

## 2. Deploy by platform

Use the project's own command. Typical shapes:

| Target | Typical path | Notes |
|---|---|---|
| Static site or web app host | Push to the connected branch; or the host CLI deploy | Preview deploy first; check cache and CDN invalidation |
| Containers / Kubernetes | Build image tagged with the SHA, push, update the deployment, rollout status | Pin image digests; readiness probes; `kubectl rollout status`, `kubectl rollout undo` for rollback |
| PaaS (Fly, Render, Railway, Heroku) | Platform CLI or git push | Release command for migrations; check release phase logs |
| Cloudflare Workers / Pages | `wrangler deploy` (Workers), Pages by git; versions and gradual deployments for staged rollout | Secrets via `wrangler secret`; D1 migrations applied with the documented command and checked locally first; `wrangler rollback` for Workers |
| Serverless (Lambda, Cloud Functions) | IaC or CLI deploy of a new version; shift alias traffic gradually | Keep the previous version for instant rollback |
| Mobile (iOS) | Archive, TestFlight, phased release in App Store Connect | Review times; cannot roll back a released binary, only halt phased release and ship a fix |
| Mobile (Android) | AAB to internal, closed, then production track with staged rollout percentage | Halt rollout in Play Console; fix forward |
| Expo / React Native | EAS Build for binaries, EAS Update for JS-only changes on a channel | OTA only if the native runtime version matches; roll back by republishing the previous update |
| Desktop apps | Signed installers, auto-update feed | Staged feed; signing and notarisation credentials with the owner |
| Libraries and packages | Tag, CI publishes to npm, PyPI, crates.io, Maven Central, NuGet | Publishing is irreversible (versions cannot be reused); dry-run first (`npm publish --dry-run`, `cargo publish --dry-run`); 2FA and provenance with the owner |
| Databases | Migration tool with the documented command | Expand, migrate, verify, contract across releases |

Commands that change production (`wrangler deploy`, `kubectl apply`, `terraform apply`, `fastlane deliver`, `firebase deploy`, `npm publish`, `gh release create`, `prisma migrate deploy`) each need the user's explicit request. Show the exact command and its target first.

## 3. Order of operations

1. Merge (if the pipeline deploys from the default branch, this starts the deploy: say so first).
2. Apply expand-compatible migrations.
3. Deploy the code, gradually where the platform allows (canary, percentage, one region first).
4. Run the post-deploy smoke checks (below).
5. Start the canary watch (`canary` guidance in this skill).
6. Ramp to 100% after the canary window is clean.
7. Record: tag or release notes, deploy time, SHA, who approved.
8. Schedule the contraction step (dropping old columns, removing flags) for a later release.

## 4. Smoke checks right after

- Health and version endpoint returns the new SHA.
- The two or three most important user flows, end to end, with a test account.
- Error tracker: no new error types; crash-free rate steady.
- Logs: no new stack traces; no spike in warnings.
- Background jobs and queues draining; scheduled jobs registered.
- Third-party integrations (payments, email, auth) respond; webhooks arrive.
- For web: key pages load, console clean, assets served with the new hashes.
For a site that has just gone live for the first time, hand over to `lll:launch`.

## 5. Rollback decision

Roll back (with the user's approval) when, after confirmation on two checks, any of these hold:
- Errors on a core flow above baseline.
- Data being written incorrectly (stop first, then investigate: this is an incident, see `lll:debug`).
- A security exposure.
- Latency far over baseline with no quick fix.

Roll back with the documented command. Confirm the signal returns to baseline. Then investigate the cause calmly. A rollback that the data cannot survive is not available: that is why migrations are expand-first.

Fix forward only when the fix is small, understood, and faster than a rollback, and still goes through the gates.

## 6. After

Report: what was deployed (SHA, environment, time), checks run with results, canary outcome, rollback status, open follow-ups (contraction, flags to remove, docs). Update the changelog or release notes if the project keeps them.
