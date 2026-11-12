# Onboarding doc template

Write to `docs/onboarding/<YYYY-MM-DD>.md` in the target repository (add `-2`, `-3` if the name is taken). Keep the whole doc readable in two minutes at the top and searchable below. Delete any section that has nothing true to say instead of padding it.

```markdown
# Onboarding: <project> (<YYYY-MM-DD>)

<stack-detect block from ../../shared/stack-detect.md>

Depth: quick | standard | deep      Slice: whole repo | <paths>
Method: facts script, <graphify yes/no>, app run <yes in throwaway copy / no>
Read: <n> of <m> source files. Not read: <areas and why>.

## 1. What this is
Two or three sentences: what the product does, for whom, how it earns or serves. Source: <README / owner>. Observed against inferred.

## 2. How to run it
| Step | Command | Result | Note |
|---|---|---|---|
| install | `pnpm install --frozen-lockfile` | works / fails / unverified | 40 s |
| start | `pnpm dev` | | needs `DATABASE_URL` (name only) |
| test | `pnpm test` | | |
| build | `pnpm build` | | |
README is wrong about: <list> (fixes that worked).
Environment: runtime versions pinned in <file>.

## 3. Architecture
<one picture or five bullets>
- Shape: monolith | monorepo | services | serverless; web | mobile | desktop | backend
- Entry points: `path:line`, ...
- Modules and dependencies: <module> -> <module>
- Data stores and who owns each table: ...
- External services: <name> (what for, where called `path:line`)
- Auth and tenancy: ...
- Config and secrets (names only): see handover-style table if the project ends up with one
- Build, deploy, environments: ...

## 4. Key flows
### <flow name>
Story in five to eight lines, then the hop table and observations (see trace-a-flow reference).

## 5. Conventions
Naming, error handling, async style, state management, tests, git (commit and branch style). "Unknown" where not detected.

## 6. Risks and debt
| Id | Risk | Evidence | Scenario | Severity | Likelihood 6 months | Effort | Verdict |
|---|---|---|---|---|---|---|---|
Hot spots (churn x size): ...   Single-owner areas: ...   Stale areas in the critical path: ...
Undocumented decisions (reconstructed, to confirm with the owner): ...

## 7. Code tour
Numbered stops with `path:line` anchors (see code-tour reference).

## 8. Where to look
| I want to... | Look at... |
|---|---|
| add an endpoint or screen | `path` |
| change the schema | `path` |
| add a test | `path` |
| change the build or deploy | `path` |

## 9. Open questions
| Question | Why it matters | Who can answer |
|---|---|---|

## 10. Suggested next steps
Three to five bullets, each naming the skill that does it (`lll:scope`, `lll:audit`, `lll:security`, `lll:docs`, `lll:handover`).

## Coverage and honesty
- Not run: <commands skipped and why>
- Assumed: <list>
- Unverified: <list>
```

## Chat summary (full mode)

Five lines: what it is; how to run it (works or not); top three risks with anchors; biggest unknown; doc path. Then skipped or unverified items.

## Starter CLAUDE.md (offer, do not write unasked)

If the repo has none, offer a file of 100 lines or fewer built from the doc: stack in one line, commands (install, dev, test, lint, build), layout (folder to purpose, only non-obvious ones), conventions that differ from defaults, gotchas found while tracing, forbidden commands. If one exists, propose additions as a diff and leave its existing rules untouched. The built-in `/init` creates a first draft; use the findings here as its input.
