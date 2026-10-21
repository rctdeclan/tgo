import test from 'node:test'
import assert from 'node:assert/strict'
import { compose } from '../src/core/compose.js'

test('configuration, methods, declaration-ordered Parts, init once, then View', () => {
  const order = []
  let configuredApp
  class Body {
    constructor(app) {
      configuredApp = app
      this.width = 640
      this.initializations = 0
      order.push('body')
    }
    identity(value) { return { receiver: this, value } }
    init() { this.initializations++; order.push('init'); assert.equal(this.identity(7).receiver, this) }
  }
  const App = compose(class { constructor(value) { this.baseValue = value; order.push('base') } })
    .part('10', class { constructor(app) { assert.equal(app.width, 640); assert.equal(app.identity(1).receiver, app); order.push('10') } })
    .part('2', class { constructor() { order.push('2') } })
    .body(Body)
    .view((parts, app) => { order.push('view'); return { parts, app } })
    .build()
  const app = new App('argument')
  assert.equal(configuredApp, app)
  assert.equal(app.baseValue, 'argument')
  assert.equal(app.initializations, 1)
  assert.deepEqual(order, ['base', 'body', '10', '2', 'init'])
  assert.equal(app.View().parts, app.parts)
  assert.equal(app.View().app, app)
  assert.equal(app.initializations, 1)
  assert.deepEqual(app.identity('result'), { receiver: app, value: 'result' })
  const other = {}
  assert.equal(app.identity.call(other, 4).receiver, other)
})

test('function-valued Body own fields fail clearly before constructing Parts', () => {
  for (const Body of [class { action = () => this }, class { constructor() { this.action = function () {} } }]) {
    let constructed = false
    const App = compose(class {}).part('part', class { constructor() { constructed = true } }).body(Body).build()
    assert.throws(() => new App(), /Body own field action must be data/)
    assert.equal(constructed, false)
  }
})

test('built classes retain their own construction definitions', () => {
  const builder = compose(class {}).part('first', class {})
  const First = builder.body(class { constructor() { this.version = 1 } }).view((parts, app) => app.version).build()
  const Second = builder.part('second', class {}).body(class { constructor() { this.version = 2 } }).build()
  assert.equal(new First().View(), 1)
  assert.deepEqual(Object.keys(new First().parts), ['first'])
  assert.deepEqual(Object.keys(new Second().parts), ['first', 'second'])
})
