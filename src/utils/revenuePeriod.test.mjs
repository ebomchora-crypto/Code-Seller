import assert from 'node:assert/strict'
import test from 'node:test'

import { buildSeries, computeChange, resolveRange } from './revenuePeriod.ts'

const now = new Date(2026, 8, 26, 15, 30) // sábado, 26/09/2026

test('hoje compara com ontem, hora a hora', () => {
  const range = resolveRange('today', null, now)
  assert.equal(range.start.getTime(), new Date(2026, 8, 26).getTime())
  assert.equal(range.previousStart.getTime(), new Date(2026, 8, 25).getTime())
  assert.equal(range.granularity, 'hour')
  assert.equal(range.compareLabel, 'vs. ontem')
})

test('semana começa na segunda-feira', () => {
  const range = resolveRange('week', null, now)
  assert.equal(range.start.getTime(), new Date(2026, 8, 21).getTime())
  assert.equal(range.end.getTime(), new Date(2026, 8, 28).getTime())
})

test('mês mantém o recorte antigo do Início', () => {
  const range = resolveRange('month', null, now)
  assert.equal(range.start.getTime(), new Date(2026, 8, 1).getTime())
  assert.equal(range.previousStart.getTime(), new Date(2026, 7, 1).getTime())
  assert.equal(range.compareLabel, 'vs. mês anterior')
})

test('período personalizado inclui o último dia e compara com os dias anteriores', () => {
  const range = resolveRange('custom', { from: '2026-09-10', to: '2026-09-19' }, now)
  assert.equal(range.end.getTime(), new Date(2026, 8, 20).getTime())
  assert.equal(range.previousStart.getTime(), new Date(2026, 7, 31).getTime())
  assert.equal(range.compareLabel, 'vs. 10 dias anteriores')
})

test('série por hora soma cada venda na hora certa e traz o dia anterior', () => {
  const range = resolveRange('today', null, now)
  const entries = [
    { id: 'a', amount: 840, date: new Date(2026, 8, 26, 10, 15).toISOString(), title: 'Site', subtitle: null },
    { id: 'b', amount: 1200, date: new Date(2026, 8, 25, 10, 40).toISOString(), title: 'LP', subtitle: null },
  ]
  const series = buildSeries(entries, range)
  assert.equal(series.length, 24)
  assert.equal(series[10].value, 840)
  assert.equal(series[10].previous, 1200)
})

test('variação percentual', () => {
  assert.deepEqual(computeChange(3123, 1295, 'vs. ontem'), { value: 141.2, direction: 'up', label: 'vs. ontem' })
  assert.equal(computeChange(0, 0, 'x').direction, 'neutral')
})

test('o tempo todo: sem comparação, mês a mês desde a primeira venda', () => {
  const range = resolveRange('all', null, now)
  assert.equal(range.compare, false)
  assert.equal(range.granularity, 'month')
  const entries = [
    { id: 'a', amount: 350, date: new Date(2025, 11, 15, 12).toISOString(), title: 'a', subtitle: null },
    { id: 'b', amount: 1700, date: new Date(2026, 3, 17, 12).toISOString(), title: 'b', subtitle: null },
    { id: 'c', amount: 100, date: new Date(2026, 8, 2, 12).toISOString(), title: 'c', subtitle: null },
  ]
  const series = buildSeries(entries, range)
  assert.equal(series.length, 10) // dez/25 → set/26
  assert.equal(series[0].label, 'Dez/25')
  assert.equal(series[0].value, 350)
  assert.equal(series.at(-1).value, 100)
  assert.equal(series.reduce((sum, point) => sum + point.value, 0), 2150)
})

test('o tempo todo sem vendas antigas mostra os últimos 6 meses', () => {
  const series = buildSeries([], resolveRange('all', null, now))
  assert.equal(series.length, 6)
  assert.equal(series.at(-1).label, 'Set')
})
