# Motion

Motion explains change, confirms action and keeps people oriented. It is never decoration on something seen all day. Work through the gates in order; the first two often end with "no animation".

## 1. Gate: should it move?

| How often the person sees it | Decision |
|---|---|
| 100 or more times a day, or triggered by keyboard (command palette, list navigation, tab switch) | none |
| tens of times a day (hover, menus, row selection) | remove, or cut to a tiny fade |
| occasionally (sheet, modal, toast, page change) | standard motion |
| rare or first time (onboarding, success moment, empty-state delight) | may delight |

## 2. Gate: what is the purpose?

Pick one: **spatial consistency** (where did that come from, where did it go), **state change** (this toggled), **feedback** (I heard you), **explanation** (how this works), **continuity** (prevent a jarring jump). "Looks cool" on a frequent element is not a purpose.

Website rule: one authored moment per page (the section whose visual most needs explaining, or one entrance). Not the same fade-up on every section, not a hover effect on every card.

## 3. Pick the cheapest tool that works

| Platform | Prefer |
|---|---|
| Web | CSS transition for state changes; `@starting-style` and `transition-behavior: allow-discrete` for enter/exit; View Transitions API for page and element morphs; WAAPI for programmatic; a spring library only for gesture-driven or interruptible physics. No library for a fade. |
| SwiftUI | implicit `.animation(_, value:)`; `withAnimation` for hierarchy changes; `matchedGeometryEffect` / `glassEffectID` for morphs; `DragGesture` plus spring for gestures; `PhaseAnimator` / `keyframeAnimator` for sequences |
| UIKit | `UIView.animate` with springs, `UIViewPropertyAnimator` for interruptible |
| Compose | `animate*AsState`, `updateTransition`, `AnimatedVisibility`, `Modifier.animateItem()` in lazy lists, `SharedTransitionLayout`, `Animatable` plus gestures |
| React Native | Reanimated worklets on the UI thread; layout animations; avoid JS-driven per-frame animation |
| Flutter | implicit animated widgets, `AnimationController` for sequences, Hero for shared elements |
| Desktop | short fades; respect OS animation setting; avoid long transitions in dense tools |

## 4. Properties

- Web: animate `transform`, `opacity`, `filter` and `clip-path` only. Never width, height, top, left, margin or padding (layout and paint on every frame). Blur stays at 14 to 20 px or less and only in a masked crossfade.
- Compose: `graphicsLayer` scale, translation and alpha, not layout modifiers.
- SwiftUI: `scaleEffect`, `offset`, `opacity`; avoid animating heavy layout containers.
- Content is visible by default. Add the hidden start state from script only after the observer exists, so a script failure never hides content.

## 5. Values

### Springs (preferred for anything that can be grabbed or interrupted)
| Interaction | Damping / bounce | Response or duration |
|---|---|---|
| Default UI transition | critically damped, no bounce | 0.3 to 0.4 s |
| Sheet, drawer, panel | damping 0.8 (bounce about 0.2) | about 0.3 s |
| Reposition, reorder | critically damped | 0.4 s |
| Thrown or flicked | damping 0.8 | 0.4 s |

Bounce only where the gesture carried momentum. Serious flows (payments, destructive) never bounce.

Code anchors: SwiftUI `.spring(response: 0.35, dampingFraction: 1)`; Compose `spring(dampingRatio = Spring.DampingRatioNoBouncy, stiffness = Spring.StiffnessMediumLow)`; web spring libraries `{ type: "spring", bounce: 0, duration: 0.4 }`.

### Tweens
| Element | Duration |
|---|---|
| Press feedback | 100 to 160 ms |
| Tooltip, small popover | 125 to 200 ms |
| Dropdown, select | 150 to 250 ms |
| Modal, drawer | 200 to 500 ms |
| Anything else in UI | under 300 ms |

Curves: entering or exiting uses an ease-out (`cubic-bezier(0.23, 1, 0.32, 1)`); moving on screen uses ease-in-out (`cubic-bezier(0.77, 0, 0.175, 1)`); a drawer or sheet `cubic-bezier(0.32, 0.72, 0, 1)`; colour and hover use `ease`; constant motion (progress, spinner) uses `linear`. Do not use plain `ease-in` on UI: it starts slow and feels laggy. Define curves and durations as tokens.

