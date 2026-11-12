# Lens: perf

Slowness users notice and costs the owner pays: backend latency, query and cache behaviour, page load and interaction speed, bundle weight, mobile startup and jank, memory.

## Covers

- Backend: slow endpoints, sequential work that could run in parallel, blocking I/O in async code, missing timeouts, cold starts, payload size, missing compression and caching.
- Data access: query count and shape per request (deep checks in the db lens).
- Web front end: Core Web Vitals (LCP, INP, CLS), TTFB, render-blocking resources, images, fonts, JavaScript weight, hydration cost.
- Mobile: cold start, frame drops, list rendering, image decoding, app size.
- Desktop: startup time, main-process blocking, renderer memory.
- Memory: unbounded caches, leaks through listeners, timers and closures.

## Method

1. **Find what matters.** The flows users repeat (landing, sign-in, main list, search, checkout, save) and the endpoints with the most traffic or the slowest p95 in logs or monitoring when the owner gives access.
2. **Measure before claiming.** Use field data when it exists (RUM, CrUX, APM, store vitals), lab measurements otherwise, and state which. Repeat lab runs (at least three, report the median) on a production build.
3. **Static candidates.** Read the hot paths for the patterns below. Each is a lead until measured or computed (query count times row count, bytes shipped, work per frame).
4. **Quantify.** Every finding states the cost: milliseconds at a percentile, bytes, queries per request, frames dropped, money per month. No estimated impact, no finding; a zero-impact item is a note.
5. **Be specific.** "Compress `hero.png` (450 KB) to AVIF at the rendered size", not "optimise images".
6. **Budgets.** If the project has budgets (`size-limit`, `bundlesize`, Lighthouse CI budgets, performance tests), check them and treat a breach as a finding. If it has none, propose two or three in Questions.

## Thresholds

Good / needs improvement / poor, at the 75th percentile of page loads (retrieve current values from web.dev before quoting them in a report):

| Metric | Good | Poor |
|---|---|---|
| LCP | ≤ 2.5 s | > 4 s |
| INP | ≤ 200 ms | > 500 ms |
| CLS | ≤ 0.1 | > 0.25 |
| TTFB | ≤ 0.8 s | > 1.8 s |
| FCP | ≤ 1.8 s | > 3 s |

## Checks

### Backend

- Independent awaits in sequence (`for` loops of `await`, chained calls that do not depend on each other); unbounded `Promise.all` or goroutine fan-out on user-sized input.
- Synchronous file, crypto or compression work in request handlers (`readFileSync`, `zlib.*Sync`, `bcrypt` at a high cost on a single event loop).
- Blocking calls inside async runtimes (Python `requests` in `async def`, `time.sleep`, JDBC on a reactive thread).
- Outbound HTTP and database calls without timeouts.
- No cache for expensive pure reads; caches without TTL or invalidation; caching per user where a shared cache works.
- Large responses: no pagination, whole objects where a few fields are used, no compression.
- O(n²) work on user-sized collections (nested `find`, `includes` in loops, string concatenation in loops).
- Logging or serialisation in hot loops.
- Serverless and edge: heavy top-level initialisation (cold start), bundle size, per-request connections, CPU-time and subrequest limits; on Workers, use `ctx.waitUntil` for work the response does not need. Profiling a deployed Worker: `lll:cloudflare`.

### Web front end

- **LCP:** hero image lazy-loaded or discovered late (CSS background, JS-inserted), no `fetchpriority="high"` or preload on it, slow TTFB, render-blocking CSS or fonts in the critical path.
- **CLS:** images and embeds without `width` and `height` or `aspect-ratio`, injected banners above content, web fonts without `font-display` or size-adjusted fallbacks.
- **INP:** long tasks in input handlers, synchronous state updates that re-render large trees, heavy work not deferred (`scheduler.yield`, `requestIdleCallback`, workers).
- **JavaScript weight:** whole-library imports (`lodash`, `moment`, icon packs), no route-level code splitting, client components that could render on the server, duplicate packages in the bundle, legacy polyfills for browsers the project does not target (`browserslist`, `@babel/preset-env` targets, `core-js`).
- **Network:** missing `Cache-Control` on hashed static assets, no Brotli or gzip, request chains (CSS imports, JS-loaded fonts), preconnects to origins never used, third-party scripts on the critical path.
- **Lists and rendering:** unvirtualised long lists, layout reads after writes in loops, animations on properties other than `transform` and `opacity`.
- Production source maps served publicly: a perf and exposure note, not a speed issue.

