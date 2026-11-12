# Releasing the pack

Do this only when the owner asks. Running these commands is safe; committing, tagging and pushing are the owner's call.

Contents: Before you start · Checks in order · Token budget · Version · Notice · Tag and publish · After release

## Before you start

- Work from the pack root. The pack is its own git repository; other sessions may have uncommitted work in it. Read `git status`, and treat changes you did not make as theirs. Do not stash, reset or clean.
- If the tree holds unrelated changes, release only what the owner names, or wait.

## Checks in order

1. `node skills/pack/scripts/lint.mjs` for the skills you changed, then for all of them. No errors; read the warnings.
2. `node scripts/check.mjs`. Contract and links. Must print `check: ok`.
3. Each script's self-test once: `node skills/<name>/scripts/<file>.mjs --selftest` for the scripts you changed, and `node scripts/selftest.mjs` for the pack.
4. `node scripts/gen-router.mjs` rewrites `hooks/router.txt` and prints its token estimate. Read the lines for the skills you changed. A truncated line (ending in `...`) loses its triggers; shorten sentence 1 of that description.
5. `claude plugin validate .` (add `--strict` for CI). Fix warnings that name your files.
6. `claude plugin details lll` and note the "Always-on" figure. It works on an installed plugin only (`claude plugin list`); if it answers "not found", install the pack first as the README describes. The `--plugin-dir` flag that the error suggests was rejected by this subcommand when tested.
7. `claude plugin eval . --ablation none --tag trigger --runs 3 --no-publish` for the changed skills (use `--case`).
8. If a vendored source changed upstream, `bash scripts/sync-vendor.sh`, review the diff, update the pins in `NOTICE`.

Fix every error you meet, including ones in files you did not edit, or name the exact blocker.

## Token budget

The router and house-style text are printed at the start of every session, and every skill description is listed in the skill listing. Per skill that is roughly 60 to 120 tokens. Keep a note of "Always-on" before and after a release. If it rose, say which skill and why it earns it. Cut a description before cutting a rule.

## Version

Edit `version` in `.claude-plugin/plugin.json`. If `marketplace.json` has a version for the plugin, keep them equal (`claude plugin tag` checks that the two agree).

| Change | Bump |
|---|---|
| Wording, description tuning, reference fixes, evals only | patch |
| New skill, new mode, new script, new reference | minor |
| Rename or removal of a skill, a changed contract, a changed output users rely on | major |

Before 1.0.0 the same rules apply to the second and third numbers. Ask the owner before choosing a major bump.

## Notice

Every adapted MIT or Apache-2.0 source needs a line in `NOTICE`: skill, what was adapted, source, licence. Do not edit `NOTICE` yourself unless asked; hand the owner the exact lines. Inspiration-only sources need no line, and nothing may be copied from them.

## Tag and publish

- `claude plugin tag --dry-run` shows the tag it would create (`lll--v<version>`) and checks that `plugin.json` and the marketplace entry agree. It refuses on a dirty tree unless forced; do not force.
- Create the tag, and push it (`--push`), only when the owner says to. Commit messages and tag annotations are the owner's text; draft them, do not create them unasked.
- A teammate gets the new version with `claude plugin update lll@lll` (restart required to apply). Say so in the hand-off.

## After release

- Run `node skills/pack/scripts/skill-usage.mjs --since 14` after a week of use: did the changed skills fire, did typed counts fall?
- Note any skill whose positive eval fell below two of three runs; fix before the next release.
