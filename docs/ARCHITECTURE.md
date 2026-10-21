# TGO Architecture

Updated: 2026-10-21. Cookbook and the corrected Temporal-backed P4/P5 work are implemented, tested and ready for review. compose.js is unchanged in the calendar phase. See COOKBOOK_PROGRESS.md for verification boundaries and remaining product defects.

## Compound Functions, Parts and Classes

These are distinct, coupled mechanisms:

- Compound Function: alpha is inline at the beta call site. Beta is a Part method constructing/returning one reusable gamma inside its closure. Gamma retains context and incorporates alpha in its behavior. Beta controls surrounding work, repeated/conditional invocation and return values. Gamma need not return alpha's result.
- Compound Part: encapsulates domain responsibility and exposes capabilities through Compound Functions. It cannot access or retain siblings. Pure calculations may remain ordinary helpers.
- Compound Class: the essential compose(Base).part(...).body(...).view(...).build() chain creates a class. The Compound explicitly wires capabilities, Body orchestrates, and React Views present supplied data and dispatch actions.

No event bus, registry, DI framework or React Context substitutes for these mechanisms.

## Confirmed builder lifecycle

src/core/compose.js implements the user's confirmed six-step contract:

1. Construct Body with app before Parts; copy its own data fields onto app.
2. Install ordinary Body prototype methods so method calls on app use app as this. Return values and normal call/call-site receiver semantics are preserved; methods are not silently bound.
3. Instantiate Parts in declaration order.
4. Automatically invoke Body.init once after construction with app as receiver; construct/wire capabilities there.
5. React invokes the configured View with (parts, app).
6. Body arrow-function fields retain normal JavaScript lexical semantics; they are not rebound. Function-valued Body own fields are rejected with a clear error instead of copied as app methods. Use prototype methods for orchestration. Own accessor fields are not data and are also rejected.

Build captures declarations so subsequent builder use does not alter a previously built class. This is an implementation safeguard, not a new universal Cookbook convention. No additional class hierarchy, implicit mount/disposal system or member rebinding protocol is introduced.

## Ownership and execution flow

src/main.jsx constructs App and mounts app.View. src/App.jsx registers Viewport, Packing, Header, Strokes and Lists Parts, configures the 640px frame, and wires ten reusable capabilities in Body.init before seeding the same twenty subject-colored events, now with semantic seed offsets.

| Responsibility | Implementation |
| --- | --- |
| Canonical viewport state/navigation | ViewportPart owns one createViewport instance from src/state/viewport.js; shared Temporal coordinates and local calendar interval spans replace fixed-duration algorithms |
| Event records and creation | StrokesPart owns its in-memory array and creates/inserts events through capabilities |
| Projection and provisional placement | StrokesPart.getLayout uses semantic projection/routing; assignRowsForUnit remains unchanged; PackingPart is not activated as the lane algorithm |
| Header intervals/navigation | HeaderPart.present builds real calendar groups using the shared active coordinates; HeaderPart.navigate dispatches supplied targets |
| Lists data | ListsPart.present selects supplied rowCount/listItems/viewport, with no sibling access |
| Shared presentation snapshot | Body.refresh calls wired capabilities once per update and publishes one consistent model to React subscribers |
| Input and rendering | AppPresentation consumes the Body snapshot with useSyncExternalStore; Views dispatch supplied actions |
| Hover/draft text/animations | Presentation-local hooks remain; they do not own canonical event or viewport state |

Parts do not retain app or sibling instances. ViewportPart reads only viewportConfig during construction. All actual cross-Part wiring is in Body.init; no Part imports another Part. The Body's React subscriber set transports presentation snapshots, not named messages or cross-Part events. StrokesPart.observe registers its returned gamma with the Part's existing local event listeners during explicit Body.init wiring; the gamma reads events and invokes alpha. That internal subscription has the Part's lifetime and no external/global resource.

## Real wiring example

From src/App.jsx Body.init:

```js
this.insertEvent = this.parts.strokes.insert(event => event)
this.eventsChanged = this.parts.strokes.observe(() => this.refresh())
this.createStroke = this.parts.strokes.create(event => this.insertEvent(event))
this.navigate = this.parts.viewport.navigate(() => this.refresh())
this.navigateHeader = this.parts.header.navigate((index, time) => this.navigate("jumpTo", index, time))
```

StrokesPart.create constructs a native-unit record and invokes its captured alpha. Body sends that record to the insertion gamma; insertion updates events. The reusable observer gamma invokes the Body refresh callback on any event insertion, including direct calls to the retained addEvent API. Header navigation similarly invokes the viewport gamma, then refreshes shared presentation. These gammas are constructed once and reused, not rebuilt on every render.

