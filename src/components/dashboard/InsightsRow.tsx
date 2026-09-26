import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Crosshair, Pencil, Target, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { PanelHeader } from '@/components/ui/PanelHeader'
import { useAuthContext } from '@/stores/AuthContext'
import { getHunterResult, getMonthForecast, type HunterResult, type MonthForecast } from '@/services/supabase/insights'

interface InsightsRowProps {
  /** Vendido no mês (mesmo número do card de vidro no padrão Mês · Vendido). */
  soldThisMonth: number | null
  refreshKey: number
}

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

function daysLeftInMonth(now = new Date()): number {
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return end.getDate() - now.getDate() + 1
}

function GoalRing({ percent }: { percent: number }) {
  const circumference = 2 * Math.PI * 34
  const clamped = Math.min(percent, 100)
  const done = percent >= 100
  return (
    <div className="relative size-[88px] shrink-0">
      <svg viewBox="0 0 80 80" className="size-[88px] -rotate-90">
        <circle cx="40" cy="40" r="34" fill="none" stroke="var(--bg-muted)" strokeWidth="7" />
        <circle
          cx="40"
          cy="40"
          r="34"
          fill="none"
          stroke={done ? '#22c55e' : 'url(#goal-gradient)'}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped / 100)}
          className="transition-[stroke-dashoffset] duration-700"
        />
        <defs>
          <linearGradient id="goal-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#a78bfa" />
            <stop offset="1" stopColor="#6d28d9" />
          </linearGradient>
        </defs>
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-display text-[18px] font-bold tabular-nums text-[var(--text-primary)]">
        {Math.round(percent)}%
      </span>
    </div>
  )
}

function GoalCard({ sold }: { sold: number | null }) {
  const { profile, updateProfile } = useAuthContext()
  const goal = profile?.monthly_goal ? Number(profile.monthly_goal) : null
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)

  function startEditing() {
    setDraft(goal ? String(goal) : '')
    setEditing(true)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const value = Number(draft.replace(/\./g, '').replace(',', '.'))
    if (!Number.isFinite(value) || value <= 0) {
      toast.error('Digite um valor maior que zero.')
      return
    }
    setSaving(true)
    const { error } = await updateProfile({ monthly_goal: value })
    setSaving(false)
    if (error) {
      toast.error('Não foi possível salvar a meta.')
      return
    }
    setEditing(false)
  }

  const days = daysLeftInMonth()
  const remaining = goal !== null && sold !== null ? Math.max(goal - sold, 0) : 0
  const percent = goal && sold !== null ? (sold / goal) * 100 : 0

  return (
    <Card id="meta-do-mes" className="flex h-full scroll-mt-6 flex-col">
      <PanelHeader
        title="Meta do mês"
        subtitle="Quanto você quer vender este mês"
        action={
          goal !== null && !editing ? (
            <button
              type="button"
              onClick={startEditing}
              aria-label="Editar meta"
              className="flex size-8 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]"
            >
              <Pencil className="size-4" />
            </button>
          ) : undefined
        }
      />

      {editing || goal === null ? (
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col justify-center gap-3">
          {!editing && (
            <p className="flex items-center gap-2 text-[13.5px] text-[var(--text-muted)]">
              <Target className="size-4 text-[var(--accent-text)]" />
              Defina uma meta e acompanhe quanto falta por dia.
            </p>
          )}
          <label className="relative block">
            <span className="sr-only">Meta do mês em reais</span>
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[14px] text-[var(--text-muted)]">R$</span>
            <input
              inputMode="decimal"
              autoFocus={editing}
              value={draft}
              onChange={(event) => setDraft(event.target.value.replace(/[^\d.,]/g, ''))}
              placeholder="12.000"
              className="h-11 w-full rounded-xl border border-[var(--border-default)] bg-[var(--field-bg)] pl-11 pr-4 text-[15px] font-medium text-[var(--text-primary)] outline-none transition focus:border-[var(--accent-ring)] focus:ring-4 focus:ring-[var(--accent-tint)]"
            />
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving || !draft}
              className="h-9 flex-1 rounded-xl bg-[linear-gradient(135deg,#8b5cf6,#6d28d9)] text-[13.5px] font-medium text-white transition hover:brightness-110 disabled:opacity-50"
            >
              {goal === null ? 'Definir meta' : 'Salvar'}
            </button>
            {editing && (
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="h-9 rounded-xl px-4 text-[13.5px] text-[var(--text-muted)] hover:bg-[var(--bg-muted)]"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      ) : sold === null ? (
        <Skeleton className="h-[88px] w-full rounded-2xl" />
      ) : (
        <div className="flex flex-1 items-center gap-5">
          <GoalRing percent={percent} />
          <div className="min-w-0">
            <p className="font-display text-[20px] font-bold tabular-nums text-[var(--text-primary)]">{formatBRL(sold)}</p>
            <p className="text-[12.5px] text-[var(--text-muted)]">de {formatBRL(goal)}</p>
            <p className="mt-2 text-[13px] text-[var(--text-secondary)]">
              {remaining === 0 ? (
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  Meta batida{sold > goal ? ` · ${formatBRL(sold - goal)} acima` : ''}
                </span>
              ) : (
                <>
                  Faltam <span className="font-semibold text-[var(--text-primary)]">{formatBRL(remaining)}</span> em {days}{' '}
                  {days === 1 ? 'dia' : 'dias'} · {formatBRL(remaining / days)}/dia
                </>
              )}
            </p>
          </div>
        </div>
      )}
    </Card>
  )
}

