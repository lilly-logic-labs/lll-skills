# Forms, navigation, onboarding and microcopy

The highest-friction surfaces. Use when building or reviewing any form, menu, flow, first-run or UI text.

## 1. Forms

Forms are where people abandon. Every field costs.

### Structure
- Ask only for what this task needs now. Each optional field you remove raises completion. Collect the rest later, in context.
- One column. Labels above fields. A visible label always: a placeholder is a hint, never the only label (it disappears on input).
- Group related fields under a heading; order follows the person's mental model, not the database.
- Put the control next to what it changes. Settings: the toggle beside the sentence it affects.
- Multi-step only when the task has natural stages; show progress ("Step 2 of 4") and allow Back without data loss.
- Mark the minority: if most fields are required, mark optional ones "(optional)". Avoid red asterisks as the only signal.

### Inputs
| Data | Use |
|---|---|
| Email | `type="email"`, `autocomplete="email"`, `inputmode="email"`; iOS `.emailAddress` and `textContentType`; Android `KeyboardType.Email` |
| Phone | `type="tel"`, numeric keypad, accept spaces, dashes, brackets; format after, do not reject |
| Password | show/hide toggle, paste allowed, `autocomplete="new-password"` or `current-password`, rules shown before typing |
| One-time code | `autocomplete="one-time-code"`, `inputmode="numeric"`, auto-advance, paste whole code |
| Date | native picker on mobile; typed entry on desktop with a clear format; never three dropdowns for a birth date |
| Choice 2 to 5 | radio / segmented control; 6 to 15 select; more than that, searchable combobox |
| On/off | switch for immediate effect; checkbox for "applied on submit" |
| Amount | numeric input, currency symbol outside the field, locale-aware separators |
| Address | one search field with autocomplete plus manual fallback |

- Format on blur, never reject valid input because of punctuation or spaces.
- Smart defaults, always overridable. Remember the last choice where safe.
- Support autofill and password managers; do not block paste.
- Autofocus only when one field is the whole purpose of the screen (search, a code entry, the first field of a short sign-in). Never autofocus on a page people arrive at to read, on mobile where it raises the keyboard over content, or on a modal's close or destructive button.

### Validation
- Validate inline, on blur, not on every keystroke. Once a field is in error, re-validate as they type so the error clears the moment it is fixed.
- Error text under the field in colour, icon and words. Say how to fix: "Use 8 or more characters", not "Invalid".
- On submit with errors: focus the first invalid field, scroll it into view, summarise at the top for long forms and link each item to its field.
- Prevent errors: constrain input (stepper, picker), explain format with an example, disable only when you also say why.
- Double-submit guard: the submit disables itself and shows progress. Idempotency key on the server for payments.
- Never clear the form on failure. Keep drafts for long forms (local storage or the platform's saved state).
- Accessibility: `<label for>` or programmatic association, `aria-describedby` for hints and errors, `aria-invalid`, `required`, and `autocomplete` tokens (WCAG 1.3.5).

### Destructive and risky actions
- Prefer undo to confirmation. For the irreversible: name the object and consequence in the dialog, label the button with the verb ("Delete project"), make Cancel the default focus, use type-to-confirm only for catastrophic actions.
- Separate destructive from primary visually and spatially.

## 2. Navigation

Answer on every screen: where am I, where can I go, how do I get out.

### Choosing a pattern
| Situation | Pattern |
|---|---|
| 3 to 5 top-level destinations, phone | bottom tab bar (iOS tab bar, Material navigation bar) |
| 5 to 7 destinations, tablet or desktop | navigation rail or sidebar |
| Many destinations, hierarchy | sidebar with groups; breadcrumbs for depth |
| Marketing site | top bar with 4 to 6 links, one primary CTA, footer for the rest |
| Drill-down detail | push navigation with a back button |
| Self-contained task or short form | modal sheet with a close or cancel |
| Rare utilities | overflow menu or "More" |

- Hamburger menus on phones hide the main destinations and lower use. Keep primary destinations visible.
- The current location is marked (selected tab, `aria-current="page"`), and the label matches the destination's title.
- Back always works and goes where people expect. Preserve scroll position and filters on return.
- State lives in the URL on the web: filters, tabs, pagination, selected item. Deep links work.
- Search: visible where content is large; recent searches and empty-result guidance.
- Convention is the floor (Jakob's law). Departing from it must solve a stated problem and be taught.
- Platform: iOS uses back swipe and large titles; Android uses predictive back and the system bar; desktop expects keyboard shortcuts and menus. Do not ship the other platform's navigation unchanged.

## 3. Onboarding and first run

Goal: reach the first moment of value fast. The best onboarding is a product that needs none.

1. Name the activation moment (first invoice sent, first file synced). Cut every step before it that is not required.
2. Defer sign-up and permissions until the value is clear. Ask for a permission at the moment it is needed, with one line saying why, and handle "denied" gracefully.
3. Show, do not tell: a sample project, a pre-filled example, a checklist that completes as they act. Carousels of screenshots are skipped.
4. Allow skip on every step, resume later, and never trap the person in a tour.
5. Progress is visible ("2 of 3") and honest. The final screen goes into the product, not a dead-end "You're all set".
6. Empty states double as onboarding: the first empty list shows the one starting action.
7. Coach marks: one at a time, anchored to the real control, dismissible, shown once.
8. Measure it: the funnel from install to activation, drop-off per step. Analytics wiring is `lll:analytics`.

## 4. Microcopy

Words are interface. Treat them like spacing: fewer, exact.

- Name things by what the person understands, not how the system is built. "Notifications", not "Webhook configuration".
- Buttons: verb plus object. "Save changes", "Send invoice", "Create project". Not "Submit", "OK", "Continue" when something more specific exists.
- Keep one name per action through the whole flow: the button says "Publish", the toast says "Published", the history says "Published by Sam".
- Sentence case for UI. Title Case only for proper nouns and platform conventions that require it.
- Active voice, plain verbs, no filler. "We couldn't save your changes" over "Your changes could not be saved due to an error".
- Errors: say what, why if useful, what next. No apology theatre, no "Oops". Never blame.
- Empty states: an invitation to act, not a mood.
- Confirmation dialogs: title states the action, body the consequence, buttons the verbs.
- Loading text ends with a real ellipsis: "Saving…".
- Numbers and dates in the locale; relative time ("2 hours ago") with the exact time on hover or long press.
- Instructions longer than one sentence mean the design failed. Fix the interaction, then cut the text.
- Cut happy talk: "Welcome to", "We're thrilled to", self-praise. If deleting 30 percent of the words improves it, delete them.
- Avoid buzzwords (seamless, effortless, supercharge, streamline, unlock, revolutionise). Say what the product does.
- Do not invent claims, prices, testimonials or legal text. Ask the owner.
- All strings go through the project's i18n. Leave room for 30 to 40 percent expansion; avoid concatenated sentences; use plural rules, not "(s)".

## 5. Checklist

1. Every form field earns its place; labels visible; right input type and keyboard.
2. Inline validation on blur; errors name the fix; focus moves to the first error.
3. Submit cannot double-send; failure keeps the data.
4. Primary navigation visible; location marked; back works; URL holds state.
5. First run reaches value in the fewest steps; permissions asked in context.
6. Buttons name the outcome; one name per action.
