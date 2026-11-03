# Current stroke presentation

Updated on main, 2026-11-03. The latest user correction supersedes the separate three-row Header and November 2 colored inset outline. Lists remain hidden. The separate temporary header study is untouched.

## Units inside strokes

The Header View is unmounted and strokes start at y=0, without reserving header space. Every empty cell in every stroke row displays a short, faint white indication of its active unit. Labels are clipped inside their cell: examples include `3 Tue`, `12:00`, `Morn`, `Noon`, `Aft`, `Eve`, `Night`, `W45`, `F22`, `Nov`, `Q4` and `2026`. Quarter labels omit the parent year; week/fortnight labels use short prefixes. Repeated hours retain UTC offsets so the two occurrences remain distinguishable. Labels are computed once per rendered column, then reused across rows. Occupied cells omit these unit labels.

Parent-term names are absent from the stroke area. Larger spaces at term bounds supply that hierarchy. Existing keyboard, gestures and command controls continue navigation; the old Header click targets are no longer rendered. HeaderPart and its Body-wired model/navigation capabilities remain available but dormant in presentation. Body still refreshes its compatibility model; removing that work is a possible later cleanup.

Multiple groups of strokes, each with independently displayed units, are a future plan. This implementation still has one viewport/unit across its rows; no group-management model or new orchestration was added.

## Event routing and text

Every event projects once into strokes, including one-unit and finer-than-display items. Existing half-open intersected-cell projection covers at least one cell; amount determines interval extent. ListsPart remains wired for compatibility with empty listItems; its Views are unmounted. The legacy isListEvent helper is unused by active layout.

Eventlines retain title and smaller descriptive subtitle, separately clipped to the rectangle. All twenty examples have descriptions. The SVG title includes both full strings for pointer inspection. The creation capability accepts optional subtitle text; the inline editor still supplies title only, so new descriptions start empty.

## Geometry and glass dividers

- Grid rows have 40px pitch and 39px cells, leaving 1px between rows.
- Matching-unit eventlines inset the entire filled rectangle on all four sides of its surrounding cell-area rectangle. The normal inset is 2px, giving a 35px-high body at y=row*40+2. For example, a two-day event is inset in day view; amount does not control eligibility. Its horizontal inset is capped at one quarter of body width only at extremely narrow zoom to preserve a positive rectangle. Other-unit eventlines fill their projected cell-area bounds. There are no colored borders, outset outlines or checkmarks. Text moves inward with the rectangle.
- Ordinary cell boundaries have 4px gutters and term boundaries 12px gutters, clamped to 20%/50% of cell width at narrow zoom. Both neighboring cells contribute half the gutter.
- The original glass treatment is restored: each cell boundary has a translucent `#4F4F4F` band at 0.4 opacity over the uploaded background image (0.65 with hover tint). Term boundaries have wider bands. These bands are part of the underlying grid; continuous multi-cell eventlines cover interior boundaries.
- Term boundaries are exact starts of higher calendar units: day view separates Sunday/Monday more widely; month view separates quarters; quarter view separates years. Day parts also separate the Morning cycle start, fortnights the first start within a year, and years decades. Coincident higher-term starts such as month starts also widen the gap. Temporal supplies boundaries, including DST and negative indices.
- Pure strokeGeometry helpers supply grid bounds, event insets and draft placement. Calendar coordinates and cursor anchoring are unchanged; spacing changes painted area inside cells, without adding time or shifting dates. Multi-cell event bodies remain continuous.
- The desktop window remains 640x520; tall SVG content scrolls within it. Phones retain an unscaled scene crop, existing controls and black landscape rails. The uploaded polygon image stays behind the grid/glass bands.

assignRowsForUnit and its hints are unchanged. Non-overlapping events can still share a row; this task does not redesign packing.

## Verification

75/75 Node tests pass, including whole-rectangle inset geometry for one-, two- and five-unit events, non-native full bounds, narrow widths, short unit labels, repeated-hour offsets, glass/label rendering and Header removal. Calendar boundaries, half-open projection, Cookbook isolation/lifecycle, cursor anchoring, touch and creation tests remain passing. npm run build passes and Vite serves HTTP 200.

Headless Chromium checks pass at all ten displayed units: each empty cell has a faint unit label, occupied cells omit it, glass divider bands are present, all twenty events remain, and no Header arrows or colored event outlines render. A native two-day example is measured 2px inward on left/right and 35px high, versus the surrounding 39px cell. Inline creation and keyboard pan pass. A tall desktop year scene scrolls inside the 520px window. Phone 390x844 and landscape 844x390 load, zoom and fit without horizontal page overflow; black landscape rails remain. No page runtime errors were observed.

The previous November 2 version passed 73 tests and browser checks with colored outlines; that outline behavior has now been replaced by the whole-rectangle inset above.

## Remaining limits

Independent stroke groups are planned, not implemented. Physical iPhone/iPad Safari is unverified. Descriptions have no inline editor. Long strokes whose left edge is offscreen can still have offscreen text; clipping does not reposition it. Row-cache writes remain derived rather than stored in canonical events. Drafts resolve against the viewport at submission. Dormant Lists retains old clipping limits. Scheduling is session-only; no backend, persistence, drag/resize or new packing algorithm. Prior development dependency audit findings and font fallback differences remain.
