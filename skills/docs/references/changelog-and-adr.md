# Changelogs, release notes, versions and ADRs

## Changelog

First find out who writes it.

| Signal | Meaning | What to do |
|---|---|---|
| `.changeset/` folder | Changesets generates the changelog from small files | add a changeset file in the project's format; never edit `CHANGELOG.md` directly |
| `release-please`, `semantic-release`, `conventional-changelog`, `git-cliff` config | generated from commit messages | change nothing; make sure the commit message is conventional (`lll:ship` writes it) |
| Hand-written `CHANGELOG.md` with an `Unreleased` section | maintained by hand | add entries under `Unreleased` |
| Hand-written, no `Unreleased` | maintained by hand at release time | propose the entry text in the summary and ask where to put it |
| No changelog | none | do not create one |

Rules for hand-maintained files:

1. Read the whole file first and copy its format: headings (`Added`, `Changed`, `Fixed`, `Removed`, `Security`, `Deprecated` in Keep a Changelog; or plain bullets), tense, link style, issue references.
2. Add; do not rewrite. Never regenerate, reorder or delete released entries. Edit with exact-match replacements, never by rewriting the file.
3. Write for the reader of the release: what they can now do or what stopped breaking, in plain words ("You can now export reports as CSV"), not the commit title or the implementation. Say what changed, why it matters, and how to use or migrate. Breaking changes and migration steps are explicit.
4. One entry per user-visible change. Internal refactors with no behaviour change usually get none.
5. If an existing entry for this change looks wrong or incomplete, report it; do not silently replace it.
6. Keep the date format, version heading and compare links as the file does them.

## Version numbers

The version is a release decision. Never bump `VERSION`, `package.json` version, `Cargo.toml`, `pyproject.toml` or app build numbers on your own. If a bump looks needed (breaking change shipped under a patch number, new feature not covered by the current entry), say so and ask. If the version was already bumped for this branch, check that the changelog entry for it covers everything on the branch and report any uncovered change.

## ADRs (architecture decision records)

Typical places: `docs/adr/`, `adr/`, `docs/decisions/`, `docs/architecture/decisions/`. Common file names: `0007-use-postgres.md`. Common fields: Title, Status, Context, Decision, Consequences (Nygard style), or the MADR template with considered options.

- Statuses: proposed, accepted, deprecated, superseded by ADR-N, rejected.
- An accepted ADR is not edited to change what was decided. If the code now follows a different decision, the right change is a new ADR that supersedes the old one, and a one-line status change on the old one (`Status: Superseded by ADR-0012`). Drafting the new ADR is allowed when the owner asks; deciding is theirs.
- Facts inside an old ADR that are no longer true (a renamed module) stay as written; the history is part of the record.
- Check on every change: does the code contradict an accepted ADR? That is a finding for the owner ("ADR 12 is not honoured here"), not a reason to edit the ADR and not a reason to call the ADR wrong.
- A proposed ADR whose decision has now shipped should be moved to accepted by the owner. Report it.
- Number new ADRs by the next free integer, copy the neighbours' template, link related ADRs both ways, and add it to the ADR index if there is one.

## Release notes and upgrade guides

- Written once per release, dated, and then history.
- Migration guides for breaking changes live with the version they apply to. Add one when a breaking change lands and the project keeps them; list the exact steps and the before and after code.
- Deprecation notices: record the version, the replacement and the removal date or version.

## TODO and roadmap files

- Mark an item complete only when the diff clearly finishes it; add the completion date in the file's format.
- New deferred work found in the diff (`TODO`, `FIXME`, `HACK` comments that stand for real work): ask whether to capture it. Do not create items on your own.
