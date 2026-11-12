# States: loading, empty, error, success, offline, partial

An interface is honest when every wait, failure, success and emptiness is designed. Use this to build the states, to find missing ones in a review, and to specify them.

## 1. Inventory every surface

For each screen, list the data it depends on and the actions it offers, then fill this matrix. A blank cell is a finding unless you can say why it cannot occur.

| State | Question it answers | Required |
|---|---|---|
| First load | "Is it working?" | skeleton or progress shaped like the content |
| Refresh / revalidate | "Is this current?" | old content stays; subtle indicator |
| Empty (never had data) | "What is this and what do I do?" | explanation plus one next action |
| Empty (filtered / no results) | "Why nothing?" | name the filter, offer clear/relax |
| Partial | "Some failed" | show what loaded; mark what did not; retry that part |
| Error (recoverable) | "What happened, what now?" | message plus retry or fix |
| Error (fatal) | "Is my data safe?" | plain statement, a way out, support path |
| Offline | "Am I connected?" | named state; reads from cache; writes queue |
| Permission denied / blocked | "Why can't I?" | say what is needed, link to settings or request access |
| Success | "Did it work?" | confirmation weighted to the action |
| Long / extreme content | "Does it break?" | truncation, wrap, overflow rules tested |
| First run | "Where do I start?" | one clear starting action |
| Stale / conflict | "Someone else changed it" | show both, let the person choose |

## 2. Loading

Perceived time is a design property. Unknown waits feel longer than known ones.

- Acknowledge input within 100 ms. A press that changes nothing on screen is a dead press, whatever the network does.
- Show an indicator only after about 300 ms so fast responses never flicker; once shown, keep it at least 400 ms.

| Expected wait | Pattern | Why |
|---|---|---|
| under 1 s | nothing, or an instant transition | a spinner flickers and reads as lag |
| 1 to 10 s | skeleton, or a spinner | enough to need a signal, too short to estimate |
| over 10 s | determinate progress, or named steps ("Uploading", "Processing") | a bare spinner past 10 s reads as frozen |
| unknown | skeleton or staged text | sets expectation without a false clock |

- Preference: skeleton, then progress bar, then staged text, then spinner.
- Skeletons match the real layout (same rows, same heights) and never animate faster than a slow shimmer; disable the shimmer for reduced motion.
- Refresh keeps existing content on screen. Do not blank a list to reload it.
- Pagination: infinite scroll needs a visible end and a way to the footer; "load more" is safer for accessibility.
- Long jobs: let the person leave and come back. Say where the result will appear.

## 3. Empty

Three parts: confirm it is expected ("No invoices yet"), say why if there is a reason ("No results for 'acme' in Paid"), give the next action ("Create invoice", "Clear filters").

- Distinct from loading and from error. A blank screen hides which of the three it is.
- Add a small visual only if it is meaningful; no stock illustration to fill space.
- Dashboards and charts with no data show the axes or an honest "No data for this range", never a fabricated sparkline.
- First-run empty is a teaching moment: show a sample or a single starting action, not a tour.

## 4. Errors

Answer in order: what happened, why (only if it helps), what to do next.

- Specific: "Your card was declined by your bank", not "Payment failed".
- Human: no codes, stack traces or internal names in the headline; a reference id in small text for support.
- Actionable: retry, fix this field, use another method, contact support.
- Non-blaming, even for user error. Our-side failures never blame the input.
- "Something went wrong. Please try again." says nothing about whether retrying helps. It is a finding.
- Placement: next to the thing that failed. Field errors under the field, in colour and text and icon. A page error at the top of the content. A toast alone is not enough for an error that needs action.
- Keep visible until resolved; do not clear on the first keystroke.
- Preserve input: a failed submit never clears the form. Autosave drafts for long forms.
- Move focus to the first error on submit; announce it to screen readers (`aria-live="assertive"` or an alert role; `role=alert`, Android `liveRegion`, iOS accessibility notification).
- Network vs server vs validation vs permission vs not-found are different messages and different actions. Do not collapse them.
- Retry with backoff for transient failures; show the retry count only if the person waits.

