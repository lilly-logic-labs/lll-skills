# Apple platforms: SwiftUI, UIKit, Liquid Glass

For iPhone, iPad, Mac, Apple Watch and Vision. Apple APIs change every year; confirm signatures against current documentation (the `context7` docs tool or developer.apple.com) when a symbol matters.

## 1. Principles that decide most things

- Use system components first: `NavigationStack`, `NavigationSplitView`, `TabView`, `List`, `Form`, `Menu`, `confirmationDialog`, `sheet`, `Toolbar`. They bring accessibility, Dynamic Type, dark mode, localisation and the current visual language for free.
- Respect the HIG patterns: large titles that collapse, swipe back, sheets with detents, context menus, swipe actions, pull to refresh, search with `.searchable`.
- SF Symbols for icons, matched to text weight and size (`Image(systemName:)` with `.symbolRenderingMode`, `.font`). Hierarchical or palette rendering for depth; variable colour where it fits.
- Semantic colours (`Color.primary`, `.secondary`, `Color(.systemBackground)`, asset catalog colours with light/dark/high-contrast variants) and `.tint`. Accent colour in the asset catalog.
- Text styles (`.font(.body)`, `.title`, `.caption`) for Dynamic Type. Custom fonts scale with `Font.custom(_:size:relativeTo:)`. Test at the largest accessibility size.
- Safe areas respected; extend backgrounds under bars deliberately (`.ignoresSafeArea` on the background only, not on content).
- Haptics: `.sensoryFeedback` (iOS 17+) or `UIImpactFeedbackGenerator` for confirmed actions; never for every tap.

## 2. Liquid Glass (iOS 26, iPadOS 26, macOS Tahoe, visionOS 26)

Liquid Glass is a translucent material for the **navigation and control layer that floats above content**: bars, tab bars, toolbars, sheets, floating buttons, menus. It is not a page background and not for body text.

### Native first
- Building with the current SDK, standard `NavigationStack` toolbars, `TabView`, sheets, menus and system buttons adopt glass automatically. Remove custom bar backgrounds and `toolbarBackground` hacks that fight it.
- Custom glass surfaces: `.glassEffect()` (default regular variant in a capsule). Customise: `.glassEffect(.regular.tint(.blue).interactive(), in: .rect(cornerRadius: 20))`. `.interactive()` for things that respond to touch.
- Buttons: `.buttonStyle(.glass)` for secondary, `.buttonStyle(.glassProminent)` for the primary action.
- Multiple glass shapes in one area go in a `GlassEffectContainer(spacing:)`. It renders them together and lets them morph and merge. Give elements `glassEffectID(_:in: namespace)` for morphing transitions, and `glassEffectUnion` to merge into one shape.
- Scroll edge effects soften where scrolling content meets bars (`scrollEdgeEffectStyle`). Do not add a 1 px divider under a floating bar.
- UIKit: `UIGlassEffect` in a `UIVisualEffectView`, `UIGlassContainerEffect` for groups; bar button items can opt out of the shared glass background.

### Rules
1. Glass on glass is a defect. One layer of glass per region; nested content on glass is plain.
2. Content (cards, lists, text blocks, images) is not glass. Glass is chrome.
3. Text on glass needs contrast in light, dark and tinted. Use heavier weight, not smaller text. Tint only the primary element, for meaning not decoration.
4. Keep shapes concentric with the device and container corners (use the system container-relative shapes where available); nested radius = outer minus inset.
5. Controls give on press (a small scale and brightening); bars do not react.
6. Accessibility settings change glass: Reduce Transparency makes it frostier and more opaque; Increase Contrast adds borders; Reduce Motion simplifies morphs. Native glass handles this; a hand-built one must do the same: solid surface, same size and layout, hairline kept.
7. One recipe per app. If the deployment target is below iOS 26, put the `#available(iOS 26, *)` branch inside one modifier (`appGlass(radius:)`) that falls back to `.ultraThinMaterial` plus a tint, a lit top edge and a soft shadow. Call sites never branch.
8. Do not recreate glass on Android or web as a visual theme. Translate the intent: Android uses Material 3 surfaces; web uses `backdrop-filter` sparingly on a fixed bar with a solid fallback (`@supports not (backdrop-filter: blur(1px))` and `prefers-reduced-transparency`).

