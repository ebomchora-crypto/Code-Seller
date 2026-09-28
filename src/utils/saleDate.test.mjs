import assert from 'node:assert/strict'
import test from 'node:test'

import { dayToTimestamp, defaultPaidAtInput, localDateTimeInput, localDay } from './saleDate.ts'

const now = new Date('2026-09-28T15:30:00')

test('dia de hoje vira o instante atual', () => {
  assert.equal(dayToTimestamp(localDay(now), now), now.toISOString())
})

test('dia passado vira meio-dia local daquele dia', () => {
  const iso = dayToTimestamp('2026-01-15', now)
  assert.equal(localDay(iso), '2026-01-15')
  assert.equal(new Date(iso).getHours(), 12)
})

test('"Pago em" segue a data do lançamento', () => {
  assert.equal(defaultPaidAtInput('2026-04-17', now), '2026-04-17T12:00')
  assert.equal(defaultPaidAtInput(localDay(now), now), localDateTimeInput(now))
})

test('localDateTimeInput mostra o horário local, não o UTC', () => {
  const instant = new Date('2026-09-27T20:58:00')
  assert.equal(localDateTimeInput(instant.toISOString()), '2026-09-27T20:58')
})
