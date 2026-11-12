# Agent memory and instruction files

Agents carry two kinds of persistent text: instruction files in the repository (committed, shared) and memory kept outside it (per user, per project, not committed). Both can go stale and then mislead every later session. Sync both after code changes.

## Instruction files in the repository

| Agent | Files |
|---|---|
| Claude Code | `CLAUDE.md` (root and nested folders), `.claude/` rules and skills |
| Codex, many agents | `AGENTS.md` (root and nested) |
| Cursor | `.cursor/rules/*`, `.cursorrules` |
| GitHub Copilot | `.github/copilot-instructions.md` |
| Gemini CLI | `GEMINI.md` |
| Windsurf, Cline, Aider | `.windsurf/rules`, `.clinerules`, `CONVENTIONS.md` |

Update only the factual parts: commands, structure, architecture, environment, deployed hostnames, tool versions. Rules sections belong to the owner (see the protected text notes). Nested files apply to their folder; check the nested file closest to the changed code. Keep them short: every line is read in every session. If an edit would add more than a few lines, say so, because that costs tokens on every prompt (`lll:tokens`).

Files an instruction file imports (`@path/to/file`) are part of the same context; check the imported file too.

## Memory outside the repository

Claude Code's auto-memory lives in the Claude config folder under the project's own subfolder, typically `projects/<project-path-slug>/memory/` with an index file `MEMORY.md` and one file per memory. The slug is the project path with separators and punctuation turned into hyphens. The index holds one line per memory: a title link and a short hook. Each memory file usually has frontmatter (`name`, `description`, `type`) and a body. Find the folder from the session's own context first (the index is often loaded at session start); otherwise look in `~/.claude/projects/` (or the folder named by the config-directory setting) for the slug that matches the repository path. Other agents keep similar stores (Cursor and Windsurf memories, Copilot instructions, project knowledge in web tools); handle them the same way when the owner points at them.

### Procedure

1. Read the index, then every memory file whose title or hook relates to the changed area. Skip the rest.
2. For each memory, ask: does it state a fact the code now contradicts (a path, a command, a decision, a name, a limit, a status)?
   - **Contradicted and the rest is still useful**: edit the memory to the new fact and update its date or hook.
   - **Contradicted and nothing useful remains**: delete the memory file and remove its index line.
   - **Still true**: leave it alone.
   - **Preference or feedback about how to work** (tone, style, what the owner likes): never "correct" it from code. It is not a fact about the repository.
3. Fix the index line for every changed memory so the hook matches the content. Keep the index short; it loads into every session.
4. Do not add a memory for something the repository already records (code, docs, git history, `CLAUDE.md`). Memory is for what the repository cannot say: why a decision was made, who asked for what, constraints from outside, where an external system lives, personal preferences.
5. Do not store secrets, credentials or personal data in memory.
6. Memory is outside the repo, so it is not in the commit. List every memory edit or delete in the summary with the old fact and the new one.

### When edits are not allowed mid-session

Some owners batch changes to `CLAUDE.md`, `AGENTS.md` and `MEMORY.md` for the start of a session, because editing them mid-session invalidates the prompt cache and makes every later turn cost more. If the project's or user's instructions say so, do not edit them. Write the exact proposed edits (file, old text, new text, reason) in the summary instead.

## What goes stale most often

- Commands that were renamed (`npm run dev` → `pnpm dev`), moved scripts, changed ports.
- File and folder locations after a refactor.
- Hostnames, project ids and environment names after infrastructure moves.
- Decisions recorded as "we will do X" after X shipped or was dropped.
- Counts and lists of skills, commands, routes, packages or tables.
- Status lines: "WIP", "not yet implemented", "blocked on Y".
- Test and CI instructions after a runner or workflow change.
- Names of people or teams who own areas.

## Quick check for a stale instruction file

Run `node scripts/drift.mjs --root . --docs CLAUDE.md,AGENTS.md`, then walk the Commands and Architecture sections line by line against the manifest, the file tree and CI config.
