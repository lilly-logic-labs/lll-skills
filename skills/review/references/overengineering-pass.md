# Over-engineering pass

A focused review of a diff, branch or file for code that should not exist or should be smaller. It looks for what can be deleted, replaced by the standard library or the platform, or never built. It does not hunt for bugs; correctness is the main review. To apply cleanups automatically, the built-in `/simplify` does that. This pass reports.

## Method

1. Read the intent first. You cannot say something is unnecessary until you know what it is for.
2. Walk the diff top to bottom. For each added function, class, file, option and dependency, run the ladder in order and stop at the first rung that holds:
   1. Is it needed at all? (no caller, speculative, gold-plating)
   2. Is it already in the repository? (helper, type, component, pattern)
   3. Does the standard library do it?
   4. Does the platform or framework do it natively?
   5. Does an already-installed dependency do it?
   6. Can it be one line, or a simple expression?
3. For each hit, name the replacement and estimate lines saved.
4. Do not flag what is genuinely needed. Validation at trust boundaries, error handling that prevents data loss, security measures and accessibility basics are not over-engineering.

## Tags

One finding per line: `path:line tag: what is wrong -> what replaces it (about N lines saved)`.

| Tag | Use for | Example |
|---|---|---|
| `delete` | Dead or unused code, unreachable branch, unused export, commented-out code, unused parameter, a file nobody imports | `utils/format.ts:12 delete: exported, no importers -> remove (about 18 lines)` |
| `stdlib` | Hand-written code for what the language or runtime provides | `lib/chunk.js:3 stdlib: manual loop -> built-in chunk/batch helper, or a two-line slice loop` |
| `native` | A library or custom code where the platform or framework has the feature | `Datepicker.tsx:1 native: picker library for a date -> input type="date"` |
| `yagni` | Abstractions and options without a second user: interface with one implementation, factory for one product, config for a constant, plugin system for one plugin, feature flag nobody flips, parameter always passed the same value | `PaymentProviderFactory.ts yagni: one provider -> call it directly` |
| `shrink` | Correct but too long: needless intermediates, verbose conditionals, wrapper functions that only delegate, premature layering | `service.py:40 shrink: five-step loop -> comprehension (about 8 lines)` |
| `dep` | New dependency for a few lines of code, or a heavy one for a small need | `package.json dep: left-pad style package -> three lines` |
| `reuse` | Duplicates something that exists elsewhere in the repository | `api/helpers.go:77 reuse: same as pkg/httpx.Retry -> call it` |

## What counts as over-engineering

- Layers that only forward calls; repository + service + manager + facade for one table.
- Generic frameworks built for one use; configuration for values that never change; options nobody asked for.
- Wrapper types that add no behaviour; deep inheritance for two cases; patterns used because they have names.
- Defensive code for states the types or callers already exclude (distinct from validation at trust boundaries).
- Premature optimisation without a measurement; caches without a measured miss cost.
- Custom implementations of standard algorithms, parsers, date handling, retry loops, crypto (crypto is also a security finding).
- Scaffolding for later: unused modes, providers, hooks, empty directories, TODO frameworks.
- Tests that restate the implementation line by line (mirror tests) while missing behaviour.

## What not to flag

- Code required by the project's conventions even if verbose.
- Complexity that is the actual product (a parser in a parser project).
- Simplifications that change behaviour. If shrinking changes behaviour, say so and make it a question.
- Taste in naming or formatting.
- Repeated code when abstraction would couple unrelated things; three similar lines are cheaper than a wrong abstraction.

## Output

```
Over-engineering pass: <scope>
<findings, one per line, ordered by lines saved>
Total: about <N> lines removable, <M> dependencies avoidable.
Keep as is: <anything that looked heavy but is justified, one line each>
```

Rules:
- Order by lines saved, biggest first.
- If nothing is over-engineered, say "Clean" and stop. Do not invent findings.
- A bug found in passing, report it separately with the normal finding block.
- Applying the cleanups is a build task (`lll:build`, safe-refactor route) with tests kept green; do not mix it into a feature commit.

## Intensity

- **Quick** (default): top findings only, no more than ten lines.
- **Thorough** (user asks): every hit, with replacement snippets for the larger ones.
