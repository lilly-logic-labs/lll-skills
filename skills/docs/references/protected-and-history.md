# Protected text and history

What to leave alone, what to edit, what to ask about.

## Never edit (report instead)

- The owner's rules sections in `CLAUDE.md`, `AGENTS.md`, `.cursor/rules`, `.github/copilot-instructions.md`, `GEMINI.md` and similar: sections named Rules, Conventions, Preferences, Do and Don't, Style, Workflow rules, or anything written as an instruction to the agent. A rule the code breaks is a code issue; a rule that looks wrong is a question for the owner.
- Anything under `.claude/` except files the owner asked you to maintain, and the settings of any tool.
- Locked decisions: accepted ADRs, `DECISIONS.md` entries, product requirement text, legal and policy documents (privacy policy, terms), pricing pages and licence files. Fact errors in them (a wrong path or a renamed function inside an ADR) go to the owner.
- Released changelog entries and release notes: history. Only fix an obviously broken link or typo if the owner agrees.
- Third-party and vendored docs, generated output, lockfiles.

## Edit freely (facts only)

- Commands, project structure, architecture and "how to" facts in `README`, `CONTRIBUTING`, the Commands and Architecture sections of `CLAUDE.md` and `AGENTS.md`, package READMEs and `docs/**` reference pages.
- API docs and OpenAPI files, when the code is the source of truth and the file is hand-maintained.
- Env example files (names and placeholder values only).
- Code comments and docstrings next to the code you changed, when they now say something false.

## History: leave as written

Keep dated or point-in-time documents as they were, even when their content is now out of date. They record what was decided or found at the time:

- `docs/audits/`, `docs/plans/`, `docs/specs/`, retrospectives, postmortems, meeting notes, anything with a date in the filename or title.
- Accepted or superseded ADRs.
- Old release notes and migration guides for old versions.

To make the current state clear, edit the current doc, add a short superseded-by line in the history file only if the project does that already, and never rewrite the past.

## Ask first

- Changes to README introduction, positioning or marketing text, the security model, design rationale, philosophy or large rewrites (more than about ten lines in one section).
- Removing a whole section or page.
- Version bumps and release dates.
- Adding a new top-level doc or folder.
- Text that makes a legal, medical, financial or compliance claim.
- Anything that contradicts a stated locked decision.

## Order of authority

1. The project's own rules about documentation (in `CLAUDE.md`, `AGENTS.md`, `CONTRIBUTING`, a docs style guide).
2. The code and configuration as they are now.
3. Accepted decisions (ADRs, specs).
4. Everything else, including this skill.

If a doc folder has a style guide (voice, headings, terminology), follow it. If the project keeps a list of banned terms or a glossary, apply it to the lines you touch.
