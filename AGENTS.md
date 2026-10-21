# TGO / Replanner Agent Instructions

## Authority and scope

The corrected full Temporal request and subsequent user replies define current calendar scope. P2-P3 Cookbook and P4/P5 Temporal integration are implemented and ready for review. The current task establishes a documentation-only Codex Cloud baseline: do not change application code or introduce features. The repository is now published at https://github.com/rctdeclan/tgo; main tracks origin/main. Earlier authorization covers a verified handoff commit/push. Future commits/pushes require task authorization. Only the main replanner project is in scope; do not audit/edit sibling archives or revert unrelated changes.

## Cookbook: mandatory and unchanged

Preserve compose(Base).part(...).body(...).view(...).build(), which returns a class. Alpha is inline at each beta construction; beta is a Part method creating/returning one reusable gamma within its closure. Gamma retains context and incorporates alpha in executable behavior. Work before/after, conditional/repeated calls, ignored/transformed alpha results and independent/no gamma return are permitted. Never mandate universal return alpha(...).

The confirmed builder copies Body own data before Parts, installs ordinary prototype methods with normal app receiver/call semantics, constructs Parts in declaration order, automatically invokes init once afterward, and passes (parts,app) to View. Own function-valued Body fields are rejected; no implicit lexical arrow rebinding. Use ordinary Body methods for orchestration and explicit init wiring. compose.js was not changed by calendar work.

Parts must not discover/retain siblings or app under aliases. ViewportPart reads only constructor viewportConfig. The Compound/Body explicitly wires capabilities; no Context, registry, bus, new singleton orchestration or alternative DI framework. Pure calendar/math helpers remain ordinary functions. Views receive presentation data/actions; appropriate draft/hover/focus/input adapters/animation hooks stay local.

## Calendar authority and semantics

Use @js-temporal/polyfill 0.5.1 and src/domain/calendar.js. Do not reintroduce a custom Gregorian/TZ engine, UNIT_MS/UNIT_TERM_SPAN, fixed month/year durations or universal month/week ratios.

Core API: cellAt, nextCell, cellPosition, coordinate, instantAt. Cells use {unit,index,start,end} with integer epoch-millisecond boundaries, [start,end), consecutive indexes and elapsed coordinate fractions. Calendar calculations are independent of React/Parts/SVG. Mathematical memoization is not scheduling state.

Europe/Amsterdam; Monday weeks; fortnight anchor local 1970-01-05; quarters Jan/Apr/Jul/Oct; overflow:constrain for month/year addition. All event units add in LOCAL WALL time, not elapsed-hour arithmetic. Explicit compatible disambiguation shifts gaps forward/defaults overlaps earlier; preserve a valid anchor offset during addition. Repeated-hour cells remain distinct; four-hour cells follow local 00/04/08/12/16/20. nextCell traversal differs intentionally from event calendar addition.

Fractional event amounts are DEFERRED. Accept positive integer event amounts and reject invalid records before mutation. Coordinate fractions are supported and use elapsed time between actual boundaries; do not conflate these with event fractions. Event model stays {anchor,definedUnit,amount}; derived end is not persisted.

Routing is by semantic definedUnit rank ONLY: finer than display -> list, equal/coarser -> stroke. Amount controls interval, not granularity. Do not use duration/rawSpan/end-versus-start-plus-display-unit to route. Stroke projection covers every cell intersecting [start,end), excluding the following cell at an exact end boundary. Long finer-unit events are single anchor-column list entries, not strokes or repeated entries.

## Structure and preservation

- App Body keeps ten reusable capabilities, initializes seeds, coordinates events/navigation/layout and publishes one stable presentation snapshot.
- ViewportPart owns one createViewport instance. state/viewport.js uses shared calendar coordinates, cursor/center anchoring, local transition spans and dynamic rendered-column coverage; no shared application singleton.
- HeaderPart uses real cells/common labels; StrokesPart owns events/unchanged assignRowsForUnit; ListsPart consumes supplied shared layout; PackingPart remains inactive in the lane path.
- AppPresentation uses useSyncExternalStore; Views do not directly query siblings. src/domain/labels.js formats consistently in Amsterdam.
- Keep the 640x520 SVG, three header rows where levels exist, colors/spacing/assets, part-owned stationary bg.png/bg2.png, lists below strokes and horizontal-only motion.
- useTrackpadTimeline uses use-gesture with target:ref/passive:false, retaining existing thresholds and Safari listeners. Do not regress to passive React wheel-prop binding.
- Scheduling stays in memory. No storage/backend, new event manager, lane redesign or unrelated features. Existing row-cache loss, crowded-list clipping, offscreen coarse-event labels and current-viewport draft submission behavior remain known issues, not target invariants.

