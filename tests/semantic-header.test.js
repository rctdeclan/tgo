import test from 'node:test'
import assert from 'node:assert/strict'
import { createSourceLoader } from './helpers/load-source.js'
import { UNIT_ORDER, fromLocal, coordinate, cellAt } from '../src/domain/calendar.js'

test('all three header levels project real boundaries with the active coordinate model', () => {
  const load = createSourceLoader()
  const Header = load('src/parts/HeaderPart.jsx').HeaderPart
  const present = new Header().present(model => model)
  for (const date of ['1969-12-31', '2024-02-29', '2026-03-29', '2026-10-25', '2026-12-31']) {
    for (const [unitIndex, unit] of UNIT_ORDER.entries()) {
      const origin = cellAt(fromLocal(date), unit).start
      const model = present({ unitIndex, unit, worldOriginTime: origin, zoom: 1, visibleCells: 40, worldOffsetPx: 0 }, fromLocal(date))
      assert.equal(model.rows.length, Math.min(3, UNIT_ORDER.length - unitIndex))
      for (const row of model.rows) {
        for (const group of row.groups) {
          const cell = cellAt(group.startTime, row.unit)
          assert.equal(group.startTime, cell.start)
          assert.equal(group.startI, coordinate(cell.start, unit) - coordinate(origin, unit))
          assert.equal(group.endI + 1, coordinate(cell.end, unit) - coordinate(origin, unit))
          assert.ok(group.endI + 1 > group.startI)
          assert.equal(typeof group.label, 'string')
        }
      }
    }
  }
})

test('repeated hour header labels preserve both offsets', () => {
  const load = createSourceLoader()
  const Header = load('src/parts/HeaderPart.jsx').HeaderPart
  const model = new Header().present(value => value)({ unitIndex: 2, unit: 'hour', worldOriginTime: fromLocal('2026-10-25T02:00'), zoom: 1, visibleCells: 8, worldOffsetPx: 0 }, fromLocal('2026-10-25T02:30'))
  const bottom = model.rows.at(-1).groups
  assert.ok(bottom.some(group => group.label.includes('+02:00')))
  assert.ok(bottom.some(group => group.label.includes('+01:00')))
})
