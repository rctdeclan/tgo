import test from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import { createSourceLoader } from './helpers/load-source.js'
import { sceneX, phoneContentHeight } from '../src/ui/frameGeometry.js'
import { coordinate, instantAt, fromLocal } from '../src/domain/calendar.js'
const create = () => createSourceLoader()('src/state/viewport.js').createViewport()
const timeAt = (viewport, x, width) => {
  const s = viewport.getSnapshot()
  return instantAt(coordinate(s.worldOriginTime, s.unit) + (sceneX(x, width) - 320 - s.worldOffsetPx) / (120 * s.zoom), s.unit)
}

test('phone crop retains the logical center and moving pinch anchor without shrinking text', () => {
  for (const width of [320, 375, 390, 430]) {
    assert.equal(sceneX(width / 2, width), 320)
    const viewport = create()
    viewport.resizeFrame(width)
    const anchor = timeAt(viewport, 110, width)
    viewport.transformGesture(sceneX(110, width), 1.3, -25, 640)
    assert.ok(Math.abs(timeAt(viewport, 135, width) - anchor) <= 1)
  }
})

test('phone resize and readable zoom preserve center and fit at least three unit-widths', () => {
  const viewport = create()
  viewport.jumpTo(4, fromLocal('2026-10-25T12:00'))
  const anchor = timeAt(viewport, 320, 640)
  for (const width of [320, 430, 375, 640]) {
    viewport.resizeFrame(width)
    assert.ok(Math.abs(timeAt(viewport, width / 2, width) - anchor) <= 1)
    viewport.stepUnit(-1, { readable: true })
    viewport.stepUnit(1, { readable: true })
    assert.ok(viewport.getSnapshot().zoom * 120 <= width / 3 + 1e-8)
    assert.ok(Math.abs(timeAt(viewport, width / 2, width) - anchor) <= 1)
  }
})

test('phone content height includes every stroke row without a list section', () => {
  assert.ok(phoneContentHeight(6) >= 520)
  for (const rows of [8, 12, 30]) assert.ok(phoneContentHeight(rows) >= 81 + rows * 40 + 8)
})

function find(element, predicate) {
  if (Array.isArray(element)) {
    for (const child of element) { const found = find(child, predicate); if (found) return found }
  } else if (element && typeof element === 'object') {
    if (predicate(element)) return element
    return find(element.props?.children, predicate)
  }
}

test('phone navigation dispatches existing capabilities and respects unit limits', () => {
  const load = createSourceLoader({ modules: { react: { ...React,
    useRef: value => ({ current: value }), useState: value => [value, () => {}], useEffect() {}
  } } })
  const Frame = load('src/ui/TimelineFrame.jsx').TimelineFrame
  const calls = []
  const render = unitIndex => Frame({ viewport: { unit: 'hour', unitIndex }, rowCount: 6, onNavigate: (...args) => calls.push(args), children: () => null })
  let tree = render(2)
  for (const name of ['Earlier', 'Later', 'Zoom out', 'Zoom in']) find(tree, element => element.props?.['aria-label'] === name).props.onClick()
  assert.deepEqual(calls.map(call => call.slice(0, 2)), [['panUnits', -1], ['panUnits', 1], ['stepUnit', 1], ['stepUnit', -1]])
  assert.equal(find(render(0), element => element.props?.['aria-label'] === 'Zoom in').props.disabled, true)
  assert.equal(find(render(9), element => element.props?.['aria-label'] === 'Zoom out').props.disabled, true)
})

test('wheel zoom maps phone coordinates into the cropped scene and lets vertical scrolling through', () => {
  let gestures
  let first = true
  const node = { getBoundingClientRect: () => ({ left: 10, width: 390 }) }
  const load = createSourceLoader({ modules: {
    react: { useRef: value => { if (first) { first = false; return { current: node } } return { current: value } }, useEffect() {} },
    '@use-gesture/react': { useGesture: value => { gestures = value } }
  } })
  const calls = []
  load('src/hooks/useTrackpadTimeline.js').useTrackpadTimeline({ zoomByScaleFactor: (...args) => calls.push(args), panBy() {} }, { width: 640, allowVerticalScroll: true })
  let prevented = false
  const event = { clientX: 130, preventDefault() { prevented = true } }
  gestures.onWheel({ event, delta: [0, 30], ctrlKey: false })
  assert.equal(prevented, false)
  gestures.onWheel({ event, delta: [0, -120], ctrlKey: true })
  assert.equal(prevented, true)
  assert.equal(calls[0][0], 245)
  assert.equal(calls[0][2], 640)
})