## Install and verify

Node 22 reference. Install devDependencies from package-lock; never copy macOS node_modules to Linux. No secrets, services or backend setup.

```sh
npm ci
npm test
npm run build
npm run dev -- --host 0.0.0.0
```

49 tests pass: Cookbook lifecycle/wiring/isolation, Temporal/DST/negative/history indexes, calendar projection/rank routing, cursor anchoring, controlled adapters and real React 640px SSR. Host-TZ independence is also checked. Production build passes. No lint/type-check scripts are configured.

Real headless Google Chrome smoke tests passed initial rendering, native wheel/keyboard/header actions, inline creation, routing and DOM header/grid/list alignment without application errors. A temporary external playwright-core driver was used because the built-in browser tool could not start; no application browser-test dependency was added. This does NOT certify physical Safari/macOS pinch, history gestures or all animation paint cases. Linux/Codex Cloud tests, build and Vite HTTP serving now pass; see docs/CLOUD_BASELINE.md for current browser evidence and runtime versions. The iCloud dependency tree can cause long cold reads; a build alone is not evidence of page loading.

## Documentation

- docs/CLOUD_HANDOFF.md: reproducible setup, GitHub connection steps and verification limitations.
- docs/CALENDAR.md: API, policies, indexes, projection/routing and examples.
- docs/TEMPORAL_MIGRATION.md: change inventory, test/browser evidence, remaining limits and manual Safari checks.
- docs/ARCHITECTURE.md, docs/DESIGN.md, docs/INVARIANTS.md, docs/IMPLEMENTATION_STATUS.md: current implementation/authority.
- docs/IMPLEMENTATION_PLAN.md and docs/RECONCILIATION.md: phase status and approved ledger. Old duration-based routing proposals are superseded.
- docs/COOKBOOK_PROGRESS.md and original audit/migration documents retain historical evidence; current calendar documents supersede old pending statuses.
- tests/README.md: suite coverage and limits.

## Historical Mac development environment caveat

Actual-project tests/build and Chrome production-preview smoke checks passed after integration. The identical-source /private/tmp development server works, but the original iCloud-backed project's Vite development server can stall even on HTML requests. Do not treat the successful build or preview as proof that npm run dev works at this path. No dependency relocation workaround has been applied; do not silently move/link node_modules. Linux execution now passes; physical Safari gestures remain unverified.

## Codex Cloud baseline (2026-10-21)

Read docs/CLOUD_BASELINE.md for current evidence, limitations and next tasks. Fresh public clone at b765f608285ef913f94ede1da0f977a502d169ae; main tracks origin/main at https://github.com/rctdeclan/tgo.git. git pull --ff-only was already up to date. No unfinished local changes were present at initial inspection.

Linux x86_64, default Node 24.19.0/npm 11.9.0. npm ci installed 67 packages with the tracked lockfile unchanged; all 49 tests and production build pass. The repository reference remains Node 22.14.0 (.nvmrc); all 49 tests and production build also pass with that exact runtime. Vite starts and serves HTML/main module HTTP 200 at this checkout; the Mac iCloud path issue is historical. No lint/type-check scripts exist. A scoped credential-pattern scan found no matches; generated outputs/dependencies/common secret paths are ignored and not tracked.

npm audit reports 9 development dependency findings (6 high, 2 moderate, 1 low); npm audit --omit=dev reports zero. Do not silently run npm audit fix or upgrade the lockfile in baseline work. Review Vite/esbuild and transitive tooling updates as a separate maintenance task. Futura is not bundled; Linux font fallback affects visuals. Browser checks do not certify physical Safari gestures or exhaustive motion/visual behavior. No lane redesign, persistence or new features are authorized.
