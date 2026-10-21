import test from 'node:test'
import assert from 'node:assert/strict'
import { UNIT_ORDER, TIME_ZONE, fromLocal, zoned, cellAt, nextCell, cellPosition, coordinate, instantAt, addCalendar, eventInterval } from '../src/domain/calendar.js'
const at = fromLocal
const hours = cell => (cell.end - cell.start) / 3600000
const local = value => zoned(value).toPlainDateTime().toString()

test('actual month lengths, leap years and clamped additions from the original anchor', () => {
  for (const [date, days] of [['2023-02-01', 28], ['2024-02-01', 29], ['2024-03-01', 31], ['2024-04-01', 30]]) {
    const cell = cellAt(at(date), 'month')
    assert.equal(zoned(cell.start).toPlainDate().until(zoned(cell.end).toPlainDate()).days, days)
  }
  assert.equal(local(addCalendar(at('2023-01-31T10:00'), 'month', 1)), '2023-02-28T10:00:00')
  assert.equal(local(addCalendar(at('2024-01-31T10:00'), 'month', 1)), '2024-02-29T10:00:00')
  assert.equal(local(addCalendar(at('2024-01-31T10:00'), 'month', 2)), '2024-03-31T10:00:00')
  assert.equal(local(addCalendar(at('2024-02-29T10:00'), 'year', 1)), '2025-02-28T10:00:00')
})

test('Monday weeks, stable fortnight anchor, quarters and negative indices', () => {
  assert.equal(TIME_ZONE, 'Europe/Amsterdam')
  assert.equal(cellAt(at('1970-01-05'), 'fortnight').index, 0)
  const previous = cellAt(at('1970-01-04T23:59'), 'fortnight')
  assert.equal(previous.index, -1)
  assert.equal(local(previous.start), '1969-12-22T00:00:00')
  assert.equal(local(previous.end), '1970-01-05T00:00:00')
  assert.equal(local(cellAt(at('2026-01-01'), 'week').start), '2025-12-29T00:00:00')
  const quarter = cellAt(at('2024-02-29'), 'quarter')
  assert.equal(local(quarter.start), '2024-01-01T00:00:00')
  assert.equal(local(quarter.end), '2024-04-01T00:00:00')
  assert.equal(cellAt(at('1969-12-31'), 'day').index, -1)
  assert.equal(cellAt(at('1969-12-31'), 'month').index, -1)
  assert.equal(cellAt(at('1969-12-31'), 'year').index, -1)
  assert.equal(hours(cellAt(at('2024-06-01'), 'year')), 366 * 24)
})

test('DST days are one coordinate cell; four-hour boundaries stay on the civil grid', () => {
  const spring = cellAt(at('2026-03-29T12:00'), 'day')
  const autumn = cellAt(at('2026-10-25T12:00'), 'day')
  assert.equal(hours(spring), 23)
  assert.equal(hours(autumn), 25)
  assert.equal(cellPosition(at('2026-03-29T12:00'), spring), 11 / 23)
  assert.equal(coordinate(spring.end, 'day') - coordinate(spring.start, 'day'), 1)
  assert.equal(coordinate(autumn.end, 'day') - coordinate(autumn.start, 'day'), 1)
  assert.equal(hours(cellAt(at('2026-03-29T01:00'), 'fourHour')), 3)
  assert.equal(hours(cellAt(at('2026-10-25T01:00'), 'fourHour')), 5)
})

test('missing hour skipped, repeated hours distinct, explicit disambiguation and preserved offsets', () => {
  assert.equal(local(at('2026-03-29T02:30')), '2026-03-29T03:30:00')
  const beforeGap = cellAt(at('2026-03-29T01:30'), 'hour')
  assert.equal(local(nextCell(beforeGap).start), '2026-03-29T03:00:00')
  const first = at('2026-10-25T02:30')
  const second = at('2026-10-25T02:30', { offset: '+01:00' })
  assert.equal(at('2026-10-25T02:30+01:00'), second)
  assert.equal(second - first, 3600000)
  assert.equal(zoned(first).offset, '+02:00')
  assert.equal(cellAt(second, 'hour').index - cellAt(first, 'hour').index, 1)
  assert.equal(nextCell(cellAt(first, 'hour')).start, cellAt(second, 'hour').start)
  assert.equal(coordinate(second, 'hour') - coordinate(first, 'hour'), 1)
  assert.equal(zoned(addCalendar(second, 'minute', 1)).offset, '+01:00')
  assert.equal(addCalendar(second, 'minute', 1) - second, 60000)
  assert.equal(addCalendar(first, 'hour', 1) - first, 2 * 3600000)
  assert.equal(local(addCalendar(at('2026-03-29T01:30'), 'fourHour', 1)), '2026-03-29T05:30:00')
  assert.throws(() => at('2026-10-25T02:30', { offset: '+03:00' }), /offset/i)
})

