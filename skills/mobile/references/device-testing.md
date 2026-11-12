# Device testing

Test the release-like build on a real device when you can, on an emulator or simulator when you cannot, and say which. The evidence tiers, the synthetic-input limits, the debug-only rules and the screen rubric are adapted from the gstack `ios-qa` and `ios-design-review` skills (MIT, see `NOTICE`).

## What each environment proves

| Environment | Proves | Does not prove |
|---|---|---|
| Unit/component tests | Logic and rendering of one unit | Permissions, deep links, push, OEM quirks |
| Emulator / simulator | Layout, navigation, most flows, logs | Real push delivery, sensors, performance, camera, biometrics, vendor battery limits |
| Real device | Everything above, plus real performance and push | Other models/OS versions |
| Cloud device farm | Many models in parallel | Your specific hardware setup |

Evidence tiers for reports (keep them separate): **fixture-driven** (mocked data), **real UI with test backend**, **real external success** (live provider, real push, real payment sandbox). Never report the first as the third.

## Android: adb and emulator

```
adb devices -l                                   # serials, authorised state
adb -s <serial> install -r app-release.apk
adb -s <serial> logcat -v time *:W               # warnings and errors; add --pid=$(adb shell pidof -s <package>)
adb shell am start -W -n <package>/<activity>    # -W prints startup time
adb shell am start -a android.intent.action.VIEW -d "<url>" <package>      # deep link
adb shell pm grant <package> android.permission.CAMERA                     # test permission paths
adb shell pm revoke <package> android.permission.CAMERA
adb shell pm clear <package>                     # fresh install state (deletes user data on the device)
adb exec-out screencap -p > screen.png
adb shell settings put system font_scale 2.0     # large text; reset to 1.0
adb shell settings put global window_animation_scale 0     # faster UI tests; reset to 1
adb bugreport report.zip
```

Emulator: `emulator -list-avds`, `emulator -avd <name>`; use Google Play system images when the app needs Play services. Network conditions through the emulator console; low-end profile with 2 GB RAM for stress.

## iOS: simulator and device (macOS)

```
xcrun simctl list devices available
xcrun simctl boot "<Device>"
xcrun simctl install booted <App>.app
xcrun simctl launch booted <bundle id>
xcrun simctl openurl booted "<url>"
xcrun simctl io booted screenshot screen.png
xcrun simctl push booted <bundle id> payload.apns
xcrun simctl privacy booted reset all <bundle id>
xcrun devicectl list devices                     # connected physical devices
```

Physical device: trust the Mac, enable Developer Mode, sign with a development profile. Choose the device explicitly when more than one is attached.

## QA loop (manual or agent-driven)

1. Define the goal and the termination condition for one flow ("sign up with email, reach the home screen, see the empty state").
2. Start from a known state: fresh install or cleared data, known test account, known backend environment (never production data).
3. Loop: capture screenshot and accessibility hierarchy, decide the next action, act, capture again, compare with the expected state, record any mismatch with steps.
4. Check logs after each flow: logcat or the device console, crash reporter, backend logs for the test user.
5. Repeat on a second form factor and with large text and dark mode.
6. Report each issue with: steps, expected, actual, screenshot, device and OS, build number, severity per `../../../shared/findings.md`.
7. Hand fixes to `lll:debug` (root cause) and `lll:build` (change). Reproduce before fixing; keep the reproducing steps or snapshot as the regression test where possible.

Known limits of synthetic input

- Tools that inject touches may not reach custom gesture views (canvas, drag, pan). Cover those with the framework's own UI tests or expose a debug-only test hook.
- Accessibility trees can be sparse in custom or rendered-in-canvas UIs (games, Flutter without semantics); label things so tests and screen readers can find them.
- A timed-out or lost tap response must not be retried blindly; look at the screen first.

## ARTEMIS tools (Android, when connected)

ARTEMIS runs an autonomous agent on an Android device or emulator. Tools: `mobile_diagnose`, `mobile_run_task`, `mobile_manage_task`, `mobile_get_device_state`, `mobile_inspect_trace`.

1. **Failure or no device**: call `mobile_diagnose` first. Follow its `next_steps` in order; `attempt_fix` only applies safe self-heals; `launch_avd` boots an installed emulator in the background (then re-check after about a minute).
2. **Several devices attached**: confirm the target serial with the user (`adb devices -l`) and pass `device_serial`.
3. **Start a task**: `mobile_run_task` with a self-contained `task_desc`: starting state, exact steps, and the stop condition. It is one-shot and non-blocking.
   - `Flash` for short, deterministic paths. `Pro` for exploratory or multi-branch flows, or when you need ADB shell, logs, verification and a written report (`expected_output_desc`, `verification_level`).
   - `locked_app_package` keeps it inside the app under test. `app_path` installs an APK first.
