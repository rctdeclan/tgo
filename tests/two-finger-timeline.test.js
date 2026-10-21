import test from 'node:test'
import assert from 'node:assert/strict'
import { attachTwoFingerTimeline } from '../src/hooks/twoFingerTimeline.js'
import { createSourceLoader } from './helpers/load-source.js'
import { coordinate, instantAt, fromLocal } from '../src/domain/calendar.js'

function target() {
  const listeners = new Map()
  return {
    listeners,
    getBoundingClientRect: () => ({ left: 100, width: 640 }),
    addEventListener(type, fn) { listeners.set(type, fn) },
    removeEventListener(type, fn) { if (listeners.get(type) === fn) listeners.delete(type) },
    send(type, touches = []) {
      const event = { type, touches, prevented: false, stopped: false,
        preventDefault() { this.prevented = true },
        stopImmediatePropagation() { this.stopped = true } }
      listeners.get(type)?.(event)
      return event
    }
  }
}
const finger = (identifier, clientX, clientY = 100) => ({ identifier, clientX, clientY })
const timeAt = (viewport, x) => {
  const s = viewport.getSnapshot()
  return instantAt(coordinate(s.worldOriginTime, s.unit) + (x - 320 - s.worldOffsetPx) / (120 * s.zoom), s.unit)
}

test('two fingers pan and pinch together while preserving the moving midpoint instant', () => {
  const viewport = createSourceLoader()('src/state/viewport.js').createViewport()
  viewport.jumpTo(4, fromLocal('2026-10-25T12:00'))
  const node = target()
  const dispose = attachTwoFingerTimeline(node, viewport)
  const instant = timeAt(viewport, 200)
  assert.ok(node.send('touchstart', [finger(1, 200), finger(2, 400)]).prevented)
  node.send('touchmove', [finger(1, 250), finger(2, 450)])
  assert.ok(Math.abs(timeAt(viewport, 250) - instant) <= 1)
  const before = viewport.getSnapshot()
  // Spread and translate in the same event, including a semantic-level change.
  node.send('touchmove', [finger(1, 220), finger(2, 580)])
  assert.ok(Math.abs(timeAt(viewport, 300) - instant) <= 1)
  assert.notDeepEqual(viewport.getSnapshot(), before)
  dispose()
  assert.equal(node.listeners.size, 0)
})

test('one finger stays a tap; completed navigation suppresses its synthetic click', () => {
  const node = target()
  let calls = 0
  const dispose = attachTwoFingerTimeline(node, { panBy() { calls++ }, zoomByScaleFactor() { calls++ } })
  assert.equal(node.send('touchstart', [finger(1, 200)]).prevented, false)
  assert.equal(node.send('touchmove', [finger(1, 210)]).prevented, false)
  assert.equal(node.send('click').prevented, false)
  assert.equal(calls, 0)
  node.send('touchstart', [finger(1, 200), finger(2, 400)])
  node.send('touchmove', [finger(1, 210), finger(2, 410)])
  node.send('touchend')
  const click = node.send('click')
  assert.ok(click.prevented && click.stopped)
  dispose()
})

test('finger replacement, third finger and cancellation reset without navigation jumps', () => {
  const node = target()
  const calls = []
  const active = []
  const dispose = attachTwoFingerTimeline(node, {
    panBy: value => calls.push(value), zoomByScaleFactor: () => calls.push('zoom')
  }, { onActiveChange: value => active.push(value) })
  node.send('touchstart', [finger(1, 200), finger(2, 400)])
  node.send('touchmove', [finger(1, 200), finger(3, 600)])
  assert.deepEqual(calls, [])
  node.send('touchstart', [finger(1, 200), finger(3, 600), finger(4, 800)])
  assert.equal(active.at(-1), false)
  node.send('touchend', [finger(1, 200), finger(3, 600)])
  assert.deepEqual(calls, [])
  node.send('touchcancel')
  node.send('touchmove', [finger(1, 200), finger(3, 600)])
  assert.deepEqual(calls, [])
  dispose()
  assert.equal(active.at(-1), false)
})

test('touch pinch is ignored by use-gesture to prevent duplicate zoom delivery', () => {
  let callbacks
  const { useTrackpadTimeline } = createSourceLoader({ modules: {
    react: { useRef: value => ({ current: value }), useEffect() {} },
    '@use-gesture/react': { useGesture(value) { callbacks = value } }
  } })('src/hooks/useTrackpadTimeline.js')
  let calls = 0
  useTrackpadTimeline({ zoomByScaleFactor() { calls++ } })
  for (const event of [{ type: 'touchmove' }, { type: 'pointermove', pointerType: 'touch' }]) {
    callbacks.onPinch({ event, origin: [300, 100], offset: [200], first: false, memo: 100 })
  }
  assert.equal(calls, 0)
})
