# Authoring a skill for the pack

Contents: Fit test · Baseline first · Name and folder · Body · References · Scripts · Content rules · Sources · Anti-patterns · Done check

## Fit test

A new skill must pass all four. Otherwise extend a neighbour or do nothing.

1. **Own trigger.** A user phrase that no existing skill description already owns.
2. **Recurs.** It came up at least three times in the transcript history, or one failure was expensive (money, data, an outage).
3. **Not covered elsewhere.** No built-in (`/code-review`, `/security-review`, `/simplify`, `/init`, `claude-api`, `run`, `dataviz`, artifact tools) and no `anthropic-skills:*` skill (pdf, docx, xlsx, pptx, humanizer, skill-creator, docs, deep-research, chrome-browser) does it.
4. **Adds method, not facts the model has.** Something the model gets wrong or skips without it: a sequence that matters, a check list from real incidents, a deterministic script, a hard rule. General knowledge does not need a skill.

## Baseline first

Before writing, run the real task once without the skill, or ask for a transcript where it went wrong. List what the agent did badly: skipped a step, guessed a fact, over-built, stopped early. The skill answers that list. Run the task again with the draft skill and compare. Where it still fails, tighten the rule that should have stopped it, or move the rule closer to the step it guards. Rules that nothing failed on are noise; cut them.

## Name and folder

- `skills/<name>/SKILL.md`; name lowercase, hyphenated, short, matches the frontmatter. Users type `/lll:<name>`, so one word beats two.
- Frontmatter holds only `name`, `description`, and `metadata: origin: lll`.

## Body

Order is fixed by `CONTRACT.md`: title and two-line promise, `## When to use`, `## When not to use` (name the other lll skill), `## Modes` (guidance by default, full only when asked) or `## Single mode`, numbered steps, `## Output`. Extra sections such as `## Rules` go between the steps and the output.

- Target 80 to 130 lines; the cap is 300. When it grows past 200, move depth to references.
- Steps are imperatives with a bolded lead ("**Measure.** Run ..."). One idea per sentence.
- State the default and the exception, not a menu. Give one recommended path.
- Say what to do when a check cannot run (no access, no tool): report it, do not skip silently.

## References

- One level deep: SKILL.md links each reference file. A reference never links to another reference. It may link a file in the pack's shared rules folder.
- A reference over 100 lines starts with a one-line `Contents:` list.
- Every reference is linked from SKILL.md with a clause on when to read it. An unlinked reference never gets read.
- Write paths relative to the skill folder, even inside a reference.
- Put per-stack and per-platform detail in references; keep SKILL.md stack neutral.

## Scripts

Only for deterministic work the model should not redo from memory: parsing a format, counting, probing an endpoint, comparing two tables.

- `skills/<name>/scripts/*.mjs`, Node 18 or newer, zero dependencies, no install step.
- An assert-based `--selftest` that builds its own fixtures in the OS temp folder and passes offline. Run it once when written and after any edit.
- Print counts, names and verdicts. Never print secrets or message bodies. Exit non-zero on a verdict that needs attention.
- Read-only by default; write only into a folder the caller passes. Network calls only when probing is the skill's job.
- Windows and POSIX: use `node:path`, not shell string paths; avoid shell-only features.

## Content rules

- Methods and checks, not a particular repository, client, hostname or product rule.
- Verify every version number, flag, limit and URL before you write it (run the command, read the docs). If you cannot, write "confirm in current docs".
- Date anything that decays (laws, quotas, prices, platform policies) and tell the reader to verify.
- Fold in the project's own rules: tell the skill to read `CLAUDE.md`, `AGENTS.md`, the README and the manifests at run time (`../../../shared/stack-detect.md`).
- Shared behaviour lives in `shared/`: ground rules, findings format, fix phase, report, agents. Link it; never paste it.
- Remote or production writes, spending, sending messages: the skill says "ask the owner first".
- Plain words, no marketing tone, no emoji. Use the ASCII hyphen, not decorative punctuation.

## Sources

- MIT or Apache-2.0 text may be adapted. Record the source, licence and files for `NOTICE` and tell the owner, who adds the line.
- A source with no licence or another licence is inspiration only: write every sentence yourself.
- Never copy from a client or product repository. Take the method, drop the names.

## Anti-patterns

| Pattern | Why it fails | Instead |
|---|---|---|
| Description lists the steps | The model follows the summary and skips the body | Say when to use it; keep steps in the body |
| One skill, ten unrelated modes | Triggers blur, listing grows | Split, or keep the two best modes |
| Re-explaining a built-in | Two sources of truth that drift | Point to it by name |
| "Always do X" with no reason | Followed blindly, or ignored | Give the reason in one clause |
| A rule nobody saw fail | Noise | Delete until a failure justifies it |
| Absolute paths, one OS only | Breaks for teammates and other hosts | Relative paths, both shells where a command matters |
| Menus of options | The model picks arbitrarily | Default plus one named exception |
| Time-sensitive facts with no date | Silent rot | Date and "verify" step |
| Long SKILL.md that quotes docs | Costs tokens on every load | Link, or summarise in a reference |

## Done check

- `node scripts/lint.mjs <name>` has no errors and no avoidable warnings.
- `check.mjs` is clean for the skill; every script passes its `--selftest`.
- The description fits 400 characters, starts short, has "Use when" with four or more phrases and a "Not for" line.
- Evals exist: three positive, one near-miss.
- A real task ran with the skill and the observed failures are gone.
