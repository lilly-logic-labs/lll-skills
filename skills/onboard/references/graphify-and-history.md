# Graphify and git history

Two optional accelerators. Both give leads, not conclusions.

## Graphify (only if the `graphify` CLI is installed)

Graphify turns a folder into a queryable graph (modules, calls, communities, "god nodes" that everything touches) in `graphify-out/`. It answers "what connects to what" faster than grep on a large repo.

Check first: `graphify --help` (not installed: skip this section, the recon checklist is enough).

### Use an existing graph (read-only, safe in guidance mode)

If `graphify-out/graph.json` already exists in the repo:

```
graphify query "how does a payment reach the ledger"            # broad context
graphify query "how does a payment reach the ledger" --dfs      # follow one path deeply
graphify query "..." --budget 1500                              # cap the answer size
graphify path "InvoiceService" "LedgerRepository"               # shortest connection
graphify explain "InvoiceService"                               # one node and its neighbours
```

Read `graphify-out/GRAPH_REPORT.md` for the god nodes and communities, if present. A graph can be stale: check its date against `git log -1 --format=%cs` and say so. Then confirm every claim in the code and anchor it with `path:line`; edges marked inferred or ambiguous are guesses.

### Build a graph (full mode only)

Building writes `graphify-out/` and, for documents and images, sends content through model calls. So:

1. Get the owner's go-ahead for that exact tool and data flow (`../../../shared/ground-rules.md`). If the client's contract restricts AI tools on their code, do not build one.
2. Build in the throwaway copy made for the run step, never in the shared checkout. If the owner wants the graph kept in the repo, tell them to add `graphify-out/` to the ignore file.
3. Use the installed `/graphify` skill on the copy (`/graphify <path>`; `--mode deep` for richer links on a small repo; `graphify update <path>` re-extracts code only, with no model calls).
4. Use the graph for the architecture map and the "who depends on whom" part of the doc. Cite code anchors, not graph node names.

### Good graph questions

- Which modules does the checkout path cross?
- What are the god nodes, and are they tested?
- Which community has no test file near it?
- What is the shortest path from the HTTP layer to the database for entity X?

## Manual commands when Node or the facts script is unavailable

```
git ls-files | wc -l                                              # tracked files
git ls-files | sed 's/.*\.//' | sort | uniq -c | sort -rn | head  # languages by extension
git log --since="12 months ago" --name-only --format= | sort | uniq -c | sort -rn | head -20   # churn
git shortlog -sn --since="12 months ago"                          # who has been active
git log -1 --format=%cs -- <dir>                                  # last touch of an area
git log --diff-filter=A --format=%cs -- <file> | tail -1          # when a file first appeared
git branch -a --no-merged                                         # unmerged branches
git rev-parse --is-shallow-repository                             # is history cut?
```

Windows PowerShell has no `sort | uniq -c`; use Git Bash for these, or `Group-Object`.

## History reading, by question

| Question | How |
|---|---|
| When did the design change? | the largest commits and the commit dates of the hot-spot files |
| Why is this odd code here? | `git log -L <start>,<end>:<file>` or `git blame -w -C <file>` then read the commit message |
| What was tried and dropped? | unmerged branches, reverted commits (`git log --grep="^Revert"`) |
| Who knows this area? | `git shortlog -sn -- <dir>`; the last committer is not always the author of the design |
| Is the project alive? | commits per month for 12 months, the date of the last commit, open pull requests if `gh` is available (read-only) |

Authors are names from the history; use them to find the right person to ask, not to judge people. Do not print author emails in reports.
