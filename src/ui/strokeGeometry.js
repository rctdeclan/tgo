import { UNIT_ORDER, DAY_PARTS, cellAt, nextCell, zoned } from '../domain/calendar.js'

export const STROKES_TOP = 0
export const ROW_PITCH = 40
export const STROKE_HEIGHT = 39
export const NORMAL_GAP = 4
export const TERM_GAP = 12
const boundaries = new Map()

// Mathematical cache only: calendar boundaries are independent of app state.
export function startsTerm(cell) {
  const key = `${cell.unit}:${cell.index}`
  if (boundaries.has(key)) return boundaries.get(key)
  const rank = UNIT_ORDER.indexOf(cell.unit)
  let result = cell.unit === 'dayPart' && cell.index % DAY_PARTS.length === 0
  if (cell.unit === 'year') result = zoned(cell.start).year % 10 === 0
  if (cell.unit === 'fortnight') result = zoned(cell.start).year !== zoned(nextCell(cell, -1).start).year
  if (!result) result = UNIT_ORDER.slice(rank + 1).some(unit => cellAt(cell.start, unit).start === cell.start)
  boundaries.set(key, result)
  if (boundaries.size > 2048) boundaries.delete(boundaries.keys().next().value)
  return result
}
export function boundaryGap(cell, cellWidth) {
  return startsTerm(cell) ? Math.min(TERM_GAP, cellWidth * 0.5) : Math.min(NORMAL_GAP, cellWidth * 0.2)
}
export function gapAtInstant(instant, unit, cellWidth) {
  const cell = cellAt(instant, unit)
  return cell.start === instant ? boundaryGap(cell, cellWidth) : Math.min(NORMAL_GAP, cellWidth * 0.2)
}
export function cellBox(origin, index, span, cellWidth) {
  const first = nextCell(origin, index)
  const after = nextCell(origin, index + span)
  const left = boundaryGap(first, cellWidth) / 2
  const right = boundaryGap(after, cellWidth) / 2
  return { x: index * cellWidth + left, width: Math.max(0, span * cellWidth - left - right), termStart: startsTerm(first) }
}
export function eventBox(origin, event, unit, cellWidth) {
  const box = cellBox(origin, event.start, event.span, cellWidth)
  const native = event.term.definedUnit === unit
  const insetX = native ? Math.min(2, box.width / 4) : 0
  const insetY = native ? 2 : 0
  return { x: box.x + insetX, y: insetY, width: box.width - insetX * 2,
    height: STROKE_HEIGHT - insetY * 2, native }
}
export function strokeContentHeight(rowCount) {
  return Math.max(520, STROKES_TOP + rowCount * ROW_PITCH + 8)
}
