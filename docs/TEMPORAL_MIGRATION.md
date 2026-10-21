> Historical implementation-phase report. The source is now committed/published at b765f60; current Linux verification and follow-up tasks are in [CLOUD_BASELINE.md](CLOUD_BASELINE.md). References below to uncommitted work, no push or unverified Linux describe that earlier phase.

# Temporal Migration Implementation Report

Updated: 2026-10-21. The corrected full Temporal request authorizes necessary P4/P5 completion. Prior to this task, P4/P5 were absent: there was no custom semantic engine to simplify. The migration replaces the older synthetic calculation paths with one shared Temporal-backed API. No commit or push.

## Implementation and flow

1. src/domain/calendar.js supplies cellAt, nextCell, cellPosition, coordinate and instantAt. Epoch-millisecond cells retain real boundaries, stable indexes and elapsed fractions. Temporal supplies Gregorian arithmetic, timezone conversion, clamping, disambiguation and transition data.
2. ViewportPart still owns a per-app viewport engine; Body constructs the same ten reusable capabilities once. Navigation inverts old coordinates at the cursor/center and solves the new offset. Zoom thresholds use actual local coarse/fine interval spans.
3. HeaderPart iterates actual coarser/current cells and projects through the same active coordinates. ISO week labels and list formatting use Amsterdam rather than the host OS zone.
4. eventInterval resolves {anchor,definedUnit,amount}; projection covers intersected cells using exact half-open millisecond boundaries. Routing independently compares semantic unit ranks, per the user's revised rule. No amount-based routing remains.
5. Body publishes one shared layout/presentation snapshot. Lists receive matching rowCount and projected anchor columns. Strokes retain unchanged assignRowsForUnit logic; event creation selects the current semantic cell and keeps existing memory-only records.
6. Native use-gesture target/ref binding makes passive:false effective. This was necessary to resolve passive-listener console errors found during browser verification; input thresholds and conventions were preserved.

## Removed calculations / Temporal replacements

- Removed UNIT_MS/UNIT_TERM_SPAN, 28-day months, 336-day years and fixed month/week zoom ratios. time.js is only a zoom-order compatibility re-export.
- Replaced raw anchor/origin millisecond division and snapped epoch-duration origins with calendar coordinates/inverse mapping.
- Replaced duration-only span ceilings and rawSpan<1 routing with actual calendar intervals/cell intersections and definedUnit rank routing.
- Replaced header epoch buckets, product-of-spans groups and handwritten week calculations with Temporal calendar cells and weekOfYear.
- Replaced OS-local Date label calculations with Amsterdam Temporal formatting.
- Replaced sample-event fixed day/hour offsets with explicit wall-clock calendar addition.
- Kept unavoidable layout math: cell index grouping, elapsed interpolation, pixel transforms, clipping and provisional lane assignment. Sub-day integer ranking uses only Temporal-provided offsets/transitions; it is not a timezone-rule engine.

Calendar policy details, API contracts and exact examples are in CALENDAR.md. Fractional event amounts are deferred by user instruction. Calendar addition preserves a valid anchor offset and uses compatible disambiguation; all units use wall-clock addition, not ZonedDateTime's default elapsed-hour addition.

## Files created/modified

- New: src/domain/calendar.js, src/domain/labels.js.
- Updated runtime: src/domain/time.js, src/domain/projection.js, src/state/viewport.js, src/parts/ViewportPart.js, src/parts/HeaderPart.jsx, src/parts/StrokesPart.jsx, src/parts/ListsPart.jsx, src/App.jsx, src/hooks/useTrackpadTimeline.js.
- New tests: tests/calendar.test.js, tests/semantic-viewport.test.js, tests/semantic-header.test.js, tests/semantic-projection.test.js.
- Updated tests: tests/current-implementation.test.js, tests/cookbook-application.test.js, tests/presentation-actions.test.js. Fixture timestamps now use the semantic API rather than importing removed duration constants.
- Dependency: package.json/package-lock.json add exact @js-temporal/polyfill 0.5.1 and its jsbi dependency; no application test/browser framework dependency was added.
- Documentation: CALENDAR.md, TEMPORAL_MIGRATION.md, ARCHITECTURE.md, DESIGN.md, INVARIANTS.md, IMPLEMENTATION_PLAN.md, IMPLEMENTATION_STATUS.md, RECONCILIATION.md, AGENTS.md, tests/README.md and current-status banners in historical Cookbook/example documents.
- Unchanged: compose.js, PackingPart/active lane algorithm, main.jsx, ViewportSVG markup/animation implementation, image assets, index.html and vite.config.js. JSX fill-rule spelling was corrected to fillRule without changing rendered styling.

