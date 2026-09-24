import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
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

const columns: { key: SortColumn | null; label: string; align?: 'right' }[] = [
  { key: 'title', label: 'Título' },
  { key: null, label: 'Contato' },
  { key: null, label: 'Etapa' },
  { key: 'value', label: 'Valor', align: 'right' },
  { key: null, label: 'Serviço' },
  { key: 'probability', label: 'Probabilidade' },
  { key: 'expected_close_date', label: 'Fechamento previsto' },
  { key: null, label: 'Ações' },
]

function formatDate(value: string | null): string {
  if (!value) return '—'
  return new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR')
}

function SortIcon({ direction }: { direction: SortDirection }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className={`h-3 w-3 transition-transform ${direction === 'asc' ? 'rotate-180' : ''}`}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
    </svg>
  )
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, index) => (
        <tr key={index} className="border-b border-neutral-100">
          {columns.map((_column, columnIndex) => (
            <td key={columnIndex} className="px-4 py-3">
              <Skeleton className="h-4 w-full max-w-[120px]" />
            </td>
          ))}
        </tr>
      ))}
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
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-100">
              {columns.map((column) => (
                <th
                  key={column.label}
                  className={`px-4 py-3 font-medium text-neutral-500 ${column.align === 'right' ? 'text-right' : ''}`}
                >
                  {column.key ? (
                    <button
                      type="button"
                      onClick={() => handleSort(column.key as SortColumn)}
                      className={`flex items-center gap-1 transition-colors hover:text-neutral-900 ${column.align === 'right' ? 'ml-auto' : ''}`}
                    >
                      {column.label}
                      {sortColumn === column.key && <SortIcon direction={sortDirection} />}
                    </button>
                  ) : (
                    column.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows />
            ) : (
              sortedDeals.map((deal) => (
                <tr
                  key={deal.id}
                  className="group border-b border-neutral-100 transition-colors duration-150 last:border-0 hover:bg-purple-50/60"
                >
                  <td className="px-4 py-3">
                    <Link to={`/deals/${deal.id}`} className="font-medium text-neutral-900 hover:text-purple-700">
                      {deal.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{deal.contact?.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <StageBadge stage={deal.stage} />
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-neutral-800">{formatCurrency(deal.value)}</td>
                  <td className="px-4 py-3 text-neutral-600">{deal.service ?? '—'}</td>
                  <td className="px-4 py-3 text-neutral-600">{deal.probability}%</td>
                  <td className="px-4 py-3 text-neutral-500">{formatDate(deal.expected_close_date)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => onEdit(deal)}
                        className="text-xs font-medium text-neutral-500 hover:text-purple-700"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteRequest(deal)}
                        className="text-xs font-medium text-neutral-500 hover:text-red-600"
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 p-3 md:hidden">
        {loading
          ? Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-32 w-full" />)
          : sortedDeals.map((deal) => (
              <div key={deal.id} className="rounded-lg border border-neutral-200 p-4">
                <div className="flex items-center justify-between">
                  <Link to={`/deals/${deal.id}`} className="font-medium text-neutral-900">
                    {deal.title}
                  </Link>
                  <StageBadge stage={deal.stage} />
                </div>
                <p className="mt-1 text-xs text-neutral-500">{deal.contact?.name ?? 'Sem contato vinculado'}</p>
                <p className="mt-1 text-sm font-medium text-neutral-800">{formatCurrency(deal.value)}</p>
                <div className="mt-3 flex gap-3">
                  <button
                    type="button"
                    onClick={() => onEdit(deal)}
                    className="text-xs font-medium text-neutral-500 hover:text-purple-700"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteRequest(deal)}
                    className="text-xs font-medium text-neutral-500 hover:text-red-600"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
      </div>
    </div>
  )
}
