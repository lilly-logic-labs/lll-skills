# Safe refactor

Change structure while behaviour stays exactly the same. The proof that it stayed the same is established before the first structural edit and re-run after every step.

## Procedure

1. **State the boundary.** Write down what must not change: public interfaces, return values and types, error behaviour and messages callers match on, ordering, timing guarantees, side effects, persisted formats, log lines that tooling reads, and compatibility with callers you cannot see (published packages, other services, saved data). Also write the goal: what structure you want and why (one sentence). If the goal is "cleaner", name the specific pain it removes.
2. **Lock behaviour with tests before touching code.**
   - Existing tests that cover the area: run them, confirm green, note their count.
   - Gaps: write characterisation tests that record what the code does today, including its odd edges, from real inputs. They assert current behaviour, not what you think is right. A bug found this way is noted and left alone; fixing it is a separate change.
   - For code you cannot unit test (UI, glue): snapshot outputs, golden files, a scripted run, or screenshots before and after.
   - If no test can be written, say so, narrow the refactor to mechanical steps a tool performs, and ask before a larger one.
3. **Keep features out.** A refactor commit contains no behaviour change, no bug fix and no new feature. Make the change easy first, then make the easy change in a separate commit.
4. **Move one ownership boundary at a time.** One extraction, one rename, one move, one inlining per step. Prefer the language server or IDE refactoring (rename, extract, move, change signature) and codemods to hand edits: they update every reference.
5. **Keep every intermediate state buildable and green.** Run the focused tests after each step and the full suite after each commit. If a step breaks, revert that step and take a smaller one; do not push forward on red.
6. **Do not grow the surface.** No new dependency, config or abstraction unless the goal needs it. Do not leave both the old and new way in place: move the callers and delete the old path in the same change.
7. **Prove it.** Run the same proof as in step 2: same tests, same snapshots. Same count of passing tests plus the new characterisation tests. Diff public API listings (exports, signatures, route tables, schema dumps) before and after where tooling exists.
8. **Stop** when behaviour matches and the requested structure is reached.

## Tools by stack

| Stack | Rename / move / extract | API surface check |
|---|---|---|
| TypeScript | tsserver rename, `ts-morph`, `jscodeshift` | `tsc --noEmit`, `api-extractor` report |
| Python | `rope`, `ruff` fixes, IDE | `mypy`/`pyright`, `griffe` or `pydoc` listing |
| Go | `gopls` rename, `gofmt -r`, `gorename` | `go vet`, `apidiff` |
| Rust | `rust-analyzer` assists | `cargo public-api`, `cargo semver-checks` |
| Kotlin / Java | IDE refactorings | `binary-compatibility-validator`, `japicmp` |
| Swift | Xcode refactor menu | interface files, compiler |
| .NET | Roslyn refactorings | `PublicApiAnalyzers` |
| PHP / Ruby | IDE, `rector` (PHP), `parser` gems | route listing, `phpstan`, `sorbet` |
| Mobile | same as the language, plus before/after screenshots | store listing unaffected |

## Red flags

| Thought | Reality |
|---|---|
| "I will fix this bug while I am in here" | Separate commit, separate test. |
| "The tests are slow, I will run them at the end" | A break found at the end has twenty suspects. |
| "Behaviour is obviously the same" | Obviously the same is how orders, defaults and error messages change. |
| "I will keep both versions for now" | Two ways to do one thing. Move callers and delete in the same change. |
| "No tests exist, so none are needed" | No tests means the first step is characterisation. |

## Deliverable

A series of small commits, each green: `refactor(<scope>): <move>`. Final message: the boundary you held, how it was proved (commands and counts), what you noticed but left alone.
