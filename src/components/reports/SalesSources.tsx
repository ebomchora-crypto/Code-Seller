import { useEffect, useMemo, useState } from 'react'
import { Lightbulb } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { PanelHeader } from '@/components/ui/PanelHeader'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { getSalesSourcesData } from '@/services/supabase/report'
import {
  buildSourceStats,
  MIN_DECIDED_FOR_RATE,
  sourceInsights,
  type SourceContact,
  type SourceDeal,
  type SourceDimension,
} from '@/utils/salesSources'
import { formatMoney } from '@/utils/currency'

type SourcePeriod = '3m' | '6m' | '12m' | 'all'

const PERIODS: { value: SourcePeriod; label: string }[] = [
  { value: '3m', label: '3 meses' },
  { value: '6m', label: '6 meses' },
  { value: '12m', label: '12 meses' },
  { value: 'all', label: 'O tempo todo' },
]

const DIMENSIONS: { value: SourceDimension; label: string }[] = [
  { value: 'origin', label: 'Por origem' },
  { value: 'niche', label: 'Por nicho' },
]

function periodStart(period: SourcePeriod, now: Date): Date | null {
  if (period === 'all') return null
  const months = period === '3m' ? 3 : period === '6m' ? 6 : 12
  return new Date(now.getFullYear(), now.getMonth() - months + 1, 1)
}

function brl(value: number): string {
  return formatMoney(value, undefined, { decimals: false })
}

