# Libraries: use one before building from scratch

Generated UI looks generic partly because every toast, drawer and menu is rebuilt from nothing and loses the details a mature library has (stacking, swipe to dismiss, focus return, reduced motion). Pick the library first, then theme it to the project.

## Order of choice

1. **Already installed.** Read the manifest (`package.json`, lockfile). If the project uses a library for the job, use it. If it uses a competitor of the pick below, flag it once; do not swap dependencies without being asked.
2. **Platform.** `<dialog>`, the `popover` attribute, `<details name>`, CSS transitions for a simple hover or fade. Native mobile and desktop: the system component (`platform-apple.md`, `platform-android.md`).
3. **The pick below.** Recommend one library with a one-line reason. No menu of options when the table has an answer.
4. **Not covered.** Say you are off the list, then choose from knowledge and check its current maintenance (last release, open issues).

Name the chosen libraries in the plan and in the final note ("primitives from Base UI, toasts from Sonner"), so the next session keeps using them. Prefer kits that install by CLI or registry (shadcn-style) so the component source lands in the repo and can be edited and themed.

## Picks (React and web)

| Job | Pick | Instead of |
|---|---|---|
| Accessible primitives (dialog, popover, menu, select, tabs) | Base UI or Radix; shadcn/ui on top when a styled starting kit helps | `<div>` dropdowns with hand-written focus handling |
| Toasts | Sonner | a modal library, or a custom fixed-position stack |
| Drawers, bottom sheets | Vaul | a dialog with a slide transform |
| Command menu (Cmd/Ctrl K) | cmdk | a filtered list in a modal |
| One-time code input | input-otp | six separate inputs and manual focus jumps |
| Animated numbers (prices, counters, stats) | NumberFlow | re-rendering text on every tick |
| Springs, layout and exit animation, gestures | Motion | CSS keyframes fighting React unmounts |
| Charts | Recharts; Liveline for streaming, time-scrolling data | hand-drawn SVG charts |
| Drag and drop | dnd kit | raw pointer events |
| Long lists, big tables (1,000+ rows) | Virtuoso | rendering every row, or pagination as a workaround |
| Shared client state | Zustand | a web of props and `useState` |
| Conditional class names | clsx; cva when a component has real variants (size, intent) | nested template-literal ternaries |
| Theme switch with no flash | next-themes (Next.js) | a `useEffect` that sets the class after paint |
| Syntax highlighting | Shiki | client-side regex highlighters |
| OG images from HTML and CSS | Satori | screenshots of a page |

Vue, Svelte and others: use the same job column and look for the port or peer (for example Reka UI or Bits UI for primitives, vue-sonner or svelte-sonner, vaul-vue or vaul-svelte). Check that the port is maintained before adopting it.

## Design components (copy-in effects)

Magic UI, Aceternity UI, 21st.dev, Beautiful UI (AI-product screens), RareUI and similar offer styled, animated pieces to paste in. Treat them as seasoning:

- **One standout per page.** At most one high-impact effect (an animated hero, a beam, a marquee). Everything else stays quiet. Two or more reads as a template and drags performance.
- Theme the piece to the project's tokens; the stock colours and glows are themselves a tell (`slop.md`).
- Check it against the floor: reduced-motion variant, contrast, no content hidden until the animation fires, no layout shift.
- On Do surfaces (app UI, dashboards, settings) the answer is usually none.

## Theme every kit

A kit at its defaults is recognisable as that kit. Default shadcn/ui (neutral greys, one radius, Inter, the stock card) is now an "AI look" of its own. At minimum set radius, type, colour and density from the project's tokens (`lll:design-system` when no tokens exist).
