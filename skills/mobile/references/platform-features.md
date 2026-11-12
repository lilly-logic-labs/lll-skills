# Platform features

Permissions, deep links, push, background work, offline storage and crash reporting. Same design on every stack; APIs differ. For each, the user-facing contract comes first, then the platform notes.

## Permissions

Contract

1. Ask when the feature is first used, after a short in-app explanation of why, never on first launch for everything.
2. Request the minimum. Prefer pickers (photo picker, document picker, contact picker) that need no permission.
3. Handle all states: granted, denied once, denied permanently ("don't ask again"), restricted by policy, limited access (iOS photos, Android partial media access).
4. A denial leaves the rest of the app working and offers a way to re-enable (a button that opens system settings).
5. Re-check the permission each time the feature starts; users revoke it in settings.

Platform notes

| Topic | Android | iOS |
|---|---|---|
| Declaration | `<uses-permission>` in the manifest; some need a Play declaration (SMS, call log, all-files access, accessibility service, exact alarms, full-screen intents, foreground service types) | `NS*UsageDescription` string per capability in Info.plist; specific, honest text |
| Runtime prompt | Dangerous permissions; notifications permission on recent versions; "while using" vs background location are separate steps | One-time system prompt; once denied the app can only deep-link to settings |
| Tracking | Advertising ID rules, Play data safety | App Tracking Transparency prompt required before tracking |
| Libraries | Each library may add permissions to the merged manifest; read the merged manifest in the release build | Each SDK may need strings; missing string crashes at access |

Expo: use each module's permission hooks and set iOS strings in `ios.infoPlist` or the module's plugin options. Flutter: `permission_handler` plus the same manifest and plist entries. Check the merged manifest (`./gradlew :app:processReleaseMainManifest`, or the merged manifest tab in Android Studio) to see what the app really requests.

## Deep links and app links

| Kind | Android | iOS |
|---|---|---|
| Custom scheme (`myapp://`) | Intent filter with `VIEW`, `DEFAULT`, `BROWSABLE` | `CFBundleURLSchemes` |
| Verified https links | App Links: `autoVerify` intent filter plus `/.well-known/assetlinks.json` carrying the release signing certificate fingerprint | Universal Links: Associated Domains entitlement plus `apple-app-site-association` on the same host |

Rules

- The `.well-known` files are served over HTTPS at the exact host, with no redirects, content type JSON, and match the app's package or team and bundle id.
- Only link paths the app actually handles. Treat every incoming link as untrusted input: validate parameters, never act on a destructive action from a link without confirmation.
- Cold start, warm start and "already on the target screen" are three different code paths. Test all three.
- Test commands: `adb shell am start -a android.intent.action.VIEW -d "<url>" <package>`, `adb shell pm get-app-links <package>`, `xcrun simctl openurl booted "<url>"`.
- Link provider SDKs and attribution tools sit on top of these; configure the base first.
- Auth callbacks (OAuth) use a verified https redirect or the platform auth session API, not a custom scheme another app can register.

## Push notifications

Flow: app requests permission, gets a token (FCM on Android, APNs on iOS, or Expo push tokens that wrap both), sends it to your server tied to the user and device, server sends through FCM or APNs.

Checklist

- Credentials configured per environment: FCM server credentials (service account), APNs key (`.p8`) with team and key ids. Debug and release builds can use different APNs environments.
- Android: notification channels (importance per category), `POST_NOTIFICATIONS` on recent versions, small icon, default channel for FCM.
- iOS: capability enabled, permission prompt (provisional authorisation for quiet delivery), `UNUserNotificationCenter` delegate handles foreground display and taps.
- Token lifecycle: refresh on every launch; delete on sign-out; server removes tokens that FCM or APNs report invalid.
- Payload: notification versus data messages behave differently in background; keep payload small, no sensitive content on the lock screen, localise server-side.
- Tap handling routes through the same deep-link code as links, cold start included.
- Rate and frequency limits: one reason to send, easy per-category opt-out, quiet hours if relevant.
- Testing: send to a real device; the iOS simulator accepts `xcrun simctl push` payloads but is not a proof of APNs setup; Android emulators need Google Play services images.
- Do not use push as the only channel for anything critical (security codes use SMS or in-app).

## Background work

| Need | Android | iOS | Cross-platform |
|---|---|---|---|
| Deferrable, guaranteed eventually (sync, upload) | WorkManager | `BGProcessingTask` / `BGAppRefreshTask` (system decides when) | Expo `expo-background-task` / TaskManager, `workmanager` (Flutter) |
| Visible long-running work (navigation, music, recording) | Foreground service with a declared type and a notification | Background modes (audio, location, VoIP) with a real use | |
| Exact time (alarm, medication) | Exact alarm APIs with the permission and Play declaration | Local notifications (time-based), not background execution | |
| Server-triggered | High-priority FCM data message (limited) | Silent push / background notification (throttled) | |

Rules: background execution is never guaranteed on time; design every job to be idempotent and resumable; batch network use; respect battery saver and Doze; report background failures to crash reporting; test with the app force-quit, device rebooted and low-power mode on.

## Offline storage and sync

- Source of truth on device for core data (SQLite via Room, SQLDelight, Core Data/SwiftData/GRDB, `expo-sqlite`, drift). Key-value stores for preferences only.
- Secrets in Keychain or Keystore (via secure store libraries), never in plain preferences or SQLite.
- Migrations numbered, tested from every shipped schema version, and never destructive without a backup path. A failed migration must not wipe user data silently.
- Sync design: local write first, outbox queue with idempotency keys, server accepts retries safely, conflict policy stated (last write wins per field, merge, or user choice), tombstones for deletions so deleted rows do not return, incremental sync with a cursor, visible sync status.
- Handle clock skew: use server timestamps or version counters for ordering, not device time.
- Storage limits: cap caches, clear on sign-out, exclude large re-downloadable files from backup.
- Test: airplane mode mid-write, kill during sync, two devices editing, restore from backup, upgrade from the oldest supported version.
- Encrypt at rest when data is sensitive (SQLCipher, platform file protection); decide key handling with `lll:security`.

## Crash reporting and diagnostics

- One crash reporter (Firebase Crashlytics, Sentry, or the platform's own) initialised before anything else, covering native crashes and JavaScript or Dart errors.
- Symbols per release: iOS dSYMs, Android R8 `mapping.txt` and native symbols, JS source maps, Flutter `--split-debug-info` symbols. Automate the upload in the release pipeline; check one real stack trace after the first release.
- Attach: app version, build number, OS, device model, release channel or OTA update id, user id (hashed or internal id, never email), breadcrumbs for navigation and network.
- Scrub personal data from breadcrumbs, URLs and log messages. Honour consent: crash reporting that includes identifiers may need disclosure in the privacy forms.
- Alerts on new crash clusters and on crash-free rate dropping below the team threshold. Store consoles also show crash and ANR rates (Play vitals, Xcode Organizer, MetricKit); they affect store visibility.
- ANRs (Android) and hangs (iOS) are bugs to track the same way as crashes.
- Keep a release dashboard: crash-free users, startup time, key funnel completion, per version.

For analytics events and consent flows use `lll:analytics`.
