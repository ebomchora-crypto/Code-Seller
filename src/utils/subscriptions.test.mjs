import assert from 'node:assert/strict'
import test from 'node:test'
import { addMonths, chargeDate, chargesDue, chargesLeft, contractTotal, durationLabel, lastChargeDate, monthlyRecurring, nextChargeDate, validateDraft, emptyDraft } from './subscriptions.ts'

test('datas da mensalidade mantêm o dia e respeitam mês curto', () => {
  assert.equal(addMonths('2026-01-31', 1), '2026-02-28')
  assert.equal(addMonths('2028-01-31', 1), '2028-02-29')
  assert.equal(chargeDate('2026-01-31', 3), '2026-03-31')
  assert.equal(addMonths('2026-11-15', 3), '2027-02-15')
  assert.equal(addMonths('2026-12-10', 1), '2027-01-10')
})

test('próximo vencimento, cobranças que faltam e fim do contrato', () => {
  const sub = { start_date: '2026-10-10', months: 3 }
  assert.equal(nextChargeDate(sub, '2026-09-01'), '2026-10-10')
  assert.equal(nextChargeDate(sub, '2026-10-10'), '2026-10-10')
  assert.equal(nextChargeDate(sub, '2026-10-11'), '2026-11-10')
  assert.equal(nextChargeDate(sub, '2026-12-10'), '2026-12-10')
  assert.equal(nextChargeDate(sub, '2026-12-11'), null)
  assert.equal(lastChargeDate(sub), '2026-12-10')
  assert.equal(chargesDue(sub, '2026-11-20'), 2)
  assert.equal(chargesLeft(sub, '2026-11-20'), 1)
  assert.equal(chargesLeft(sub, '2027-05-01'), 0)
  const open = { start_date: '2026-10-10', months: null }
  assert.equal(nextChargeDate(open, '2030-05-20'), '2030-06-10')
  assert.equal(chargesLeft(open, '2026-11-20'), null)
  assert.equal(lastChargeDate(open), null)
})

test('total do contrato, rótulos e receita recorrente por moeda', () => {
  assert.equal(contractTotal({ amount: 149.9, months: 12 }), 1798.8)
  assert.equal(contractTotal({ amount: 100, months: null }), null)
  assert.equal(durationLabel(null), 'Sem prazo')
  assert.equal(durationLabel(1), '1 mês')
  assert.equal(durationLabel(6), '6 meses')
  const subs = [
    { amount: 150, currency: 'BRL', status: 'active', start_date: '2026-01-10', months: null },
    { amount: 99.9, currency: 'BRL', status: 'active', start_date: '2026-01-10', months: 12 },
    { amount: 500, currency: 'BRL', status: 'paused', start_date: '2026-01-10', months: null },
    { amount: 60, currency: 'USD', status: 'active', start_date: '2026-01-10', months: null },
    { amount: 80, currency: 'BRL', status: 'active', start_date: '2024-01-10', months: 6 },
  ]
  assert.deepEqual(monthlyRecurring(subs, '2026-10-11'), { BRL: 249.9, USD: 60 })
})

test('formulário da mensalidade: só valida quando está ligada', () => {
  const draft = emptyDraft('2026-11-10')
  assert.deepEqual(validateDraft(draft), {})
  assert.ok(validateDraft({ ...draft, enabled: true }).amount)
  assert.deepEqual(validateDraft({ ...draft, enabled: true, amount: '150' }), {})
  assert.ok(validateDraft({ ...draft, enabled: true, amount: '150', months: '0' }).months)
  assert.ok(validateDraft({ ...draft, enabled: true, amount: '150', months: '2.5' }).months)
  assert.ok(validateDraft({ ...draft, enabled: true, amount: '150', startDate: '' }).startDate)
})