### Mobile

- Startup: work on the main thread before first frame (SDK initialisation, database migrations, synchronous storage reads), large splash-time network calls.
- Lists: React Native `FlatList` without `keyExtractor` or `getItemLayout` for fixed rows, inline renderers re-created every render, `ScrollView` holding long lists; Flutter `ListView` instead of `ListView.builder`, missing `const` constructors; Android `RecyclerView` without `DiffUtil`; SwiftUI `List` identity churn.
- Images decoded at full resolution into small views; no caching.
- React Native: Hermes enabled, `console.log` stripped in release, heavy JS-thread work during navigation transitions.
- App size: unused resources and architectures, uncompressed assets.

### Memory

- Module-level maps or caches that only grow; listeners, intervals and subscriptions not removed; closures capturing large objects in long-lived callbacks; Workers or Lambdas holding per-request data in global scope.

## Commands

Builds write into the tree, so run them in the fix worktree or a temporary copy.

| Need | Command |
|---|---|
| Lab page metrics | A pinned Lighthouse CLI (`lighthouse <url> --only-categories=performance --output=json`), or Chrome DevTools traces through a browser MCP server or the `chrome-browser` and `built-in-browser` skills |
| Field data | PageSpeed Insights or CrUX API for public URLs (owner go-ahead: sends the URL to Google) |
| Bundle composition | The framework's build output (`next build` route sizes, `vite build` with the visualizer plugin if configured), `source-map-explorer` on a production build, `webpack-bundle-analyzer` stats |
| Node backend | `node --cpu-prof`, `clinic` if installed, `autocannon` against a local server only |
| Python | `py-spy record`, `cProfile`, `tracemalloc` |
| Go | `go test -bench . -benchmem`, `pprof` endpoints on a local run |
| JVM | JFR, async-profiler |
| .NET | `dotnet-counters`, `dotnet-trace` |
| Android | `adb shell am start -W <pkg>/<activity>` for start time, `adb shell dumpsys gfxinfo <pkg>` for frames, Macrobenchmark, Perfetto, LeakCanary |
| iOS | Instruments (App Launch, Time Profiler, Hitches, Leaks), MetricKit reports |
| Flutter | `flutter run --profile`, DevTools performance view |

Load tests only run against a local or disposable environment, never production (`../../../shared/ground-rules.md`). Measurements on a real device need the owner's device: list them under Owner actions when none is available.

## Severity calibration

- **critical:** an endpoint or job that times out or exhausts memory at current data volume in a core flow; a runaway paid workload (AI calls, egress) with no bound.
- **high:** p75 LCP above 4 s or INP above 500 ms on a core page in field data; an N+1 that makes the main list scale linearly with records; cold start above several seconds on the first screen of a mobile app.
- **medium:** Core Web Vitals in "needs improvement" on key pages; a bundle carrying a large unused library; missing caching on a frequently hit read.
- **low:** small wins with measured impact under 100 ms or a few kilobytes on non-critical pages.

## False-positive traps

- Development builds (React dev mode, unminified bundles, debug APKs) are not evidence.
- A fast developer machine and a warm cache are not the 75th percentile user.
- A render-blocking resource or unused preconnect with zero measured impact is a note, not a finding.
- An N+1 over a small fixed N, or a slow path that runs once a day in a background job, rarely matters.
- Bundle reports that include dev-only or test code; check the production entry.
- Third-party scripts the owner requires (analytics, chat) are a trade-off: report the cost, let the owner decide.
