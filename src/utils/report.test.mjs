import assert from 'node:assert/strict'
import test from 'node:test'

import { buildMonthlyReport } from './report.ts'

const d = (y, m, day) => new Date(y, m, day, 12).toISOString()
const base = { title: 'x', stage: 'won', service: null, origin: null, contact_origin: null }

const deals = [
  { ...base, id: '1', value: 2000, status: 'won', service: 'Site', contact_origin: 'Buyers Hunter', created_at: d(2026, 8, 1), updated_at: d(2026, 8, 25), won_at: d(2026, 8, 11) },
  { ...base, id: '2', value: 1000, status: 'won', service: 'Site', origin: 'Indicação', created_at: d(2026, 8, 5), updated_at: d(2026, 8, 20), won_at: d(2026, 8, 20) },
  { ...base, id: '3', value: 3000, status: 'won', service: 'Sistema', created_at: d(2026, 7, 1), updated_at: d(2026, 7, 21), won_at: d(2026, 7, 21) },
  { ...base, id: '4', value: 500, status: 'lost', stage: 'lost', created_at: d(2026, 8, 2), updated_at: d(2026, 8, 12) },
  { ...base, id: '5', value: 800, status: 'open', stage: 'proposal', created_at: d(2026, 8, 3), updated_at: d(2026, 8, 3) },
]

test('soma o vendido pela data do ganho e agrupa por serviço e origem', () => {
  const report = buildMonthlyReport(deals, [], [], 2026, 8, new Date(2026, 8, 26, 12))
  assert.equal(report.sold, 3000)
  assert.equal(report.soldPrevious, 3000)
  assert.equal(report.salesCount, 2)
  assert.equal(report.ticket, 1500)
  assert.deepEqual(report.byService, [{ label: 'Site', count: 2, value: 3000 }])
  assert.deepEqual(report.byOrigin.map((bucket) => bucket.label), ['Buyers Hunter', 'Indicação'])
  assert.equal(report.avgDaysToClose, 12.5)
  assert.equal(report.conversion, 2 / 3)
  assert.equal(report.createdCount, 4)
})

test('lucro do mês e dias parado na etapa', () => {
  const transactions = [
    { type: 'income', amount: 1200, date: d(2026, 8, 10) },
    { type: 'expense', amount: 200, date: d(2026, 8, 11) },
    { type: 'income', amount: 999, date: d(2026, 7, 30) },
  ]
  const changes = [{ deal_id: '5', occurred_at: d(2026, 8, 16) }]
  const report = buildMonthlyReport(deals, transactions, changes, 2026, 8, new Date(2026, 8, 26, 12))
  assert.equal(report.received, 1200)
  assert.equal(report.profit, 1000)
  assert.deepEqual(report.stuck, [{ stage: 'proposal', count: 1, avgDays: 10 }])
})
