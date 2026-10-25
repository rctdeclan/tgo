import test from 'node:test'
import assert from 'node:assert/strict'
import { createSourceLoader } from './helpers/load-source.js'
const load = createSourceLoader()
const { fromLocal, cellAt, nextCell } = load('src/domain/calendar.js')
const { scaleFor, rangeFor, position, timeAt, zoomAt, buildHeader, projectRows } = load('src/experiment/model.js')
const { TimelinePart } = load('src/experiment/TimelinePart.js')
const { createStudyEvents } = load('src/experiment/seeds.js')
const now = fromLocal('2026-10-25T12:00')
const state = zoom => {
  const value = { now, range: rangeFor(now), zoom, width: 700, scrollLeft: 0 }
  value.scrollLeft = position(cellAt(now, 'week').start, value)
  return value
}

test('study uses one leaf level for zoom: weeks, days or hours', () => {
  for (const [zoom, unit] of [[15, 'week'], [50, 'day'], [84, 'hour']]) {
    assert.equal(scaleFor(zoom).unit, unit)
    const cells = buildHeader(state(zoom))
    assert.ok(cells.length > 0)
    assert.ok(cells.every(cell => cell.unit === unit))
  }
})

test('study zoom preserves the instant under the cursor across all levels', () => {
  let current = state(15)
  for (const zoom of [50, 84, 50, 15, 84]) {
    const anchor = timeAt(277, current)
    current = zoomAt(current, zoom, 277)
    assert.ok(Math.abs(timeAt(277, current) - anchor) <= 1)
  }
})

test('hour expansion traverses both occurrences of the autumn repeated hour', () => {
  const current = state(84)
  const day = cellAt(now, 'day')
  current.scrollLeft = position(day.start, current)
  current.width = 25 * scaleFor(current.zoom).cellWidth
  const cells = buildHeader(current).filter(cell => cell.start >= day.start && cell.start < day.end)
  assert.equal(cells.length, 25)
  const repeated = cells.filter(cell => cell.label === '02:00')
  assert.equal(repeated.length, 2)
  assert.notEqual(repeated[0].start, repeated[1].start)
  assert.ok(repeated[0].title.includes('+02:00'))
  assert.ok(repeated[1].title.includes('+01:00'))
})

test('every seeded item has its own stable row, including overlapping/finer events', () => {
  const events = createStudyEvents(now)
  for (const unit of ['week', 'day', 'hour']) {
    const rows = projectRows(events, unit, rangeFor(now).start)
    assert.equal(rows.length, 20)
    assert.deepEqual(Array.from(rows, row => row.id), Array.from(events, row => row.id))
    assert.ok(rows.every(row => row.span > 0))
    assert.ok(rows.some(row => row.term.definedUnit === 'fifteenMinute'))
  }
})

test('weeks open days, days open hours, and folded periods can be reopened', () => {
  const part = new TimelinePart()
  part.state = state(15)
  const navigate = part.navigate(() => {})
  const present = part.present(model => model)
  navigate('open', 'week', cellAt(now, 'week').start)
  assert.equal(present([]).unit, 'day')
  navigate('open', 'day', cellAt(now, 'day').start)
  assert.equal(present([]).unit, 'hour')
  navigate('collapse', 'day', now)
  assert.ok(present([]).cells.some(cell => cell.unit === 'day'))
  navigate('open', 'day', now)
  assert.ok(present([]).cells.every(cell => cell.unit === 'hour'))
})

test('horizontal navigation unfolds newly visible periods at the current zoom', () => {
  const part = new TimelinePart()
  part.state = state(50)
  const navigate = part.navigate(() => {})
  const present = part.present(model => model)
  const left = part.state.scrollLeft
  navigate('collapse', 'week', now)
  assert.ok(present([]).cells.some(cell => cell.unit === 'week'))
  navigate('scroll', left + 2400)
  assert.ok(present([]).cells.every(cell => cell.unit === 'day'))
  navigate('scroll', left)
  assert.ok(present([]).cells.every(cell => cell.unit === 'day'))
})