### Shape rules
- Enter and exit along the same path. A sheet that opened from a row returns to that row. Exit faster than enter.
- Popovers scale from their trigger; modals from the centre. Never from `scale(0)`; start at 0.95 with opacity.
- Press feedback: scale 0.95 to 0.98 on web, about 0.93 on small glass controls; spring back.
- Stagger siblings 30 to 80 ms in reading order, inside one section only.
- Slow where the person decides (a 2 s hold-to-confirm, linear), fast where the system answers (200 ms ease-out).
- Skeleton shimmer is slow (1.5 to 2 s) and low contrast.

### Formulas (starting points, then feel-check)

- Spring from a response time `T` (seconds) and damping ratio `z`, unit mass: stiffness = (2 pi / T)^2, damping = 2 * z * sqrt(stiffness). T 0.35 gives stiffness about 322, which sits between Compose `StiffnessLow` (200) and `StiffnessMediumLow` (400). `StiffnessMedium` (1500) is about 0.16 s and feels snappy, not default.
- Tween duration grows with travel: about 200 ms for 100 px, plus about 50 ms per further 100 px, capped at 400 ms for UI. A full-screen move is not twice a small one.
- Exit takes 60 to 70 percent of the enter duration.
- Stagger step shrinks as the list grows: 50 ms for 3 items, 30 ms for 8, and cap the total at about 300 ms.
- Scale for press feedback is 1 minus (4 / smaller side in px), clamped to 0.93 to 0.98, so large surfaces move less.

## 6. Interruptibility

- Never lock input during a transition. Tapping again, dragging or navigating mid-flight works.
- Start from the current presented value, not the target. Retarget, do not restart. Springs and CSS transitions retarget; CSS `@keyframes` do not.
- Hand the gesture's release velocity to the spring. Choose the landing target by projecting momentum; a flick above about 0.11 px/ms dismisses, a slow drag reverses by position.
- Past bounds, rubber-band rather than hard stop.
- Highlight on pointer down, commit on pointer up, with about 10 pt tolerance; dragging away cancels, dragging back re-arms.

## 7. Reduced motion and pointer gating

Ship together with the animation.

- Web: `@media (prefers-reduced-motion: reduce)` replaces slides, parallax, zoom and spring with a crossfade or nothing; keep opacity or colour changes that aid understanding. Video autoplay and looping carousels stop.
- iOS: `accessibilityReduceMotion` (`@Environment(\.accessibilityReduceMotion)`); Android: read `Settings.Global.ANIMATOR_DURATION_SCALE` and treat 0 as reduced motion (platform animators honour it already; custom ones must check); RN `AccessibilityInfo.isReduceMotionEnabled`.
- Hover motion only under `(hover: hover) and (pointer: fine)`.
- No flashing more than 3 times per second; avoid slow loops near 0.2 Hz and abrupt brightness jumps.
- Auto-playing motion over 5 s has a pause control.

## 8. Never ship

| Never | Instead |
|---|---|
| `transition: all` | list the properties |
| `scale(0)` entrance | scale from 0.95 with opacity |
| `ease-in` on UI | ease-out or a custom curve |
| motion on a keyboard or high-frequency action | none |
| UI motion over 300 ms with no reason | 150 to 250 ms |
| `transform-origin: center` on a popover anchored to a trigger | the trigger |
| keyframes on toasts, toggles, rapid triggers | transitions or springs |
| layout properties animated | transform and opacity |
| everything animating at once | one focal movement, rest still |
| hover motion on touch devices | media-query gate |
| missing reduced-motion path | a gentler variant |
| bounce on serious flows | critically damped |
| press feedback on release | on pointer down |
| content hidden behind scroll-triggered opacity 0 with no fallback | visible by default |

## 9. Feel check (do not skip)

1. Play at 0.25x (browser animation inspector) and step frames: any pop, overshoot past the target, or origin jump?
2. Trigger it twice quickly and interrupt it halfway. Does it snap, restart or retarget smoothly?
3. Test on a throttled CPU (4x slowdown) and on the oldest target device.
4. Turn on reduced motion and confirm the fallback.
5. Look again tomorrow. If you notice the animation more than the result, cut it.

## 10. Output for a motion task

Code, then: gate result (frequency tier, purpose), ingredients (tool, properties, curve or spring, one line each), reduced-motion behaviour, and what to feel-check on a device.
