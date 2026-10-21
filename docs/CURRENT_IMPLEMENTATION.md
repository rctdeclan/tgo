> Historical baseline audit (2c0289c), not the current implementation or unresolved-policy list. Cookbook P2-P3 and Temporal P4-P5 are now implemented. Read ARCHITECTURE.md, CALENDAR.md, IMPLEMENTATION_STATUS.md and CLOUD_HANDOFF.md first. Original evidence below is preserved unchanged.

# Current TGO / Replanner Implementation

Audit date: 2026-10-21. Application baseline: Git commit `2c0289c`.
Architecture is pending reconciliation with the newer TGO specification, which was not supplied.

## Scope and evidence

This report covers only the main `replanner` project. Sibling archives are excluded. All application source, configuration, package metadata and the lockfile were inspected. Dependencies and generated build output were examined only to verify setup, not as application architecture.

The project was initially supplied without `.git`. At the user's subsequent request, a local `main` repository was initialized and the existing source was committed as `2c0289c`, before audit documents were added. This establishes a baseline, not historical evidence about earlier development. There are no earlier commits, tags or configured remotes in this repository. No claim about the model used to develop it or the reasons for earlier rewrites can be established here.

Source references below are project-relative paths and line numbers at that baseline. Runtime verification means the checks described in `IMPLEMENTATION_STATUS.md`; it does not imply browser gesture testing.

## Project structure and dependencies

| Module | Actual role |
| --- | --- |
| `src/main.jsx` | Creates one composed app instance and mounts its function-valued `View` with ReactDOM |
| `src/App.jsx` | Registers four parts, supplies configuration, seeds 20 events and assembles SVG layers |
| `src/core/compose.js` | Fluent builder returning a subclass of its supplied base class |
| `src/state/viewport.js` | Module-level viewport store, listeners, hook subscriptions and navigation actions |
| `src/hooks/useTrackpadTimeline.js` | use-gesture wheel/pinch binding and native Safari gesture listeners |
| `src/ui/ViewportSVG.jsx` | Fixed SVG frame, world translation, global keyboard handling and visual animations |
| `src/domain/time.js` | Fixed millisecond unit hierarchy and adjacent-unit span ratios |
| `src/domain/projection.js` | Quantizes event start and duration to current unit cells |
| `src/parts/HeaderPart.jsx` | Grouped header rows, date labels, clipping-aware label placement and highlighting |
| `src/parts/StrokesPart.jsx` | Event storage, notifications, routing/layout, cell grid, inline creation and stroke rendering |
| `src/parts/ListsPart.jsx` | Per-unit columns for events shorter than one displayed unit; derives its vertical position from stroke layout |
| `src/parts/PackingPart.jsx` | Older packing method; instantiated but unused by the active stroke layout |
| `src/bg.png`, `src/bg2.png` | Part-owned image backgrounds |
| `index.html`, `vite.config.js` | Root element, global styles and Vite React plugin |
| `replanner.code-workspace` | Editor workspace; includes a relative reference to another folder, not an app dependency |

The project is JavaScript/JSX with ES modules, React and Vite. There is no TypeScript setup, test runner, linter, backend, database, routing framework or application CSS bundle. The lockfile resolves React/ReactDOM 18.3.1, use-gesture 10.3.1, Vite 5.4.21 and plugin-react 4.7.0. Manifest ranges and available commands are in `package.json:6`.

## Composition architecture

The active abstraction is a class composition builder with named part instances. It is not a subclass of React.Component. There is no class named Compound in the main project's source. `BaseApp` is empty; the generated class still uses ordinary JavaScript inheritance (`extends Base`).

Actual application construction (`src/App.jsx:17`):

```jsx
const App = compose(BaseApp)
  .part("packing", PackingPart)
  .part("header", HeaderPart)
  .part("strokes", StrokesPart)
  .part("lists", ListsPart)
  .body(class {
    constructor(app) { this.viewportConfig = /* configuration */ }
    init() { /* seed this.parts.strokes */ }
  })
  .view((parts, app) => /* JSX */)
  .build()
```

`src/core/compose.js:2` closes over `partDefs`, `BodyClass` and `viewFn`. `.part`, `.body` and `.view` mutate those captured values and return the builder. `.build()` returns a class, not an instance. The class and its instance `View` continue to reference the builder's captured values; build does not freeze a snapshot.

Construction proceeds as follows (`src/core/compose.js:24`):

