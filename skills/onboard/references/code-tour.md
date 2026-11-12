# Code tour

A tour is a guided reading path: a fixed order of stops, each anchored to real code, written for one reader. It beats a file listing because each stop explains why the next one follows.

Default form: a "Code tour" section in the onboarding doc. Use the CodeTour `.tour` file format only if the user works in VS Code with the CodeTour extension, or asks for it; the format is the open `microsoft/codetour` schema.

## Pick the reader and depth

| Request | Persona | Stops |
|---|---|---|
| "onboarding", "new joiner" | new-joiner | 9 to 13 |
| "quick tour", "vibe check" | quick | 5 to 8 |
| "architecture" | architect | 14 to 18 |
| "tour this PR" | pr-reviewer | 7 to 11 |
| "why did this break" | rca-investigator | 7 to 11 |
| "explain how feature X works" | feature-explainer | 7 to 11 |

Scale down for small repos. For a monorepo, tour one package, not all.

## Shape

1. Orientation: the repo root or the main package, what the product is.
2. Module map: the two or three folders that matter and how they depend on each other.
3. The core path: the flow you traced (entry, validation, logic, storage, side effect).
4. A gotcha: the edge case, the legacy corner or the non-obvious rule that bites newcomers.
5. Close with what the reader can now do (change X safely, find Y), not a recap.

The first stop is anchored to a real file or directory, never a text-only intro.

## Writing each stop (SMIG)

- **Situation**: what the reader is looking at.
- **Mechanism**: how it works, in the code's own terms.
- **Implication**: why it matters for this reader.
- **Gotcha**: what a smart reader would miss.

Two to five sentences. Name the concrete function or rule. No "this file contains utilities".

## Anchors must be real

- Confirm the file exists and the line is in range before writing it.
- For volatile files prefer a pattern anchor (a regex that matches the declaration) to a line number.
- Never guess a line number. Run `node scripts/check-anchors.mjs <doc-or-tour> --root <repo>` at the end and fix every report.

## Markdown tour (default)

```markdown
## Code tour: new joiner (11 stops)

1. **Root** `package.json:1`: pnpm workspace with three packages; `apps/web` ships to users, `packages/core` holds the rules.
2. **Web entry** `apps/web/src/main.tsx:12`: ...
```

One numbered line per stop, anchor first in backticks as `path:line` (or `path:start-end`).

## `.tour` file

Write to `.tours/<persona>-<focus>.tour`. Only `.tour` JSON; touch no source files.

```json
{
  "$schema": "https://aka.ms/codetour-schema",
  "title": "Payments service: new joiner",
  "description": "Request path from route to ledger.",
  "steps": [
    { "directory": "src", "title": "Source root", "description": "All runtime code starts here." },
    { "file": "src/server.ts", "line": 12, "title": "Entry point", "description": "Boots the server and wires middleware before any route." },
    { "file": "src/app.ts", "pattern": "export default class App", "title": "App class", "description": "Pattern anchor survives edits." },
    { "file": "src/core/pipeline.ts", "selection": { "start": { "line": 15, "character": 0 }, "end": { "line": 34, "character": 0 } }, "title": "Pipeline", "description": "Validation, auth, then the handler." },
    { "title": "Next steps", "description": "You can now follow a payment from route to ledger." }
  ]
}
```

Step types: `directory`, `file` + `line`, `file` + `selection`, `file` + `pattern`, `uri` (a PR or issue link), and a text-only step (only as the last step).

### The `ref` field

`ref` pins the tour to a branch or commit. When it differs from the branch the reader has checked out, CodeTour opens each file from that revision in git, and a file missing there fails with "file not found" while the tour text still shows. Rules:

| Tour type | `ref` |
|---|---|
| Onboarding or architecture | the branch the reader will be on, or leave it out |
| PR tour | the PR branch, never the base (new files do not exist on the base) |
| Unsure | leave `ref` out; files then come from disk |

`check-anchors.mjs` verifies each file exists at `ref` when one is set.

## Anti-patterns

| Anti-pattern | Fix |
|---|---|
| A file listing | order the stops so each leads to the next |
| Generic text | name the concrete function, rule or table |
| Guessed anchors | verify, then run the checker |
| Too many stops for a quick tour | cut to the core path |
| Text-only first stop | anchor to a file or directory |
| Wrong reader | write for the persona, not a generic engineer |
| Tour of a vendored or generated folder | skip it |