## Verification

- Pre-integration: all 30 existing tests plus seven initial calendar tests passed (37 total); production build passed. Cookbook lifecycle and Part-isolation checks remained intact.
- Calendar/navigation increment: 10 focused tests passed; header increment brought this to 12; routing/projection increment to 18.
- Final automated suite: 49 tests pass, including lookup-order-independent historical indexing, concrete calendar/DST values, exact boundaries, all-level routing, cursor anchoring, input dispatch, memory state and 640px SSR. Full suite passes with TZ=UTC; calendar/header checks also pass with TZ=Pacific/Honolulu, exercising independence from host timezone.
- Production build passes. The bundled JS is about 353 kB / 109 kB gzip, increased by Temporal versus the older ~194 kB / 63 kB gzip build. No package upgrade beyond the requested dependency was made.
- Built-in browser tool could not initialize its Node runtime. A temporary playwright-core driver outside the repository ran the installed Google Chrome in headless mode instead; no browser framework was added to package.json.
- Real Chrome verified initial render, 640px frame, two section backgrounds, Up/Down through all levels, left/right/wheel navigation adapters, ctrl-wheel zoom, inline creation, stroke/list transition, clickable headers and DOM column alignment. No uncaught runtime or application console errors after the native gesture-binding fix. The smoke driver suppresses the browser's unrelated favicon request with HTTP 204; no app favicon feature was added.
- The first smoke run exposed passive-listener errors; the native target/ref fix removed them. Existing JSX fill-rule warning was also eliminated.

## Limitations and review status

Native Safari/macOS pinch and browser history/page zoom need physical-device testing; synthetic Chrome events do not certify those. Headless Chrome screenshots/DOM alignment are not a full visual regression suite. Existing row-cache loss, list clipping/overflow, coarse-event offscreen labels and current-viewport draft submission behavior remain. Cell-snapped geometry/lanes can change necessarily when actual calendar intersections replace synthetic durations; the placement algorithm itself is unchanged.

A single scaleX animation cannot globally align nonlinear month/day mappings; settled geometry and cursor anchoring are tested, while intermediate CSS motion remains a local approximation. Historical timezone results depend on host IANA/Intl data. Extremely distant sub-day indexing can enumerate many Temporal transitions. Fractional amounts are intentionally not implemented.

P4/P5 are implemented and ready for user review at the automated/Chrome boundary. No commit/push. No remaining policy ambiguity blocks positive-integer events; deferred fractions or future lane design require separate instructions.

## Manual Safari verification

Run npm ci, npm test, npm run build, then npm run dev and open its printed URL. Pan both ways across month/year boundaries; pinch at an off-center date; use every arrow key; click header cells; create an event and zoom between its native/finer/coarser views. Confirm cells/labels/lists align, backgrounds remain stationary, no page/history gesture leaks occur, and reload resets session events. Do not use a successful production build alone as gesture evidence.

## Actual-project verification

After copying the tested implementation into the main project, npm install --offline added only Temporal/jsbi, all 49 tests passed again, the production build passed, and git diff --check passed. compose.js and PackingPart are byte-identical to the pre-Temporal P2/P3 snapshot; existing uncommitted Cookbook changes remain preserved.

Chrome also passed the full smoke check against this project's production preview at http://127.0.0.1:5182/. The identical-source development server in /private/tmp passed previously. However, the actual iCloud-backed Vite development server at port 5181 stalled: initial browser navigation exceeded 30 seconds, and direct HTML/App requests exceeded 10 seconds without a response. This is an unresolved development-environment limitation, not a successful actual-path dev-server check. No dependency relocation or symlink workaround was applied. Physical Safari testing and Linux execution remain unverified.

The extended actual-path development-browser retry also timed out after 120 seconds. Production preview remained verified; the stalled task-owned dev server was stopped.
