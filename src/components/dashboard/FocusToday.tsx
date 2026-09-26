import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowUpRight, Briefcase, Check, CheckCircle2, ListTodo, UserRound, Wallet } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { PanelHeader } from '@/components/ui/PanelHeader'
import { InitialsAvatar } from '@/components/ui/InitialsAvatar'
import { getTodayFocus, type TodayFocus } from '@/services/supabase/focus'
import { completeTask } from '@/services/supabase/tasks'
import { formatRelativeDate } from '@/utils/date'

type FocusTab = 'tasks' | 'deals' | 'receivables' | 'contacts'

const TABS: { key: FocusTab; label: string; icon: typeof ListTodo; color: string; link: string; linkLabel: string }[] = [
  { key: 'tasks', label: 'Tarefas', icon: ListTodo, color: '#8b5cf6', link: '/tasks', linkLabel: 'Ver tarefas' },
  { key: 'deals', label: 'Negócios parados', icon: Briefcase, color: '#f59e0b', link: '/deals', linkLabel: 'Ver pipeline' },
  { key: 'receivables', label: 'A receber', icon: Wallet, color: '#22c55e', link: '/financial', linkLabel: 'Ver financeiro' },
  { key: 'contacts', label: 'Sem contato', icon: UserRound, color: '#3b82f6', link: '/crm', linkLabel: 'Ver CRM' },
]

const EMPTY_TEXT: Record<FocusTab, string> = {
  tasks: 'Nenhuma tarefa para hoje nem atrasada.',
  deals: 'Nenhum negócio parado há mais de 10 dias.',
  receivables: 'Nada vencendo nos próximos 7 dias.',
  contacts: 'Todo contato novo já recebeu uma primeira interação.',
}

const MAX_ROWS = 5