## 5. Success

Unacknowledged success makes people press twice.

- In-place change first: "Save" becomes "Saved" with a check, the new row appears highlighted.
- Toast or snackbar for low-stakes, reversible actions, with Undo. It auto-dismisses after about 4 to 6 seconds and is never the only record of something important.
- A full confirmation screen only for terminal or high-stakes outcomes (payment, submission, account deletion), stating what happens next.
- Use the same verb as the action: the button said "Publish", the confirmation says "Published".
- Prefer undo over "Are you sure?". Confirm only the irreversible, and name the object in the confirm ("Delete 'Q3 report'?").

## 6. Offline, partial and degraded

- Name the state: "You're offline. Changes sync when you reconnect." Do it once, in a place that does not shift layout.
- Read from cache, queue writes, show per-item sync status (pending, failed) and a retry. Never silently drop a write.
- Partial failure: render what you have. Mark the failed section in place with its own retry. One failed widget does not blank the page.
- A failed image keeps its space and alt text. A failed live feature falls back to a manual path.
- Timeouts: after a defined limit stop spinning and present the error state.
- Conflicts: show both versions and let the person choose; never overwrite silently.

## 7. Buttons and controls

| State | Requirement |
|---|---|
| default | affordant: contrast, shape, cursor |
| hover | pointer only, subtle (gate with `(hover: hover) and (pointer: fine)`) |
| focus | visible ring, 3:1 against its surroundings |
| pressed | feedback on pointer down, before async work |
| loading | spinner inside the button, label kept or changed to "Saving…", disabled so it cannot send twice, width does not jump |
| disabled | visibly distinct and the reason reachable (helper text, tooltip); not opacity alone; prefer enabled-with-validation over mystery-disabled |
| success / error | momentary in-place change |

Defects on sight: a loading button that still accepts a press; disabled by opacity only with no reason; a submit button that stays enabled for an invalid empty form with no message.

## 7b. Harden checklist (before ship)

Force each, then fix it by design (truncate with access to the full text, wrap, reserve space, keep input), not by hiding it.

- **Content:** empty; one item; 500 items; a 200-character name; a long string with no spaces; emoji and combining characters; right-to-left text; very large, very small, zero and negative numbers; missing optional fields; a date on a month or year boundary; another time zone; another locale's number format.
- **Network:** offline; slow (3G); a request that fails; a request answered twice; a stale cache; the tab backgrounded and resumed.
- **Interaction:** double tap; rapid back and forward; an interrupted gesture; rotate; split-screen; text at 200 percent; browser zoom; paste; autofill; hardware keyboard on a phone.
- **Permissions:** denied; revoked after grant; blocked by policy. Each shows the next step.

## 8. Build checklist

1. List data sources and actions; fill the matrix in section 1.
2. One shared component for skeleton, empty, error so the whole app speaks one way.
3. Model state as a single union (idle / loading / success / error / empty), not independent booleans that can contradict each other.
4. Test each state by forcing it: throttle network, return an error, return an empty array, return 500 items, return a 200-character name.
5. Capture a screenshot of each state, at the smallest width.

## 9. Worked example: "Save invoice" form

- Idle: Save enabled when the form is valid; invalid fields show errors on blur.
- Pressed: instant press feedback; button shows spinner and "Saving…", disabled, width fixed.
- Success: button reads "Saved" with a check for 1.5 s; toast "Invoice 1042 saved" with Undo; list row highlights.
- Validation error: focus moves to first bad field; error under it: "Enter an amount greater than 0".
- Network error: banner above the form: "Couldn't reach the server. Your changes are still here." with Retry. Input kept.
- Server rejection (duplicate number): message under the number field: "Invoice 1042 already exists. Use 1043?" with a one-tap fix.
- Offline: banner "You're offline. This invoice will save when you reconnect." Button reads "Save offline"; row shows a pending badge.
- Long content: 80-character customer name truncates with a tooltip; the layout does not move.
