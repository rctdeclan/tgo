> Current Temporal update (2026-10-21): P4/P5 are now implemented and verified with 49 tests/build and real Chrome interaction/alignment checks. CALENDAR.md and TEMPORAL_MIGRATION.md supersede pending calendar statuses below. Routing uses definedUnit rank, NOT the earlier duration comparison. Fractional event amounts are explicitly deferred. The following record is historical.

# Cookbook Migration Progress

Updated: 2026-10-21. P2-P3 implemented and automated verification passed; ready for user review. P4-P5 have not started. No commit or push.

## Confirmed contract

The user confirmed configuration before Parts, ordinary Body prototype methods installed on app with normal JavaScript call semantics, declaration-order Part construction, exactly one automatic post-Parts init with app receiver, and View(parts, app). Own Body data fields are copied. Function-valued own fields (including arrows) fail clearly before Part construction; no lexical arrow rebinding is attempted. Application orchestration uses prototype methods and explicitly constructed capabilities, not Body arrow fields.

The function correction remains authoritative: alpha is inline at the beta call site; beta belongs to a Part and constructs/returns one reusable gamma retaining beta context. Gamma incorporates alpha in executable behavior. Beta determines surrounding work, conditional/repeated invocation and independent/no return. No universal return alpha(...) rule exists.

## Production implementation

- src/core/compose.js implements the confirmed lifecycle. Build captures its declarations; later builder calls do not change an already-built class.
- src/App.jsx Body.init constructs ten capabilities once and wires creation -> insertion -> event observation -> refresh and header navigation -> viewport navigation -> refresh. Body methods seed events, coordinate layout/presentation and notify React subscribers.
- ViewportPart owns a per-app createViewport instance. Existing fixed-duration algorithms were moved out of useViewport without calendar changes. State no longer leaks between different app instances.
- StrokesPart owns creation, event insertion and layout. The existing addEvent/getLayout/assignRowsForUnit implementations remain local domain operations; application interactions use wired capabilities.
- ListsPart receives viewport, rowCount and listItems through its present capability. All four sibling accesses are removed. HeaderPart supplies groups and navigation through its capabilities.
- PackingPart remains inactive in the app's lane path. It has a reusable layout capability around its existing pack calculation; it has not replaced assignRowsForUnit.
- No Part retains app or another Part. ViewportPart reads only viewportConfig during construction. No sibling imports, registry, event bus or React Context is introduced.
- AppPresentation subscribes to a stable Body snapshot using useSyncExternalStore. This is presentation-state notification, not a Part communication bus. Child Views receive data and capability dispatchers. Draft/hover, input adapters, Safari gesture listeners and presentation animations remain in React.
- The actual frame and input fallback widths are 640px. Assets, JSX geometry and fixed time-unit mathematics remain unchanged. No persistence or backend was added.

## Capability inventory

| Part beta | Inline alpha site in Body.init | Returned gamma behavior |
| --- | --- | --- |
| viewport.read | viewport => viewport | Reads current instance snapshot |
| viewport.navigate | () => this.refresh() | Runs a named navigation operation, invokes alpha, returns its own snapshot |
| viewport.stepScale | scale => scale | Supplies existing keyboard animation compensation ratio |
| strokes.layout | layout => layout | Runs unchanged projection/lane calculation |
| strokes.insert | event => event | Inserts, invokes alpha, returns the stored event independently |
| strokes.observe | () => this.refresh() | Registers its reusable gamma with local event notifications; gamma invokes alpha with the current events |
| strokes.create | event => this.insertEvent(event) | Constructs a native-unit event from draft/current viewport, dispatches insertion |
| header.present | model => model | Builds unchanged header grouping with Body-supplied current time |
| header.navigate | (index, time) => this.navigate("jumpTo", index, time) | Dispatches valid header targets to viewport capability |
| lists.present | model => model | Selects supplied layout data for Lists presentation |

The observe construction registers its returned gamma in the owning Part's local listener array; no cross-Part observer lookup occurs. Body constructs it once. It lives with the Part, so no external/global listener survives disposal of the app; React subscribes/unsubscribes separately. Direct legacy addEvent calls still refresh the shared model. This is a local capability lifecycle, not a new universal Cookbook convention.

Each construction returns one function; refresh and repeated interactions reuse it. PackingPart.layout is separately tested, but intentionally not wired into active placement. Capability-specific payloads are implementation APIs, not additional universal Cookbook rules.

## Verification

- Builder/example increment: 12/12 focused tests passed.
- Migrated baseline increment: 22/22 tests passed.
- Final suite: 30/30 tests passed. Covers builder order/receivers/one-time initialization, unsupported own functions, reusable production gammas, inline alpha sites, Part isolation, explicit wiring, event/list notifications, instance memory isolation, unchanged navigation math, 640px SSR and input-adapter dispatch.
- npm run build passed (51 modules). No dependency versions changed in P2-P3.
- One-off comparison against Git baseline 2c0289c passed 41 exact SVG-markup comparisons: initial render plus all ten units after navigation, right pan, left pan and cursor zoom. Initial markup matched all 84,668 characters at a fixed timestamp. This compares markup, not browser pixels.
- Initial sandbox runs intermittently stopped esbuild's native service. Retrying outside the sandbox passed; this was not repaired by changing application logic.
- Browser automation failed to initialize its Node runtime, so live browser execution, CSS animation paint timing, DOM focus/blur delivery and physical Safari/Chrome trackpad behavior remain unverified. Handler tests use controlled React-hook/gesture adapters, not a browser.
- Existing fill-rule React warning, synthetic calendar periods, fractional-origin header discrepancy, row-cache loss and crowded-list clipping remain. They are not newly approved behavior and have not been fixed by this architecture-only phase.

## Status

No essential Cookbook lifecycle ambiguity remains for the implemented TGO mechanisms. P2-P3 are complete at the automated/source-verification boundary and ready for review, not a claim of hardware/browser certification. P4-P5 remain deferred; calendar policy approvals still belong to DESIGN.md. Do not commit or push until review.

## Files changed in P2-P3

Runtime: src/core/compose.js, src/App.jsx, src/parts/ViewportPart.js (new), src/parts/HeaderPart.jsx, src/parts/StrokesPart.jsx, src/parts/ListsPart.jsx, src/parts/PackingPart.jsx, src/state/viewport.js, src/ui/ViewportSVG.jsx, src/hooks/useTrackpadTimeline.js.

Examples/tests: examples/cookbook-minimal.js (including an executable fluent ExampleApp), tests/builder.test.js (new), tests/cookbook-application.test.js (new), tests/presentation-actions.test.js (new), tests/cookbook-example.test.js, tests/current-implementation.test.js, tests/helpers/load-source.js and tests/README.md.

Documentation: AGENTS.md, docs/ARCHITECTURE.md, docs/COOKBOOK_PROGRESS.md, docs/COOKBOOK_MIGRATION.md, docs/IMPLEMENTATION_STATUS.md, docs/INVARIANTS.md, docs/IMPLEMENTATION_PLAN.md, docs/RECONCILIATION.md, docs/DESIGN.md and docs/VERIFICATION_EXAMPLES.md. Historical baseline assessment sections are labeled rather than presented as current gaps.

Unchanged: src/domain/time.js, src/domain/projection.js, src/main.jsx, image assets, index.html, Vite configuration, and package files (pre-existing P1 package changes remain). No application dependency or package version was changed by P2-P3.
