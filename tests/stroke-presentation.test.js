import test from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { cellAt, nextCell, fromLocal, UNIT_ORDER } from '../src/domain/calendar.js'
import { boundaryGap, cellBox, eventBox, startsTerm, STROKE_HEIGHT } from '../src/ui/strokeGeometry.js'
import { createSourceLoader } from './helpers/load-source.js'

const cell = (date, unit) => cellAt(fromLocal(date), unit)

test('larger gutters distinguish calendar term boundaries across displayed units', () => {
  for (const [unit, term, ordinary] of [
    ['minute', '2026-11-02T12:15', '2026-11-02T12:16'],
    ['fifteenMinute', '2026-11-02T13:00', '2026-11-02T13:15'],
    ['hour', '2026-11-02T00:00', '2026-11-02T02:00'],
    ['dayPart', '2026-11-02T06:00', '2026-11-02T11:00'],
    ['day', '2026-11-02', '2026-11-04'],
    ['week', '2026-11-09', '2026-11-02'],
    ['fortnight', '2026-01-05', '2026-01-19'],
    ['month', '2026-04-01', '2026-05-01'],
    ['quarter', '2026-01-01', '2026-04-01'],
    ['year', '2030-01-01', '2031-01-01']
  ]) {
    assert.ok(boundaryGap(cell(term, unit), 120) > boundaryGap(cell(ordinary, unit), 120), unit)
  }
})

test('gutters preserve semantic positions and remain usable at narrow zoom and DST', () => {
  for (const unit of UNIT_ORDER) {
    for (const date of ['1969-12-29', '2026-03-29', '2026-10-25']) {
      const origin = cell(date, unit)
      for (const width of [4, 60, 120]) {
        const left = cellBox(origin, -1, 1, width)
        const right = cellBox(origin, 0, 1, width)
        assert.ok(left.width > 0 && right.width > 0)
        const gap = right.x - (left.x + left.width)
        assert.ok(Math.abs(gap - boundaryGap(origin, width)) < 1e-8)
        assert.equal(right.x, boundaryGap(origin, width) / 2)
      }
    }
  }
  assert.equal(startsTerm(cell('1969-12-29T06:00', 'dayPart')), true)
  assert.equal(startsTerm(nextCell(cell('2026-03-29', 'day'), 1)), true)
})

test('native-unit event rectangles inset on all sides, independently of amount', () => {
  const origin = cell('2026-11-02', 'day')
  for (const amount of [1, 2, 5]) {
    const event = { start: 0, span: amount, term: { definedUnit: 'day', amount } }
    const cells = cellBox(origin, 0, amount, 120)
    const box = eventBox(origin, event, 'day', 120)
    assert.equal(box.x - cells.x, 2)
    assert.equal(cells.x + cells.width - box.x - box.width, 2)
    assert.equal(box.y, 2)
    assert.equal(STROKE_HEIGHT - box.y - box.height, 2)
    const other = eventBox(origin, { ...event, term: { definedUnit: 'hour' } }, 'day', 120)
    assert.deepEqual([other.x, other.width, other.y, other.height], [cells.x, cells.width, 0, STROKE_HEIGHT])
    assert.ok(eventBox(origin, event, 'day', 0.5).width > 0)
  }
})

test('strokes embed empty-unit labels and glass dividers, with no header or colored outlines', () => {
  const load = createSourceLoader()
  const part = new (load('src/parts/StrokesPart.jsx').StrokesPart)()
  const origin = fromLocal('2026-11-02')
  for (const [id, definedUnit, amount] of [['native', 'day', 2], ['fine', 'hour', 1], ['coarse', 'week', 1]]) {
    part.addEvent({ id, title: `Title ${id}`, subtitle: `Description ${id}`, term: { anchor: origin, definedUnit, amount } })
  }
  const layout = part.getLayout('day', origin)
  const html = renderToStaticMarkup(React.createElement(part.Content, {
    viewport: { unit: 'day', worldOriginTime: origin, zoom: 1, visibleCells: 8, worldOffsetPx: 0 }, layout
  }))
  assert.equal(layout.listItems.length, 0)
  assert.equal((html.match(/data-event-line=/g) || []).length, 3)
  assert.match(html, /data-event-line="native" data-native-inset="true"/)
  assert.doesNotMatch(html, /data-native-border=|stroke=|<path/)
  assert.match(html, /data-glass-divider=/)
  assert.match(html, /data-cell-unit=/)
  for (const id of ['native', 'fine', 'coarse']) {
    assert.match(html, new RegExp(`data-event-title="${id}"`))
    assert.match(html, new RegExp(`data-event-subtitle="${id}"[^>]*>Description ${id}<`))
  }
  const app = new (load('src/App.jsx').App)()
  assert.ok(app.parts.strokes.events.every(event => event.title && event.subtitle))
  const appHtml = renderToStaticMarkup(React.createElement(app.View))
  assert.doesNotMatch(appHtml, /M0 7L7 14|Fortnight |Week /)
})

test('short stroke unit labels omit parent terms and retain repeated-hour offsets', () => {
  const { unitLabel } = createSourceLoader()('src/domain/labels.js')
  const at = fromLocal('2026-11-03T12:15')
  const expected = { year: '2026', quarter: 'Q4', month: 'Nov', fortnight: 'F22', week: 'W45', day: '3 Tue', dayPart: 'Noon', hour: '12:15', fifteenMinute: '12:15', minute: '12:15' }
  for (const [unit, label] of Object.entries(expected)) assert.equal(unitLabel(at, unit), label)
  const repeated = cell('2026-10-25T02:00', 'hour')
  assert.match(unitLabel(repeated.start, 'hour'), /02:00 \+02:00/)
  assert.match(unitLabel(nextCell(repeated).start, 'hour'), /02:00 \+01:00/)
})
