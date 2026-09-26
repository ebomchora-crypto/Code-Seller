import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence } from 'motion/react'
import { ChevronDown, Pencil, Trash2 } from 'lucide-react'
import { InitialsAvatar } from '@/components/ui/InitialsAvatar'
import { FlipItem } from '@/components/motion/FlipItem'
import { StageBadge } from '@/components/deals/StageBadge'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatCurrency } from '@/utils/deals'
import type { Deal } from '@/types'

interface DealListProps {
  deals: Deal[]
  loading: boolean
  onEdit: (deal: Deal) => void
  onDeleteRequest: (deal: Deal) => void
}

type SortColumn = 'title' | 'value' | 'expected_close_date' | 'probability'
type SortDirection = 'asc' | 'desc'

const columns: { key: SortColumn | null; label: string; align?: 'right'; className?: string }[] = [
  { key: 'title', label: 'Negócio' },
  { key: null, label: 'Etapa' },
  { key: 'value', label: 'Valor', align: 'right' },
  { key: 'probability', label: 'Chance' },
  { key: 'expected_close_date', label: 'Previsão' },
  { key: null, label: '', className: 'w-24' },
]

function formatDate(value: string | null): string {
  if (!value) return '—'
  return new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '')
}

const iconButton =
  'flex size-8 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-muted)]'

function RowActions({ deal, onEdit, onDeleteRequest }: Pick<DealListProps, 'onEdit' | 'onDeleteRequest'> & { deal: Deal }) {
  return (
    <>
      <button type="button" onClick={() => onEdit(deal)} aria-label={`Editar ${deal.title}`} title="Editar" className={`${iconButton} hover:text-[var(--accent-text)]`}>
        <Pencil className="size-4" />
      </button>
      <button type="button" onClick={() => onDeleteRequest(deal)} aria-label={`Excluir ${deal.title}`} title="Excluir" className={`${iconButton} hover:text-red-500`}>
        <Trash2 className="size-4" />
      </button>
    </>
  )
}

export function DealList({ deals, loading, onEdit, onDeleteRequest }: DealListProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn>('title')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  const sortedDeals = useMemo(() => {
    const copy = [...deals]
    copy.sort((a, b) => {
      let result = 0
      if (sortColumn === 'title') result = a.title.localeCompare(b.title)
      else if (sortColumn === 'value') result = (a.value ?? 0) - (b.value ?? 0)
      else if (sortColumn === 'probability') result = a.probability - b.probability
      else if (sortColumn === 'expected_close_date') {
        result = (a.expected_close_date ?? '').localeCompare(b.expected_close_date ?? '')
      }
      return sortDirection === 'asc' ? result : -result
    })
    return copy
  }, [deals, sortColumn, sortDirection])

  function handleSort(column: SortColumn) {
    setSortDirection((current) => (sortColumn === column && current === 'asc' ? 'desc' : 'asc'))
    setSortColumn(column)
  }

  if (!loading && deals.length === 0) {
    return (
      <EmptyState
        title="Nenhum negócio encontrado"
        description="Crie um novo negócio ou ajuste os filtros para ver resultados aqui."
      />
    )
  }

  return (
    <div className="overflow-hidden rounded-[var(--card-radius)] border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-[var(--shadow-card)]">
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-[13.5px]">
          <thead>
            <tr className="border-b border-[var(--border-subtle)] bg-black/[0.02] dark:bg-white/[0.02]">
              {columns.map((column) => (
                <th
                  key={column.label || 'actions'}
                  className={`whitespace-nowrap px-4 py-3 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)] first:pl-5 ${
                    column.align === 'right' ? 'text-right' : ''
                  } ${column.className ?? ''}`}
                >
                  {column.key ? (
                    <button
                      type="button"
                      onClick={() => handleSort(column.key as SortColumn)}
                      className={`inline-flex items-center gap-1 uppercase transition-colors hover:text-[var(--text-primary)] ${
                        sortColumn === column.key ? 'text-[var(--text-secondary)]' : ''
                      }`}
                    >
                      {column.label}
                      {sortColumn === column.key && (
                        <ChevronDown className={`size-3.5 transition-transform ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />
                      )}
                    </button>
                  ) : (
                    column.label || <span className="sr-only">Ações</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <tr key={index} className="border-b border-[var(--border-subtle)] last:border-0">
                  {columns.map((_column, columnIndex) => (
                    <td key={columnIndex} className="px-4 py-4 first:pl-5">
                      <Skeleton className="h-4 w-full max-w-[140px]" />
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <AnimatePresence initial={false}>
                {sortedDeals.map((deal) => (
                  <FlipItem
                    as="tr"
                    key={deal.id}
                    className="group border-b border-[var(--border-subtle)] transition-colors duration-150 last:border-0 hover:bg-black/[0.025] dark:hover:bg-white/[0.03]"
                  >
                    <td className="py-3 pl-5 pr-4">
                      <Link to={`/deals/${deal.id}`} className="flex min-w-0 items-center gap-3">
                        <InitialsAvatar name={deal.contact?.name ?? deal.title} size="sm" />
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent-text)]">
                            {deal.title}
                          </span>
                          <span className="block max-w-[260px] truncate text-[12px] text-[var(--text-muted)]">
                            {[deal.contact?.name, deal.service].filter(Boolean).join(' · ') || 'Sem contato'}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <StageBadge stage={deal.stage} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-display font-semibold tabular-nums text-[var(--text-primary)]">
                      {formatCurrency(deal.value)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[var(--bg-muted)]">
                          <div className="h-full rounded-full bg-[var(--accent-solid)]" style={{ width: `${deal.probability}%` }} />
                        </div>
                        <span className="tabular-nums text-[var(--text-secondary)]">{deal.probability}%</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[var(--text-muted)]">{formatDate(deal.expected_close_date)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1 opacity-0 transition-opacity duration-150 focus-within:opacity-100 group-hover:opacity-100">
                        <RowActions deal={deal} onEdit={onEdit} onDeleteRequest={onDeleteRequest} />
                      </div>
                    </td>
                  </FlipItem>
                ))}
              </AnimatePresence>
            )}
          </tbody>
        </table>
      </div>

      <ul className="flex flex-col divide-y divide-[var(--border-subtle)] md:hidden">
        {loading
          ? Array.from({ length: 4 }).map((_, index) => (
              <li key={index} className="flex items-center gap-3 p-4">
                <Skeleton className="size-10 rounded-xl" />
                <Skeleton className="h-4 flex-1" />
              </li>
            ))
          : sortedDeals.map((deal) => (
              <li key={deal.id} className="flex items-start gap-3 p-4">
                <InitialsAvatar name={deal.contact?.name ?? deal.title} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <Link to={`/deals/${deal.id}`} className="min-w-0 truncate font-medium text-[var(--text-primary)]">
                      {deal.title}
                    </Link>
                    <span className="shrink-0 font-display font-semibold tabular-nums text-[var(--text-primary)]">
                      {formatCurrency(deal.value)}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-[12.5px] text-[var(--text-muted)]">{deal.contact?.name ?? 'Sem contato vinculado'}</p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <StageBadge stage={deal.stage} />
                    <div className="-mr-2 flex gap-1">
                      <RowActions deal={deal} onEdit={onEdit} onDeleteRequest={onDeleteRequest} />
                    </div>
                  </div>
                </div>
              </li>
            ))}
      </ul>
    </div>
  )
}
