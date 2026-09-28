import assert from 'node:assert/strict'
import test from 'node:test'

import { buildSourceStats, sourceInsights } from './salesSources.ts'

const end = new Date('2026-10-01T00:00:00')
const start = new Date('2026-07-01T00:00:00')

function deal(status, value, when, contact_origin, contact_niche, origin = null) {
  return { status, value, won_at: status === 'won' ? when : null, updated_at: when, contact_origin, contact_niche, origin }
}

const deals = [
  deal('won', 3000, '2026-09-10T12:00:00', 'Indicação', 'Barbearia'),
  deal('won', 3000, '2026-08-10T12:00:00', 'indicação', 'Barbearia'),
  deal('lost', 2000, '2026-08-11T12:00:00', 'Indicação', 'Barbearia'),
  deal('won', 2000, '2026-09-01T12:00:00', 'Instagram', 'Clínica'),
  deal('lost', 1000, '2026-09-02T12:00:00', 'Instagram', 'Clínica'),
  deal('lost', 1000, '2026-09-03T12:00:00', 'Instagram', 'Clínica'),
  deal('lost', 1000, '2026-09-04T12:00:00', 'Instagram', 'Clínica'),
  deal('won', 9999, '2025-01-01T12:00:00', 'Indicação', 'Barbearia'), // fora do período
  deal('open', 5000, '2026-09-05T12:00:00', 'Indicação', 'Barbearia'), // aberto não conta
  deal('won', 500, '2026-09-06T12:00:00', null, null, 'Site'), // origem do próprio negócio
]

const contacts = [
  ...Array.from({ length: 6 }, () => ({ created_at: '2026-09-01T12:00:00', origin: 'TikTok', niche: 'Academia' })),
  { created_at: '2026-09-01T12:00:00', origin: 'Instagram', niche: 'Clínica' },
  { created_at: '2020-01-01T12:00:00', origin: 'Instagram', niche: 'Clínica' },
]

test('agrupa por origem ignorando maiúsculas/acentos e o período', () => {
  const rows = buildSourceStats(deals, contacts, 'origin', start, end)
  const indicacao = rows.find((row) => row.label === 'Indicação')
  assert.equal(indicacao.won, 2)
  assert.equal(indicacao.lost, 1)
  assert.equal(indicacao.revenue, 6000)
  assert.equal(Math.round(indicacao.closeRate * 100), 67)
  assert.equal(indicacao.ticket, 3000)
  assert.equal(rows[0].label, 'Indicação')
  const instagram = rows.find((row) => row.label === 'Instagram')
  assert.equal(instagram.leads, 1)
  assert.equal(instagram.closeRate, 0.25)
  assert.equal(rows.find((row) => row.label === 'Site').revenue, 500)
  assert.equal(rows.find((row) => row.label === 'TikTok').leads, 6)
})

test('o tempo todo inclui vendas antigas', () => {
  const rows = buildSourceStats(deals, contacts, 'origin', null, end)
  assert.equal(rows.find((row) => row.label === 'Indicação').revenue, 15999)
})

test('por nicho', () => {
  const rows = buildSourceStats(deals, contacts, 'niche', start, end)
  assert.deepEqual(
    rows.map((row) => [row.label, row.revenue]),
    [
      ['Barbearia', 6000],
      ['Clínica', 2000],
      ['Nicho não informado', 500],
      ['Academia', 0],
    ],
  )
})

test('destaques em português claro', () => {
  const insights = sourceInsights(buildSourceStats(deals, contacts, 'origin', start, end), 'origin')
  assert.match(insights[0], /^Indicação é a origem que mais fatura: R\$\s?6\.000 \(71% do total\)\.$/)
  assert.equal(insights[1], 'Indicação vende 3x mais que Instagram.')
  assert.equal(insights[2], 'Indicação fecha 67% dos negócios — a melhor taxa entre as origens.')
  assert.equal(insights[3], 'Instagram fecha só 25%.')
  assert.equal(insights[4], 'TikTok trouxe 6 leads e ainda nenhuma venda.')
})

test('sem dados, sem destaques', () => {
  assert.deepEqual(sourceInsights(buildSourceStats([], [], 'niche', start, end), 'niche'), [])
})

test('com uma só origem comparável, não fala em "melhor taxa"', () => {
  const only = [
    deal('won', 1000, '2026-09-10T12:00:00', 'Instagram', null),
    deal('lost', 1000, '2026-09-11T12:00:00', 'Instagram', null),
    deal('lost', 1000, '2026-09-12T12:00:00', 'Instagram', null),
  ]
  assert.ok(sourceInsights(buildSourceStats(only, [], 'origin', start, end), 'origin').includes('Instagram fecha 33% dos negócios.'))
})