function ForecastCard({ sold, forecast, goal }: { sold: number | null; forecast: MonthForecast | null; goal: number | null }) {
  const projection = sold !== null && forecast ? sold + forecast.weighted : null
  const max = Math.max(projection ?? 0, sold !== null && forecast ? sold + forecast.best : 0, goal ?? 0, 1)

  return (
    <Card className="flex h-full flex-col">
      <PanelHeader
        title="Previsão do mês"
        subtitle="Vendido + o provável do pipeline"
        action={
          <Link to="/deals" className="text-[var(--text-muted)] hover:text-[var(--accent-text)]" aria-label="Ver pipeline">
            <ArrowUpRight className="size-4" />
          </Link>
        }
      />
      {projection === null || !forecast || sold === null ? (
        <Skeleton className="h-24 w-full rounded-2xl" />
      ) : (
        <div className="flex flex-1 flex-col justify-center">
          <p className="flex items-baseline gap-2">
            <span className="font-display text-[26px] font-bold tabular-nums text-[var(--text-primary)]">{formatBRL(projection)}</span>
            {goal && <span className="text-[12.5px] text-[var(--text-muted)]">{Math.round((projection / goal) * 100)}% da meta</span>}
          </p>
          <div className="relative mt-3 flex h-2.5 overflow-hidden rounded-full bg-[var(--bg-muted)]">
            <span className="h-full bg-[linear-gradient(90deg,#8b5cf6,#6d28d9)]" style={{ width: `${(sold / max) * 100}%` }} />
            <span className="h-full bg-[#a78bfa]/45" style={{ width: `${(forecast.weighted / max) * 100}%` }} />
            {goal && <span className="absolute inset-y-0 w-0.5 bg-[var(--text-primary)]" style={{ left: `${(goal / max) * 100}%` }} title="Meta" />}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-[var(--text-muted)]">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-[#7c3aed]" /> Vendido {formatBRL(sold)}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-[#a78bfa]/60" /> Provável {formatBRL(forecast.weighted)}
            </span>
          </div>
          <p className="mt-2 text-[12.5px] text-[var(--text-muted)]">
            {forecast.count === 0
              ? 'Nenhum negócio aberto com fechamento previsto para este mês.'
              : `${forecast.count} ${forecast.count === 1 ? 'negócio previsto' : 'negócios previstos'} · se todos fecharem, ${formatBRL(sold + forecast.best)}`}
          </p>
        </div>
      )}
    </Card>
  )
}

function HunterCard({ result }: { result: HunterResult | null }) {
  const steps = result
    ? [
        { label: 'Importadas', value: result.imported },
        { label: 'Viraram negócio', value: result.withDeal },
        { label: 'Ganhas', value: result.won },
      ]
    : []
  const max = Math.max(result?.imported ?? 0, 1)

  return (
    <Card className="flex h-full flex-col">
      <PanelHeader
        title="Buyers Hunter"
        subtitle="Da busca até a venda"
        action={
          <Link to="/prospection" className="text-[var(--text-muted)] hover:text-[var(--accent-text)]" aria-label="Abrir Buyers Hunter">
            <ArrowUpRight className="size-4" />
          </Link>
        }
      />
      {!result ? (
        <Skeleton className="h-24 w-full rounded-2xl" />
      ) : result.imported === 0 ? (
        <div className="flex flex-1 flex-col justify-center gap-3">
          <p className="flex items-center gap-2 text-[13.5px] text-[var(--text-muted)]">
            <Crosshair className="size-4 text-[var(--accent-text)]" />
            Nenhuma empresa importada ainda.
          </p>
          <Link
            to="/prospection"
            className="inline-flex h-9 w-fit items-center rounded-xl border border-[var(--border-default)] px-4 text-[13.5px] font-medium text-[var(--text-secondary)] transition hover:border-[var(--accent-ring)] hover:text-[var(--accent-text)]"
          >
            Buscar empresas
          </Link>
        </div>
      ) : (
        <div className="flex flex-1 flex-col justify-center gap-2.5">
          {steps.map((step) => (
            <div key={step.label}>
              <div className="flex items-baseline justify-between text-[12.5px]">
                <span className="text-[var(--text-secondary)]">{step.label}</span>
                <span className="font-semibold tabular-nums text-[var(--text-primary)]">{step.value}</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--bg-muted)]">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#a78bfa,#6d28d9)]"
                  style={{ width: `${Math.max((step.value / max) * 100, step.value > 0 ? 4 : 0)}%` }}
                />
              </div>
            </div>
          ))}
          <p className="mt-1 flex items-center gap-1.5 text-[12.5px] text-[var(--text-muted)]">
            <TrendingUp className="size-3.5" />
            {formatBRL(result.wonValue)} vendidos
            {result.searchesThisMonth !== null && ` · ${result.searchesThisMonth} buscas no mês`}
          </p>
        </div>
      )}
    </Card>
  )
}

// Meta, previsão e Buyers Hunter lado a lado — abaixo do Foco de hoje, sem
// mexer no bloco roxo.
export function InsightsRow({ soldThisMonth, refreshKey }: InsightsRowProps) {
  const { profile } = useAuthContext()
  const [forecast, setForecast] = useState<MonthForecast | null>(null)
  const [hunter, setHunter] = useState<HunterResult | null>(null)

  useEffect(() => {
    getMonthForecast()
      .then(setForecast)
      .catch(() => setForecast({ count: 0, weighted: 0, best: 0 }))
    getHunterResult()
      .then(setHunter)
      .catch(() => setHunter({ imported: 0, importedThisMonth: 0, withDeal: 0, won: 0, wonValue: 0, searchesThisMonth: null }))
  }, [refreshKey])

  const goal = profile?.monthly_goal ? Number(profile.monthly_goal) : null

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
      <GoalCard sold={soldThisMonth} />
      <ForecastCard sold={soldThisMonth} forecast={forecast} goal={goal} />
      <HunterCard result={hunter} />
    </div>
  )
}
