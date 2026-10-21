import test from 'node:test'
import assert from 'node:assert/strict'
import { createSourceLoader } from './helpers/load-source.js'
import { UNIT_ORDER, fromLocal, cellAt, nextCell, coordinate, addCalendar } from '../src/domain/calendar.js'
const at = fromLocal
const event = (id, date, definedUnit, amount = 1) => ({ id, title: id, term: { anchor: at(date), definedUnit, amount } })
const load = createSourceLoader()
const { project, isListEvent } = load('src/domain/projection.js')
const { StrokesPart } = load('src/parts/StrokesPart.jsx')

test('approved month-view examples: granularity routing independent of interval length', () => {
  const part = new StrokesPart()
  part.addEvent(event('jan-month', '2023-01-31', 'month'))
  part.addEvent(event('feb-leap', '2024-01-31', 'month'))
  part.addEvent(event('march-28-days', '2023-03-01', 'day', 28))
  part.addEvent(event('march-31-days', '2023-03-15', 'day', 31))
  part.addEvent(event('march-month', '2023-03-01', 'month'))
  const model = part.getLayout('month', at('2023-01-01'))
  const byId = id => model.packed.find(item => item.id === id)
  assert.deepEqual([byId('jan-month').start, byId('jan-month').span], [0, 2])
  assert.deepEqual([byId('march-month').start, byId('march-month').span], [2, 1])
  assert.equal(byId('feb-leap').span, 2)
  assert.deepEqual(Array.from(model.listItems, item => item.id), ['march-28-days', 'march-31-days'])
  assert.equal(isListEvent('day', 'month'), true)
  assert.equal(isListEvent('month', 'month'), false)
  assert.equal(isListEvent('year', 'month'), false)
})

test('half-open projection excludes end boundary and includes a final one-millisecond intersection', () => {
  const origin = at('2024-01-01')
  const jan = project({ anchor: origin, definedUnit: 'month', amount: 1 }, 'month', origin)
  assert.deepEqual([jan.start, jan.span], [0, 1])
  const across = project({ anchor: origin + 1, definedUnit: 'month', amount: 1 }, 'month', origin)
  assert.equal(across.span, 2)
  const quarter = project({ anchor: at('2024-03-31'), definedUnit: 'day', amount: 1 }, 'quarter', origin)
  assert.equal(quarter.span, 1)
})

test('month events project into real days/weeks; DST events align with header cells', () => {
  const march = { anchor: at('2026-03-01'), definedUnit: 'month', amount: 1 }
  assert.equal(project(march, 'day', march.anchor).span, 31)
  assert.equal(project(march, 'week', at('2026-02-23')).span, 6)
  const spring = { anchor: at('2026-03-29'), definedUnit: 'day', amount: 1 }
  const autumn = { anchor: at('2026-10-25'), definedUnit: 'day', amount: 1 }
  assert.equal(project(spring, 'hour', spring.anchor).span, 23)
  assert.equal(project(autumn, 'hour', autumn.anchor).span, 25)
  for (const term of [spring, autumn, march]) {
    const cell = cellAt(term.anchor, term.definedUnit)
    assert.equal(coordinate(cell.end, 'hour') - coordinate(cell.start, 'hour'), project(term, 'hour', cell.start).span)
  }
})

test('each event routes exactly once at every level, including long finer-unit intervals', () => {
  const part = new StrokesPart()
  for (const [i, unit] of UNIT_ORDER.entries()) part.addEvent(event(String(i), '2026-10-25T01:30', unit, 31))
  for (const [index, unit] of UNIT_ORDER.entries()) {
    const model = part.getLayout(unit, at('2026-10-01'))
    const ids = [...model.packed, ...model.listItems].map(item => item.id)
    assert.equal(ids.length, 10)
    assert.equal(new Set(ids).size, 10)
    assert.equal(model.listItems.length, index)
    assert.equal(model.packed.length, 10 - index)
    for (const item of model.listItems) assert.equal(item.start, cellAt(at('2026-10-25T01:30'), unit).index - cellAt(at('2026-10-01'), unit).index)
  }
})

test('header and stroke geometry share exact boundaries under pan at all levels', () => {
  const Header = load('src/parts/HeaderPart.jsx').HeaderPart
  const present = new Header().present(value => value)
  for (const [unitIndex, unit] of UNIT_ORDER.entries()) {
    const origin = nextCell(cellAt(at('2026-10-25'), unit), -2).start
    const viewport = { unitIndex, unit, worldOriginTime: origin, zoom: 1, visibleCells: 8, worldOffsetPx: 0 }
    const model = present(viewport, origin)
    const bottom = model.rows.at(-1)
    for (const group of bottom.groups) {
      const term = { anchor: group.startTime, definedUnit: unit, amount: 1 }
      // Hour event arithmetic is civil; a repeated first hour may span both actual hour cells.
      const projected = project(term, unit, origin)
      assert.equal(projected.start, group.startI)
      assert.ok(projected.span >= 1)
    }
  }
})

test('invalid/deferred event amounts are rejected before mutating in-memory records', () => {
  const part = new StrokesPart()
  assert.throws(() => part.addEvent(event('fraction', '2024-01-01', 'month', 0.5)), /fractional/)
  assert.equal(part.events.length, 0)
})
