import { UNIT_ORDER, cellAt, eventInterval } from "./calendar"

export function isListEvent(definedUnit, displayedUnit) {
  const source = UNIT_ORDER.indexOf(definedUnit)
  const target = UNIT_ORDER.indexOf(displayedUnit)
  if (source < 0 || target < 0) throw new RangeError("Unknown event/display unit")
  return source < target
}

export function project(term, unit, origin) {
  const interval = eventInterval(term)
  const first = cellAt(interval.start, unit)
  // Events have integer-millisecond instants. The exclusive end never owns
  // the following cell, including when the event ends exactly at a boundary.
  const last = cellAt(interval.end - 1, unit)
  return {
    start: first.index - cellAt(origin, unit).index,
    span: last.index - first.index + 1,
    interval
  }
}
