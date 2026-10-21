import test from 'node:test'
import assert from 'node:assert/strict'
import { ExamplePart, ExampleApp, runExample } from '../examples/cookbook-minimal.js'

test('beta returns one retained gamma incorporating inline alpha on repeated use', () => {
  const part = new ExamplePart()
  const observed = []
  const gamma = part.beta((value, run) => { observed.push([value, run]); return value })
  assert.equal(typeof gamma, 'function')
  assert.deepEqual(observed, [])
  gamma(['first'])
  gamma(['second'])
  assert.deepEqual(observed, [['first', 1], ['second', 2]])
})

test('each beta construction retains independent state', () => {
  const part = new ExamplePart()
  const first = part.beta(value => value)
  const second = part.beta(value => value)
  assert.notEqual(first, second)
  assert.equal(first(['a']).run, 1)
  assert.equal(first(['b']).run, 2)
  assert.equal(second(['c']).run, 1)
})

test('gamma performs work before/after alpha, transforms its result and returns a different value', () => {
  const part = new ExamplePart()
  const gamma = part.beta((value, run) => `${value}:${run}`)
  assert.deepEqual(gamma(['a']), { run: 1, processed: 1, output: 'A:1' })
  assert.deepEqual(gamma(['b']), { run: 2, processed: 2, output: 'B:2' })
})

test('one gamma use can invoke alpha multiple times', () => {
  const part = new ExamplePart()
  const observed = []
  const gamma = part.beta((value, run) => { observed.push([value, run]); return value })
  assert.deepEqual(gamma(['a', 'b']), { run: 1, processed: 2, output: 'A,B' })
  assert.deepEqual(observed, [['a', 1], ['b', 1]])
})

test('conditional no-work gamma use need not invoke alpha but retains reusable behavior', () => {
  const part = new ExamplePart()
  const observed = []
  const gamma = part.beta(value => { observed.push(value); return value })
  assert.deepEqual(gamma([]), { run: 1, processed: 0, output: '' })
  assert.deepEqual(observed, [])
  assert.deepEqual(gamma(['later']), { run: 2, processed: 1, output: 'LATER' })
  assert.deepEqual(observed, ['later'])
})

test('effect gamma ignores alpha return and has no return value', () => {
  const part = new ExamplePart()
  const observed = []
  const sentinel = { alphaResult: true }
  const gamma = part.effect((value, call) => { observed.push([value, call]); return sentinel })
  assert.equal(gamma('first'), undefined)
  assert.equal(gamma('second'), undefined)
  assert.deepEqual(observed, [['first', 1], ['second', 2]])
})

test('effect gamma can conditionally skip alpha while updating captured state', () => {
  const part = new ExamplePart()
  const observed = []
  const gamma = part.effect((value, call) => { observed.push([value, call]) })
  gamma('first')
  assert.equal(gamma('skip', { enabled: false }), undefined)
  gamma('third')
  assert.deepEqual(observed, [['first', 1], ['third', 3]])
})

test('executable example demonstrates transformed batch results and closure reuse', () => {
  assert.deepEqual(runExample(), [
    { run: 1, processed: 2, output: 'A:1,B:1' },
    { run: 2, processed: 3, output: 'C:2' }
  ])
})

test('executable Compound Class example wires Parts through the confirmed lifecycle', () => {
  const app = new ExampleApp()
  assert.deepEqual(app.run(['first']), { run: 1, processed: 1, output: 'FIRST' })
  assert.deepEqual(app.run(['second']), { run: 2, processed: 2, output: 'SECOND' })
  assert.deepEqual(app.received, ['first', 'second'])
  assert.equal(app.View().app, app)
  assert.equal(app.View().parts, app.parts)
  assert.deepEqual(Object.keys(app.parts.source), [])
  assert.deepEqual(Object.keys(app.parts.destination), [])
})
