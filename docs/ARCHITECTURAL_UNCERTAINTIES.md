> Historical baseline audit (2c0289c), not the current implementation or unresolved-policy list. Cookbook P2-P3 and Temporal P4-P5 are now implemented. Read ARCHITECTURE.md, CALENDAR.md, IMPLEMENTATION_STATUS.md and CLOUD_HANDOFF.md first. Original evidence below is preserved unchanged.

# Architectural Uncertainties

Audit date: 2026-10-21. Main-project baseline: `2c0289c`. These are observations and reconciliation questions, not new mandatory architecture rules. The external TGO design was not available. Archives are outside scope.

## Composition semantics

**U1. What is a Compound Function?** The main source contains a builder closure returning a class and arrow-function fields returning JSX. It contains no formal Compound Function implementation or alpha/beta/gamma role definitions. Supply the newer definition, a minimal construction example and lifecycle/ownership semantics before classifying these ordinary closures as equivalent. Evidence: `src/core/compose.js:2`, `src/App.jsx:17`.

**U2. Which body members should be installed on the app?** Object.assign copies enumerable own properties only. Conventional prototype methods are not merged; init is only specially invoked. Copied arrow fields still close over the body object. This was reproduced. The code works for the current constructor field and init usage, but does not implement the broader method-merging claim from earlier discussion. Evidence: `src/core/compose.js:28`.

**U3. Is a built composition immutable?** The class captures the builder's mutable partDefs/body/view variables. Reusing the builder after build can affect existing class definitions and instance views. Multiple body calls replace rather than compose. Duplicate part names overwrite. No validation or policy is documented. Evidence: `src/core/compose.js:3`.

**U4. What guarantees may part constructors rely on?** Parts are instantiated in registration order; a constructor can see prior siblings but not necessarily later siblings. Current constructors only retain app references. Cross-part access occurs after construction. Init runs after all parts. No dependency ordering, teardown or multiple-app contract exists. Evidence: `src/core/compose.js:35`, `src/parts/ListsPart.jsx:64`.

## Time and coordinates

**U5. Synthetic periods versus civil calendar periods.** Month=28 days, quarter=84 days and year=336 days are internally ratio-consistent. Labels derive local calendar month/quarter/year/week strings from bucket start timestamps. Epoch weeks begin at multiples of seven days from 1970-01-01, not configured Monday/Sunday boundaries. Fixed 24-hour days do not model local DST days. Decide whether these are deliberate equal-width planning periods, calendar periods, or separately named concepts. Evidence: `src/domain/time.js:15`, `src/parts/HeaderPart.jsx:15`, `src/parts/ListsPart.jsx:21`.

**U6. Origins are only partly canonical.** Initial Date.now origin is arbitrary. Gesture unit transitions snap origin, while header jumpTo and readable keyboard steps set a selected/center timestamp without snapping. Pan normalization retains the origin's fractional phase. Header buckets floor origin/unitMs but stroke projection subtracts full origin. A focused probe reproduces header boundary displacement with origin=100.5 days. What should define the shared global grid and timezone? Evidence: `src/state/viewport.js:8,125,192,206`, `src/parts/HeaderPart.jsx:56`, `src/domain/projection.js:4`.

**U7. Does an event represent occupied buckets or true elapsed time?** Projection floors start and ceils duration independently. A 1-day event anchored 0.9 days into a bucket is drawn as one cell rather than the two cells intersecting its real interval. Whether this is a defect or intended snapping cannot be settled without the new event semantics. Evidence: `src/domain/projection.js:8`.

**U8. Three visible units versus readable keyboard steps.** Settled base cell width is capped at 640/3 pixels. Gesture transitions preserve duration width using ratios; keyboard steps reset cell width to the cap; header jumps preserve width only until capped. These are distinct policies. Exact duration preservation, immediate one-unit keyboard jumps and a hard width cap can conflict. Specify the expected behavior per input method, during animation, and whether three complete cells or three cell-widths are required. Evidence: `src/App.jsx:12`, `src/state/viewport.js:155,192,206`.

**U9. Range and validity are implicit, not comprehensively enforced.** Current callers pass valid unit names, integer step deltas and finite timestamps. Actions clamp ordinary unit indexes but do not reject all NaN/fractional indexes, bad config bounds, negative durations or duplicate event IDs. project itself has no invalid-unit guard. Product-level validation policy is absent. Evidence: `src/state/viewport.js:192`, `src/parts/StrokesPart.jsx:30`, `src/domain/projection.js`.

## Position and state ownership

**U10. Persistent positions are currently hints, not authoritative placement.** assignRowsForUnit resolves overlap anew and replaces the position map on projected objects. Canonical events never receive generated cache writes; even a saved row can be pushed down by newly inserted earlier events. Should saved positions be immutable, user-controlled or conflict-resolved? Is a position a lane only or also an explicit horizontal cell? Should layouts be keyed by semantic unit or continuous zoom? Evidence: `src/parts/StrokesPart.jsx:50,103,191`. Canonical cache loss and existing-event displacement were reproduced.

