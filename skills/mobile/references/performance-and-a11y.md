# Performance and accessibility

Measure first, on a real mid-range or low-end device in a release (or profile) build. A debug build or a flagship phone hides the problems users see.

## Set budgets with the owner

Write them down before optimising. Starting points, adjust per product:

| Metric | Starting budget |
|---|---|
| Cold start to first usable screen | about 2 s on a mid-range device |
| Frame time | 16.6 ms at 60 Hz, 8.3 ms at 120 Hz; no dropped frames in scrolling and transitions |
| Interaction response | under 100 ms feedback to a tap |
| Memory | steady state does not grow over a 10 minute session |
| Download size | track every release; investigate jumps over 10 percent |
| Crash-free users and ANR/hang rate | the store's "bad behaviour" thresholds are published (retrieve the current numbers) and are the floor |

## Find the problem

| Platform | Tools |
|---|---|
| Android | Android Studio Profiler, Layout Inspector (recomposition counts), Perfetto/System Trace, Macrobenchmark for startup and scroll, Baseline Profiles, StrictMode in debug, LeakCanary, Play vitals, APK/AAB Analyzer, `bundletool` |
| iOS | Instruments (Time Profiler, Allocations, Leaks, Hangs, SwiftUI view body counts), MetricKit, Xcode Organizer, `os_signpost`, Xcode memory graph |
| React Native / Expo | React DevTools profiler, Hermes sampling profiler, Flashlight or Perfetto on Android, `expo export` bundle analysis, FlashList warnings, LogBox |
| Flutter | DevTools (performance overlay, rebuild tracking, CPU, memory), `--profile` builds, `flutter run --trace-startup`, Timeline |

Procedure

1. Reproduce the slow path with a concrete script (cold start, open the 5000-row list, scroll to the end).
2. Record a baseline number (median of 5 runs).
3. Profile; pick the biggest single cost, not the first suspicious line.
4. Change one thing; re-measure; keep it only if the number improved.
5. Add a guard (benchmark test, size check in CI, alert on startup time) so it does not regress.

## Common causes and fixes

Startup

- Heavy work in `Application.onCreate`, `didFinishLaunching` or root provider initialisation. Defer SDK init until first use (App Startup library, lazy init).
- Large JS bundle or eager imports (RN): inline requires, split rarely used screens, remove unused libraries, Hermes bytecode.
- Synchronous disk or network on the launch path. Show cached content first.
- Android: ship a Baseline Profile; avoid reflection-heavy DI at startup.

Jank

- Main-thread work: JSON parsing, image decoding, database reads, crypto. Move off main.
- Over-rendering: lists without stable keys, recomposition or rebuild storms, state held too high. Narrow the state, memoise, split widgets.
- Big images: resize, downsample, use the platform's image pipeline and caching.
- Overdraw and expensive effects (blur, shadows, large clip paths) on low-end GPUs.
- RN: animations on the JS thread; use native-driven or Reanimated worklets. Bridge chatter.
- Flutter: shader compilation jank is addressed by the current renderer; still avoid `saveLayer` heavy effects and `Opacity` over big trees.

Memory

- Leaks from retained Activities/Fragments/contexts, listeners not removed, coroutine scopes that outlive screens, closures capturing `self` strongly, navigation stacks that keep screens alive.
- Unbounded caches, large bitmaps, lists that hold every item in memory.
- Test: open and close the heaviest screen 20 times and compare heap snapshots.

Size

- Android: App Bundle, R8 shrinking and resource shrinking, drop unused ABIs where allowed, WebP/AVIF images, remove unused libraries, check `lib/` native sizes.
- iOS: App Thinning is automatic; check asset catalogs, on-demand resources, unused frameworks and bitcode-era leftovers.
- RN/Flutter: analyse the bundle; avoid pulling a whole utility library for one function; compress fonts and subset them.

Network and battery

- Cache with validators (ETag), compress, paginate, batch. Retry with exponential backoff and jitter; stop on offline.
- Replace polling with push where possible. Location: lowest accuracy that works, stop updates when not needed. Release wake locks and audio sessions.

## Accessibility

An app that cannot be used with a screen reader, large text or one hand fails real users and often store policy. Do the basics on every screen you touch.

Checklist

- [ ] Every interactive element has an accessible name and role. Icon buttons have labels.
- [ ] Reading order matches visual order; focus moves logically after navigation, dialogs and errors.
- [ ] Touch targets at least 48 dp on Android and 44 pt on iOS, with spacing.
- [ ] Text scales with the system setting up to at least 200 percent without clipping or overlap; layouts reflow.
- [ ] Contrast at least 4.5:1 for body text and 3:1 for large text and icons; information is not carried by colour alone.
- [ ] State is announced (selected, checked, disabled, expanded, loading, error). Errors are tied to their field and read out.
- [ ] Motion respects "reduce motion"; no flashing content; auto-playing media can be paused.
- [ ] Custom gestures have an accessible alternative (a button).
- [ ] Images carry alt text or are marked decorative; video has captions where speech matters.
- [ ] Works in landscape, with keyboard (external or switch), and with the system's bold text and high contrast.

API reminders

| Stack | Names |
|---|---|
| React Native | `accessible`, `accessibilityLabel`, `accessibilityRole`, `accessibilityState`, `accessibilityHint`, `importantForAccessibility` |
| Android Views and Compose | `contentDescription`, `Modifier.semantics { }`, `Modifier.clearAndSetSemantics`, `heading()`, `stateDescription` |
| SwiftUI | `.accessibilityLabel`, `.accessibilityValue`, `.accessibilityHint`, `.accessibilityElement(children:)`, `.accessibilityAddTraits`, Dynamic Type via system fonts and `@ScaledMetric` |
| Flutter | `Semantics`, `MergeSemantics`, `ExcludeSemantics`, `tooltip` |

Test with the real tools, not just by reading code

1. Turn on TalkBack (Android) or VoiceOver (iOS) and complete the main flow with the screen off or eyes closed.
2. Set font scale to the maximum: `adb shell settings put system font_scale 2.0` (reset with `1.0`); iOS Settings or the simulator's Dynamic Type control.
3. Run Accessibility Scanner (Android) and Accessibility Inspector (Xcode).
4. Check dark mode and high contrast.
5. Record findings with the screen name, the failing item and the user impact. Use `../../../shared/findings.md` format; lens `a11y`.

For visual design critique (hierarchy, spacing, motion) use `lll:ui`. For a repository-wide accessibility audit use `lll:audit` with the a11y lens.
