---
name: mobile
description: Build, fix, review and release mobile apps on Expo and React Native, Android (Kotlin, Compose), iOS (SwiftUI) or Flutter. Covers EAS, signing, Play Console, TestFlight, store rejections, permissions, deep links, push, offline, crashes, performance, device testing. Use when the user says app, APK, IPA, Expo, Play Store, App Store. Not for UI critique (lll:ui) or security audits (lll:security).
metadata:
  origin: lll
---

# Mobile

Ship a mobile app that builds, runs on real devices, passes store review and survives production.
Works on Expo or React Native, native Android, native iOS, Flutter and Kotlin or Compose Multiplatform, and learns the stack from the project.

## When to use

- Writing, changing or debugging an app screen, native module, config plugin, Gradle or Xcode setting, navigation, state, storage or sync.
- Build, signing, versioning, EAS, Fastlane, Play Console tracks, TestFlight, OTA updates, store listing, review rejection.
- Permissions, deep links and app links, push notifications, background work, offline storage, crash reporting.
- Slow start, jank, memory, app size, battery, accessibility on device.
- Testing on an emulator, simulator or real phone, including ARTEMIS device tools when connected.
- Windows desktop app end-to-end tests (see [device testing](references/device-testing.md)).

## When not to use

- Visual design critique or polish of screens (typography, spacing, motion): `lll:ui`. This skill checks that screens work and are accessible, not whether they are beautiful.
- Security audit of the app or its backend: `lll:security`. Mobile-specific storage and transport rules are listed here as engineering defaults only.
- Backend on Cloudflare: `lll:cloudflare`. LLM features inside the app: `lll:ai`.
- Planning a new app or feature before code: `lll:plan`. Reading an unfamiliar app repository: `lll:onboard`.
- Pre-launch and day-0 checks of a website: `lll:launch`. Store listing copy and campaigns: `lll:marketing`.

## Modes

- **Guidance** (default): answer, write or review inline. Edit only what was asked. No subagents. Builds and device runs only if the user wants them.
- **Full**: only when the user asks for a release-readiness review or a whole-app mobile audit. Read-only: no `prebuild`, no builds that write into the tree, no store or console changes. Run the inventory script, walk [the release checklist](references/store-release.md), write a report per `../../shared/report.md` with findings per `../../shared/findings.md`, fix per `../../shared/fix-phase.md`. Subagents per `../../shared/agents.md`.

## Steps

1. **Learn the project.** `../../shared/stack-detect.md`, then run the inventory (read-only, zero dependencies):
   `node scripts/mobile-inventory.mjs <project folder>`
   It prints stacks, application ids, versions, SDK levels, permissions, deep links, known SDKs, signing and service files (locations only) and risky settings. Then check what this machine can do: `adb devices -l`, an emulator, Xcode (macOS only; on Windows or Linux iOS builds go through EAS cloud builds, a Mac or CI).
2. **Classify the task** and open the matching reference:

   | Task | Read |
   |---|---|
   | Expo, React Native, EAS, config plugins, OTA | [expo-react-native](references/expo-react-native.md) |
   | Kotlin, Compose, Gradle, signing, Play Console, architecture | [android-native](references/android-native.md) |
   | SwiftUI, Swift concurrency, Xcode, signing, TestFlight, on-device models | [ios-native](references/ios-native.md) |
   | Flutter, Dart, Compose Multiplatform, KMP, coroutines and Flow | [flutter-and-kmp](references/flutter-and-kmp.md) |
   | Permissions, deep links, push, background work, offline, crash reporting | [platform-features](references/platform-features.md) |
   | Startup, jank, memory, size, battery, accessibility | [performance-and-a11y](references/performance-and-a11y.md) |
   | Store listing, review rejection, versioning, staged rollout, release checklist | [store-release](references/store-release.md) |
   | Emulator, simulator, real device, ARTEMIS, E2E tests, desktop E2E | [device-testing](references/device-testing.md) |

3. **Respect what exists.** The project's architecture, navigation and state libraries win over the defaults in the references. Do not migrate stacks or upgrade the SDK major version without being asked. Check the framework version before using an API (Expo SDK, React Native, AGP, Kotlin, Xcode, Swift, Flutter).
4. **Retrieve current docs** for anything versioned or policy-driven: store requirements (target API level, SDK minimums, privacy declarations), Expo and EAS options, Play and App Store review guidelines. Use the host's docs tool or the vendor's site. Never quote a deadline or a number from memory.
5. **Make the change** with the engineering defaults below. Smallest diff. Platform glue that cannot be unit tested gets a manual device check instead.
6. **Verify on a device** ([device testing](references/device-testing.md)): build, install, run the changed flow, check logs. A passing typecheck does not show that a permission prompt, a deep link or a push works. Say what ran and what did not.
7. **Release gates** when shipping: [store-release](references/store-release.md). Builds, signing, uploads, console changes and store submissions are owner actions; prepare the exact commands and values.
8. **Hand back** a summary: what changed, how it was verified (device and OS version), what the owner must do, what is unverified.

## Engineering defaults

Apply unless the project says otherwise.

1. **No secrets in the binary.** Anything in the app bundle, `EXPO_PUBLIC_*`, `BuildConfig`, plists or Dart constants can be extracted. Put keys that must stay secret behind your own backend.
2. **Ask for a permission in context**, right before the feature needs it, with a reason string that matches the use. Every denial path leaves the app usable. Request the minimum set.
3. **Offline is normal.** Core flows work without a network, writes queue locally, sync is idempotent and resumable, and the UI shows sync state.
4. **Money, health and legal figures are authoritative.** Show a clear loading or error state instead of a stale or guessed value.
5. **One source of truth for version and build number**, monotonic build numbers, and a written path from commit to store build.
6. **OTA updates ship JavaScript and assets only.** Anything native needs a store build and a new runtime version.
7. **Crash reporting and symbols from the first release**: upload dSYMs, R8 mapping files and source maps as part of the build.
8. **Debug-only code must be absent from release**: dev menus, debug bridges, logging of payloads, relaxed TLS, test accounts. Check the release artifact, not the source.
9. **Test on a low-end real device** and on the smallest and largest screen you support, with large text and TalkBack or VoiceOver on once.
10. **Do not block the main thread.** Disk, network, JSON, images and crypto go to background work.
11. **Plan the rollback before the release**: staged rollout, kill switch or remote config, and a hotfix path that does not need a long review.

## Output

- Guidance: the answer, diff or commands in chat, device and OS versions checked, owner actions, anything unverified.
- Full: report at `docs/audits/<date>-mobile.md` per `../../shared/report.md`, local fix branch if fixes were made, a release-gate table (pass, fail, owner action) and the owner-action list.
