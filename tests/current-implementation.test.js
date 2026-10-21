import test from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { compose } from '../src/core/compose.js'
import { addCalendar, fromLocal, coordinate, instantAt } from '../src/domain/calendar.js'
const fixture = (unit, amount) => addCalendar(fromLocal('1970-01-01'), unit, amount)
import { createSourceLoader } from './helpers/load-source.js'

function strokes() {
  const load = createSourceLoader()
  const { StrokesPart } = load('src/parts/StrokesPart.jsx')
  return new StrokesPart({ parts: {} })
}

function event(id, start, amount = 1, definedUnit = 'day', positionsByUnit = {}) {
  return { id, title: id, term: { anchor: fixture('day', start), definedUnit, amount }, positionsByUnit }
}

test('current builder: config before Parts, init afterward, explicit parts/app View', () => {
  const order = []
  class Part {
    constructor(app) { assert.equal(app.config.width, 640); order.push('part') }
  }
  const App = compose(class {})
    .part('part', Part)
    .body(class {
      constructor() { this.config = { width: 640 }; order.push('config') }
      init() { assert.ok(this.parts.part); order.push('init') }
    })
    .view((parts, app) => ({ parts, app }))
    .build()
  const app = new App()
  assert.deepEqual(order, ['config', 'part', 'init'])
  assert.equal(app.View().parts, app.parts)
  assert.equal(app.View().app, app)
})

test('Body prototype methods use the composed app receiver', () => {
  const App = compose(class {}).body(class { method() { return this } }).build()
  const app = new App()
  assert.equal(app.method(), app)
})

test('events notify in memory and preserve supplied colors and unit-row hints', () => {
  const part = strokes()
  let notifications = 0
  const unsubscribe = part.subscribe(() => { notifications += 1 })
  part.addEvent({ ...event('one', 0, 1, 'day', { day: 3 }), color: '#123456' })
  assert.equal(notifications, 1)
  assert.equal(part.events[0].color, '#123456')
  assert.equal(part.getLayout('day', 0).packed[0].row, 3)
  unsubscribe()
  part.addEvent(event('two', 3))
  assert.equal(notifications, 1)
  assert.equal(strokes().events.length, 0)
})

test('current routing: sub-unit events enter lists, equal/larger durations remain strokes', () => {
  const part = strokes()
  part.addEvent(event('short', 0, 2, 'hour'))
  part.addEvent(event('equal', 0))
  part.addEvent(event('long', 1, 3))
  const layout = part.getLayout('day', 0)
  assert.deepEqual(Array.from(layout.listItems, item => item.id), ['short'])
  assert.deepEqual(Array.from(layout.packed, item => [item.id, item.start, item.span]), [['equal', 0, 1], ['long', 1, 3]])
  assert.equal(layout.rowCount, 6)
})

test('provisional layout: only overlapping intervals require different rows', () => {
  const part = strokes()
  part.addEvent(event('a', 0, 2))
  part.addEvent(event('b', 1))
  part.addEvent(event('c', 2))
  assert.deepEqual(Array.from(part.getLayout('day', 0).packed, item => [item.id, item.row]), [['a', 0], ['b', 1], ['c', 0]])
})

test('known baseline gap: derived row writes do not persist to canonical events', () => {
  const part = strokes()
  part.addEvent(event('later', 10))
  assert.equal(part.getLayout('day', 0).packed[0].row, 0)
  assert.equal(part.events[0].positionsByUnit.day, undefined)
  part.addEvent(event('earlier', 9, 2))
  assert.equal(part.getLayout('day', 0).packed.find(item => item.id === 'later').row, 1)
})

function viewport() {
  const load = createSourceLoader()
  const { createViewport } = load('src/state/viewport.js')
  const config = { zoomUpper: 640 / (3 * 120), zoomLower: 0.5 }
  const model = createViewport(config)
  return { read: () => ({ ...model.getSnapshot(), ...model }), config }
}

function timeAt(snapshot, x) {
  return instantAt(coordinate(snapshot.worldOriginTime, snapshot.unit) + (x - 320 - snapshot.worldOffsetPx) / (120 * snapshot.zoom), snapshot.unit)
}

test('current one-unit pan preserves continuous time map through normalization', () => {
  const { read } = viewport()
  read().jumpTo(4, fixture('day', 100))
  const before = read()
  read().panUnits(1)
  const after = read()
  assert.ok(Math.abs(timeAt(after, 320) - timeAt(before, 320) - (addCalendar(timeAt(before, 320), 'day', 1) - timeAt(before, 320))) < 0.001)
  assert.ok(Math.abs(after.worldOffsetPx) < 120 * after.zoom)
})

test('current gesture zoom preserves cursor timestamp across week/day transition', () => {
  const { read, config } = viewport()
  read().jumpTo(5, fixture('week', 100))
  const before = read()
  const anchor = timeAt(before, 477)
  read().zoomByScaleFactor(477, 1.025, 640)
  const after = read()
  assert.equal(after.unitIndex, before.unitIndex - 1)
  assert.ok(Math.abs(timeAt(after, 477) - anchor) < 0.01)
  assert.ok(after.zoom <= config.zoomUpper)
})

test('current keyboard step keeps center and readable cells in 640px frame', () => {
  const { read, config } = viewport()
  read().jumpTo(5, fixture('week', 100))
  const before = read()
  read().stepUnit(-1, { readable: true })
  const after = read()
  assert.equal(after.unitIndex, before.unitIndex - 1)
  assert.equal(after.zoom, config.zoomUpper)
  assert.ok(Math.abs(timeAt(after, 320) - timeAt(before, 320)) < 0.01)
})

test('real React initial render: 640px SVG, both background sections, session-only additions', () => {
  const load = createSourceLoader()
  const { App } = load('src/App.jsx')
  const first = new App()
  assert.equal(first.parts.strokes.events.length, 20)
  first.parts.strokes.addEvent(event('local-only', 0))
  const second = new App()
  assert.equal(first.parts.strokes.events.length, 21)
  assert.equal(second.parts.strokes.events.length, 20)
  const html = renderToStaticMarkup(React.createElement(second.View))
  assert.match(html, /<svg[^>]*width="640"[^>]*height="520"/)
  assert.equal((html.match(/<image /g) || []).length, 2)
})
