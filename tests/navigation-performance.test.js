import test from 'node:test'
import assert from 'node:assert/strict'
import { createSourceLoader } from './helpers/load-source.js'
import { fromLocal, cellAt, nextCell, coordinate, instantAt } from '../src/domain/calendar.js'

test('combined touch transform publishes once and preserves its moving anchor', () => {
  const app = new (createSourceLoader()('src/App.jsx').App)()
  const timeAt = x => {
    const s = app.snapshot.viewport
    return instantAt(coordinate(s.worldOriginTime, s.unit) + (x - 320 - s.worldOffsetPx) / (120 * s.zoom), s.unit)
  }
  const anchor = timeAt(320)
  let changes = 0
  app.subscribe(() => changes++)
  app.navigate('transformGesture', 320, 1.2, -24, 640)
  assert.equal(changes, 1)
  assert.ok(Math.abs(timeAt(344) - anchor) <= 1)
})

test('cached layout refreshes for inserted events and changed origin/unit', () => {
  const load = createSourceLoader()
  const part = new (load('src/parts/StrokesPart.jsx').StrokesPart)()
  const layout = part.layout(value => value)
  const origin = fromLocal('2026-10-25')
  const vp = { unit: 'day', worldOriginTime: origin }
  const empty = layout(vp)
  assert.equal(layout({ ...vp, zoom: 1.5, worldOffsetPx: 20 }), empty)
  part.addEvent({ id: 'new', title: 'new', term: { anchor: origin, definedUnit: 'day', amount: 1 } })
  const inserted = layout(vp)
  assert.notEqual(inserted, empty)
  assert.equal(inserted.packed.length, 1)
  assert.equal(layout({ ...vp, worldOriginTime: nextCell(cellAt(origin, 'day')).start }).packed[0].start, -1)
  assert.equal(layout({ ...vp, unit: 'month' }).listItems.length, 1)
})

test('cached headers update current-period tint and newly exposed geometry', () => {
  const load = createSourceLoader()
  const header = new (load('src/parts/HeaderPart.jsx').HeaderPart)().present(value => value)
  const origin = fromLocal('2026-10-25T01:00')
  const vp = { unit: 'hour', unitIndex: 2, worldOriginTime: origin, visibleCells: 8 }
  const first = header(vp, origin)
  const repeated = header({ ...vp, worldOffsetPx: 10, zoom: 1.2 }, origin + 1)
  assert.equal(first.rows[2].groups[0], repeated.rows[2].groups[0])
  const next = nextCell(cellAt(origin, 'hour')).start
  const advanced = header(vp, next)
  assert.equal(advanced.rows[2].groups.find(group => group.isCurrent).startTime, next)
  const panned = header({ ...vp, worldOriginTime: next }, next)
  assert.equal(panned.rows[2].groups.find(group => group.startTime === next).startI, 0)
  const expanded = header({ ...vp, visibleCells: 16 }, next)
  assert.ok(expanded.rows[2].groups.length > advanced.rows[2].groups.length)
})