function formatBRL(value: number | null): string {
  return (value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

function formatDue(date: string): string {
  const value = new Date(date.length === 10 ? `${date}T12:00:00` : date)
  return value.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')
}

function formatTime(date: string): string {
  return new Date(date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function Row({ icon, title, meta, action, to }: { icon: ReactNode; title: string; meta: ReactNode; action?: ReactNode; to?: string }) {
  const body = (
    <>
      {icon}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-medium text-[var(--text-primary)]">{title}</p>
        <p className="mt-0.5 truncate text-[12.5px] text-[var(--text-muted)]">{meta}</p>
      </div>
    </>
  )
  return (
    <li className="flex items-center gap-3 border-b border-[var(--border-subtle)] py-3 last:border-0">
      {to ? (
        <Link to={to} className="flex min-w-0 flex-1 items-center gap-3 hover:[&_p:first-child]:text-[var(--accent-text)]">
          {body}
        </Link>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-3">{body}</div>
      )}
      {action}
    </li>
  )
}

// "O que precisa de você hoje": tarefas do dia, negócios parados, valores a
// receber e contatos novos sem nenhuma interação — cada um com atalho.
export function FocusToday({ refreshKey = 0 }: { refreshKey?: number }) {
  const [data, setData] = useState<TodayFocus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<FocusTab>('tasks')
  const [completing, setCompleting] = useState<Set<string>>(new Set())

  const load = useCallback(() => {
    getTodayFocus()
      .then((next) => {
        setData(next)
        setError(null)
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Erro ao carregar.'))
  }, [])

  useEffect(load, [load, refreshKey])

  const counts: Record<FocusTab, number> = {
    tasks: data?.tasks.length ?? 0,
    deals: data?.stalledDeals.length ?? 0,
    receivables: data?.receivables.length ?? 0,
    contacts: data?.newContacts.length ?? 0,
  }
  const totalPending = Object.values(counts).reduce((sum, count) => sum + count, 0)
  const active = TABS.find((item) => item.key === tab) ?? TABS[0]

  async function handleComplete(id: string, title: string) {
    setCompleting((current) => new Set(current).add(id))
    try {
      await completeTask(id)
      setData((current) => (current ? { ...current, tasks: current.tasks.filter((task) => task.id !== id) } : current))
      toast.success(`"${title}" concluída.`)
    } catch {
      toast.error('Não foi possível concluir a tarefa.')
    } finally {
      setCompleting((current) => {
        const next = new Set(current)
        next.delete(id)
        return next
      })
    }
  }

  function renderRows() {
    if (!data) return null
    if (tab === 'tasks') {
      return data.tasks.slice(0, MAX_ROWS).map((task) => (
        <Row
          key={task.id}
          icon={
            <span className={`size-2 shrink-0 rounded-full ${task.overdue ? 'bg-red-500' : 'bg-amber-400'}`} aria-hidden />
          }
          title={task.title}
          meta={
            <>
              <span className={task.overdue ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}>
                {task.overdue ? `Atrasada · ${formatDue(task.due_date)}` : `Hoje · ${formatTime(task.due_date)}`}
              </span>
              {task.contact && ` · ${task.contact.name}`}
            </>
          }
          action={
            <button
              type="button"
              onClick={() => void handleComplete(task.id, task.title)}
              disabled={completing.has(task.id)}
              aria-label={`Concluir ${task.title}`}
              title="Concluir"
              className="flex size-8 shrink-0 items-center justify-center rounded-full border border-[var(--border-default)] text-[var(--text-muted)] transition-colors hover:border-emerald-500/60 hover:bg-emerald-500/10 hover:text-emerald-500 disabled:opacity-50"
            >
              <Check className="size-4" strokeWidth={2.4} />
            </button>
          }
        />
      ))
    }
    if (tab === 'deals') {
      return data.stalledDeals.slice(0, MAX_ROWS).map((deal) => (
        <Row
          key={deal.id}
          to={`/deals/${deal.id}`}
          icon={<InitialsAvatar name={deal.contact_name ?? deal.title} size="sm" />}
          title={deal.title}
          meta={`${formatBRL(deal.value)} · parado há ${deal.days_stalled} dias${deal.contact_name ? ` · ${deal.contact_name}` : ''}`}
          action={<ArrowUpRight className="size-4 shrink-0 text-[var(--text-muted)]" />}
        />
      ))
    }
    if (tab === 'receivables') {
      return data.receivables.slice(0, MAX_ROWS).map((item) => (
        <Row
          key={item.id}
          to="/financial"
          icon={
            <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <Wallet className="size-4" />
            </span>
          }
          title={item.description}
          meta={
            <>
              <span className={item.overdue ? 'text-red-600 dark:text-red-400' : ''}>
                {item.overdue ? 'Vencido' : 'Vence'} em {formatDue(item.due_date)}
              </span>
              {item.deal && ` · ${item.deal.title}`}
            </>
          }
          action={<span className="shrink-0 font-display text-[14px] font-semibold tabular-nums text-[var(--text-primary)]">{formatBRL(item.amount)}</span>}
        />
      ))
    }
    return data.newContacts.slice(0, MAX_ROWS).map((contact) => (
      <Row
        key={contact.id}
        to={`/crm/${contact.id}`}
        icon={<InitialsAvatar name={contact.name} size="sm" />}
        title={contact.name}
        meta={`${contact.niche ? `${contact.niche} · ` : ''}criado ${formatRelativeDate(contact.created_at)}`}
        action={<ArrowUpRight className="size-4 shrink-0 text-[var(--text-muted)]" />}
      />
    ))
  }

  const rows = counts[tab]

  return (
    <Card>
      <PanelHeader
        title="Foco de hoje"
        subtitle={
          data
            ? totalPending > 0
              ? `${totalPending} ${totalPending === 1 ? 'coisa precisa' : 'coisas precisam'} de você`
              : 'Tudo em dia por aqui'
            : 'O que precisa de você agora'
        }
      />

      <div role="tablist" aria-label="Foco de hoje" className="scrollbar-none -mx-1 flex gap-1.5 overflow-x-auto px-1">
        {TABS.map((item) => {
          const selected = tab === item.key
          return (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setTab(item.key)}
              className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-full border px-3.5 text-[13px] font-medium transition-all duration-200 ${
                selected
                  ? 'border-[var(--nav-active-border)] text-[var(--text-primary)] shadow-[var(--nav-active-shadow)]'
                  : 'border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]'
              }`}
              style={selected ? { background: 'var(--nav-active-bg)' } : undefined}
            >
              <item.icon className="size-3.5" style={{ color: item.color }} />
              {item.label}
              <span
                className={`min-w-[20px] rounded-full px-1.5 text-center text-[11.5px] font-semibold tabular-nums ${
                  counts[item.key] > 0 ? 'bg-[var(--accent-tint)] text-[var(--accent-text)]' : 'bg-[var(--bg-muted)] text-[var(--text-muted)]'
                }`}
              >
                {data ? counts[item.key] : '–'}
              </span>
            </button>
          )
        })}
      </div>

      <div className="mt-2">
        {error ? (
          <div className="pt-4">
            <ErrorState message={error} onRetry={load} />
          </div>
        ) : !data ? (
          <div className="flex flex-col gap-4 py-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3">
                <Skeleton className="size-8 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-3.5 w-48" />
                  <Skeleton className="mt-2 h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
        ) : rows === 0 ? (
          <div className="flex items-center gap-3 py-6 text-[14px] text-[var(--text-muted)]">
            <CheckCircle2 className="size-5 text-emerald-500" />
            {EMPTY_TEXT[tab]}
          </div>
        ) : (
          <ul>{renderRows()}</ul>
        )}
      </div>

      {data && rows > 0 && (
        <div className="mt-2 flex justify-end border-t border-[var(--border-subtle)] pt-3">
          <Link to={active.link} className="inline-flex items-center gap-1 text-[13px] font-medium text-[var(--accent-text)] hover:underline">
            {rows > MAX_ROWS ? `${active.linkLabel} (${rows})` : active.linkLabel}
            <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      )}
    </Card>
  )
}
