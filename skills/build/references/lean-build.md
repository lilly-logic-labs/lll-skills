# Lean build

New behaviour, a product slice or an integration, built as a complete narrow outcome that fits the system, with an explicit stop condition. For features where overbuilding is the main risk.

## Procedure

1. **Derive acceptance and non-goals** from the request and the repository, in three to six lines:
   - Acceptance: observable results, including one failure path (what happens on bad input, upstream error, no permission).
   - Non-goals: the neighbouring things this will not do.
   - Stop condition: the check that, once it passes, ends the work.
   Ask the user only when two readings would produce materially different work; otherwise decide, state the reading in one line, and proceed.
2. **Trace the entry point through the layers** that own the invariants: route or screen, validation, domain logic, storage, background work, outbound calls. Read an existing feature of the same shape end to end and follow its structure (file layout, naming, error type, test style).
3. **Reuse the fitting seam.** Extend the existing module, table, component or job if one fits. If patching it would duplicate behaviour or hide the root cause, refactor first as its own step (safe-refactor rules), then build.
4. **Deliver a coherent end-to-end path**, narrow but complete across the responsible layers. Do not force the work into one file or one function to look small, and do not build a layer nothing yet uses.
5. **Omit** modes, providers, config, extension points and polish that acceptance does not need. Add a new surface (service, table, dependency, queue, setting, migration) only when the lifecycle requires it, and state the trade-off in one line.
6. **Test first** per behaviour (TDD rules in this skill). Cover the failure path from step 1.
7. **Exercise the path** for real: run the code, call the endpoint, open the screen on a device or emulator, send the event. A passing unit test does not show the wiring works.
8. **Stop** when acceptance passes. Report only material omissions and the trigger that would justify adding them ("no pagination: add when lists pass about 200 rows").

## Right-size checks

| Signal | Action |
|---|---|
| More than about 8 files or 2 new services | Pause. Is there a smaller arrangement with the same feature list? Move to `lll:plan` if the answer needs a decision. |
| A second subsystem is involved | Plan it. |
| You are inventing requirements | Delete them or ask. |
| You are about to add a dependency | Climb the ladder again; justify it in one line. |
| The user-visible states are unclear (loading, empty, error) | Decide them now; they are part of the feature (`lll:ui`). |

## Platform notes

- Web and backend: validate at the edge, make handlers idempotent where retries exist, return structured errors, log with identifiers.
- Mobile: handle offline and permission denied from the start; keep native modules at the boundary (`lll:mobile`).
- Desktop: window lifecycle, file access and update paths are part of the slice.
- LLM features: schema-validate model output, handle refusals and empty replies, cap spend (`lll:ai`).
- Data: reversible migration in the same slice (see the migration route).