test('all units round-trip across leap dates, DST, pre-anchor and historical offset changes', () => {
  const times = ['1800-01-01T00:17', '1892-05-01T00:01', '1960-02-29T12:23:45.678', '1969-12-31T23:59:59.999', '2024-02-29T12:34:56.789', '2026-03-29T01:59:59.999', '2026-03-29T03:00', '2026-10-25T02:30', '2027-01-01T00:00']
  for (const unit of UNIT_ORDER) {
    for (const text of times) {
      const instant = at(text)
      const cell = cellAt(instant, unit)
      assert.ok(cell.start <= instant && instant < cell.end, `${text} ${unit}`)
      assert.ok(Math.abs(instantAt(coordinate(instant, unit), unit) - instant) <= 1, `${text} ${unit}`)
      assert.equal(nextCell(cell, -1).end, cell.start)
      assert.equal(nextCell(cell).start, cell.end)
      assert.equal(coordinate(cell.start, unit), cell.index)
      assert.equal(coordinate(cell.end, unit), cell.index + 1)
      assert.ok(coordinate(cell.end - 1, unit) < cell.index + 1)
    }
  }
})

test('equal month/year widths and explicit cell indexes, not fixed duration ratios', () => {
  assert.equal(coordinate(at('2024-02-01'), 'month'), 649)
  assert.equal(coordinate(at('2024-03-01'), 'month'), 650)
  assert.equal(coordinate(at('2024-04-01'), 'month'), 651)
  assert.equal(coordinate(at('2025-01-01'), 'year') - coordinate(at('2024-01-01'), 'year'), 1)
  assert.equal(instantAt(649.5, 'month'), at('2024-02-15T12:00'))
  assert.equal(cellPosition(at('2024-03-01'), cellAt(at('2024-02-01'), 'month')), 1)
})

test('event intervals use defined calendar units; fractional amounts explicitly deferred', () => {
  const month = eventInterval({ anchor: at('2024-01-31T10:00'), definedUnit: 'month', amount: 1 })
  assert.equal(local(month.end), '2024-02-29T10:00:00')
  const day = eventInterval({ anchor: at('2026-03-29'), definedUnit: 'day', amount: 1 })
  assert.equal(hours(day), 23)
  assert.throws(() => eventInterval({ anchor: at('2024-01-01'), definedUnit: 'month', amount: 0.5 }), /fractional event amounts are deferred/)
  assert.throws(() => eventInterval({ anchor: at('2024-01-01'), definedUnit: 'day', amount: 0 }), /positive/)
  assert.throws(() => cellAt(0, 'invalid'), /Unknown calendar unit/)
  assert.throws(() => nextCell(cellAt(0, 'day'), 0.5), /integer/)
  assert.throws(() => instantAt(Infinity, 'day'), /finite/)
})

test('sub-day indexing remains stable regardless of historical/future lookup order', async () => {
  const { createSourceLoader } = await import('./helpers/load-source.js')
  const first = createSourceLoader()('src/domain/calendar.js')
  const second = createSourceLoader()('src/domain/calendar.js')
  const instants = ['1800-01-01T00:10', '1892-05-01T00:10', '1969-12-31T23:59', '2026-10-25T02:30', '2040-01-01T12:00'].map(at)
  for (const unit of ['minute', 'fifteenMinute', 'hour']) {
    const forward = instants.map(time => first.coordinate(time, unit))
    const reverse = [...instants].reverse().map(time => second.coordinate(time, unit)).reverse()
    assert.deepEqual(forward, reverse)
    for (let i = 0; i < instants.length; i++) assert.ok(Math.abs(first.instantAt(forward[i], unit) - instants[i]) <= 1)
  }
})
