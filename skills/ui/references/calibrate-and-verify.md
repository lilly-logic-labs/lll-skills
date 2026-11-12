# Calibrate against real apps, and look at your work

Two practices: compare against how strong products solve the same problem (calibration), and always look at the rendered result (verification). The first stops you designing from memory; the second stops you shipping blind.

## 1. Calibration

Purpose: find the peer-group consensus (the floor) and the best divergence (one strong idea the consensus lacks). It is a measure, not something to copy.

### With Mobbin (when its MCP tools are connected)
1. Load the tools: search the available tools for `mobbin` (tools are named `mcp__mobbin__search_screens`, `search_flows`, `search_sections`, plus collection tools). If only an authenticate tool exists, start auth, give the owner the URL, continue marked "pending Mobbin" and do not block the task.
2. Name the pattern with one or two standard terms: onboarding, sign in, home, feed, detail, settings, profile, paywall, empty state, search, filter, tab bar, bottom sheet, toolbar, list, card, calendar, player, upload, delete confirmation, permission prompt. Add platform (`ios` or `web`; for Android work search iOS and translate to Material 3, and say so).
3. Query one screen or one journey with concrete elements, no adjectives or negations: "settings list with account section, notification toggles and a destructive delete row at the foot", not "clean modern settings". Naming an app filters to it ("Things today list").
4. Make at most three calls per task: one screen search (about 10 results), one flow search (about 5) for multi-step or motion, one page of follow-up. Pass the same one-sentence `task_intent` on each.
5. Result images expire; download rather than link if you keep them. Cite the app names. Describe what the image shows, not just metadata.
6. Extract one line per app: layout (top, middle, docked bottom), what the eye hits first, chrome (opaque, translucent, floating), primary action place and shape, empty/loading/error if shown, motion if shown, the one thing it does that others do not.
7. Conclude with the **consensus** (most apps do it) and the **best divergence**.

Use it:
- Build: the consensus is the default layout. Depart with a one-sentence reason. Take the divergence if it serves the product.
- Review: an unexplained departure from consensus is a finding. A hard-rule break in a consensus-matching design still blocks.
- Explore ("what do the best apps do for X"): return a table and two conclusions; no code.

### Without Mobbin
Name three or more strong products in the category from your own knowledge, state what each does for this pattern, and label the result "unverified against real screens". Do not invent details about specific screens. Ask the owner for screenshots of competitors when the decision matters.

### When to skip
A tweak to an existing, consistent screen; a purely internal admin tool where the project already sets the pattern; the owner's brief pins the design.

## 2. Verification: look at it

Drawing in code is drawing blind. Render, capture, view.

### Web
1. Start the app with the project's run command (the `run` skill finds it). Open it with a browser tool (`anthropic-skills:built-in-browser` or `chrome-browser`; deeper browser QA, auth flows or multi-page walks are `lll:research`).
2. Capture at 375, 768, 1024 and 1440 px wide; light and dark; full page where it scrolls.
3. Tab through the primary path; check focus visibility and order.
4. Toggle reduced motion (browser emulation) and throttle CPU/network.
5. Read the console for errors and warnings.
6. Force each state: add a failing response, an empty array, a very long string.
7. For layout detective work, query computed styles instead of guessing (`getComputedStyle` for font, colour, spacing; list elements under 44 px; check `document.fonts`).

### iOS / Android / cross-platform
1. Run on a simulator or emulator, ideally a physical device for feel. Capture the smallest and the largest shipped device and a tablet if supported.
2. Set the largest text size, dark mode, reduced motion, and a right-to-left locale if the app is localised.
3. Turn on VoiceOver or TalkBack for the primary task.
4. Force offline and slow network; kill and restore the app to test saved state.
5. Rotate; resize in multi-window; use a foldable emulator where relevant.
6. Capture a screenshot per state with the platform's tooling (`xcrun simctl io booted screenshot`, `adb exec-out screencap -p`).

### Desktop
Capture at minimum and maximum window size, 100 and 200 percent scaling, light and dark, keyboard only.

### If you cannot run anything
Say so. Review the code, mark motion, states, device behaviour and screen readers as unverified, and list the exact checks for the owner to run.

## 3. Comparing before and after

- Capture before editing. After editing, capture the same states at the same sizes and compare side by side.
- Flip horizontally and blur once to check hierarchy and balance.
- Keep captures out of the repository unless the project stores visual regression baselines; the project's own screenshot tests (Playwright, Storybook, Paparazzi, snapshot tests) are the right place for permanent proof.

## 4. Evidence rules

- Every finding cites `path:line` or a named capture.
- Computed values beat impressions: report the measured contrast ratio, size and gap.
- Do not paste personal data from screenshots into reports; describe the shape.
- Test against systems the owner controls; do not drive someone else's production site with writes.
