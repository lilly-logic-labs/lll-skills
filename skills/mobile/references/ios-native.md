# Native iOS (SwiftUI, Swift concurrency, Xcode, App Store)

Check the project's Xcode, Swift language mode, minimum iOS version and Swift Package versions first.

Building and signing need macOS with Xcode. On Windows or Linux you can read and edit Swift, but builds, simulators and archives run on a Mac, a CI Mac runner, Xcode Cloud or (for Expo and React Native) EAS cloud builds. Say so instead of pretending a build passed.

## SwiftUI

State and data flow

- Pick the narrowest owner. `@State` for view-local value state; `@Binding` to pass write access down; `@Observable` classes (Observation framework) for shared model state, held with `@State` where the view owns it or passed in; `@Environment` for app-wide services; `@Bindable` to bind into an observable.
- One source of truth per fact. Derive, do not copy.
- Keep `body` cheap and pure: no network, disk, formatting-heavy or sorting work in it. Compute in the model.
- Small views composed from small views; extract when a view has more than one reason to change. Avoid `AnyView`; use `@ViewBuilder` and generics.
- Lists: `Identifiable` with stable ids (never array index for changing data), `LazyVStack` inside `ScrollView` for long content.
- Navigation: `NavigationStack` with a typed path; `navigationDestination(for:)`; sheets driven by an optional item binding, not a Bool plus a separate value.
- Async work: `.task { }` and `.task(id:)` (auto-cancelled), not `onAppear` plus an unstructured `Task`.
- Persistence: SwiftData or Core Data or GRDB per project; migrations versioned; background contexts for writes.
- Strings in String Catalogs; dates, numbers and currency through formatters with locale; never concatenate translated sentences.
- Accessibility from the start: labels, traits, Dynamic Type, `accessibilityIdentifier` for UI tests.
- Previews for each state (loading, empty, error, content, large type, dark).

UIKit interop only when SwiftUI cannot do the job (`UIViewRepresentable`); keep the boundary small.

## Swift concurrency (Swift 6.x)

Version matters: confirm the compiler and language mode before applying advice.

1. **Data-race safety.** Swift 6 language mode turns data-race diagnostics into errors. Migrate gradually: set strict concurrency checking to `complete` in warning mode, fix by module, then switch the language mode.
2. **Isolation.** UI types and view models are `@MainActor`. Recent toolchains add an option to default a module's isolation to the main actor, which suits app targets (not libraries) and removes most annotations.
3. **Async functions and threads.** With the newer "approachable concurrency" settings, a plain `nonisolated async` function runs on the caller's actor instead of hopping to a background executor. To run something off the main actor on purpose, mark it `@concurrent`. Do this for CPU-heavy work (image processing, parsing), not for everything.
4. **Sendable.** Values that cross isolation boundaries are `Sendable`: value types, immutable classes, actors. Avoid `@unchecked Sendable` unless you protect state with a lock and say why in a comment.
5. **Structured concurrency first**: `async let`, `TaskGroup`. Use `Task { }` only to start async work from sync code, and keep the handle if it must be cancelled. Avoid `Task.detached`.
6. **Cancellation is cooperative.** Check `Task.isCancelled` or `try Task.checkCancellation()` in loops; clean up in `defer`.
7. **Actors** guard mutable shared state. Keep actor methods short; do not `await` inside while holding assumptions about state (reentrancy).
8. Use `AsyncStream` to bridge delegates and callbacks; finish the stream in `onTermination`.
9. Never block with `DispatchSemaphore` or `.wait()` inside async code.

## Foundation Models (on-device LLM)

For features that must run on device, offline or without sending text to a server. Needs a recent OS and a device that supports Apple Intelligence; retrieve current requirements.

1. Check availability first: `SystemLanguageModel.default.availability`. Provide a non-AI fallback for unsupported devices, disabled settings and "model not ready".
2. One `LanguageModelSession` per conversation or task, created with instructions (role, style, limits).
3. Structured output: define a `@Generable` type and ask for it, rather than parsing free text.
4. Tools: conform to the `Tool` protocol for app actions the model may call; keep each tool narrow and validate arguments.
5. Stream results for responsiveness; handle cancellation.
6. Handle errors: guardrail violations, context window exceeded (keep prompts small, summarise history), unsupported language.
7. The model is small. Use it for summarising, extracting, classifying and rewriting short text, not for knowledge questions.
8. Treat all inputs as untrusted; tools that change data need user confirmation (see `lll:ai` for the general rules).

## Xcode, signing, versions

