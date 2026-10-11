import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Switch } from '@/components/ui/Switch'
import { CurrencyField } from '@/components/ui/CurrencyField'
import { PAYMENT_METHOD_LABELS } from '@/utils/financial'
import { formatMoney, type CurrencyCode } from '@/utils/currency'
import { DURATION_PRESETS, chargeDate, contractTotal, durationLabel, lastChargeDate, validateDraft } from '@/utils/subscriptions'
import type { PaymentMethod, SubscriptionDraft } from '@/types'

interface SubscriptionFieldsProps {
  draft: SubscriptionDraft
  onChange: (draft: SubscriptionDraft) => void
  currency: CurrencyCode
  /** Quando informado, mostra a escolha da moeda aqui (no negócio a moeda vem do valor do negócio). */
  onCurrencyChange?: (currency: CurrencyCode) => void
  errors?: ReturnType<typeof validateDraft>
}

const formatDay = (day: string) => day.split('-').reverse().join('/')

// Mensalidade do cliente: usada no cadastro do negócio e no cadastro do contato.
export function SubscriptionFields({ draft, onChange, currency, onCurrencyChange, errors = {} }: SubscriptionFieldsProps) {
  const set = <K extends keyof SubscriptionDraft>(key: K, value: SubscriptionDraft[K]) => onChange({ ...draft, [key]: value })
  const months = draft.months ? Number(draft.months) : null
  const preset = draft.months === '' ? 'open' : DURATION_PRESETS.includes(Number(draft.months)) ? draft.months : 'custom'
  const amount = Number(draft.amount)
  const valid = draft.enabled && amount > 0 && /^\d{4}-\d{2}-\d{2}$/.test(draft.startDate) && (months === null || (Number.isInteger(months) && months > 0))
  const last = valid && months ? lastChargeDate({ start_date: draft.startDate, months }) : null
  const total = valid && months ? contractTotal({ amount, months }) : null

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[var(--border-default)] p-3.5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[13.5px] font-medium text-[var(--text-primary)]">Inclui mensalidade</p>
          <p className="text-[12px] leading-snug text-[var(--text-muted)]">Manutenção, hospedagem, tráfego pago… cobrada todo mês.</p>
        </div>
        <Switch checked={draft.enabled} onChange={(value) => set('enabled', value)} ariaLabel="Inclui mensalidade" />
      </div>

      {draft.enabled && (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex gap-2 sm:col-span-2">
              {onCurrencyChange && <CurrencyField value={currency} onChange={onCurrencyChange} />}
              <div className="min-w-0 flex-1">
                <Input
                  label="Valor da mensalidade"
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  value={draft.amount}
                  onChange={(event) => set('amount', event.target.value)}
                  error={errors.amount}
                />
              </div>
            </div>
            <Input
              label="Primeira cobrança em"
              type="date"
              value={draft.startDate}
              onChange={(event) => set('startDate', event.target.value)}
              error={errors.startDate}
              helperText="As outras vencem no mesmo dia dos meses seguintes."
            />
            <div className="flex flex-col gap-2">
              <Select
                label="Por quanto tempo"
                value={preset}
                onChange={(event) => {
                  const value = event.target.value
                  set('months', value === 'open' ? '' : value === 'custom' ? '18' : value)
                }}
              >
                <option value="open">Sem prazo (até cancelar)</option>
                {DURATION_PRESETS.map((value) => (
                  <option key={value} value={String(value)}>
                    {durationLabel(value)}
                  </option>
                ))}
                <option value="custom">Outro prazo…</option>
              </Select>
              {preset === 'custom' && (
                <Input
                  aria-label="Quantidade de meses"
                  type="number"
                  min="1"
                  max="120"
                  inputMode="numeric"
                  placeholder="Meses"
                  value={draft.months}
                  onChange={(event) => set('months', event.target.value)}
                  error={errors.months}
                />
              )}
            </div>
            <Select label="Como cobra" value={draft.paymentMethod} onChange={(event) => set('paymentMethod', event.target.value as PaymentMethod | '')}>
              <option value="">A definir</option>
              {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
            <Input label="Nome da cobrança" value={draft.title} onChange={(event) => set('title', event.target.value)} placeholder="Mensalidade" />
          </div>
          <Input label="Observações da mensalidade" value={draft.notes} onChange={(event) => set('notes', event.target.value)} placeholder="Ex.: inclui hospedagem e 2 alterações por mês" />

          {valid && (
            <p className="rounded-xl bg-[var(--accent-tint)] px-3 py-2 text-[12.5px] leading-relaxed text-[var(--accent-text)]">
              {formatMoney(amount, currency)} por mês, a partir de {formatDay(draft.startDate)}
              {months && last ? ` até ${formatDay(last)} (${months} cobranças${total ? `, total ${formatMoney(total, currency)}` : ''})` : ', sem data para acabar'}
              . Cada mês vira uma conta a receber no Financeiro (próxima: {formatDay(chargeDate(draft.startDate, 1))}).
            </p>
          )}
        </>
      )}
    </div>
  )
}