1. Call `super(...args)`.
2. Construct a separate body object with the app as an argument.
3. Copy its enumerable own properties to the app using `Object.assign`.
4. Create `app.parts` and instantiate registered part classes in registration order, passing the app.
5. If the body has `init`, invoke it using `bodyInstance.init.call(app)`.
6. React later invokes the app's arrow-function `View`, which calls `viewFn(app.parts, app)`.

A significant distinction from prior conversational descriptions: **body prototype methods are not merged onto the app**. A conventional `method() {}` and `init() {}` live on the body prototype and are not copied by `Object.assign`. The builder special-cases invocation of `init`; it does not install `app.init`. Own arrow functions would be copied, but retain their original lexical body `this`. One `.body` call is used in App; the builder permits repeated calls and replaces the previous body definition. Similar replacement occurs for duplicate part names and repeated `.view` calls. There is no validation or disposal protocol.

### Compound terminology

| Requested concept | Evidence in the main project |
| --- | --- |
| Compound Classes | A generated `Composed extends Base` class exists; no formal Compound Class contract is documented |
| Compound Parts | Regular named classes receiving an app reference; all four are constructed by the builder |
| Compound Functions | No named implementation or formal function construction protocol is present |
| Alpha/beta/gamma closures | No definitions or identifiers establish these roles; ordinary lexical closures must not be assumed equivalent |
| Fluent composition API | Explicitly implemented in `src/core/compose.js` |
| Cross-part wiring | Explicit property access such as `this.app.parts.strokes.getLayout(...)` in ListsPart |
| React functional views | Function-valued class fields use React hooks and lexical `this`; `.view((parts, app) => JSX)` is explicit |
| Pure views | Top-level composition callback projects JSX; part views also own interaction state and effects, so the whole view layer is not purely stateless projection |

There is no React Context, dependency injection container or inheritance hierarchy for the part classes. The new external definition of Compound Functions cannot be assessed until supplied.

## State ownership and execution flow

`src/main.jsx:6` creates `new App()` once outside React. App's post-parts init seeds 20 events relative to its initialization time. No StrictMode wrapper is used.

`StrokesPart.events` owns the canonical event array. `addEvent` appends an object with color and a cloned `positionsByUnit` object, then notifies listeners (`src/parts/StrokesPart.jsx:30`). Stroke/list content and backgrounds use local revision counters to render after notifications. React owns draft text, hover state and animation state. Events are not stored in React state directly.

The viewport's canonical state is a **module singleton** (`src/state/viewport.js:8`), not an app-owned instance. Each `useViewport` call subscribes React state to that shared store. Two app instances would have separate event arrays but share navigation. Configuration is supplied to action closures, rather than stored with the singleton. No useSyncExternalStore or centralized transaction mechanism is present.

Lists depends on StrokesPart both for event notifications and layout. Layout is recalculated independently by stroke content, stroke background, list content and list background. PackingPart is registered but the current layout calls `assignRowsForUnit` directly (`StrokesPart.jsx:109`).

## Time, projection and rows

Terms have this shape:

```js
{ anchor: timestampMs, definedUnit: "day", amount: 2 }
```

Events add `id`, `title`, `color` and `positionsByUnit`, for example `{day: 2}`. `preferredRow` is still accepted as an older fallback. There is no schema validation. Sample subjects determine colors but are not retained as event subject fields (`src/App.jsx:66`).

The ordered units are minute, fifteenMinute, hour, fourHour, day, week, fortnight, month, quarter and year. All are fixed durations: day = 24 hours, week = 7 days, month = 28 days, quarter = 84 days, year = 336 days (`src/domain/time.js:15`). All adjacent span ratios agree with those durations. Weeks are Unix-epoch buckets, not configured ISO/local calendar weeks. Date labels use local JavaScript Date formatting; that is a separate calendar interpretation.

Projection (`src/domain/projection.js:4`):

```js
start = Math.floor((term.anchor - origin) / UNIT_MS[unit])
span = Math.max(1, Math.ceil(UNIT_MS[term.definedUnit] * term.amount / UNIT_MS[unit]))
```

The span is rounded from duration alone, not from the actual ending bucket. Sub-cell anchor position is discarded. A one-day event starting at 0.9 days projects to start 0, span 1, although its real end crosses a second day bucket. Whether that is intended quantization needs confirmation.

`getLayout` routes events with duration/current-unit ratio below 1 into lists. All others become strokes; there is no crowding-based overflow routing. It sorts projected strokes by start, span and id, then assigns a non-overlapping row starting at the saved row (`StrokesPart.jsx:50`). At least six rows are rendered; more rows are allowed.

