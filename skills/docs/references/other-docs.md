# Other doc types, gaps and generated docs

Contents: README quality bar · API docs and OpenAPI · Code comments and docstrings · Env example files · Diagrams · Generated docs · Translations · Coverage map and gaps · Doc discoverability

## README quality bar

A README is correct when a new person can run the project from it. Walk it as a new contributor would:

- The listed prerequisites, install, run and test commands exist and would succeed in order.
- The feature list matches what the code does now.
- Screenshots and demos are marked as possibly stale when the UI changed.
- Links work. Badges point at the right repository and branch.
- The licence and contact lines are right.

Change facts; leave the introduction and positioning to the owner.

## API docs and OpenAPI

- If the OpenAPI/Swagger/GraphQL schema is generated from code (FastAPI, NestJS, Spring, tsoa, Rails rswag), do not hand-edit the output; fix the annotations or run the generator if the owner allows it, and report that regeneration is needed.
- If it is hand-written, diff it against the route definitions: methods, paths, path and query parameters, required fields, request and response schemas, status codes, auth requirements, error shapes, examples.
- Removed routes must go from the spec. New routes need an entry or a flagged gap.
- Version fields, server URLs and contact info are facts too.

## Code comments and docstrings

- Check comments, docstrings, JSDoc, Javadoc, KDoc, rustdoc and Go doc comments on every function, type and file you or the change touched.
- A comment that describes behaviour the code no longer has is a defect; fix or delete it.
- Do not add comments everywhere, and do not rewrite working comments for style. Keep to the lines that are false.
- "Why" comments that record a decision stay unless the decision was reversed.

## Env example files

`.env.example`, `.env.sample`, `.dev.vars.example` and similar:

- Every variable the code reads at startup or in a documented path is listed with a safe placeholder and a one-line comment if it is not obvious.
- Variables the code no longer reads are removed.
- Never put real values in an example file. If a real secret is present, report its location only (`../../../shared/ground-rules.md`).
- Docs that describe configuration list the same names and defaults.

## Diagrams

Mermaid, PlantUML, ASCII art and images of architecture:

- Extract the entity names (services, modules, queues, tables, flows) and look each up in the code.
- A renamed, split, merged or removed entity makes the diagram stale. Fix text-based diagrams when the change is mechanical (rename a box). A structural redraw needs the owner; flag it.
- Image files cannot be edited from text; list the ones that are stale.

## Generated docs

Typedoc, Sphinx autodoc, Javadoc, rustdoc, Storybook, Docusaurus API plugins, schema docs:

- Edit the source (annotations, docstrings, the config), not the output.
- Check if the output is committed. If so, say that regeneration is needed and give the command from the project's docs; run it only when the owner allows writes from generators.
- If the output folder is ignored, there is nothing to update.

## Translations (i18n)

- If the product or docs are translated, a changed source string or doc page needs the same change in the other locales or a flagged gap.
- Compare keys across locale files: same key set, same placeholders (`{name}`, `%s`, ICU plurals). Report missing and orphaned keys. A script that diffs JSON/YAML/PO key sets is enough.
- Do not machine-translate docs without being asked; add a marker the project already uses for "needs translation".
- Keep terminology consistent with the project's glossary.

## Coverage map and gaps

For each new or changed piece of public surface (command, flag, route, export, config key, env var, user-facing feature), check which kinds of doc cover it:

| Kind | Question it answers | Typical home |
|---|---|---|
| Reference | what is it, what are its options | README tables, API docs, `--help`, config reference |
| How-to | how do I do task X with it | README examples, `docs/guides`, `CONTRIBUTING` |
| Tutorial | how do I learn it from nothing | getting-started guide |
| Explanation | why does it work this way | architecture doc, ADR |

```
Coverage map
  surface            reference  how-to  tutorial  explanation
  /export command    README     -       -         -
  EXPORT_TTL         -          -       -         -
```

An item with no coverage at all is a critical gap; reference-only coverage is a common gap. Report gaps in the summary. Add the missing reference line (one table row, one option entry) because that is a fact edit. Do not write whole new guides, tutorials or explanation pages unless the user asks; hand that off as a normal writing task.

## Doc discoverability

Every doc file should be reachable from `README` or `CLAUDE.md` (or the docs index). When a change adds a doc or moves one, update the index and the links to it. Orphan docs are a finding.
