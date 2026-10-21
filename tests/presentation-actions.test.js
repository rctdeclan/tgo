import test from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import { createSourceLoader } from './helpers/load-source.js'
import { addCalendar, fromLocal, coordinate, instantAt } from '../src/domain/calendar.js'
const fixture = (unit, amount) => addCalendar(fromLocal('1970-01-01'), unit, amount)

function hooks() {
  const slots = []
  let index = 0
  let effects = []
  let cleanups = []
  return {
    react: {
      ...React,
      useState(initial) {
        const slot = index++
        if (!(slot in slots)) slots[slot] = typeof initial === 'function' ? initial() : initial
        return [slots[slot], value => { slots[slot] = typeof value === 'function' ? value(slots[slot]) : value }]
      },
      useRef(initial) {
        const slot = index++
        if (!(slot in slots)) slots[slot] = { current: initial }
        return slots[slot]
      },
      useEffect(effect) { effects.push(effect) }
    },
    render(View, props) { index = 0; effects = []; return View(props) },
    flush() { cleanups.forEach(cleanup => cleanup()); cleanups = effects.map(effect => effect()).filter(value => typeof value === 'function') },
    unmount() { cleanups.forEach(cleanup => cleanup()); cleanups = [] }
  }
}

function find(element, predicate) {
  if (Array.isArray(element)) {
    for (const child of element) { const found = find(child, predicate); if (found) return found }
  } else if (element && typeof element === 'object') {
    if (predicate(element)) return element
    return find(element.props?.children, predicate)
  }
}

function app() {
  const load = createSourceLoader()
  return new (load('src/App.jsx').App)()
}

function timestamp(viewport, x = 320) {
  return instantAt(coordinate(viewport.worldOriginTime, viewport.unit) + (x - 320 - viewport.worldOffsetPx) / (120 * viewport.zoom), viewport.unit)
}

test('stroke cell click, draft input, Enter/blur and Escape dispatch existing creation behavior', () => {
  const current = app()
  current.navigate('jumpTo', 4, fixture('day', 100))
  const harness = hooks()
  const load = createSourceLoader({ modules: { react: harness.react } })
  const part = new (load('src/parts/StrokesPart.jsx').StrokesPart)()
  const render = () => harness.render(part.Content, { viewport: current.snapshot.viewport, layout: current.snapshot.layout, onCreate: draft => current.createEvent(draft) })
  let tree = render()
  find(tree, element => element.props?.style?.cursor === 'text').props.onClick()
  let input = find(render(), element => element.type === 'input')
  input.props.onChange({ target: { value: 'UI event' } })
  input = find(render(), element => element.type === 'input')
  input.props.onKeyDown({ key: 'Enter', preventDefault() {}, currentTarget: { value: 'UI event' } })
  input.props.onBlur({ target: { value: 'UI event' } })
  assert.equal(current.parts.strokes.events.filter(event => event.title === 'UI event').length, 1)
  assert.equal(current.parts.strokes.events.at(-1).term.anchor, fixture('day', 80))
  assert.equal(current.parts.strokes.events.at(-1).positionsByUnit.day, 0)
  tree = render()
  assert.equal(find(tree, element => element.type === 'input'), undefined)
  find(tree, element => element.props?.style?.cursor === 'text').props.onClick()
  input = find(render(), element => element.type === 'input')
  input.props.onKeyDown({ key: 'Escape', preventDefault() {} })
  input.props.onBlur({ target: { value: 'cancelled' } })
  assert.equal(current.parts.strokes.events.some(event => event.title === 'cancelled'), false)
})

test('keyboard, wheel and pinch adapters dispatch wired navigation and preserve cursor math', () => {
  const current = app()
  const harness = hooks()
  const handlers = new Map()
  let gestures
  let gestureOptions
  class HTMLElement {}
  const window = {
    addEventListener: (name, handler) => handlers.set(name, handler),
    removeEventListener: (name, handler) => { if (handlers.get(name) === handler) handlers.delete(name) },
    requestAnimationFrame: () => 1, cancelAnimationFrame() {},
    setTimeout: () => 1, clearTimeout() {}
  }
  const load = createSourceLoader({
    modules: { react: harness.react, '@use-gesture/react': { useGesture: (callbacks, options) => { gestures = callbacks; gestureOptions = options; return undefined } } },
    globals: { window, HTMLElement }
  })
  const { ViewportSVG } = load('src/ui/ViewportSVG.jsx')
  const render = () => {
    const viewport = { ...current.snapshot.viewport }
    for (const name of ['panBy', 'panUnits', 'stepUnit', 'zoomByScaleFactor']) viewport[name] = (...args) => current.navigate(name, ...args)
    const tree = harness.render(ViewportSVG, { viewport, config: current.viewportConfig, getStepZoomScale: current.getStepZoomScale })
    harness.flush()
    return tree
  }
  current.navigateHeader(4, fixture('day', 100))
  const svg = render()
  assert.equal(gestureOptions.eventOptions.passive, false)
  assert.equal(gestureOptions.pinch.pinchOnWheel, false)
  assert.equal(gestureOptions.target.current, null)
  assert.equal(svg.props.width, 640)
  assert.equal(svg.props.height, 520)
  let preventions = 0
  const press = key => { render(); handlers.get('keydown')({ key, target: null, preventDefault() { preventions++ } }) }
  const before = timestamp(current.snapshot.viewport)
  press('ArrowRight')
  assert.equal(timestamp(current.snapshot.viewport), addCalendar(before, 'day', 1))
  press('ArrowLeft')
  assert.equal(timestamp(current.snapshot.viewport), before)
  press('ArrowUp')
  assert.equal(current.snapshot.viewport.unitIndex, 5)
  press('ArrowDown')
  assert.equal(current.snapshot.viewport.unitIndex, 4)
  assert.equal(timestamp(current.snapshot.viewport), before)
  assert.equal(preventions, 4)
  render()
  const input = new HTMLElement()
  input.tagName = 'INPUT'
  handlers.get('keydown')({ key: 'ArrowUp', target: input, preventDefault() { throw Error('typing intercepted') } })
  assert.equal(current.snapshot.viewport.unitIndex, 4)
  const center = timestamp(current.snapshot.viewport)
  gestures.onWheel({ event: { preventDefault() {}, clientX: 477 }, delta: [30, 0], ctrlKey: false })
  assert.ok(timestamp(current.snapshot.viewport) > center)
  current.navigateHeader(5, fixture('week', 100))
  render()
  const anchor = timestamp(current.snapshot.viewport, 320)
  gestures.onWheel({ event: { preventDefault() {}, clientX: 477 }, delta: [0, -120], ctrlKey: true })
  // Without a mounted DOM ref, adapters intentionally anchor at frame center.
  assert.ok(Math.abs(timestamp(current.snapshot.viewport, 320) - anchor) < 0.01)
  render()
  const pinchAnchor = timestamp(current.snapshot.viewport, 320)
  const memo = gestures.onPinch({ origin: [477], offset: [100], first: true })
  gestures.onPinch({ origin: [477], offset: [200], first: false, memo })
  assert.ok(Math.abs(timestamp(current.snapshot.viewport, 320) - pinchAnchor) < 0.01)
  harness.unmount()
  assert.equal(handlers.has('keydown'), false)
})
