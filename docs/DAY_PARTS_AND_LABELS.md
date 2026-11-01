# Day parts, clipping and the stroke backdrop

Implemented on main after the user's 2026-11-01 request and explicit approval of the proposed overlapping times. The temporary header study remains unchanged.

## Approved day parts (Europe/Amsterdam)

| Part | Named header/event window |
| --- | --- |
| Morning | 06:00–11:00 |
| Noon | 11:00–14:00 |
| Afternoon | 14:00–18:00 |
| Evening | 18:00–01:00 the next day |
| Night | 22:00–06:00 the next day |

Evening and Night overlap from 22:00 to 01:00. Their durations differ; neither is approximated as four hours. Headers use actual local calendar boundaries and show both as current during the overlap. The range tooltip includes both dates and the Amsterdam timezone. A range starting before the header's visible interval is retained if its overlapping tail still intersects it.

`dayPart` replaces `fourHour` at the same position in the display/semantic rank ladder, between hour and day. Existing legacy fourHour arithmetic remains available for compatibility, and old fourHour records route at the day-part rank; the UI and new seed use dayPart. No four-hour group is presented in the header.

## Coordinate ownership versus overlapping windows

The generic cell/coordinate API must assign each instant to exactly one cell. Its five ownership intervals begin at 06, 11, 14, 18 and 22; the last ends at 06 the following day. Thus Evening owns [18,22) and Night owns [22,next06). Cell index zero is Morning at local 1970-01-01 06:00; pre-06:00 times belong to the preceding night's index. Negative indexes and chronological traversal remain supported.

`dayPartWindow` separately exposes the full approved window, including Evening's extension to 01:00. Header projection/highlighting and native day-part event intervals use these named windows. Coordinates/inverses and nextCell use the unique ownership cells. This separation permits genuine overlap without making cursor anchoring ambiguous.

For positive integer event amounts, the end is the last counted part's named end, plus the anchor's local wall-clock offset within its ownership cell. For example:

- Evening at 18:00, amount 1 → 01:00 next day.
- Evening at 18:00, amount 2 → Night's 06:00 end, without double-counting the overlap.
- Morning at 06:00, amount 5 → 06:00 next day.
- Night anchored at 23:00, amount 1 → 07:00 next day, retaining the one-hour anchor offset as other calendar units do.

Zero addition preserves the instant. Negative additions traverse preceding ownership starts while retaining the wall-clock anchor offset. Calendar addition is not generally inverse/additive when windows overlap, just as constrained month addition is not generally invertible. Cell traversal and forward/inverse coordinates retain their stricter continuous partition contract.

Temporal resolves the boundaries using the existing compatible disambiguation/valid-offset preference. Night has seven elapsed hours across spring DST and nine across autumn DST, while remaining 22–06 in local wall time. Existing positive-integer validation, source-rank routing, half-open interval projection and provisional lane packing remain. An Evening event can intersect two day-part coordinate cells because its named window overlaps Night; that is intentional.

## Fortnight labels

The 1970-01-05 anchored, consecutive 14-day calendar grid is unchanged. Only labels change to `Fortnight 1`, `Fortnight 2`, etc. Numbering starts with the first fortnight whose start falls in a calendar year. There are normally 26 starts and occasionally 27. A period that starts in December and crosses January keeps its previous year's number until the next start; dates are not moved or shortened to reset at January 1.

For example, 2026-01-05 is Fortnight 1, 2026-01-19 is Fortnight 2 and 2026-12-21 is Fortnight 26. 2027-01-04 resets to Fortnight 1.

## Text clipping and backdrop

Event text is placed in a nested SVG viewport bounded by its stroke's text area. The outer native-unit outline remains free to extend as before. List items and their text areas have explicit width/height and hidden overflow; full label text stays in the DOM and full event names in tooltips. Clipping follows pixel widths during zoom rather than guessing a character count or allowing text into adjacent cells. Existing list capacity/vertical crowding is not redesigned.

`src/assets/strokes-background.jpg` is an unchanged copy of the supplied 1280x720 image (SHA-256 b7f4c0ef5f37d86b36d03fb211d4768aa2b9feefe65f7fc48227041e1be123f1). It replaces the icon artwork in StrokesPart.Background, behind the stroke grid. Stroke fills/borders and the separate list backdrop remain. Existing stationary-background cancellation during horizontal movement is retained. The old icon asset is retained in Git history/source but is no longer imported into the main app's build.

## Verification / limits

70 tests: the previous 64 plus five day-part/overlap/DST/coordinate tests and one multi-year fortnight-label test. Existing semantic header expectations now distinguish ownership cell ends from overlapping display range ends. JSX tests accept JPEG assets without decoding them as source.

Browser checks exercise real long-title creation, event/list SVG clipping bounds and retained full strings, all five names across horizontal navigation, fortnight labels, the exact background asset and phone layout. Production build passes; 16 calendar/header/day-part/fortnight checks also pass under TZ=Pacific/Honolulu. Physical Safari/iPhone checks remain manual; original packing/cache, crowded-list and session-only persistence limits remain. Changing the day-part timetable through a user-facing editor is not implemented; the approved values live in DAY_PARTS.