### Hand-built fallback recipe (below iOS 26)
Material `.ultraThinMaterial`, a faint product tint so the edge shows over white, a 1 pt top-to-bottom white gradient stroke inside the fill (about 0.9 alpha light, 0.15 dark), a 0.5 pt hairline, and a soft shadow carrying the lift (radius about 24, y offset about 12 to 16). Dark glass is a darker material, not light inverted. Reduce Transparency: solid fill, same geometry.

## 3. Layout and navigation

- iPhone: `TabView` (3 to 5 tabs) with a `NavigationStack` per tab. iPad and Mac: `NavigationSplitView` with sidebar; adaptive tab/sidebar. Let size classes (`horizontalSizeClass`) drive layout, not device checks.
- Sheets: presentation detents (`.medium`, `.large`, custom), drag indicator, a visible close for non-dismissable content; a sheet opened from a row returns to it.
- Forms: `Form` with sections; `LabeledContent`; `Picker` styles; `DatePicker` compact.
- Lists: `List` with `.swipeActions`, `.contextMenu`, `.refreshable`, stable `id`s. `LazyVStack` in `ScrollView` for custom rows. Avoid `AnyView` and per-row heavy work in `body`.
- Keyboard: `.scrollDismissesKeyboard`, `@FocusState`, `.submitLabel`, `.textContentType`, `.keyboardType`.
- Mac: menu bar commands, keyboard shortcuts, toolbars, resizable windows, hover states, right-click context menus, inspector panes.
- Watch: glanceable, one action per screen, large type, digital crown. visionOS: windows with ornaments, depth by glass, eyes-and-hands targets of at least 60 pt.

## 4. Motion in SwiftUI

Springs: `.spring(response:dampingFraction:)`, or presets `.smooth`, `.snappy`, `.bouncy`. Implicit animation via `.animation(_, value:)`; explicit via `withAnimation`. Morph with `matchedGeometryEffect`/`glassEffectID`. `PhaseAnimator`, `keyframeAnimator` for sequences. Gesture-driven: `DragGesture` plus spring; carry velocity on release. Honour `@Environment(\.accessibilityReduceMotion)`. Press feedback needs a pointer-down signal; plain `Button` reports on release, so use a custom `ButtonStyle` reading `configuration.isPressed`.

## 5. Accessibility APIs

`accessibilityLabel`, `accessibilityValue`, `accessibilityHint`, `accessibilityAddTraits(.isButton / .isHeader)`, `accessibilityElement(children: .combine)`, `accessibilitySortPriority`, `accessibilityAction`, `@AccessibilityFocusState`. Dynamic Type: no fixed heights on text; use `ViewThatFits` or `AnyLayout` to switch to vertical stacks at large sizes. Check VoiceOver rotor order, Voice Control (visible labels match spoken names), Switch Control, Reduce Motion, Bold Text, Increase Contrast. Targets at least 44 x 44 pt.

## 6. UIKit and mixed projects

Use `UIListContentConfiguration`, diffable data sources, compositional layout, `UIButton.Configuration`, `UISheetPresentationController`. Auto Layout with `safeAreaLayoutGuide` and `readableContentGuide`. `UIFontMetrics` for scaling. Bridge with `UIHostingController` / `UIViewRepresentable`; keep one source of truth for theme tokens.

## 7. Review triggers

- Custom tab bar or nav bar reimplementing system behaviour.
- Hard-coded colours, fonts or sizes where semantic ones exist.
- Fixed heights that clip at large Dynamic Type.
- Glass behind paragraph text, glass on glass, or a second glass recipe.
- `NavigationView` (deprecated) instead of `NavigationStack`/`NavigationSplitView`.
- Missing empty/error/loading states in `List` driven by async data.
- Tap targets under 44 pt, images with no accessibility label.
- Animations that ignore Reduce Motion.
