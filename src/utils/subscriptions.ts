import type { ClientSubscription, SubscriptionDraft, SubscriptionStatus } from '../types/subscriptions.ts'

// Regras da mensalidade (datas, prazo, próximos vencimentos). Testado em src/utils/subscriptions.test.mjs.

export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  active: 'Ativa',
  paused: 'Pausada',
  canceled: 'Cancelada',
}

export const DURATION_PRESETS = [3, 6, 12, 24, 36]

const pad = (value: number) => String(value).padStart(2, '0')

/** Soma meses a um dia (YYYY-MM-DD) mantendo o dia do vencimento; mês curto usa o último dia (31/01 → 28/02). */
export function addMonths(day: string, months: number): string {
  const [year, month, date] = day.split('-').map(Number)
  const index = year * 12 + (month - 1) + months
  const nextYear = Math.floor(index / 12)
  const nextMonth = (index % 12) + 1
  const last = new Date(Date.UTC(nextYear, nextMonth, 0)).getUTCDate()
  return `${nextYear}-${pad(nextMonth)}-${pad(Math.min(date, last))}`
}

/** Vencimento da cobrança número `n` (1 = primeira). */
export function chargeDate(startDate: string, n: number): string {
  return addMonths(startDate, n - 1)
}

/** Último vencimento (null se não tem prazo). */
export function lastChargeDate(sub: Pick<ClientSubscription, 'start_date' | 'months'>): string | null {
  return sub.months ? chargeDate(sub.start_date, sub.months) : null
}

/** Próximo vencimento a partir de `today` (inclusive); null quando já acabou. */
export function nextChargeDate(sub: Pick<ClientSubscription, 'start_date' | 'months'>, today: string): string | null {
  if (today <= sub.start_date) return sub.start_date
  const [sy, sm] = sub.start_date.split('-').map(Number)
  const [ty, tm] = today.split('-').map(Number)
  let n = Math.max(1, (ty * 12 + tm) - (sy * 12 + sm) + 1)
  while (n > 1 && chargeDate(sub.start_date, n - 1) >= today) n--
  while (chargeDate(sub.start_date, n) < today) n++
  if (sub.months && n > sub.months) return null
  return chargeDate(sub.start_date, n)
}

/** Cobranças que já venceram até `today` (inclusive). */
export function chargesDue(sub: Pick<ClientSubscription, 'start_date' | 'months'>, today: string): number {
  if (today < sub.start_date) return 0
  let n = 0
  const cap = sub.months ?? 1200
  while (n < cap && chargeDate(sub.start_date, n + 1) <= today) n++
  return n
}

/** Cobranças que ainda faltam (null se não tem prazo). */
export function chargesLeft(sub: Pick<ClientSubscription, 'start_date' | 'months'>, today: string): number | null {
  return sub.months ? Math.max(0, sub.months - chargesDue(sub, today)) : null
}

/** Valor total do contrato (null se não tem prazo). */
export function contractTotal(sub: Pick<ClientSubscription, 'amount' | 'months'>): number | null {
  return sub.months ? Math.round(sub.amount * sub.months * 100) / 100 : null
}

export function durationLabel(months: number | null): string {
  if (!months) return 'Sem prazo'
  if (months === 12) return '12 meses (1 ano)'
  if (months === 24) return '24 meses (2 anos)'
  if (months === 36) return '36 meses (3 anos)'
  return `${months} ${months === 1 ? 'mês' : 'meses'}`
}

/** Receita mensal recorrente das mensalidades ativas, por moeda. */
export function monthlyRecurring(subs: Pick<ClientSubscription, 'amount' | 'currency' | 'status' | 'start_date' | 'months'>[], today: string): Record<string, number> {
  const total: Record<string, number> = {}
  for (const sub of subs) {
    if (sub.status !== 'active') continue
    if (sub.months && (lastChargeDate(sub) ?? '9999') < today) continue
    total[sub.currency] = Math.round(((total[sub.currency] ?? 0) + sub.amount) * 100) / 100
  }
  return total
}

// ---------------------------------------------------------------------------
// Formulário
// ---------------------------------------------------------------------------

export function emptyDraft(suggestedStart: string): SubscriptionDraft {
  return { enabled: false, title: 'Mensalidade', amount: '', startDate: suggestedStart, months: '', paymentMethod: '', notes: '' }
}

export function draftFromSubscription(sub: ClientSubscription): SubscriptionDraft {
  return {
    enabled: sub.status !== 'canceled',
    title: sub.title,
    amount: String(sub.amount),
    startDate: sub.start_date,
    months: sub.months ? String(sub.months) : '',
    paymentMethod: sub.payment_method ?? '',
    notes: sub.notes ?? '',
  }
}

export function validateDraft(draft: SubscriptionDraft): Partial<Record<'amount' | 'startDate' | 'months', string>> {
  const errors: Partial<Record<'amount' | 'startDate' | 'months', string>> = {}
  if (!draft.enabled) return errors
  const amount = Number(draft.amount)
  if (!draft.amount || Number.isNaN(amount) || amount <= 0) errors.amount = 'Informe o valor da mensalidade.'
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.startDate)) errors.startDate = 'Escolha a data da primeira cobrança.'
  if (draft.months) {
    const months = Number(draft.months)
    if (!Number.isInteger(months) || months < 1 || months > 120) errors.months = 'Use de 1 a 120 meses (ou deixe sem prazo).'
  }
  return errors
}

/** Data sugerida para a 1ª cobrança: um mês depois do dia base. */
export function suggestedStart(baseDay: string): string {
  return addMonths(baseDay, 1)
}
