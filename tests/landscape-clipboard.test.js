import test from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import { createSourceLoader } from './helpers/load-source.js'
function find(element, predicate) {
  if (Array.isArray(element)) {
    for (const child of element) { const found = find(child, predicate); if (found) return found }
  } else if (element && typeof element === 'object') {
    if (predicate(element)) return element
    return find(element.props?.children, predicate)
  }
}
function clipboardView(clipboard) {
  const state = []; let index = 0
  const load = createSourceLoader({ globals: { navigator: { clipboard } }, modules: { react: {
    ...React, useId: () => 'clipboard-test', useState: initial => {
      const slot = index++
      if (!(slot in state)) state[slot] = initial
      return [state[slot], value => { state[slot] = typeof value === 'function' ? value(state[slot]) : value }]
    }
  } } })
  const View = load('src/ui/LandscapeTools.jsx').LandscapeTools
  const render = () => { index = 0; return View({ viewport: { unitIndex: 2 }, onNavigate() {}, children: null }) }
  return { render, tool: label => find(render(), element => element.props?.label === label),
    text: () => find(render(), element => element.type === 'textarea'),
    status: () => find(render(), element => element.props?.role === 'status').props.children }
}
test('clipboard is read only on request; clearing the local buffer never clears the system clipboard', async () => {
  let reads = 0; const writes = []
  const view = clipboardView({ readText: async () => { reads++; return 'saved text' }, writeText: async text => writes.push(text) })
  view.render(); assert.equal(reads, 0)
  await view.tool('Paste into clipboard buffer').props.onClick()
  assert.equal(reads, 1)
  assert.equal(view.text().props.value, 'saved text')
  await view.tool('Copy clipboard buffer').props.onClick()
  assert.deepEqual(writes, ['saved text'])
  view.tool('Clear clipboard buffer').props.onClick()
  assert.equal(view.text().props.value, '')
  assert.deepEqual(writes, ['saved text'])
})
test('denied clipboard access keeps manual text entry available and retains the buffer', async () => {
  const denied = async () => { throw Error('denied') }
  const view = clipboardView({ readText: denied, writeText: denied })
  await view.tool('Paste into clipboard buffer').props.onClick()
  assert.match(view.status(), /Paste into the field/)
  view.text().props.onChange({ target: { value: 'manual text' } })
  await view.tool('Copy clipboard buffer').props.onClick()
  assert.equal(view.text().props.value, 'manual text')
  assert.match(view.status(), /copy it manually/)
})
