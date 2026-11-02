# Current stroke presentation

Approved follow-up implemented on main, 2026-11-02. This supersedes earlier requirements for finer-unit list routing, decorative checkmarks and outset native-unit outlines. The separate temporary header study is untouched.

## Routing and text

The Lists Views are unmounted for now. Every event projects once into strokes, including one-unit items and events defined in a finer unit than the active display. The existing half-open intersected-cell projection covers at least one cell; interval amount controls its extent. No duration/rank split sends items into a list. ListsPart and its Body-wired presentation capability remain dormant for compatibility, with listItems empty. The legacy isListEvent helper is not called by active layout.

Each eventline displays a title and a smaller descriptive subtitle in separately bounded SVG text lines, clipped to the event rectangle. All twenty seeded events include example descriptions. The SVG title contains the full title and description for pointer inspection. Creation accepts optional subtitle text through the existing creation capability; the inline editor still supplies only a title, so newly created descriptions start empty. No subtitle editing interface was requested or added.

## Geometry

- Rows retain their 40px pitch. Grid cells and stroke bodies are 39px high, leaving exactly 1px between rows.
- Decorative checkmarks and outset outlines are removed.
- Only exact equality between definedUnit and displayed unit enables the native outline. Amount is irrelevant: a two-day event has the outline in day view. The 2px stroke path sits at x/y=3 within the event rectangle, painting its outer edge 2px inside; the same inset applies on all sides. Other units have no outline.
- Ordinary horizontal cell boundaries have 4px visual gutters; term boundaries have 12px gutters. Gutters clamp to 20%/50% of cell width at very narrow zoom, keeping cells positive. Both adjacent cells contribute half the gutter.
- Pure shared strokeGeometry helpers supply grid, event outer bounds, draft placement and Header gaps. The existing coordinate/inverse mapping is unchanged: gutters remove painted area inside cells, without inserting time or shifting zoom anchors. Multi-cell events stay continuous across interior boundaries.
- A term boundary is an exact start of a higher displayed calendar unit. Thus day view separates Sunday/Monday more widely, month view separates quarters, and quarter view separates years. Day parts also separate the Morning cycle start; fortnights separate the first start within a calendar year; years separate decades. Other coincident higher-term starts, such as a month boundary in day view, also widen the gutter. This follows real Temporal boundaries, including DST and negative indices.
- The desktop window remains 640x520; tall stroke content grows and scrolls vertically. Phone portrait/landscape keeps its unscaled scene crop, controls and black landscape rails. The uploaded polygon image remains behind the strokes.

The existing assignRowsForUnit algorithm and its per-unit hints are unchanged. Events may still share a row when their intervals do not overlap; this is not a packing redesign.

## Verification

73/73 Node tests pass, including the updated all-stroke routing checks, multi-unit native border/subtitle rendering, term gutters at every displayed level, narrow zoom, pre-1970 dates and DST. Existing Cookbook isolation/lifecycle, cursor anchoring, touch input, draft actions and known row-cache characterization tests pass. npm run build passes; Vite serves HTTP 200.

Headless Chromium checks pass across all ten zoom levels: twenty event records remain present, only the stroke background is mounted, all example subtitles exist, and event checkmark paths are absent. Browser geometry confirms 39px bodies on 40px pitch and the painted 2px native border inset for a two-day event in day view. Desktop year view scrolls a 889px content scene inside its 520px window. Phone 390x844 and landscape 844x390 fit without horizontal page overflow and retain black rails. No page runtime errors were observed.

## Remaining limits

Physical iPhone/iPad Safari remains unverified. Descriptions have no inline editing UI. Long strokes whose left edge is offscreen can still have offscreen labels; clipping prevents overflow but does not reposition text. Row-cache writes remain derived rather than persisted to canonical events. Drafts still resolve against the current viewport on submission. The hidden legacy Lists component retains its old clipping limits. Scheduling remains session-only, with no backend, persistence, drag/resize or new lane algorithm. These changes do not resolve older dependency audit findings or font availability differences.
