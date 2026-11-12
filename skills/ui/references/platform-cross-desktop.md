# Cross-platform and desktop: React Native, Flutter, Electron, Tauri, native desktop

The rule across all of them: look and behave like the platform you are on, share logic and tokens, not pixels.

## 1. React Native and Expo

Store release, native config, EAS and permissions are `lll:mobile`. Here: the interface.

- Safe areas: `react-native-safe-area-context` (`SafeAreaProvider`, `useSafeAreaInsets`); never hard-code status-bar heights. Keyboard: `KeyboardAvoidingView` (behavior differs by platform) or `react-native-keyboard-controller`; the primary action stays reachable.
- Touch: `Pressable` with a pressed style, `hitSlop` to reach 44 pt, `android_ripple` on Android. Feedback on press-in. Avoid `TouchableOpacity` fade as the only feedback.
- Lists: `FlatList`/`FlashList` with stable `keyExtractor`, `getItemLayout` when heights are fixed, memoised rows, `removeClippedSubviews` only if profiled. Pull to refresh via `refreshControl`. Empty and error via `ListEmptyComponent`/`ListFooterComponent`.
- Platform idiom: `Platform.select` and `.ios.tsx`/`.android.tsx` files where behaviour must differ (back handling, date pickers, alerts, nav bars). Use native navigation (expo-router, React Navigation native stack) so gestures and large titles come free.
- Text: `allowFontScaling` stays on; cap with `maxFontSizeMultiplier` (about 1.3 to 1.5) only where layouts break; test at largest sizes. No fixed-height text containers.
- Theming: `useColorScheme`, one token module exported to styles; avoid inline style objects recreated per render in hot lists.
- Animation: Reanimated (UI thread worklets), `useAnimatedStyle`, layout animations, Gesture Handler for gestures; avoid `Animated` JS-driven loops for continuous effects. Reduced motion via `AccessibilityInfo.isReduceMotionEnabled`.
- Accessibility: `accessibilityRole`, `accessibilityLabel`, `accessibilityState`, `accessibilityHint`, `accessible` grouping, `importantForAccessibility` on Android, live regions via `accessibilityLiveRegion`.
- Images: `expo-image` with placeholders, sized sources, caching; reserve aspect ratio.
- Offline: queue writes, show sync state, persist drafts.
- Dev checks: Expo web or a simulator is not proof; test on a mid-range Android device and a small iPhone.

## 2. Flutter

- `useMaterial3: true`, `ColorScheme.fromSeed` or brand scheme, `ThemeData` text theme in `sp`-scaled units (text scaling via `MediaQuery.textScalerOf`). Use `Theme.of(context)` roles, not literals.
- Adaptive: `LayoutBuilder`/`MediaQuery` size classes; `NavigationBar` vs `NavigationRail`; adaptive constructors (`Switch.adaptive`, `showAdaptiveDialog`) or Cupertino widgets when the iOS idiom matters.
- `SafeArea`, `Scaffold`, `SingleChildScrollView` with keyboard insets, `ListView.builder` with keys, `const` constructors, split large `build` methods, `RepaintBoundary` only when profiled.
- `Semantics` for custom widgets, `ExcludeSemantics` for decoration, `MergeSemantics` for rows; minimum tap target 48 logical pixels (`kMinInteractiveDimension`).
- States: `AsyncValue`/`FutureBuilder`/`Bloc` states mapped to loading, data, empty, error widgets in one shared pattern.
- Motion: implicit animated widgets first, `AnimationController` for sequences, `Hero` for shared elements, `MediaQuery.disableAnimations` for reduced motion.
- Golden tests per state and theme catch visual regressions.

## 3. Electron and Tauri (web UI in a window)

Apply the web notes, then add desktop behaviour that a web page does not give:
- Window: remember size and position, minimum size, sensible resize behaviour, restore on launch; single-instance lock.
- Title bar: native frame by default; custom title bars need drag regions (`-webkit-app-region: drag` / `data-tauri-drag-region`), controls that match OS (traffic lights left on macOS, caption buttons right on Windows), and keyboard/snap behaviour.
- Menus and shortcuts: real application menu (`Menu` / Tauri menu), standard accelerators (Cmd/Ctrl+C/V/Z/S/W/Q, F11, Esc), shortcuts shown in menus and tooltips; do not capture system shortcuts.
- Theme: follow the OS (`nativeTheme`, `prefers-color-scheme`), accent colour, high contrast (`forced-colors`); scrollbars and selection styled for the platform.
- Text selection: UI chrome is `user-select: none`; content (logs, tables, messages) is selectable and copyable.
- Context menus: native or faithfully styled; right-click works on every list row that has actions.
- Focus: restore focus after dialogs; roving tabindex in toolbars; visible focus ring.
- DPI and multi-monitor: crisp icons (SVG), test 100, 150, 200 percent scaling.
- Notifications, tray, drag and drop, file associations: ask permission patterns and failure states (denied, unsupported).
- Performance: virtualise long lists, avoid blocking the renderer, defer heavy work to the main/Rust side; startup should show a window shell in under about a second.
- Security of the shell (nodeIntegration, CSP, IPC allowlists) is `lll:security`.

## 4. Native desktop

- **macOS (SwiftUI/AppKit).** Menu bar with full command set, toolbar, sidebar (`NavigationSplitView`), inspector, resizable windows, vibrancy/materials, keyboard navigation, hover and focus states, undo/redo via `UndoManager`, Settings scene (`Settings { }`), drag and drop. Liquid Glass applies to toolbars and sidebars on current macOS.
- **Windows (WinUI 3, WPF, .NET MAUI).** Fluent design: Mica/Acrylic backdrops, accent colour from the system, light/dark/high-contrast themes, `NavigationView`, command bar, `AutomationProperties.Name` and UI Automation for screen readers, keyboard access keys and Tab order, DPI-aware layout (no fixed pixels), touch and pen input.
- **Linux (GTK/Qt).** Follow the desktop theme, respect Wayland/X11 scaling, use platform file pickers and notifications, set `.desktop` metadata.
- **Terminal UIs.** Keyboard first; every action has a key shown in a footer; respect `NO_COLOR` and terminal width; colour is never the only signal; clean non-interactive mode for pipes.

## 5. Shared across all

- Tokens: one source of truth (colours, spacing, radii, type) exported per platform; semantics identical, values adapted.
- Components: share behaviour and naming, adapt rendering. A "Button" on iOS, Android and web has the same variants and states and different native feel.
- Input: touch, pointer, keyboard, stylus, voice, switch. Every action reachable by keyboard on any platform that has one.
- Window and size changes never lose state.
- Test matrix: smallest phone, largest phone, tablet, a desktop window at minimum and maximum size, largest text size, dark mode, RTL.
