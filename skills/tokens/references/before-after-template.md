# Before and after table

Fill the "before" column from a `node scripts/usage.mjs` run (and `/context`, `claude plugin details`) before any change. After the change, run the same commands with the same flags over a comparable window of real sessions and fill "after". Mark each line measured or projected. Never invent a number; write "not measured".

```markdown
# Token audit: <project or setup> (<YYYY-MM-DD>)

Window: <dates>   Sessions: <n>   Prompts: <n>   Method: node scripts/usage.mjs <flags>

## Result
- Fixed context per session: <before> -> <after> tokens (<measured | projected>)
- Hook text per prompt: <before> -> <after> tokens
- Cost units per prompt: <before> -> <after> (input-token equivalents)
- Cache hit ratio: <before> -> <after>

## Before and after
| Item | Before | After | Change | Status | How |
|---|---|---|---|---|---|
| Fixed context (session start) | 18,400 | 11,900 | -6,500 | measured | script SESSION-START CONTEXT, new session |
| Per-prompt hook text | 969 | 45 | -924 | measured | script hook table, 20 prompts |
| Skill listing | 7,400 | 4,100 | -3,300 | measured | after disabling 3 plugins |
| Root CLAUDE.md | 4,400 | 2,600 | -1,800 | measured | wc -c / 4 |
| Largest tool output class | Read 4.7M tok | n/a | n/a | projected | slice reads; check next window |
| Compactions per 10 sessions | 8 | not measured | | | |
| Cost units per session | 3.6M | not measured | | | window too short |

(The numbers above are an example layout only.)

## Changes applied
| File or setting | Change | Backup | Needs new session |
|---|---|---|---|

## Changes proposed, not applied
| Change | Projected saving | Risk | Owner decision needed |
|---|---|---|---|

## Quality check
<Which representative task was re-run after the cuts and what happened. If behaviour regressed, which cut was reverted.>

## Habits agreed
<3 to 5 lines>
```

Notes:

- A small window or a different task mix makes before and after incomparable. Say so and keep the status "projected".
- Cost units are input-token equivalents and compare setups. Dollar amounts come only from the logged cost field.
- Report fixed-context numbers from a new session; a continued session still carries the old prefix.
