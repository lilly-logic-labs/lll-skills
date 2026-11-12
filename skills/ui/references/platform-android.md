# Android: Jetpack Compose and Material 3

Material 3 is the component grammar on Android. Compose is the way to build it. Android APIs move fast; confirm against current docs (the `context7` tool or developer.android.com) when a symbol or version matters.

## 1. Principles

- Use Material 3 components first (`Scaffold`, `TopAppBar`, `NavigationBar`, `NavigationRail`, `ModalBottomSheet`, `Button` variants, `TextField`, `ListItem`, `Snackbar`, `SearchBar`, `FloatingActionButton`). They bring ripple, state layers, accessibility, RTL and font scaling.
- Theme with `MaterialTheme(colorScheme, typography, shapes)`. Components read roles, never raw colours: `primary`, `onPrimary`, `primaryContainer`, `secondary`, `tertiary`, `surface`, `surfaceContainer*`, `outline`, `error`, `onSurface`, `onSurfaceVariant`.
- Dynamic colour (Android 12+) when the brand allows it; otherwise a seed-generated static scheme with dark variants. Tonal elevation (surface container levels) instead of shadows for separation.
- Typography: the M3 scale (Display, Headline, Title, Body, Label) in `sp`, so users' font size setting scales it. Never `dp` for text.
- Shapes from the M3 shape scale (extra small to extra large); one family across the app. Large surfaces use rounded corners; do not mix sharp and bubbly randomly.
- Icons: Material Symbols, one style (outlined / rounded / sharp) and weight.
- Material 3 Expressive (newer) adds springier motion, bolder shapes and larger type; adopt consistently or not at all.

## 2. Edge to edge and system UI

- Edge to edge is the default on current target SDKs. Draw behind the status and navigation bars; apply insets with `WindowInsets.safeDrawing`, `Scaffold` content padding, `Modifier.windowInsetsPadding`, `imePadding()` for the keyboard.
- Scrollable content gets inset padding at the ends (`contentPadding`) so the last item clears the nav bar and keyboard.
- Status and navigation bar icon contrast follows the surface behind (`enableEdgeToEdge`, `SystemBarStyle`).
- Cutouts and foldable hinges: use `WindowInsets.displayCutout` and the window layout library's fold features.

## 3. Navigation and back

- Predictive back: opt in (`android:enableOnBackInvokedCallback="true"`), use the Navigation library or `BackHandler`/`PredictiveBackHandler`, and design the back animation (cross-activity, cross-destination, in-app). Do not intercept back for things the system should handle.
- Top-level destinations: `NavigationBar` for 3 to 5 on compact widths; `NavigationRail` on medium; permanent or modal drawer on expanded. Use `NavigationSuiteScaffold` to switch automatically.
- Deep links and state restoration: `rememberSaveable`, saved state for view models, navigation arguments that are ids not objects.

## 4. Adaptive layouts

Window size classes: compact (under 600 dp wide), medium (600 to 839), expanded (840+); newer guidance adds large and extra-large. Drive layout from `currentWindowAdaptiveInfo()`, not from device type.

- Canonical layouts: list-detail (`ListDetailPaneScaffold`), supporting pane, feed. On compact, one pane and navigate; on expanded, two panes side by side.
- Tablets, foldables, Chromebooks, desktop windowing and multi-window must not crash or letterbox into a stretched phone UI. Handle configuration changes without losing state.
- Support portrait and landscape unless there is a stated reason not to.
- Keyboard and mouse: focus order, hover states, `onKeyEvent`, shortcuts on large screens.

## 5. Compose craft

- State hoisting: composables take state and callbacks; view models expose a single `UiState` sealed type (Loading, Content, Empty, Error) so impossible combinations cannot occur.
- Stability and recomposition: avoid creating new lambdas/objects in lazy item scopes; mark classes `@Immutable`/`@Stable` where needed or use immutable collections; read state as late as possible; `derivedStateOf` for computed state; `remember` keyed correctly.
- Lazy lists: always give `key` (and `contentType`); `Modifier.animateItem()` for item changes; avoid nested scrolling in the same direction; heavy images with Coil and sized requests.
- Modifiers: order matters (padding before background differs from after); pass `modifier: Modifier = Modifier` as the first optional parameter.
- Previews for light, dark, large font, RTL and each state (`@PreviewParameter`, multipreview annotations).
- Touch targets: `Modifier.minimumInteractiveComponentSize()` or 48 dp; `Modifier.semantics { }` for custom controls; `clickable(role = Role.Button, onClickLabel = ...)`.

## 6. Motion

Springs: `spring(dampingRatio = Spring.DampingRatioNoBouncy, stiffness = Spring.StiffnessMedium)` default; `0.8` damping with `StiffnessMediumLow` for sheets. `AnimatedVisibility`, `AnimatedContent`, `updateTransition`, `Animatable` with gestures, `SharedTransitionLayout` for shared elements. Animate with `graphicsLayer { }` (alpha, scale, translation) so recomposition is skipped. M3 motion schemes define standard and expressive spring tokens. Respect reduced motion by reading the animator duration scale; shorten or skip custom animations.

## 7. Accessibility (TalkBack)

`contentDescription` on meaningful images and icon buttons (`null` on decorative), `Modifier.semantics { heading() }`, `stateDescription`, `liveRegion`, `mergeDescendants = true` on rows, `traversalIndex` for odd focus order, `testTag` is not accessibility. Check TalkBack, Switch Access, font scale at 200 percent, display size large, bold text, high contrast text, colour correction, remove animations.

## 8. Glass and other platforms' idioms

Do not paste iOS Liquid Glass onto Android. Use Material 3 surfaces and tonal elevation. If the brand wants translucency, apply it to one floating bar with a solid fallback below API 31 (blur needs `RenderEffect`, API 31) and when reduce-transparency-like settings are on.

## 9. Review triggers

- `dp` used for text; fixed text-container heights.
- Raw colour literals in composables instead of `MaterialTheme.colorScheme`.
- Missing `contentDescription`, targets under 48 dp.
- Content hidden behind system bars or the IME.
- No handling of tablets and landscape; phone UI stretched.
- Lazy list items without keys; state read high in the tree causing recomposition storms.
- Back handled incorrectly (blocking system back, custom dialogs ignoring back).
- Loading/empty/error handled with scattered booleans rather than one `UiState`.
- Snackbar used for errors that need an action with no action button.
