const STYLES: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pendente', className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  paid: { label: 'Pago', className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  overdue: { label: 'Vencido', className: 'bg-red-500/10 text-red-600 dark:text-red-400' },
  cancelled: { label: 'Cancelado', className: 'bg-[var(--bg-muted)] text-[var(--text-muted)]' },
}

// Status de transações e contas a receber, igual nos dois lugares.
export function StatusPill({ status }: { status: 'pending' | 'paid' | 'overdue' | 'cancelled' }) {
  const style = STYLES[status]
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[12px] font-medium ${style.className}`}>
      <span className="size-1.5 rounded-full bg-current" />
      {style.label}
    </span>
  )
}