The saved-position mechanism is incomplete: projection spreads each stored event into a new object, and `assignRowsForUnit` replaces `positionsByUnit` on that copy. Automatically resolved positions do not reach the canonical event. Input-created row hints are stored, but conflicts can displace them on each layout calculation. Adding an earlier overlapping event can move an existing event. A position is currently a row number only; horizontal position remains derived from time. Keys are semantic units, not continuous zoom scales.

## Coordinates, navigation and rendering

The frame is 640 by 520 SVG pixels (`src/ui/ViewportSVG.jsx:7`). World x=0 is translated to frame center plus `worldOffsetPx`. A cell is `120 * zoom` pixels wide. Stroke rows are 40 pixels apart, cells 30 pixels tall, gaps 14 pixels, stroke content starts at y=81. Nested SVG elements give rows, events and lists local coordinates.

Pan normalization moves complete cell offsets into `worldOriginTime`, keeping the residual offset within one cell (`src/state/viewport.js:17`). This preserves the continuous pixel-to-time map and recycles a fixed 40-column window. It is not a data-loading or unbounded DOM system. Very small minute cells can make that fixed window narrower than the viewport.

Gesture zoom preserves the cursor time using old and new pixels-per-millisecond, snaps the new origin on unit changes, and transfers zoom using adjacent span ratios (`src/state/viewport.js:125`). Zoom-out thresholds are `zoomUpper / currentTermSpan`. The app cap `640 / (3 * 120)` ensures at least three unit-widths fit at settled scale; it does not guarantee three complete unobscured cells or three cells in every coarser header row.

Keyboard Up/Down changes one unit and lands at the maximum readable cell size, preserving center time. It does not preserve duration width like gestures. Left/Right pans by one current cell. Header clicks use `jumpTo`, which preserves duration scale until capped, centers the selected timestamp and resets offset. These are three distinct navigation policies.

`useTrackpadTimeline` uses wheel deltaX for pan and accumulated Ctrl-wheel deltaY for zoom. Steps multiply zoom by 1.025 or its inverse. Pinch and native Safari gesture paths also accumulate logarithmic scale deltas. `zoomSensitivity` is declared but unused. Native listeners depend on a newly created viewport object and may be rebound after renders; real Safari/Chrome delivery is not verified here.

The three header rows use the current unit and up to two coarser units, absolute epoch grouping and local labels. Near the year boundary only one or two rows exist; bottom-row click logic still assumes rowOrder 2 (`HeaderPart.jsx:102,147`). Labels clamp only for intersecting groups. Current-period tint is computed from Date.now on render, with no clock timer. Header grouping floors the origin while event projection uses the full origin; fractional origins therefore remain a source of positional disagreement.

Keyboard animation immediately applies model changes, then animates a compensating translate or scaleX to identity over 180ms. A single-view blur/opacity pulse also occurs on unit changes. This is not interpolation of two complete semantic layouts. Single requestAnimationFrame scheduling and rapid repeats need browser verification.

## Sections, lists and editing

App places part-owned background functions into `stationaryChildren`, outside keyboard transforms (`src/App.jsx:80`). They cancel worldOffsetPx themselves, so image x positions remain fixed during pan; image height/section split still follows row count. They remain inside the dissolve group. Header's translucent background remains inside the animated header view.

List columns use the same 120*zoom spacing and origin as strokes. The section starts at `81 + rowCount * 40 + 8`, with height 110. Each column takes at most six items in event insertion order, but 40-pixel item spacing puts most beyond that height. There is no overflow count, internal scrolling or expand control. Time indicators use weekday, calendar week-of-month, month or clock strings. List items omit event color and source unit.

Clicking a grid cell opens a foreignObject input. Enter or blur saves, Escape cancels, and blank titles are discarded (`StrokesPart.jsx:161`). Creation records one current-unit duration and the clicked row. Drafts keep relative start/row, not an immutable time/unit snapshot, so navigation while editing can change the resulting event time or duration. Existing strokes have no edit, drag, resize, delete or completion action; the checkbox is decorative SVG. The extra outset border is conditional on exact definedUnit equality and uses expanded SVG bounds with overflow visible.

## Persistence

All events, row hints, viewport state and drafts live in memory. Reload recreates seed events and discards additions. No localStorage, IndexedDB, API, database, export/import or authentication implementation is present. The lockfile and local Git baseline persist code, not scheduling data.