function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-1 rounded-full border border-[var(--border-default)] bg-[var(--bg-card)] p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={`h-9 whitespace-nowrap rounded-full px-3.5 text-[13px] font-medium transition-colors ${
            value === option.value
              ? 'bg-[var(--accent-tint)] text-[var(--accent-text)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

function RateCell({ won, lost, rate }: { won: number; lost: number; rate: number | null }) {
  if (rate === null) return <span className="text-[var(--text-muted)]">—</span>
  const few = won + lost < MIN_DECIDED_FOR_RATE
  return (
    <span className={few ? 'text-[var(--text-muted)]' : 'font-semibold text-[var(--text-primary)]'} title={`${won} de ${won + lost} negócios decididos`}>
      {Math.round(rate * 100)}%
      {few && <span className="ml-1 text-[11px] font-normal">(poucos)</span>}
    </span>
  )
}

// Onde vale colocar esforço: faturamento, vendas, taxa de fechamento e
// leads por origem ou por nicho.
export function SalesSources() {
  const [dimension, setDimension] = useState<SourceDimension>('origin')
  const [period, setPeriod] = useState<SourcePeriod>('12m')
  const [data, setData] = useState<{ deals: SourceDeal[]; contacts: SourceContact[] } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    getSalesSourcesData()
      .then((next) => {
        if (cancelled) return
        setData(next)
        setError(null)
      })
      .catch((reason: unknown) => !cancelled && setError(reason instanceof Error ? reason.message : 'Erro ao carregar.'))
    return () => {
      cancelled = true
    }
  }, [attempt])

  const { rows, insights } = useMemo(() => {
    if (!data) return { rows: [], insights: [] }
    const now = new Date()
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    const nextRows = buildSourceStats(data.deals, data.contacts, dimension, periodStart(period, now), end)
    return { rows: nextRows, insights: sourceInsights(nextRows, dimension) }
  }, [data, dimension, period])

  const maxRevenue = Math.max(...rows.map((row) => row.revenue), 1)
  const nameHeader = dimension === 'origin' ? 'Origem' : 'Nicho'

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2.5">
        <Segmented label="Agrupar" options={DIMENSIONS} value={dimension} onChange={setDimension} />
        <Segmented label="Período" options={PERIODS} value={period} onChange={setPeriod} />
      </div>

      {error ? (
        <ErrorState
          message={error}
          onRetry={() => {
            setError(null)
            setAttempt((value) => value + 1)
          }}
        />
      ) : !data ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-32 w-full rounded-[22px]" />
          <Skeleton className="h-72 w-full rounded-[22px]" />
        </div>
      ) : rows.length === 0 ? (
        <Card>
          <p className="py-6 text-center text-[13.5px] text-[var(--text-muted)]">
            Ainda não há vendas nem leads neste período. Conforme você cadastra contatos (com origem e nicho) e fecha negócios, o
            ranking aparece aqui.
          </p>
        </Card>
      ) : (
        <>
          {insights.length > 0 && (
            <Card>
              <PanelHeader title="Onde colocar esforço" subtitle="O que os seus números mostram neste período" />
              <ul className="flex flex-col gap-2.5">
                {insights.map((insight) => (
                  <li key={insight} className="flex items-start gap-3 text-[14px] leading-relaxed text-[var(--text-primary)]">
                    <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent-tint)] text-[var(--accent-text)]">
                      <Lightbulb className="size-3.5" />
                    </span>
                    {insight}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card>
            <PanelHeader
              title={dimension === 'origin' ? 'Ranking das origens' : 'Ranking dos nichos'}
              subtitle="Ordenado pelo que mais fatura"
            />

            {/* Telas grandes: tabela */}
            <div className="hidden md:block">
              <table className="w-full text-left text-[13.5px]">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)] text-[11.5px] uppercase tracking-[0.08em] text-[var(--text-muted)]">
                    <th className="py-2.5 pr-3 font-semibold">{nameHeader}</th>
                    <th className="w-[34%] py-2.5 pr-3 font-semibold">Faturamento</th>
                    <th className="py-2.5 pr-3 text-right font-semibold">Vendas</th>
                    <th className="py-2.5 pr-3 text-right font-semibold">Fecha</th>
                    <th className="py-2.5 pr-3 text-right font-semibold">Leads</th>
                    <th className="py-2.5 text-right font-semibold">Ticket médio</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.key} className="border-b border-[var(--border-subtle)] last:border-0">
                      <td className="py-3 pr-3 font-medium text-[var(--text-primary)]">{row.label}</td>
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-3">
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--bg-muted)]">
                            <div
                              className="h-full rounded-full bg-[linear-gradient(90deg,#a78bfa,#6d28d9)]"
                              style={{ width: `${row.revenue > 0 ? Math.max((row.revenue / maxRevenue) * 100, 3) : 0}%` }}
                            />
                          </div>
                          <span className="w-24 shrink-0 text-right font-semibold tabular-nums text-[var(--text-primary)]">{brl(row.revenue)}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-3 text-right tabular-nums text-[var(--text-secondary)]">{row.won}</td>
                      <td className="py-3 pr-3 text-right tabular-nums">
                        <RateCell won={row.won} lost={row.lost} rate={row.closeRate} />
                      </td>
                      <td className="py-3 pr-3 text-right tabular-nums text-[var(--text-secondary)]">{row.leads}</td>
                      <td className="py-3 text-right tabular-nums text-[var(--text-secondary)]">{row.ticket === null ? '—' : brl(row.ticket)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Celular: um cartão por linha */}
            <ul className="flex flex-col gap-3 md:hidden">
              {rows.map((row) => (
                <li key={row.key} className="rounded-2xl border border-[var(--border-subtle)] p-3.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="truncate font-medium text-[var(--text-primary)]">{row.label}</span>
                    <span className="shrink-0 font-semibold tabular-nums text-[var(--text-primary)]">{brl(row.revenue)}</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--bg-muted)]">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,#a78bfa,#6d28d9)]"
                      style={{ width: `${row.revenue > 0 ? Math.max((row.revenue / maxRevenue) * 100, 3) : 0}%` }}
                    />
                  </div>
                  <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[12.5px] text-[var(--text-muted)]">
                    <span>{row.won} {row.won === 1 ? 'venda' : 'vendas'}</span>
                    <span>
                      Fecha <RateCell won={row.won} lost={row.lost} rate={row.closeRate} />
                    </span>
                    <span>{row.leads} leads</span>
                  </p>
                </li>
              ))}
            </ul>

            <p className="mt-4 text-[12px] leading-relaxed text-[var(--text-muted)]">
              <strong className="font-medium text-[var(--text-secondary)]">Fecha</strong> = vendas ÷ negócios decididos (ganhos +
              perdidos) no período. <strong className="font-medium text-[var(--text-secondary)]">Leads</strong> = contatos novos no
              período. A origem e o nicho vêm do contato do negócio.
            </p>
          </Card>
        </>
      )}
    </div>
  )
}