**U11. Which module owns layout?** PackingPart remains registered and unused. The active assignment logic resides inside StrokesPart and is invoked repeatedly by four component functions. Decide whether this is deliberate ownership or a transitional duplication after comparison. Evidence: `src/App.jsx:18`, `src/parts/PackingPart.jsx:5`, `src/parts/StrokesPart.jsx:109`, `src/parts/ListsPart.jsx:68,98`.

**U12. Is viewport state global or per timeline?** All useViewport consumers share module state regardless of app instance. App config is read by action closures. Event data is per part instance, while hover/draft/animation are per React mount. This mixed ownership is observable architecture, not proof of an intended multi-timeline model. Evidence: `src/state/viewport.js:8,117`, `src/parts/StrokesPart.jsx:18`.

**U13. Event notifications have no canonical layout revision.** addEvent notifies all subscribed views; row assignment works on derived copies during render. There is no schema, transaction or persisted layout version. There is also no retained subject identity, even though seed colors encode subjects. Clarify desired authoritative event fields and which changes should be observable. Evidence: `src/parts/StrokesPart.jsx:30`, `src/App.jsx:66`.

## Visibility and interactions

**U14. Finite rendering behind continuous navigation.** Origin recycling preserves pan math, but +/-20 rendered columns are fixed. Near minute zoomUpper/15, their total width is about 569 pixels, narrower than the frame. Increasing row count is unbounded while frame/body clipping prevents reaching content below it. Specify horizontal coverage and vertical navigation requirements. Evidence: `src/state/viewport.js:17,95`, `src/parts/StrokesPart.jsx:12,110`, `src/ui/ViewportSVG.jsx:7`, `index.html:8`.

**U15. What makes an event belong in a list?** Current routing is duration<one current unit, not lane overflow. Lists keep insertion order, omit event color/unit metadata and cap at six items. The 110px section with item y=18+40*i only accommodates two complete rows and part of a third; the remainder is clipped, with no overflow indicator. Decide crowding, ordering, expansion and list-to-stroke rules. Evidence: `src/parts/StrokesPart.jsx:90`, `src/parts/ListsPart.jsx:12,104,118`.

**U16. Header behavior at the top of the ladder.** Filtering unavailable coarser units reduces rows to two at quarter and one at year. isBottomRow and zoom-in click selection still assume rowOrder 2, so those remaining bottom rows do not use finer-unit click behavior. Hover identities also use relative group offsets that can be reused after pan. Date.now highlighting has no periodic refresh. These are limitations requiring an explicit header contract. Evidence: `src/parts/HeaderPart.jsx:97,102,147,161,201`.

**U17. Draft meaning can change while typing.** A draft stores relative column and row. Save uses current vp.unit/worldOriginTime, so a trackpad action can change what gets saved. Input is rendered before existing events, potentially obscuring the editor when overlap occurs. Keyboard navigation is ignored while typing, but gestures are still possible. Define save-on-blur, conflict, focus and editing-anchor behavior. Evidence: `src/parts/StrokesPart.jsx:161,188,251,306`, `src/ui/ViewportSVG.jsx:139`.

**U18. Multiple gesture paths need physical-device evidence.** use-gesture wheel/pinch and explicit native Safari gesture listeners coexist. The native effect is rebound when viewport changes; both pinch paths share an accumulator. Duplicate delivery, accumulator reset and history/page zoom behavior cannot be proven from source or server rendering. zoomSensitivity is unused. Evidence: `src/hooks/useTrackpadTimeline.js:9,26,81,132`.

**U19. Animation is visual compensation, not layout interpolation.** State changes immediately. A new layout is scaled horizontally back to identity, including text and header background. A single requestAnimationFrame arms CSS transitions; rapid key repeats cancel prior timers. Image backgrounds sit outside keyboard transforms but inside opacity/blur; their heights follow rowCount. Browser paint timing and fixed-background expectations need explicit verification. Evidence: `src/ui/ViewportSVG.jsx:62,103,188`, `src/App.jsx:83`.

**U20. Accessibility and portability are incomplete.** Global arrow handlers have editable-target guards but no viewport focus scope or modifier policy. Header/group controls are SVG pointer targets without keyboard semantics. Checkbox graphics have no action. Frame width and label estimates assume particular sizes/fonts; Futura is not bundled. No viewport meta tag or responsive/mobile layout exists. Evidence: `src/ui/ViewportSVG.jsx:138`, `src/parts/HeaderPart.jsx:214`, `src/parts/StrokesPart.jsx:345`, `index.html`.

## Historical and external evidence still needed

The new baseline commit contains the supplied main application only. It cannot establish why previous rewrites happened, when architectural intentions changed or which model was used. The editor workspace references another folder, but that folder and other archives are outside this audit. Supply any relevant history or rationale explicitly if it should inform the next phase.

The next design comparison needs the formal Compound definition, lifecycle/closure roles, time/calendar semantics, event schema, placement rules, interaction matrix, crowding behavior, persistence plan and any acceptance examples. No proposed resolution in this document is adopted as a requirement.