| Item | Rule |
|---|---|
| Bundle identifier | Permanent once published |
| Version and build | `MARKETING_VERSION` per release; `CURRENT_PROJECT_VERSION` strictly increasing per version (many teams use CI run numbers) |
| Signing in development | Automatic signing with the team |
| Signing in CI | App Store Connect API key (`.p8`, key id, issuer id) kept in CI secrets; Fastlane `match` or Xcode Cloud managed signing; never commit certificates or `.p8` files |
| Capabilities | Push, Associated Domains, Sign in with Apple, App Groups, Background Modes, HealthKit etc. enabled in the target and listed in the entitlements |
| Configurations | `xcconfig` per environment; no secrets in them |
| Dependencies | Swift Package Manager, versions pinned in `Package.resolved` |

Command line (macOS only):

```
xcodebuild -scheme <Scheme> -destination 'platform=iOS Simulator,name=<Device>' test
xcodebuild -scheme <Scheme> -configuration Release -archivePath build/App.xcarchive archive
xcodebuild -exportArchive -archivePath build/App.xcarchive -exportOptionsPlist ExportOptions.plist -exportPath build/export
xcrun simctl list devices available
```

Archiving and exporting write files and are build steps. Uploading to App Store Connect (Xcode, Transporter, Fastlane, EAS Submit) is an owner action.

## TestFlight

- Internal testers (team members) get builds without review. External testers need a Beta App Review for the first build of each version and a test information page.
- Builds expire after a fixed period (currently 90 days; confirm). Keep a cadence.
- Export compliance: set `ITSAppUsesNonExemptEncryption` correctly in Info.plist to skip the question each upload; standard HTTPS-only use usually qualifies for the exemption, but confirm with the owner.
- Provide reviewers with a working demo account and notes for any hardware, region or login dependency.

## App Review essentials

Retrieve the current App Review Guidelines before advising; they change several times a year. Typical rejection causes and fixes:

| Guideline area | Typical cause | Fix |
|---|---|---|
| 2.1 App completeness | Crash on launch or on the review device, broken links, placeholder content, login with no demo account | Test the release build on the oldest supported OS, add review credentials and notes |
| 2.3 Accurate metadata | Screenshots or description do not match the app; missing features claimed | Update listing; show real UI |
| 3.1 Payments | Digital goods unlocked without In-App Purchase; steering rules misread | Use StoreKit for digital content; check current external-link rules by region |
| 4.0 / 4.2 Design and minimum functionality | Web wrapper with no native value, spam, copycat | Add real native functionality |
| 4.8 Login services | Third-party login offered without an equivalent privacy-preserving option | Add Sign in with Apple or another compliant option |
| 5.1.1 Data collection | Missing or unclear purpose strings; collecting more than needed; no in-app account deletion | Specific purpose strings, minimise data, in-app delete account flow |
| 5.1.2 Data use and sharing | Sharing data with third parties (including AI services) without clear disclosure and consent | Disclose and ask permission; update privacy labels |
| 1.2 User-generated content | No report, block or moderation | Add report and block, a filter and contact information |
| Privacy manifest | Missing `PrivacyInfo.xcprivacy`, required-reason API use not declared, third-party SDKs without manifests | Declare reasons; update SDKs |
| Tracking | ATT prompt missing or a tracking SDK present without it | Add `NSUserTrackingUsageDescription` and the ATT flow, or remove the tracking |

When rejected: read the message in Resolution Center, fix the cause, reply with what changed and where to find it. Appeal only when you are sure the rule was misapplied. Request expedited review only for critical production bugs.

## iOS behaviours that bite

- Permission strings (`NS*UsageDescription`) are required for each protected API the app or any linked SDK touches; the app crashes or is rejected without them.
- Universal links need an `apple-app-site-association` file served over HTTPS without redirects, matching Associated Domains in the entitlements. Test on a real device, not the simulator only.
- Push: APNs token changes; register on every launch and send it to your server; the simulator can receive pushes with `xcrun simctl push` but not production APNs.
- Background execution is limited and system-decided (`BGTaskScheduler`); never promise exact timing.
- Keychain for secrets; data protection class set to what you need; Keychain items survive uninstall unless handled.
- App Transport Security: no blanket `NSAllowsArbitraryLoads`.
- Use `os.Logger` with privacy annotations; do not log personal data.
- iPad: universal apps must be usable on iPad; test multitasking.
- Debug-only instrumentation (QA bridges, state servers) goes behind `#if DEBUG` and a Debug-only package condition; verify the Release binary does not contain it before archiving.
