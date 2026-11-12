# Flutter, Compose Multiplatform and Kotlin coroutines

Check `pubspec.yaml` (Flutter and Dart SDK constraints) or the Kotlin and Compose Multiplatform versions first.

## Flutter and Dart

Language

- Null safety everywhere. No `!` without a comment saying why it cannot be null; prefer `?.`, `??`, pattern matching.
- `final` by default, `const` constructors and widgets wherever possible.
- Dart 3: sealed classes with exhaustive `switch` for state and results, records for small tuples, pattern matching for destructuring.
- Immutable models with `copyWith` (hand-written, `freezed` or `built_value`, whichever the project uses). JSON through `json_serializable` or `freezed`; validate unknown payloads at the boundary.
- `async`/`await` with try/catch at one layer; do not leave futures unawaited without `unawaited(...)` and a reason. Heavy CPU work in `Isolate.run` (or `compute`); never in the UI isolate.

Widgets and state

- Small widgets, `const` where possible, keys for reorderable lists. Rebuild the smallest subtree (`Consumer`, `BlocBuilder`, `select`).
- State management: whatever the project uses (Riverpod, Bloc or Cubit, Provider). New code follows the same one. Keep business logic out of widgets; repositories behind interfaces; `AsyncValue` or sealed state for loading, data and error.
- Navigation: `go_router` (declarative, deep-link friendly) or the project's choice. Typed routes where supported.
- Lists: `ListView.builder` / slivers, `itemExtent` or `prototypeItem` when sizes are fixed, `cacheExtent` only with a reason.
- Layout: `LayoutBuilder` and `MediaQuery` for adaptive layouts; `SafeArea`; text scaling up to 200 percent.
- Theming: one `ThemeData` (Material 3) and design tokens; no colours in widgets.
- Accessibility: `Semantics`, `ExcludeSemantics` sparingly, `tooltip`s on icon buttons, minimum 48 logical pixel targets.
- Platform code: `MethodChannel` or `pigeon` for typed channels, FFI for native libraries. Wrap in a Dart interface so tests can fake it.
- Flavors: `--dart-define-from-file=env/dev.json` plus platform flavors. No secrets in `dart-define` (it ends up in the binary).

Quality and release

```
dart format --set-exit-if-changed .
flutter analyze
flutter test
flutter test integration_test        # on a device or emulator
flutter build appbundle --release --obfuscate --split-debug-info=build/symbols
flutter build ipa --release --obfuscate --split-debug-info=build/symbols     # macOS only
```

Building writes files; run builds in a fix phase or on request. Keep `build/symbols` and upload it to crash reporting so obfuscated stacks can be read. Profile performance only in `--profile` mode on a real device (debug mode is not representative). Use DevTools for rebuild counts, frame times and memory; Impeller is the renderer on current iOS and Android.

Crash handling: set `FlutterError.onError` and `PlatformDispatcher.instance.onError`, and run `runZonedGuarded` only if the project needs it.

Packages: prefer maintained, null-safe packages with a verified publisher; check `flutter pub outdated` and licences; pin for apps.

## Compose Multiplatform (CMP) and Kotlin Multiplatform (KMP)

Structure

```
shared/
  src/commonMain     // domain, data interfaces, shared UI, ViewModels
  src/androidMain    // actual implementations (Android)
  src/iosMain        // actual implementations (iOS)
  src/desktopMain    // desktop JVM
androidApp/  iosApp/  desktopApp/
```

- Share the domain and data layers first, UI second. Sharing UI with Compose Multiplatform is stable on Android, desktop and iOS in current releases, but verify the status for your Compose Multiplatform version.
- `expect`/`actual` only for small platform capabilities. Prefer an interface in `commonMain` implemented per platform and injected (Koin or manual DI).
- Libraries that work in common code: Ktor (network), kotlinx.serialization, kotlinx.coroutines, kotlinx.datetime, SQLDelight or Room KMP (database), DataStore (preferences), multiplatform settings.
- ViewModels: KMP lifecycle ViewModel with `StateFlow`; keep the UiState a plain data class.
- Navigation: Navigation Compose multiplatform, Decompose or Voyager; deep links are platform-specific wiring.
- Resources: the Compose Multiplatform resources library (`Res.string`, `Res.drawable`) in `commonMain`; localisation in the same place.
- iOS interop: expose the shared framework to Swift; use SKIE or hand-written wrappers for sealed classes and Flow; embed Compose through `ComposeUIViewController`; embed native views via the interop APIs.
- Platform differences to test: insets and keyboard, back handling (Android) versus swipe-back (iOS), fonts, text input, accessibility, file access.
- The iOS framework builds only on macOS. On other hosts say it is unverified.
- Tests: `commonTest` with `kotlin.test`, coroutine tests with `runTest`, flows with Turbine; UI tests per platform.

## Kotlin coroutines and Flow rules

Scope and structure

- Every coroutine has an owner scope: `viewModelScope`, `lifecycleScope`, a scope tied to a repository's lifetime. No `GlobalScope`.
- Suspend functions are main-safe: they switch dispatcher inside (`withContext(ioDispatcher)`), so callers need not.
- Inject dispatchers (`CoroutineDispatcher` parameters) instead of hard-coding `Dispatchers.IO`.
- `supervisorScope` or `SupervisorJob` when one child failing must not cancel siblings; otherwise let failures propagate.
- Exceptions: `launch` propagates to the scope handler; `async` throws at `await`. Never swallow `CancellationException`; rethrow it. Catch specific exceptions, not `Throwable`.
- Cancellation is cooperative: long loops call `ensureActive()` or use suspending calls. Use `NonCancellable` only for cleanup.
- Do not call `runBlocking` in production code except at program entry points and tests.

Flow

- Cold flows (`flow { }`) restart per collector. Use `StateFlow` for observable state with a current value, `SharedFlow` for events that need replay semantics, a `Channel` for one-shot commands.
- Expose state from a ViewModel with `stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), initial)`; expose it read-only.
- Collect in the UI lifecycle-aware: `collectAsStateWithLifecycle()` in Compose, `repeatOnLifecycle(STARTED)` in views. Collecting in a bare `lifecycleScope.launch` keeps working in the background.
- Operators: `combine` for multiple sources, `flatMapLatest` for switching on input, `debounce` for search input, `distinctUntilChanged`, `catch` for upstream errors, `onStart`/`onCompletion` for loading state. `flowOn` changes the upstream dispatcher only.
- Backpressure: `buffer`, `conflate`, `collectLatest` when consumers are slower than producers and only the latest matters.
- Do not emit from different coroutines in a plain `flow { }`; use `channelFlow` or `callbackFlow` (with `awaitClose`).

Testing

- `runTest` with a `TestDispatcher`; advance virtual time instead of sleeping.
- Turbine (`test { awaitItem() }`) for flows; assert emissions and completion.
- Replace `Dispatchers.Main` in unit tests with a test rule.

Common bugs to look for in review: collecting a flow in `onCreate` without lifecycle awareness; a `StateFlow` mutated from many places; swallowed cancellation; `Dispatchers.IO` inside a repository that tests cannot replace; unbounded `SharedFlow` replay holding memory; `viewModelScope.launch` doing blocking I/O on Main.
