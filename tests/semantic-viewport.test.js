import test from 'node:test'
import assert from 'node:assert/strict'
import { createSourceLoader } from './helpers/load-source.js'
import { UNIT_ORDER, fromLocal, cellAt, coordinate, instantAt } from '../src/domain/calendar.js'
const make = () => createSourceLoader()('src/state/viewport.js').createViewport({ zoomUpper: 640 / 360, zoomLower: 0.5 })
const at = (vp, x = 320) => { const s = vp.getSnapshot(); return instantAt(coordinate(s.worldOriginTime, s.unit) + (x - 320 - s.worldOffsetPx) / (120 * s.zoom), s.unit) }

test('semantic pan crosses month/year/DST boundaries and dates before 1970 continuously', () => {
  for (const text of ['1969-12-31T12:00', '2024-02-29T12:00', '2026-03-29T12:00', '2026-10-25T02:30', '2026-12-31T23:59']) {
    for (const [index, unit] of UNIT_ORDER.entries()) {
      const vp = make()
      vp.jumpTo(index, fromLocal(text))
      const before = coordinate(at(vp), unit)
      vp.panUnits(1)
      assert.ok(Math.abs(coordinate(at(vp), unit) - before - 1) < 1e-6, `${text} ${unit}`)
      vp.panUnits(-2)
      assert.ok(Math.abs(coordinate(at(vp), unit) - before + 1) < 1e-6, `${text} ${unit}`)
      assert.equal(cellAt(vp.getSnapshot().worldOriginTime, unit).start, vp.getSnapshot().worldOriginTime)
    }
  }
})

test('cursor instant remains anchored across every adjacent gesture transition and round trips', () => {
  for (const text of ['1969-12-31T12:00', '2024-02-29T12:00', '2026-03-29T01:30', '2026-10-25T02:30']) {
    for (let index = 1; index < UNIT_ORDER.length; index++) {
      const vp = make()
      vp.jumpTo(index, fromLocal(text))
      vp.stepUnit(-1, { readable: true })
      vp.stepUnit(1, { readable: true })
      const anchor = at(vp, 477)
      for (let repeat = 0; repeat < 8; repeat++) {
        vp.zoomByScaleFactor(477, 1.025, 640)
        assert.ok(Math.abs(at(vp, 477) - anchor) <= 1, `${text} index ${index} in`)
        vp.zoomByScaleFactor(477, 1 / 1.025, 640)
        assert.ok(Math.abs(at(vp, 477) - anchor) <= 1, `${text} index ${index} out`)
      }
      assert.ok(vp.getSnapshot().zoom * 120 <= 640 / 3 + 1e-10)
    }
  }
})

test('keyboard/header navigation keeps dates and uses readable cell widths', () => {
  const vp = make()
  vp.jumpTo(7, fromLocal('2024-02-29T12:00'))
  const anchor = at(vp)
  for (let i = 0; i < 5; i++) { vp.stepUnit(-1, { readable: true }); vp.stepUnit(1, { readable: true }) }
  assert.equal(at(vp), anchor)
  assert.equal(vp.getSnapshot().zoom, 640 / 360)
  vp.jumpTo(4, fromLocal('2026-10-25T12:00'))
  assert.equal(at(vp), fromLocal('2026-10-25T12:00'))
})
