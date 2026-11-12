# Native Android (Kotlin, Compose, Gradle, Play)

Check the project's AGP, Gradle, Kotlin and Compose BOM versions before using an API.

## Architecture

Follow the project's. If it has none and the app is more than a few screens, use layers with the dependency rule (outer depends on inner, never the reverse).

```
presentation (Compose screens, ViewModel, UiState)
      |  depends on
domain (entities, use cases, repository interfaces)   <- plain Kotlin, no Android types
      ^  implemented by
data (repository impls, Room, network, DTOs, mappers)
```

- Modules for scale: `:app`, `:core:{ui,network,database,common}`, `:feature:<name>`, `:data`, `:domain`. Do not split into modules before the build time or ownership problem exists.
- One use case, one action (`ObserveBudgets`, `AddExpense`). Skip use cases that only forward a call.
- ViewModel exposes one immutable `UiState` as `StateFlow`, takes events as functions, sends one-off effects through a channel or a state flag consumed once.
- Map at the boundaries: DTO to domain to UI model. Never pass Room entities or network DTOs to composables.
- DI: Hilt or Koin, whichever the project has. Inject dispatchers so tests can replace them.
- Persistence: Room with schema export and migration tests; DataStore for preferences; encrypted storage only through Keystore-backed APIs.
- Network: Retrofit or Ktor, timeouts set, retries with backoff for idempotent calls only, a single place that maps errors to domain errors.

## Compose

- State hoisting: composables take state and callbacks, stateless where possible. Collect with `collectAsStateWithLifecycle()`.
- Stability: prefer immutable data classes; annotate with `@Immutable` or `@Stable` only when true. Check recomposition counts (layout inspector) before optimising.
- Lists: `LazyColumn` with stable `key`s and `contentType`. No nested vertically scrolling lazies.
- Side effects: `LaunchedEffect(key)` for suspend work tied to keys, `DisposableEffect` for register/unregister, `rememberUpdatedState` for callbacks captured by long-lived effects. No work in the composition body.
- `derivedStateOf` for values derived from fast-changing state; `remember(key)` for expensive calculations.
- Navigation: Navigation Compose with typed routes; deep links declared in the graph and in the manifest.
- Theming: Material 3 theme object, no hard-coded colours or sizes in screens; support dark theme, dynamic colour optional, font scale up to 200 percent.
- Edge-to-edge is enforced on recent target SDKs; handle `WindowInsets` (system bars, IME, cutouts) on every screen.
- Previews for each state: loading, empty, error, content, large font.

## Gradle and build

- Version catalog (`gradle/libs.versions.toml`); one place for versions. Check the AGP, Gradle and Kotlin compatibility table before bumping any of them.
- KSP over kapt where the library supports it. Enable Gradle configuration cache and build cache; if the build breaks with them on, fix the task rather than disabling.
- Variants: `debug` (debuggable, cleartext allowed only for local hosts via network security config), `release` (R8 on, shrink resources). Flavors only for real product differences.
- Local checks: `./gradlew assembleDebug testDebugUnitTest lintDebug` (add `detekt` or `ktlintCheck` if configured). Release artifact: `./gradlew bundleRelease` (writes `build/`, so it is a build step, not an audit step).
- R8: keep rules in `proguard-rules.pro` for reflection users (serialization, Retrofit models, Room is generated). After enabling minify, test the release build on a device. Upload `mapping.txt` to crash reporting on every release.
- Baseline profile and a Macrobenchmark module for startup-critical apps (see the performance reference in the skill).
- Reproducibility: pin the JDK, commit the Gradle wrapper, avoid dynamic versions (`+`, `latest`).
- 16 KB page-size and other native-library requirements follow the target SDK. Check the current Play requirement for apps with `.so` files.

## Signing

- **Play App Signing**: Google holds the app signing key; you hold an upload key. Losing the upload key is recoverable via Play support; losing the app signing key of a non-enrolled app is not. Enrol.
- Keystore and passwords never in the repository. CI reads them from secrets; local builds read `keystore.properties` (ignored by git).
- Back up the upload keystore in two places and record its alias and SHA-1/SHA-256 fingerprints (needed for Google sign-in, Firebase, App Links).
- Debug builds use the debug keystore; its fingerprint is separate from release for every API that checks it.
- The application id is permanent once published.

## Play Console

| Track | Purpose | Notes |
|---|---|---|
| Internal testing | Fast team builds, available within minutes | Up to 100 testers; no review of testers list needed |
| Closed testing | Named groups or lists | Newer personal developer accounts may need a minimum number of testers over a minimum period before production access; retrieve the current rule |
| Open testing | Public beta | Appears on the store listing |
| Production | Everyone | Use staged rollout (start low, watch crash and ANR, then widen; halt if bad) |

Release steps for the owner: AAB with a higher `versionCode` than any previous upload, release notes, staged percentage, review of pre-launch report, then roll out. Declarations to keep current: Data safety, content rating, ads, target audience, app access (test login for reviewers), financial and health declarations when relevant, account-deletion URL, restricted-permission and foreground-service declarations. Details in the store release reference.

## Play Integrity

Use it to make abuse harder, not as authentication.

1. Request a verdict with a server-generated nonce bound to the action (request hash), so a captured token cannot be replayed.
2. Send the token to your server; decode and verify it server-side with Google's API. Never decide on the client.
3. Read device integrity, app integrity (the app is the one you published) and account licensing as needed.
4. Decide policy per action: block, step-up, or allow with monitoring. Handle API errors and quota with a fallback; do not lock out users on a transient failure.
5. Combine with server checks (rate limits, anomaly detection). A rooted or emulated device is a signal, not proof.

## Platform behaviours that bite

- Notifications: channels required; `POST_NOTIFICATIONS` runtime permission on recent Android.
- Background: Doze and App Standby defer work; use WorkManager for deferrable work, foreground services with declared types for user-visible long work, and exact alarms only when truly needed (permission rules apply).
- Storage: scoped storage; use the photo picker and the Storage Access Framework instead of broad media permissions.
- Process death: restore state from `SavedStateHandle`; never rely on singletons surviving.
- Back: predictive back and `OnBackPressedCallback`; no `onBackPressed` override on new targets.
- Multi-window, foldables, tablets, locale and RTL: test them once per release.
- App Links: host `/.well-known/assetlinks.json` with the release signing fingerprint; verify with `adb shell pm get-app-links <package>`.

## Kotlin idioms to prefer

Sealed interfaces for state and results; data classes for models; immutable collections in public APIs; `when` as an exhaustive expression; null-safety without `!!`; extension functions for small helpers; `value class` for ids; named arguments for boolean parameters; `require`/`check` for invariants. Coroutines and Flow rules are in the Flutter and Kotlin Multiplatform reference of this skill.
