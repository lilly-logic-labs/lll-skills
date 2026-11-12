# Lens: drift

Places where two things that must agree no longer do: docs and code, client and server, one environment and another, one file and its copy. The code is the fact; the disagreement is the finding.

## Covers

- Docs versus code: README and CLAUDE.md commands, architecture notes, API docs, ADRs, runbooks, `.env.example`, changelogs that describe behaviour.
- Contracts: client and server request and response shapes, webhook producers and consumers, queue messages, database rows and the types that read them, mobile app versions still in the field and the API they call, generated clients and their schema.
- Config across environments: variables, secrets (names only), bindings, feature flags, resource ids and compatibility settings in local, preview, staging and production.
- Cross-file consistency: constants, limits, enums, regexes, time windows and helpers duplicated in several places.

Fixing documentation is `lll:docs`; this lens finds the drift and fixes code-side mismatches.

## Method

1. **Claims inventory.** From README, CLAUDE.md, AGENTS.md, `docs/`, ADRs and runbooks, list each checkable claim: a command, a file or function name, a flag, a limit or version number, an architecture statement, a security control. Skip history (dated plans, old audits).
2. **Check each claim.** The file or symbol exists; the command's script exists (`npm run x` needs `scripts.x`; `make x` needs a target); read-only commands run; numbers match the code. A doc claiming a security control the code lacks is at least medium.
3. **Contracts.** List every boundary between components that ship separately. For each, put both sides next to each other: field names and casing, optional versus required, types (numeric id versus string id, minor units versus decimals, UTC versus local), enum and status values, error codes and shapes, pagination, versioning. Check the side that ships slower (mobile apps in the field, other teams' services) still parses what the faster side now sends.
4. **Generated artefacts.** Generated clients, types and schemas match their source: regenerate in the fix worktree and diff (`openapi-generator`, `graphql-codegen`, `buf generate`, `prisma generate`, `wrangler types`, `sqlc generate`). A non-empty diff is drift.
5. **Environments.** Build a table of every variable, secret name, binding and flag per environment from the config files and deploy docs (`wrangler.*` env blocks, `.env.*.example`, Kubernetes overlays, `docker-compose` files, CI environments, platform settings the owner shares). Missing in one environment, pointing at another environment's resource, or differing without a reason is a finding.
6. **Copies.** Find duplicated constants and helpers (`git grep` the literal value or the helper's distinctive line) and compare.

## Commands

- Environment variables read by code, to compare with `.env.example` and the deploy config:
  `git grep -ohE 'process\.env\.[A-Z0-9_]+|import\.meta\.env\.[A-Z0-9_]+|os\.environ(\.get)?\(?\[?.[A-Z0-9_]+|os\.getenv\(.[A-Z0-9_]+|os\.Getenv\(.[A-Z0-9_]+|env::var\(.[A-Z0-9_]+|System\.getenv\(.[A-Z0-9_]+|ENV\[.[A-Z0-9_]+|getenv\(.[A-Z0-9_]+|GetEnvironmentVariable\(.[A-Z0-9_]+' | grep -oE '[A-Z][A-Z0-9_]{2,}$' | sort -u`
- Package scripts referenced in docs: `git grep -ohE '(npm|pnpm|yarn|bun) run [a-z0-9:_-]+' -- '*.md' | sort -u`, then compare with the `scripts` block.
- OpenAPI against routes: a pinned `@redocly/cli lint` for the spec; list routes with the route-inventory greps from the security skill's checklist and compare paths and methods.
- GraphQL: `graphql-codegen --check` if configured; schema diff with the pinned inspector the project uses.
- Protobuf: `buf breaking --against '.git#branch=<main>'` when the project uses buf.
- Wrangler environments: compare each `env.<name>` block's bindings, vars and routes with the top level; `wrangler types` in the fix worktree and diff the generated `Env`.
- Platform settings (owner go-ahead, names only): `vercel env ls`, `wrangler secret list --env <name>`, `gh secret list`, `gh variable list`.

## Severity calibration

- **critical:** production config pointing at a staging or test resource holding real data; a contract mismatch that corrupts stored data (cents read as currency units, local time stored as UTC).
- **high:** a contract mismatch on a core path that fails or returns wrong results; a secret or variable required at startup missing from production config; a doc that tells operators to run a destructive or wrong command.
- **medium:** a mismatch on a rare path or an older app version still in use; duplicated constants with different values; a doc claiming a security or privacy control the code does not implement; a generated client out of date.
- **low:** a stale README command, an architecture note describing a removed component, a renamed file in an ADR.

## False-positive traps

- Docs that describe planned work and say so are not drift.
- Variables with safe defaults in code may be absent from `.env.example` on purpose; check the default.
- Generated docs (API references built in CI) drift only if the generator is not run.
- Different values per environment can be deliberate (rate limits, log levels, sample rates); look for a comment or doc before reporting.
- When code contradicts an ADR or a locked rule, the code is the bug, not the ADR (`../../../shared/ground-rules.md` "Authority").
