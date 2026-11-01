import test from 'node:test'
import assert from 'node:assert/strict'
import { DAY_PARTS, UNIT_ORDER, TIME_ZONE, fromLocal, zoned, cellAt, nextCell, dayPartWindow, eventInterval, coordinate, instantAt } from '../src/domain/calendar.js'
import { createSourceLoader } from './helpers/load-source.js'
const at = fromLocal
const dateTime = value => zoned(value).toPlainDateTime().toString({ smallestUnit: 'minute' })

test('five unequal day parts use the approved local windows and cross-midnight overlap', () => {
  assert.ok(UNIT_ORDER.includes('dayPart'))
  assert.ok(!UNIT_ORDER.includes('fourHour'))
  assert.deepEqual(DAY_PARTS.map(part => part.label), ['Morning', 'Noon', 'Afternoon', 'Evening', 'Night'])
  for (const [hour, name, end] of [[6, 'Morning', '2026-05-01T11:00'], [11, 'Noon', '2026-05-01T14:00'], [14, 'Afternoon', '2026-05-01T18:00'], [18, 'Evening', '2026-05-02T01:00'], [22, 'Night', '2026-05-02T06:00']]) {
    const window = dayPartWindow(at(`2026-05-01T${hour.toString().padStart(2, '0')}:00`))
    assert.equal(window.label, name)
    assert.equal(dateTime(window.end), end)
  }
  const evening = dayPartWindow(at('2026-05-01T18:00'))
  const night = dayPartWindow(at('2026-05-01T22:00'))
  assert.equal((evening.end - night.start) / 3600000, 3)
  assert.equal(dayPartWindow(at('2026-05-02T02:00')).start, night.start)
})

test('overlapping named windows keep a unique continuous coordinate partition and stable negative indexes', () => {
  assert.equal(cellAt(at('1970-01-01T06:00'), 'dayPart').index, 0)
  assert.equal(cellAt(at('1970-01-01T00:00'), 'dayPart').index, -1)
  for (const text of ['1969-12-31T23:59', '2026-03-29T03:15', '2026-10-25T02:30', '2026-05-01T23:30']) {
    const time = at(text), cell = cellAt(time, 'dayPart')
    assert.ok(cell.start <= time && time < cell.end)
    assert.equal(nextCell(cell).start, cell.end)
    assert.equal(nextCell(cell, -1).end, cell.start)
    assert.ok(Math.abs(instantAt(coordinate(time, 'dayPart'), 'dayPart') - time) <= 1)
  }
})

test('native day-part events end at named-window ends, counting overlap once', () => {
  const interval = (date, amount) => eventInterval({ anchor: at(date), definedUnit: 'dayPart', amount })
  assert.equal(dateTime(interval('2026-05-01T18:00', 1).end), '2026-05-02T01:00')
  assert.equal(dateTime(interval('2026-05-01T18:00', 2).end), '2026-05-02T06:00')
  assert.equal(dateTime(interval('2026-05-01T06:00', 5).end), '2026-05-02T06:00')
  assert.equal(dateTime(interval('2026-05-01T23:00', 1).end), '2026-05-02T07:00')
})

test('Night follows wall time across spring/autumn DST while coordinates remain invertible', () => {
  for (const [date, elapsed] of [['2026-03-28', 7], ['2026-10-24', 9]]) {
    const start = at(`${date}T22:00`), window = dayPartWindow(start)
    assert.equal((window.end - window.start) / 3600000, elapsed)
    assert.equal(coordinate(window.end, 'dayPart') - coordinate(window.start, 'dayPart'), 1)
    assert.equal(eventInterval({ anchor: start, definedUnit: 'dayPart', amount: 1 }).end, window.end)
  }
})

test('headers show both Evening and Night during their overlap in shared coordinates', () => {
  const Header = createSourceLoader()('src/parts/HeaderPart.jsx').HeaderPart
  const model = new Header().present(value => value)({ unit: 'hour', unitIndex: 2, worldOriginTime: at('2026-05-01T23:00'), worldOffsetPx: 0, zoom: 1, visibleCells: 2 }, at('2026-05-01T23:00'))
  const row = model.rows.find(row => row.unit === 'dayPart')
  const active = row.groups.filter(group => group.isCurrent)
  assert.deepEqual(Array.from(active, group => group.label), ['Evening', 'Night'])
  assert.ok(active[0].endI + 1 > active[1].startI)
  assert.ok(active.every(group => group.title.includes(TIME_ZONE)))
})