4. **Poll**: set a timer and call `mobile_manage_task` with `status` at least once a minute; tasks can stall silently. Use `inject_instruction` to steer; `stop` to terminate.
5. **Verify**: `mobile_inspect_trace` (`view_summary`, `search`, `view_step_screenshots`, `view_step_details`) to confirm what the agent really did, and read the task's stderr log for tracebacks. Do not accept a "success" claim without checking the final screenshot.
6. **Look at the device yourself**: `mobile_get_device_state` with `screenshot` or `hierarchy`.
7. Once a flow is understood, turn it into a deterministic script (Maestro, Espresso) and stop delegating it.
8. Use test accounts and non-production backends only. The agent can tap anything on the screen, including "Delete account" and "Pay".

## Automated UI test frameworks

| Framework | Platforms | Notes |
|---|---|---|
| Maestro | Android, iOS, RN, Flutter | YAML flows, quick to write, good smoke suite; needs stable accessibility ids or text |
| Detox | React Native | Gray-box synchronisation; needs dev setup per platform |
| Espresso / Compose UI test | Android | In-process, fast; `createComposeRule`, semantics matchers, idling resources |
| XCUITest | iOS | Apple's UI test runner; use `accessibilityIdentifier` |
| Flutter `integration_test` | Flutter | Runs the real app on a device; `flutter test integration_test` |
| Appium | all | Cross-platform WebDriver; slower, useful for device farms |

Rules for stable UI tests: select by accessibility id or role, never by coordinates or by text that changes with locale; wait on conditions, never fixed sleeps; seed data through the API or a test hook; clear app state per test; one assertion path per user outcome; run on CI against an emulator image pinned by version; keep the smoke suite under ten minutes and run it on every merge.

## Screen review rubric (functional and accessibility)

Use after a device run to score each screen from 0 to 10 and say what would make it a 10. Adapted from gstack iOS design review (MIT). Visual design critique and polish belong to `lll:ui`.

1. Typography follows the platform scale and supports large text.
2. Spacing consistent; safe areas and insets respected.
3. Colour hierarchy: primary action clear, destructive actions distinct, contrast meets 4.5:1 for body text, dark mode correct.
4. Touch targets 44 pt or 48 dp minimum.
5. Loading, empty and error states exist and tell the user what to do next. No blank screens during async work.
6. Accessibility: labels, order, large text, reduce motion.
7. Animation short and purposeful; no more than a couple at once; reduce-motion respected.
8. Uses native components and conventions of the platform.
9. Content fits without horizontal scrolling; long screens have structure.
10. No placeholder data, lorem ipsum, debug labels or untranslated strings.

## Debug-only instrumentation

QA bridges, state servers and test hooks are allowed only in debug builds:

- Compile them out of release (`#if DEBUG`, Debug-only package conditions, `BuildConfig.DEBUG`, separate source sets).
- Use an isolated bundle id / application id suffix for QA builds so they coexist with the production app and cannot touch production data.
- Bind servers to loopback, require a per-launch token, and never log the token.
- Before archiving or bundling a release, check the artifact: search for the debug symbols/strings (`strings`, `nm`, `apkanalyzer`, `unzip -l`), confirm `android:debuggable` is false.
- Remove the bridge when QA ends if it is not part of the project's test strategy.

## Windows desktop apps (end-to-end)

For WPF, WinForms, WinUI, UWP, Electron, Tauri and Wails apps on a Windows host.

| App type | Driver |
|---|---|
| Electron | Playwright `_electron.launch` (pinned version declared by the project) |
| Tauri / Wails (WebView2) | `tauri-driver` WebDriver, or Playwright attached over the WebView2 DevTools port |
| WPF / WinForms / WinUI / UWP | UI Automation via FlaUI (.NET), `pywinauto` with the `uia` backend, or Appium Windows driver (check its maintenance status) |
| Win32 / legacy | `pywinauto` `win32` backend or AutoHotkey |

Rules

1. Tests need an interactive desktop session; a Windows service or a locked session cannot click. CI runners with a desktop (for example GitHub's Windows runners) are fine.
2. Give controls stable identifiers (`AutomationId`, `data-testid`); dump the tree with Inspect.exe or Accessibility Insights to find them.
3. Isolate state: a temp user-data directory per test, a seeded database, a fixed locale and display scale (100 percent or the scale you test on).
4. Wait for conditions (window exists, control enabled), never for fixed delays.
5. Kill the process tree in teardown; capture a screenshot and the app log on failure.
6. Test installers and updaters on a clean VM or sandbox, not on the dev machine.
7. Run high-DPI and multi-monitor checks manually once per release.
8. Never automate against real accounts or production services.
