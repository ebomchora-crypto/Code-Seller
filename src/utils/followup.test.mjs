import assert from 'node:assert/strict'
import test from 'node:test'

import { followUpDates } from './followup.ts'

test('agenda às 10h, em ordem, ignorando dias inválidos', () => {
  const from = new Date(2026, 8, 26, 15, 30)
  const dates = followUpDates([10, 2, 0, 5], from)
  assert.deepEqual(
    dates.map((date) => [date.getDate(), date.getMonth(), date.getHours()]),
    [
      [28, 8, 10],
      [1, 9, 10],
      [6, 9, 10],
    ],
  )
})
