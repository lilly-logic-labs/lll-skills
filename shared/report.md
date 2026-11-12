# Report

Skills that write a report put it at `docs/audits/<YYYY-MM-DD>-<skill>[-<scope>].md` in the target repository (on the fix branch when there is one), unless the project names another place. Add `-2`, `-3` if the name is taken.

## Template

```markdown
# <Skill> report: <project> (<YYYY-MM-DD>)

<stack-detect block from shared/stack-detect.md>

## Summary
- Result: <one line>
- Findings: critical <n>, high <n>, medium <n>, low <n>; needs validation <n>; rejected <n>
- Fixed <n>, not fixed <n>, reverted <n>, owner actions <n>
- Branch: <lll-fix/... or none>   Worktree: <path or none>

## Findings
<finding blocks from shared/findings.md, ranked by severity then confidence>

## Fixes
| Finding | Commit | Test added | Status |
|---|---|---|---|

## Needs validation
<one line each: the exact unresolved fact and how to settle it>

## Needs decision
<one line each: the question and the options>

## Owner actions
<one line each: what only the owner can do (secrets, dashboards, deploys, devices)>

## Rejected
<one line each: id and why>

## Questions
<items that could not yet be stated as a failure scenario>

## Coverage
- Docs sync (lll:docs): <run, commit sha | not needed: why | skipped: why>
- Scope: <paths or units covered>
- Not covered: <paths or units, and why>
- Gates on branch tip:
<real command output, trimmed to the decisive lines>
```

## Chat summary

After writing the report, reply with: counts by severity; fixed, not fixed and reverted counts; the top five findings with `path:line` and fix commit; report path; branch and worktree; owner actions; anything not covered; gate result.
