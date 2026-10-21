import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createSourceLoader } from './helpers/load-source.js'
import { addCalendar, fromLocal, coordinate, instantAt } from '../src/domain/calendar.js'
const fixture = (unit, amount) => addCalendar(fromLocal('1970-01-01'), unit, amount)

const loadApp = () => {
  const load = createSourceLoader()
  return { load, app: new (load('src/App.jsx').App)() }
}

test('production wiring constructs reusable Part-owned capabilities with inline alphas', () => {
  const load = createSourceLoader()
  const paths = {
    ViewportPart: ['read', 'navigate', 'stepScale'],
    StrokesPart: ['insert', 'create', 'layout', 'observe'],
    HeaderPart: ['navigate', 'present'],
    ListsPart: ['present']
  }
  const constructions = new Map()
  const invocations = new Map()
  for (const [name, methods] of Object.entries(paths)) {
    const Part = load(`src/parts/${name}.${name === 'ViewportPart' ? 'js' : 'jsx'}`)[name]
    for (const method of methods) {
      const beta = Part.prototype[method]
      assert.equal(typeof beta, 'function')
      const key = `${name}.${method}`
      Part.prototype[method] = function (alpha) {
        assert.equal(typeof alpha, 'function')
        constructions.set(key, (constructions.get(key) || 0) + 1)
        const gamma = beta.call(this, (...args) => {
          invocations.set(key, (invocations.get(key) || 0) + 1)
          return alpha(...args)
        })
        assert.equal(typeof gamma, 'function')
        return gamma
      }
    }
  }
  const app = new (load('src/App.jsx').App)()
  assert.equal(app.parts.strokes.listeners[0], app.eventsChanged)
  const insert = app.insertEvent
  app.createEvent({ title: 'first', start: 1, row: 2 })
  app.createEvent({ title: 'second', start: 3, row: 4 })
  app.getStepZoomScale(1)
  app.navigateHeader(4, fixture('day', 100))
  app.navigate('panUnits', 1)
  assert.equal(app.insertEvent, insert)
  for (const key of constructions.keys()) {
    assert.equal(constructions.get(key), 1, key)
    assert.ok(invocations.get(key) > 0, key)
  }
  assert.equal(constructions.size, 10)
  const source = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')
  const sites = source.match(/this\.parts\.\w+\.(?:read|layout|present|navigate|stepScale|insert|create|observe)\([^\n]+/g)
  assert.equal(sites.length, 10)
  for (const site of sites) assert.match(site, /\([^\n]*=>/, site)
})

test('Body coordinates event creation, notification, layout, lists and memory-only state', () => {
  const { app } = loadApp()
  app.navigate('jumpTo', 4, fixture('day', 100))
  let changes = 0
  const unsubscribe = app.subscribe(() => changes++)
  const created = app.createEvent({ title: '  inline event  ', row: 3, start: 2 })
  assert.equal(changes, 1)
  assert.equal(created.title, 'inline event')
  assert.equal(created.term.anchor, fixture('day', 102))
  assert.equal(created.term.definedUnit, 'day')
  assert.equal(created.term.amount, 1)
  assert.equal(app.snapshot.layout.packed.find(item => item.id === created.id).row, 3)
  const short = app.insertEvent({ id: 'short', title: 'sub-unit', term: { anchor: fixture('day', 100), definedUnit: 'hour', amount: 1 } })
  assert.equal(app.snapshot.lists.listItems.find(item => item.id === short.id).start, 0)
  assert.equal(app.snapshot.lists.rowCount, app.snapshot.layout.rowCount)
  assert.equal(app.snapshot.lists.viewport, app.snapshot.viewport)
  assert.equal(app.snapshot.header.viewport, app.snapshot.viewport)
  assert.equal(app.createEvent({ title: '  ', row: 0, start: 0 }), undefined)
  assert.equal(changes, 2)
  app.parts.strokes.addEvent({ id: 'existing-api', title: 'existing insertion API', term: { anchor: fixture('day', 100), definedUnit: 'hour', amount: 1 } })
  assert.equal(changes, 3)
  assert.ok(app.snapshot.lists.listItems.some(item => item.id === 'existing-api'))
  unsubscribe()
  app.navigate('panUnits', 1)
  assert.equal(changes, 3)
  assert.equal(loadApp().app.parts.strokes.events.length, 20)
})

test('Parts do not discover or retain siblings; app instances have independent viewport state', () => {
  const { load, app } = loadApp()
  const configOnlyApp = { viewportConfig: app.viewportConfig }
  Object.defineProperty(configOnlyApp, 'parts', { get() { throw Error('sibling access') } })
  for (const name of ['ViewportPart', 'HeaderPart', 'StrokesPart', 'ListsPart', 'PackingPart']) {
    const Part = load(`src/parts/${name}.${name === 'ViewportPart' ? 'js' : 'jsx'}`)[name]
    const part = new Part(configOnlyApp)
    assert.ok(!Object.values(part).includes(configOnlyApp))
    const source = fs.readFileSync(new URL(`../src/parts/${name}.${name === 'ViewportPart' ? 'js' : 'jsx'}`, import.meta.url), 'utf8')
    assert.doesNotMatch(source, /\b(?:this\.)?app\.parts\b|this\.parts\b|from ["']\.\//)
  }
  const other = new (load('src/App.jsx').App)()
  const before = other.snapshot.viewport
  app.navigate('panUnits', 7)
  assert.equal(other.snapshot.viewport, before)
})

test('production gamma performs its own work and need not return alpha result', () => {
  const load = createSourceLoader()
  const Part = load('src/parts/ViewportPart.js').ViewportPart
  const part = new Part({ viewportConfig: { zoomUpper: 640 / 360, zoomLower: 0.5 } })
  const observed = []
  const gamma = part.navigate(snapshot => { observed.push(snapshot); return 'not the gamma result' })
  const first = gamma('panBy', 10)
  const second = gamma('panBy', 20)
  assert.equal(observed[0], first)
  assert.equal(observed[1], second)
  assert.equal(second.worldOffsetPx, -30)
  assert.throws(() => gamma('unknown'), /Unknown viewport command/)
})

test('up/down and header navigation retain existing bounds, scale and center math', () => {
  const { app } = loadApp()
  const center = snapshot => instantAt(coordinate(snapshot.worldOriginTime, snapshot.unit) - snapshot.worldOffsetPx / (120 * snapshot.zoom), snapshot.unit)
  app.navigateHeader(5, fixture('week', 100))
  const before = center(app.snapshot.viewport)
  assert.equal(app.getStepZoomScale(-1), 1 / 7)
  app.navigate('stepUnit', -1, { readable: true })
  assert.equal(app.snapshot.viewport.unitIndex, 4)
  assert.equal(center(app.snapshot.viewport), before)
  assert.equal(app.snapshot.viewport.zoom, 640 / 360)
  app.navigate('stepUnit', 1, { readable: true })
  assert.equal(center(app.snapshot.viewport), before)
  app.navigateHeader(0, 0)
  assert.equal(app.getStepZoomScale(-1), null)
})

test('inactive Packing Part exposes a reusable capability without changing the active lanes', () => {
  const load = createSourceLoader()
  const Part = load('src/parts/PackingPart.jsx').PackingPart
  const observed = []
  const gamma = new Part().layout(packed => { observed.push(packed); return packed.length })
  assert.equal(gamma([{ start: 0, span: 2 }, { start: 1, span: 1 }]), 2)
  assert.equal(gamma([{ start: 2, span: 1 }]), 1)
  assert.deepEqual(Array.from(observed[0], event => event.row), [0, 1])
  assert.equal(observed.length, 2)
})
