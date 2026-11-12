# Expo and React Native

Check the project's Expo SDK and React Native versions first (`package.json`, or the inventory output). Retrieve the matching Expo docs: SDK majors change defaults.

## Decide the shape

| Situation | Choice |
|---|---|
| New app, no unusual native code | Expo with Continuous Native Generation (CNG): `ios/` and `android/` are generated, ignored by git |
| Needs a native library Expo Go lacks | Development build (`expo-dev-client`), still CNG |
| Committed `ios/` and `android/` folders already hand-edited | Treat as bare. Do not run `prebuild --clean`; plugins no longer apply automatically |
| Brownfield (RN inside an existing native app) | Follow the RN brownfield docs; Expo modules still usable |

Pick CNG or bare per project and write the choice in the README. Mixing both silently loses native edits.

## Config

- `app.json` or `app.config.ts`. `ios.bundleIdentifier` and `android.package` are permanent once the app is in a store; confirm with the owner before touching them.
- Install dependencies with `npx expo install <pkg>` so versions match the SDK. `npx expo install --check` and `npx expo-doctor` are read-only health checks.
- Environment values: `EXPO_PUBLIC_*` are inlined into the bundle and are public. Real secrets live in the backend or in EAS secrets used only at build time for non-bundled things (signing, store upload). Never put an API secret, service-role key or private token in an `EXPO_PUBLIC_` variable.
- One version source: `version` in app config plus an auto-incremented build number via EAS (`cli.appVersionSource: "remote"` and `autoIncrement` on the production profile). Do not hand-edit build numbers in two places.
- Enable the New Architecture only as the SDK default allows; before disabling or enabling it, check each native library's support.

## Config plugins

Use a config plugin for any native change in a CNG project. Never edit generated `ios/` or `android/`.

1. Prefer an existing plugin or `expo-build-properties` before writing one.
2. Write plugins in TypeScript with `@expo/config-plugins` mods (`withAndroidManifest`, `withInfoPlist`, `withAppBuildGradle`, `withEntitlementsPlist`). `withDangerousMod` is the last resort.
3. Make them idempotent: running prebuild twice gives the same result.
4. Test in a throwaway copy of the project: `npx expo prebuild --no-install --platform android` then diff the generated manifest. Prebuild writes into the tree, so it is a fix-phase action, not an audit action.
5. Keep reasons in comments; a plugin that edits the manifest is invisible in code review otherwise.

## EAS (build, submit, update)

`eas.json` profiles:

| Profile | Use |
|---|---|
| `development` | `developmentClient: true`, internal distribution, debug config |
| `preview` | Release config, internal distribution (APK for Android, ad hoc or TestFlight for iOS), points at staging backend |
| `production` | Store build, `autoIncrement`, production backend |

Rules:

- Let EAS manage credentials unless the owner has existing ones; back up the Android upload keystore (`eas credentials`) outside the repo.
- iOS builds from Windows or Linux run on EAS servers. Ad hoc devices need `eas device:create`.
- `eas build --local` needs the platform toolchain (Android SDK, or macOS plus Xcode) on this machine.
- `eas submit` uploads to Play or App Store Connect. It is an owner action; credentials come from the owner's EAS account, an App Store Connect API key or a Play service account JSON kept out of the repo.
- Build failures: read the failing phase in the EAS log (install dependencies, prebuild, gradle, pod install, archive). Reproduce locally with the same Node, package manager and lockfile.

## Over-the-air updates (expo-updates)

- OTA replaces JavaScript and assets only. Anything native (new library, plugin change, SDK upgrade, permission, icon, splash) needs a store build and a new runtime version.
- `runtimeVersion`: use the `fingerprint` policy where available, or `appVersion` bumped by hand on native changes. A mismatch means devices ignore the update (safe); a wrong match means crashes (dangerous).
- Channels map builds to update branches: `production`, `preview`, `staging`. Test an update on `preview` first. Publish with `eas update --channel <name> --message "<what changed>"`.
- Rollback: republish the last good update or use the rollback command; verify on a device that the app picked it up (apps check on launch, then apply on next start by default).
- Both stores allow OTA for bug fixes and minor changes. Do not use it to change the app's primary purpose or bypass review.
- Wrap startup so a broken update cannot brick the app: keep an error boundary at the root and a crash-loop fallback if the project has one.

## Code patterns

Structure and state

- Feature folders (`features/<name>/{screens,components,hooks,api}`) over type folders once past a handful of screens.
- Navigation: Expo Router (file-based, typed routes) for new apps; React Navigation if already used. Deep links come from the route tree; keep the `scheme` and the universal-link hosts in config.
- Server state in TanStack Query (cache, retry, invalidation). Local UI state in `useState` or a small store (Zustand). Avoid putting server data in a global store.
- Forms: `react-hook-form` with `zod` schemas shared with the API types.
- TypeScript strict. Validate every network response at the boundary; never trust shapes.

Lists and rendering

- `FlatList` for simple lists, FlashList for long or complex ones. Always `keyExtractor`; stable item components wrapped in `React.memo`; no inline object or function props in rows; fixed item sizes where possible.
- Images: `expo-image` (caching, placeholders). Resize server-side; never ship a 4000 px photo to a 80 px avatar.
- Animations: Reanimated on the UI thread; avoid animating layout through JS state.
- Heavy JS work blocks the UI: move it out, chunk it, or run it natively. Check with the React profiler and the Hermes profiler.
- Safe areas (`react-native-safe-area-context`), keyboard avoidance, and Android edge-to-edge must be handled on every screen with inputs.
- Platform splits via `Platform.select` or `.ios.tsx` / `.android.tsx`; keep them thin.

Storage

| Data | Store |
|---|---|
| Tokens, small secrets | `expo-secure-store` (Keychain / Keystore). Size limits apply |
| Preferences, flags | MMKV or AsyncStorage |
| Relational, offline-first data | `expo-sqlite` with numbered migrations, one writer queue |
| Files and media | `expo-file-system` in the app sandbox; clean temp files |

Quality

- Lint and typecheck from package scripts; `npx expo-doctor`.
- Unit and component tests with Jest and React Native Testing Library; flows with Maestro or Detox.
- Error boundaries per route group; log unhandled promise rejections to crash reporting.
- Source maps uploaded for every release build, or crash stacks are unreadable.

## Common failures

| Symptom | Likely cause and fix |
|---|---|
| "Unable to resolve module" | Cache (`npx expo start -c`), missing dependency, wrong import case, workspace hoisting |
| Native module not found in Expo Go | Needs a development build |
| Two versions of `react` or `react-native` | Duplicate in a monorepo; dedupe with the package manager's resolutions |
| Pod install or Gradle OOM on CI | Pin the Node and JDK versions; raise `org.gradle.jvmargs`; clean caches |
| Works in dev, white screen in release | Missing Hermes-safe code, minification issue, env var absent at build time, or a failed OTA; check release logs and source maps |
| Push token missing | Permission not granted, no FCM or APNs credential, or running on a simulator |
| Android "App not installed" | Signature mismatch with an installed build; uninstall or use the same keystore |
| Store build rejected for a missing usage string | Add the iOS `infoPlist` reason via config; one per permission used by any library |

Hand security questions (token storage design, TLS pinning, jailbreak checks) to `lll:security`.
