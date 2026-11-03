# TGO Implemented Design and Deferred Decisions

Updated: 2026-10-21. The corrected Temporal request and later user approvals are authoritative. P4 calendar primitives and P5 integration are implemented for review; they are not the older unimplemented proposals.

## Preserved product/architecture

Cookbook's fluent builder, inline-alpha / Part-beta / reusable-gamma mechanism, isolated Parts and explicit Body wiring remain. Views consume supplied state/actions; presentation-local hover, draft, focus and animation hooks remain permitted. compose.js is unchanged by this calendar phase.

Preserve the 640px scene and 520px desktop window; taller stroke content scrolls within it. Preserve existing assets/colors, in-memory events and provisional lanes. Header and Lists Views are unmounted; only short active-unit labels are embedded in empty stroke cells. No Context, backend, storage, new event manager or replacement packing algorithm.

## Approved calendar policies, now implemented

Europe/Amsterdam; Gregorian month/year boundaries; Monday weeks; fortnight anchor local 1970-01-05; quarters Jan/Apr/Jul/Oct; half-open intervals; explicit month-end constrain. Temporal supplies calendar and timezone rules.

Missing civil times shift forward by the gap. Ambiguous local inputs use the earlier occurrence unless an explicit valid offset selects the other. Calendar addition retains a valid anchor offset. ALL event-unit arithmetic is local wall-clock arithmetic, including hours. Fractional EVENT amounts are explicitly deferred; accept positive integers only. Coordinate fractions are a separate approved elapsed-time calculation.

Minute/15-minute/hour cells preserve repeated occurrences and skip nonexistent boundaries. The five approved day parts replace displayed four-hour blocks; see DAY_PARTS_AND_LABELS.md. days/months/years have real variable durations. Every cell is exactly one coordinate unit at its active zoom. Use the same continuous coordinate/inverse API for all layers. Details and concrete DST examples are in CALENDAR.md.

## Approved routing and geometry correction

The November 2 follow-up supersedes previous list routing: every event uses stroke projection, including finer-unit and one-unit events. Lists are unmounted. The interval amount still determines the event end, and definedUnit equality controls the inset of the entire filled event rectangle.

Strokes cover all cells intersected by the actual interval; an exclusive end at a boundary does not include the next cell. January 31 +1 month therefore spans January/February; March 1 +1 month occupies March. Lists are unmounted and listItems remains empty. No crowding-based routing or new placement algorithm is introduced.

## Navigation and presentation

Cursor-anchored zoom keeps the underlying instant; keyboard zoom keeps center and moves one level; left/right moves one semantic coordinate cell. Header click navigation remains a dormant capability; use keyboard, gestures or the existing command controls. Local actual coarse-cell spans replace fixed adjacent ratios. Cell widths remain capped at 640/3, with dynamic render coverage for smaller cells.

Shared Amsterdam formatting supplies the faint active-unit labels inside empty stroke cells. Parent-term text is absent; wider translucent glass-divider bands identify term boundaries. Matching-unit eventlines inset their entire fill rectangle by 2px without any outline; the stationary stroke texture remains. Keyboard transitions keep short horizontal-only CSS motion/dissolve; a single global transform is only a local approximation when variable calendar intervals make cross-level geometry non-affine.

The use-gesture hook now targets the SVG ref directly with passive:false. This fixes the passive React wheel listener problem reproduced in real Chrome while retaining sensitivity thresholds and native Safari adapters.

## Still deferred / known limitations

Fractional event semantics are deferred, not silently approximated. No timezone selector, recurrence, backend/persistence, drag/resize or lane redesign. Existing lost row-cache writes, dormant legacy list clipping and offscreen labels on long strokes remain. Drafts retain the existing current-viewport-at-submission behavior. No new periodic clock is added.

No essential policy ambiguity remains for positive-integer events in this implementation. Physical Safari/Chrome trackpads and Safari page/history prevention still need manual validation. CALENDAR.md distinguishes cell traversal, calendar addition, elapsed fractions and projection; do not collapse these into one duration ratio.

Current row spacing, subtitles and term gutters are specified in STROKE_PRESENTATION.md. No checkmarks or outset borders remain in the active stroke renderer.

Multiple groups of strokes with independent displayed units remain a future plan. This task changes presentation of the existing single group.
