> Current Temporal update (2026-10-21): P4/P5 are now implemented and verified with 49 tests/build and real Chrome interaction/alignment checks. CALENDAR.md and TEMPORAL_MIGRATION.md supersede pending calendar statuses below. Routing uses definedUnit rank, NOT the earlier duration comparison. Fractional event amounts are explicitly deferred. The following record is historical.

> P2-P3 update: Cookbook migration is now implemented and automated/source-verified, pending review. The user confirmed the six-step lifecycle. See COOKBOOK_PROGRESS.md and ARCHITECTURE.md for current code, capability wiring and test results. The assessment below describes baseline 2c0289c, not current deficiencies. P4-P5 are not started.

> Current function-contract correction (user's C2): beta controls alpha's incorporation into gamma. Gamma may work before/after alpha, transform/ignore its result, return another value/nothing, update closure state, and invoke alpha conditionally or repeatedly. No universal return alpha(...) or exactly-once-per-use rule. This correction supersedes any narrower reading of the historical assessment below. BODY/WIRING lifecycle questions are separate.

> Status update, 2026-10-21: This is the historical Cookbook gap assessment. The Approved Reconciliation Decisions now settle Cookbook adoption, 640px width, semantic calendar periods, preservation of sub-unit lists, in-memory persistence and deferral of lane redesign. See RECONCILIATION.md, ARCHITECTURE.md, DESIGN.md, INVARIANTS.md and IMPLEMENTATION_PLAN.md for current authority, open contracts and the plan awaiting approval. Earlier undecided statements below do not override those decisions. No implementation has begun.

# Cookbook Migration Assessment

Date: 2026-10-21. Scope: the main replanner project only; sibling archives are excluded. Application source remains at baseline `2c0289c`. This is a documentation-only assessment, not implementation authorization.

## Authority and boundaries

The user has established Cookbook as mandatory for TGO. The supplied requirements are:

1. Strict alpha -> beta -> gamma Compound Functions: inline alpha, Part-owned beta, reusable closure-retaining gamma, and gamma must invoke alpha.
2. Daisy-chained Compound Class construction through Parts -> Body -> View -> Build. The builder is essential.
3. Parts encapsulate responsibilities and cannot directly access sibling Parts. The Compound Class explicitly wires them together.
4. The Body orchestrates application behavior.
5. React Views remain pure presentation components.

These requirements resolve the earlier audit's uncertainty about whether Cookbook and the builder are required: **they are required**. The broader newer TGO design remains unavailable and must be reconciled before implementation starts. Earlier audit documents describe the implementation and information available at that time; their open questions do not override this subsequent architectural decision.

The full Cookbook text, executable reference examples and newer TGO product specification have not been supplied. This assessment uses only the requirements above. It does not infer additional rules for argument lists, return values, async handling, binding, member copying, disposal, state transport, constructor timing or exact builder method spelling. Alpha/beta/gamma below name architectural roles; spelling a variable with a Greek letter is not evidence of conformance. In particular, the required function chain and gamma's invocation of alpha must not be translated into a guessed circular-call implementation without the reference protocol.

## Overall conclusion

The current code partially matches Cookbook's **Compound Class builder shape**. It does not implement Cookbook's **Compound Function mechanism**, has direct sibling access in ListsPart, and places orchestration and subscriptions inside views. It therefore does not yet conform to Cookbook as a whole.

The migration must retain and reconcile the builder mechanism. Replacing it with ordinary React components, a conventional class hierarchy, a generic callback convention or dependency injection alone would not satisfy the two coupled Cookbook mechanisms.

## What already aligns

| Existing abstraction | Evidence | Conformance boundary |
| --- | --- | --- |
| Fluent Parts -> Body -> View -> Build declaration | `src/App.jsx:17`; `src/core/compose.js:7` | App registers four parts, one body and one view, then builds. This structural order aligns; it does not prove complete Cookbook lifecycle conformance. |
| Build produces an application class | `src/core/compose.js:23`; `src/main.jsx:6` | A generated class is instantiated once and its View mounted. Exact Cookbook construction semantics still need the full specification. |
| Named responsibility-bearing part classes | `src/parts/StrokesPart.jsx:18`; `src/parts/HeaderPart.jsx:84`; `src/parts/ListsPart.jsx:55`; `src/parts/PackingPart.jsx:2` | Useful responsibility boundaries exist. They do not yet supply Part-owned beta operations, and encapsulation is incomplete. |
| Explicit top-level view assembly | `src/App.jsx:80` | The builder callback takes explicit parts/app and returns JSX without initiating mutations. Its descendants are not pure presentation components. |
| Some application orchestration in Body | `src/App.jsx:22,26,66` | Configuration and sample initialization occur there. Most interactive behavior and update wiring occur elsewhere. |
| Separate domain calculations | `src/domain/time.js:2`; `src/domain/projection.js:4` | Fixed unit definitions and projection are reusable implementation material. Their existence does not make them Compound Functions. |

No existing Compound Function can be certified as conforming to all four required role properties from source evidence.

## Compound Function inventory and differences

### CF1. There is no explicit inline alpha / Part beta / reusable gamma construction

The main source has ordinary methods, hooks, closures and JSX callbacks. None demonstrates the complete required protocol. Examples include `addEvent`, `subscribe`, `getLayout`, `panBy`, `zoomByScaleFactor`, `jumpTo` and `stepUnit` (`StrokesPart.jsx:30,39,77`; `viewport.js:155,183,192,206`).

These operations expose useful behavior to map into Cookbook responsibilities. It would be incorrect to relabel a current callback as alpha or a returned function as gamma and declare the migration complete. The role placement, ordered construction, closure retention, reuse and gamma-to-alpha invocation must actually exist.

### CF2. Class-field arrows are ordinary closure-bound functions

The app's `View` captures the composed instance (`compose.js:47`). Part `Background`, `Content` and `View` fields capture their owning part (`StrokesPart.jsx:118,139,367`; `ListsPart.jsx:60,85,149`; `HeaderPart.jsx:87`). They return JSX and do not implement a Part-owned beta construction yielding a reusable gamma that invokes inline alpha.

Retaining lexical this is not sufficient Cookbook closure retention. Existing function-component identity and current lexical captures can inform migration, but do not establish the required roles.

### CF3. Hooks return actions with a different construction model

`useViewport` returns a state snapshot and ordinary action closures (`viewport.js:117,233`). These closures operate on module state and capture configuration. They are recreated during hook invocation and are not constructed by a Part-owned beta using inline alpha. No action invokes the corresponding alpha according to the supplied rule.

`useTrackpadTimeline` owns refs and effect-bound event listeners, creates use-gesture callbacks, and returns a bind object (`useTrackpadTimeline.js:4,17,26,81,134`). This is React hook composition, not the specified Compound Function protocol. Its reusable event callbacks alone do not establish a Cookbook gamma.

### CF4. Subscription and cleanup callbacks do not establish gamma

`StrokesPart.subscribe` retains a listener and returns an unsubscribe closure (`StrokesPart.jsx:39`). The returned function removes that listener; it does not invoke inline alpha. The listeners themselves are revision-counter setters created inside views. Neither the cleanup closure nor a React effect return value is evidence of a conforming gamma.

Timer, animation-frame, map and DOM-event callbacks in `ViewportSVG` are likewise ordinary callbacks (`ViewportSVG.jsx:50,62,72,103,119,138`). Reusability or closure capture in isolation is insufficient.

### CF5. Pure helper functions are not automatically an incompatible function architecture

`project`, `spanBetweenUnits`, `buildGroups`, date formatters and zoom arithmetic are ordinary calculations. They do not implement Cookbook Compound Functions. The supplied requirements do not say that every arithmetic helper must itself be converted into a three-stage construction. Their architectural use and placement need mapping against Cookbook and the newer TGO design; wrapping every helper speculatively would invent a convention.

### Attribution to older definitions

The source provides no formal older Compound Function definition or terminology. The defensible finding is **absence of the required mechanism**, with ordinary method/hook/closure patterns that are incompatible if treated as substitutes for it. This audit cannot attribute those patterns to a particular older formal definition or GPT model. The main folder has no pre-baseline development history establishing such a lineage.

## Part encapsulation and wiring differences

| Location | Actual access or coupling | Required migration direction |
| --- | --- | --- |
| `ListsPart.jsx:64` | Background directly subscribes to `this.app.parts.strokes` | Compound explicitly establishes the relationship; Lists must not look up or subscribe to its sibling itself. |
| `ListsPart.jsx:69` | Background directly calls StrokesPart.getLayout to calculate list section position | Provide the necessary layout/section information through the reconciled Compound wiring. |
| `ListsPart.jsx:89` | Content directly subscribes to StrokesPart | Remove the second sibling subscription as part of moving coordination out of the view. |
| `ListsPart.jsx:99` | Content directly calls StrokesPart.getLayout for rows and listItems | Resolve responsibility and data flow in the Compound/Body, preserving Lists' own presentation responsibility. |
| All part constructors | The complete app is retained, granting access to every sibling (`compose.js:38`) | Remove actual sibling access and establish explicit permitted boundaries. Whether Cookbook requires a different constructor signature is not supplied. |
| Header, Strokes and Lists views | Independently call useViewport and read app.viewportConfig | This is shared module/config coupling, not direct sibling access today. Reconcile ownership and explicitly wire dependencies instead of treating the singleton as a substitute for Compound wiring. |
| StrokesPart.getLayout | Owns projection, stroke/list routing and row assignment | Responsibility distribution must be reconciled. Its breadth is not by itself a forbidden sibling dependency. |
| PackingPart | Instantiated but unused by the active layout | Decide its responsibility after reconciliation; wiring it back through direct sibling lookup would violate the stated rule. |

`src/App.jsx:67` is a Body action using this.parts.strokes. That is different from a Part reaching into a sibling: Body orchestration is required. However, this is currently a direct ordinary method invocation and still lacks the strict Compound Function mechanism where that mechanism is required.

The JSX references in `App.jsx:85,90` assemble presentation, but do not explicitly establish the behavior relationships hidden inside ListsPart. Removing the spelling `app.parts` while passing the complete sibling instance under another name would not eliminate direct sibling access. The exact wiring interface must follow Cookbook, not an invented event bus or service-container substitute.

No direct sibling lookup was found in HeaderPart, StrokesPart or PackingPart. Their ownership/presentation issues are separate findings; they should not be incorrectly reported as the same violation as ListsPart.

## Compound Class builder and Body differences

### CC1. Preserve the builder, reconcile its contract

`compose` stores mutable part definitions, one body class and a view callback. Chained methods return the builder. build returns a subclass of the supplied Base. This is the strongest alignment with the required Parts -> Body -> View -> Build mechanism and must remain essential in the final design.

The implementation also permits repeated body/view replacement and duplicate part overwrites. Built classes retain the builder's live captured definitions. Cookbook's supplied summary does not establish whether those behaviors are permitted. They are contract questions, not grounds to invent mandatory immutable builders, a new naming API or validation rules.

### CC2. Declaration order and runtime order are different facts

App declares Parts -> Body -> View -> Build. Runtime construction is:

```text
super
body instance construction
Object.assign(app, body own fields)
part instances constructed with app
body.init.call(app)
View invoked later by React
```

Evidence: `src/core/compose.js:24`.

The supplied Cookbook requirement specifies the construction chain but does not give the exact runtime constructor/init order. Therefore the existing pre-parts body configuration cannot yet be labeled a proven lifecycle violation. The full Cookbook lifecycle must determine what changes. Alpha/beta/gamma function roles must not be confused with these constructor phases.

### CC3. Body member installation differs from earlier descriptions

Object.assign does not copy body prototype methods (`compose.js:31`). The prototype init is explicitly invoked but never installed as app.init (`compose.js:42`). Copied own arrow functions keep their lexical body this. There is no general method binding or method-merging implementation.

This is an actual mismatch with the earlier conversational description of the local DSL, not a known Cookbook rule about merging. The migration needs Cookbook's actual Body/member semantics before changing this mechanism. Keeping a body-shaped configuration object alone is insufficient if orchestration remains in views.

### CC4. Body currently orchestrates only startup

The body supplies configuration and 20 sample events. It does not coordinate viewport updates, stroke-to-list data flow, editing workflows, clock updates, keyboard actions or animations. Those behaviors are distributed among hooks and view functions. Explicit Compound wiring and Body orchestration must cover application behavior in the migrated design, using the required Compound Function roles.

App's empty Base class and generated extends Base are observed implementation choices. The provided summary neither requires a different base hierarchy nor forbids this use of inheritance. No hierarchy redesign is proposed here.

## React presentation differences

The top-level builder `.view((parts, app) => JSX)` is presentation-oriented. The generated View wrapper merely invokes it. Pure React presentation is not satisfied transitively, however, because the mounted descendants own behavioral flows:

| View | Non-presentation work currently performed | Necessary separation |
| --- | --- | --- |
| HeaderPart.View (`HeaderPart.jsx:87`) | Reads shared viewport state, owns hover state, reads Date.now, builds a navigation callback calling jumpTo | Supply current-time/hover/navigation presentation inputs from the reconciled behavioral construction; render header geometry and labels from those inputs. |
| StrokesPart.Background (`StrokesPart.jsx:118`) | Subscribes to events and viewport, requests layout | Supply background geometry and viewport-derived values; retain part ownership of the image markup. |
| StrokesPart.Content (`StrokesPart.jsx:139`) | Subscribes to state, owns editing/hover refs, validates titles, generates IDs/time anchors and inserts events | Move behavioral state and workflow orchestration out of presentation; retain SVG grid, input markup and event appearance. |
| ListsPart.Background/Content (`ListsPart.jsx:60,85`) | Subscribes directly to sibling state, invokes sibling layout, groups/truncates data and derives section placement | Remove sibling access and subscriptions from views; supply agreed display data and section geometry through explicit wiring. Pure formatting may remain presentation work. |
| ViewportSVG (`ViewportSVG.jsx:35`) | Calls viewport/gesture hooks, owns animation state, schedules timers/frames, installs global key listeners and invokes navigation | Separate interaction/animation lifecycle from SVG projection through the reconciled Cookbook construction. |

`HeaderPart.View` reads a changing clock during render, so identical explicit inputs need not produce identical output. Event creation from a view handler is not a pure presentation responsibility merely because the mutation occurs after render. Views can expose UI interaction points, but should forward supplied behavior through the agreed protocol rather than construct application workflows internally. The full Cookbook reference must settle how those behavior handles are represented.

The summary does not define a blanket prohibition on every React hook, prescribe a store library or prescribe physical file separation. This report requires removal of the demonstrated behavioral responsibilities from pure presentation; it does not invent a hook ban or mandatory container-component pattern. Trivial markup wrappers such as the part View fields can be preserved or adapted if their resulting inputs and descendants satisfy purity.

## Necessary changes and dependencies

| Change | Depends on | Scope and decisions still pending |
| --- | --- | --- |
| Establish exact alpha/beta/gamma construction and invocation contract | Full Cookbook reference and reconciliation | Inline alpha placement, beta ownership, retained closure meaning, reusable gamma and required alpha invocation; signatures and call semantics must come from the reference. |
| Reconcile builder and Body implementation | Cookbook lifecycle/member semantics | Keep the fluent chain and class construction; resolve member copying, initialization and wiring location without guessing constructor rules. |
| Map behavior to encapsulated Part responsibilities | New TGO event/time/layout/interaction design | Decide which existing responsibilities remain together, including placement and list routing; do not invent a replacement part hierarchy now. |
| Move sibling coordination into Compound wiring | Agreed Part boundaries and Cookbook wiring protocol | Remove all four ListsPart sibling lookups; do not conceal them through aliases or global services. |
| Move application orchestration into Body | Builder/body contract plus behavior mapping | Startup, editing, navigation and synchronization must follow explicit orchestration and the strict function mechanism. |
| Make React views pure presentation | Wired behavior/state outputs | Replace direct state subscriptions, clock reads and behavioral effects in render components with reconciled presentation inputs. Keep useful JSX and styling. |
| Resolve existing functional defects | Reconciled product rules, not Cookbook alone | Row persistence, origin alignment, projection coverage and crowded lists need behavior decisions separate from architecture conformance. |
| Verify both mechanisms together | Migrated vertical slices | Function-role conformance alone or fluent syntax alone cannot establish complete Cookbook conformance. |

## Proposed migration sequence

**Gate: do not start implementation until the main repository is reconciled with the newer TGO design specification.** Cookbook adoption is mandatory; product behavior and implementation details remain pending. This document does not authorize refactoring, package changes or commits.

1. **Complete reconciliation.** Obtain the full Cookbook reference/example and newer TGO design. Resolve each subsystem in RECONCILIATION.md, recording which requirements are fixed and which decisions remain open. Confirm lifecycle and function-role semantics before writing a replacement implementation.
2. **Establish behavioral acceptance examples.** Record what must survive: event creation, saved placement, representation changes, aligned header/world coordinates, three-unit visibility, anchored gesture zoom, semantic keyboard steps and fixed backgrounds. Separate intended behavior from known bugs and deliberate product revisions.
3. **Specify the Cookbook mapping.** Map each application operation to inline alpha, its owning Part beta, retained reusable gamma, and required alpha invocation. Record explicit Compound wiring and Body orchestration. Map state and presentation inputs without selecting an unrequested global-store or callback architecture.
4. **Reconcile the builder first.** Preserve Parts -> Body -> View -> Build as the construction backbone. Adapt only confirmed lifecycle/member/wiring differences; verify class instances and Body orchestration can host the agreed function protocol. This precedes adopting that protocol throughout features.
5. **Migrate one agreed end-to-end behavior.** Select a narrow operation after reconciliation and exercise both mechanisms together, including UI delegation, Body coordination, Part behavior and gamma reuse. Its choice and exact API remain undecided. Avoid an isolated naming-only conversion with no application integration.
6. **Migrate remaining responsibility boundaries.** Apply the verified pattern to event state/layout, navigation/gestures, Lists relationships, editing and animation. Remove direct sibling access while moving each affected view to pure presentation. Coordinate related paths in the same stage so no alias or singleton becomes a hidden replacement for explicit wiring.
7. **Verify feature and architecture acceptance.** Check gamma reuse with retained closure association and alpha invocation on use, beta ownership, inline alpha placement, no direct Part-to-sibling access, explicit Compound wiring, Body orchestration and view purity. Derive exact assertions from the full reference. Verify the application is still built through the fluent chain. Run browser interaction checks and the normal build alongside feature checks.
8. **Finalize documentation after acceptance.** Update provisional AGENTS.md and audit/reconciliation documents to describe the accepted architecture, distinguishing intentional behavior changes from migration regressions. Commit/push only if separately requested.

The sequence has dependencies, not a commitment to the current subsystem split. A future reconciled design may change the boundary of a phase while still satisfying both Cookbook mechanisms.

## Functionality and decisions that can be preserved

Cookbook conformance does not by itself require discarding the timeline implementation. Preserve the following as candidate behavior/implementation material, subject to the newer TGO design:

- The fluent builder, named responsibilities and explicit view assembly.
- SVG/nested-SVG local positioning, part-owned background images, header arrows/label chips, hover styling, subject color palette and native-unit outset borders.
- Event insertion, sample fixtures and memory-only storage while a database remains deferred.
- Unit/projection arithmetic as reusable calculations where the reconciled time model agrees; the exact 28-day month/336-day year decision is not approved by Cookbook alone.
- Continuous-pan normalization and cursor-anchored zoom mathematics where aligned with reconciled coordinates; gesture, keyboard and header behavior remain distinct until resolved.
- Sub-unit event lists and current-period highlighting as capabilities; current routing, clipping and calendar interpretation need product confirmation.
- Existing use-gesture browser integration and keyboard animation ideas as candidate adapters, relocated to the agreed behavioral ownership and verified on real browsers.
- React and Vite tooling, the baseline commit and existing audit evidence.

Preserving a capability is different from preserving its current coupling or defect. Fixing lost row-cache writes or time-grid mismatch alone would not make the architecture conform. Conversely, Cookbook does not decide calendar semantics, lane conflicts, list overflow or persistence technology.

## Verification and change record

For this assessment, main-project source was re-read, sibling access and behavioral view responsibilities were searched, and `git diff --exit-code HEAD -- src` confirmed the source still matches `2c0289c`. No archives were inspected for this assessment. The full Cookbook protocol was not tested because it is absent from the current implementation and no executable reference was provided.

Only `docs/COOKBOOK_MIGRATION.md` is added by this task. No runtime code, package configuration, existing audit documents or AGENTS.md are changed. No new build was necessary for this Markdown-only addition; earlier build results are recorded in IMPLEMENTATION_STATUS.md and are not being presented as Cookbook verification. No commit or push was performed.
