import test from 'node:test'
import assert from 'node:assert/strict'
import { createSourceLoader } from './helpers/load-source.js'
import { fromLocal, cellAt, nextCell, zoned } from '../src/domain/calendar.js'
const { headerLabel, fortnightNumber } = createSourceLoader()('src/domain/labels.js')

test('fortnight labels count starts in each calendar year and reset at the first start', () => {
  for (const year of [1969, 1970, 2024, 2025, 2026, 2027]) {
    const jan = fromLocal(`${year}-01-01`)
    let cell = cellAt(jan, 'fortnight')
    if (cell.start < jan) cell = nextCell(cell)
    let count = 0
    while (zoned(cell.start).year === year) {
      count++
      assert.equal(fortnightNumber(cell.start), count)
      assert.equal(headerLabel(cell.start, 'fortnight'), `Fortnight ${count}`)
      cell = nextCell(cell)
    }
    assert.ok(count === 26 || count === 27)
    assert.equal(fortnightNumber(cell.start), 1)
  }
})