ViewportPart.navigate illustrates independent return semantics:

```js
navigate(alpha) {
  const viewport = this.viewport
  const commands = { /* explicit allowed navigation operations */ }
  const gamma = (command, ...args) => {
    commands[command](...args)
    const snapshot = viewport.getSnapshot()
    alpha(snapshot)
    return snapshot
  }
  return gamma
}
```

The production implementation rejects unknown commands. The example's command payload is a local API, not a universal Cookbook signature. Other gammas can forward alpha's result when useful; no universal return rule is imposed. examples/cookbook-minimal.js additionally demonstrates conditional/repeated invocation and retained mutable closure counters.

## Presentation boundary

Strokes Views receive viewport/layout/onCreate; Lists Views receive viewport/rowCount/listItems; Header receives groups/current-time data and onNavigate. They do not query siblings, reconstruct domain event records, or own navigation rules. Formatting and SVG geometry remain presentation calculations. ViewportSVG retains keyboard/gesture adapters and horizontal-only animation state. The keyboard scale calculation lives behind the viewport capability.

Draft text, hover, focus and effect-based visual transitions are permitted local state. Creation still resolves the selected relative cell against the current viewport at submission, preserving baseline behavior in this phase; changing in-progress draft semantics is not part of this migration. Body supplies the current timestamp when refreshing header presentation; no periodic clock feature is added.

## Temporal integration and preserved presentation

src/domain/calendar.js is the pure shared authority backed by @js-temporal/polyfill. Five generic operations (cellAt, nextCell, cellPosition, coordinate, instantAt) provide real half-open cells and one index/elapsed-fraction mapping. Small support helpers resolve wall-clock event addition/intervals and local input; labels share Amsterdam formatting. See CALENDAR.md for exact policies and data shapes.

Viewport navigation inverts old coordinates at the cursor/center and solves the new offset for the same instant. Local coarse-cell spans replace fixed ratios; rendering coverage adapts at small widths. Header groups and stroke/list columns use the same origin cell/index. All layers retain the 640x520 SVG, original assets/style, three header rows where levels exist and provisional lanes.

Event storage is unchanged. Routing compares definedUnit ranks independently of amount; finer events go to lists, equal/coarser to strokes. Stroke coverage uses the actual interval's intersected cells with exact exclusive ends. StrokesPart validates positive integer amounts before mutation. Calendar additions use local wall time and retain valid anchor offsets; fractional event amounts are explicitly deferred. nextCell traversal and elapsed coordinate fractions are intentionally different operations.

The use-gesture adapter now binds non-passive listeners natively through the SVG ref, fixing a passive listener failure caught in Chrome; thresholds and Safari-specific listeners are retained. Pure helpers are not forced into Compound Functions. No sibling references, new class hierarchy, global scheduling store, Context or bus were introduced.

## Verification and limits

49 automated tests/build pass, including preserved Cookbook tests and timezone-independent calendar/header checks. Actual headless Chrome verifies render/input/creation/routing/header behavior and DOM column alignment without application errors; details are in TEMPORAL_MIGRATION.md. This is not physical Safari gesture certification or exhaustive visual regression testing.

Existing lost row-cache writes, list clipping and offscreen labels on long strokes remain. Drafts still resolve against the current viewport at submission. No periodic clock, persistence, backend or replacement lane algorithm was added. Real calendar geometry necessarily differs from the removed synthetic 28-day month/336-day year. One CSS scaleX is only a local approximation across nonlinear calendar levels; settled geometry/anchor tests pass. Historical results depend on host IANA data, and very distant sub-day index lookups can enumerate many Temporal transitions.

## Cloud handoff

Linux Cloud verification now passes at the source baseline b765f60; main tracks origin/main at https://github.com/rctdeclan/tgo.git. See [CLOUD_BASELINE.md](CLOUD_BASELINE.md) for actual runtime versions, tests/build, browser checks, dependency audit findings and recommended tasks. Initialization changes documentation only.

The repository is a standalone Vite/React project rooted here; sibling archives are not dependencies. Use Node 22.14.0 (.nvmrc), npm ci including devDependencies, npm test and npm run build. No secrets or external services are required. Native dependencies must be installed on the destination platform; never transfer macOS node_modules. See CLOUD_HANDOFF.md for the current verification record, GitHub connection procedure and known iCloud-development-server limitation. Historical audit documents are preserved, not current architecture authority.
