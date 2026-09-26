import { useEffect, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight, FileDown, Hourglass } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader, PageWrapper } from '@/components/ui/PageWrapper'
import { Card } from '@/components/ui/Card'
import { PanelHeader } from '@/components/ui/PanelHeader'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { useAuthContext } from '@/stores/AuthContext'
import { getMonthlyReport, type MonthlyReportData } from '@/services/supabase/report'
import { getStageConfig } from '@/utils/deals'
import { computeChange } from '@/utils/revenuePeriod'
import { openPrintWindow } from '@/utils/printDocument'
import { buildReportHtml } from '@/utils/reportPrint'
import type { DealStage } from '@/types'
import type { ReportBucket } from '@/utils/report'

function brl(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

function monthLabel(year: number, month: number): string {
  const label = new Date(year, month, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function Kpi({ label, value, hint, tone }: { label: string; value: string; hint?: ReactNode; tone?: 'up' | 'down' }) {
  return (
    <Card className="!p-5">
      <p className="text-[12.5px] font-medium text-[var(--text-muted)]">{label}</p>
      <p
        className={`mt-2 font-display text-[24px] font-bold tabular-nums tracking-tight ${
          tone === 'down' ? 'text-red-600 dark:text-red-400' : 'text-[var(--text-primary)]'
        }`}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-[12px] text-[var(--text-muted)]">{hint}</p>}
    </Card>
  )
}

function BucketList({ buckets, empty }: { buckets: ReportBucket[]; empty: string }) {
  if (buckets.length === 0) return <p className="py-6 text-[13.5px] text-[var(--text-muted)]">{empty}</p>
  const max = Math.max(...buckets.map((bucket) => bucket.value), 1)
  return (
    <ul className="flex flex-col gap-4">
      {buckets.map((bucket) => (
        <li key={bucket.label}>
          <div className="flex items-baseline justify-between gap-3 text-[13px]">
            <span className="truncate font-medium text-[var(--text-primary)]">{bucket.label}</span>
            <span className="shrink-0 tabular-nums text-[var(--text-muted)]">
              {bucket.count} {bucket.count === 1 ? 'venda' : 'vendas'} · <span className="font-semibold text-[var(--text-primary)]">{brl(bucket.value)}</span>
            </span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[var(--bg-muted)]">
            <div className="h-full rounded-full bg-[linear-gradient(90deg,#a78bfa,#6d28d9)]" style={{ width: `${Math.max((bucket.value / max) * 100, 3)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-[var(--border-subtle)] py-2.5 text-[13.5px] last:border-0">
      <span className="text-[var(--text-secondary)]">{label}</span>
      <span className="font-semibold tabular-nums text-[var(--text-primary)]">{value}</span>
    </div>
  )
}

// Relatório do mês: o que vendeu, de onde vieram os clientes, quanto sobrou e
// onde os negócios travam. "Baixar PDF" abre uma versão própria para papel.
export default function ReportsPage() {
  const { user, profile } = useAuthContext()
  const now = new Date()
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() })
  const [report, setReport] = useState<MonthlyReportData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getMonthlyReport(cursor.year, cursor.month)
      .then((data) => {
        if (cancelled) return
        setReport(data)
        setError(null)
      })
      .catch((reason: unknown) => !cancelled && setError(reason instanceof Error ? reason.message : 'Erro ao gerar o relatório.'))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [cursor])

  const isCurrentMonth = cursor.year === now.getFullYear() && cursor.month === now.getMonth()
  const label = monthLabel(cursor.year, cursor.month)

  function shift(delta: number) {
    setCursor((current) => {
      const date = new Date(current.year, current.month + delta, 1)
      return { year: date.getFullYear(), month: date.getMonth() }
    })
  }

  function downloadPdf() {
    if (!report) return
    const owner = [profile?.full_name || user?.name, profile?.company_name].filter(Boolean).join(' · ')
    if (!openPrintWindow(`Relatório ${label}`, buildReportHtml(report, label, owner))) {
      toast.error('O navegador bloqueou a janela. Libere pop-ups para baixar o PDF.')
    }
  }

  const change = report ? computeChange(report.sold, report.soldPrevious, 'vs. mês anterior') : null

  return (
    <PageWrapper>
      <PageHeader
        title="Relatórios"
        subtitle="O mês em números: o que vendeu, de onde vieram os clientes e onde os negócios travam."
        actions={
          <>
            <div className="flex h-11 items-center gap-1 rounded-full border border-[var(--border-default)] bg-[var(--bg-card)] p-1">
              <button
                type="button"
                onClick={() => shift(-1)}
                aria-label="Mês anterior"
                className="flex size-9 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]"
              >
                <ChevronLeft className="size-4" />
              </button>
              <span className="min-w-[150px] text-center text-[13.5px] font-medium text-[var(--text-primary)]">{label}</span>
              <button
                type="button"
                onClick={() => shift(1)}
                disabled={isCurrentMonth}
                aria-label="Próximo mês"
                className="flex size-9 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)] disabled:opacity-30"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
            <Button className="h-11 rounded-full px-5" onClick={downloadPdf} disabled={!report || loading}>
              <FileDown className="size-4" />
              Baixar PDF
            </Button>
          </>
        }
      />

      {error ? (
        <div className="mt-8">
          <ErrorState message={error} onRetry={() => setCursor({ ...cursor })} />
        </div>
      ) : loading || !report ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-28 w-full rounded-[22px]" />
          ))}
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
            <Kpi
              label="Vendido"
              value={brl(report.sold)}
              hint={
                change && change.direction !== 'neutral' ? (
                  <span className={change.direction === 'up' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
                    {change.direction === 'up' ? '↑' : '↓'} {change.value}% {change.label}
                  </span>
                ) : (
                  'negócios ganhos no mês'
                )
              }
            />
            <Kpi label="Vendas" value={String(report.salesCount)} hint="negócios ganhos" />
            <Kpi label="Ticket médio" value={report.salesCount > 0 ? brl(report.ticket) : '—'} hint="por venda" />
            <Kpi label="Recebido" value={brl(report.received)} hint="entradas pagas" />
            <Kpi label="Despesas" value={brl(report.expenses)} hint="despesas pagas" />
            <Kpi label="Lucro" value={brl(report.profit)} hint="recebido − despesas" tone={report.profit < 0 ? 'down' : undefined} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <PanelHeader title="O que mais vende" subtitle="Vendas do mês por serviço" />
              <BucketList buckets={report.byService} empty="Nenhuma venda neste mês." />
            </Card>
            <Card>
              <PanelHeader title="De onde vêm os clientes que fecham" subtitle="Origem dos contatos das vendas do mês" />
              <BucketList buckets={report.byOrigin} empty="Nenhuma venda neste mês." />
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card>
              <PanelHeader title="Tempo até fechar" subtitle="Da criação do negócio ao ganho" />
              {report.avgDaysToClose === null ? (
                <p className="py-4 text-[13.5px] text-[var(--text-muted)]">Sem vendas neste mês.</p>
              ) : (
                <div className="flex items-center gap-4">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-[var(--accent-tint)] text-[var(--accent-text)]">
                    <Hourglass className="size-5" />
                  </span>
                  <div>
                    <p className="font-display text-[26px] font-bold tabular-nums text-[var(--text-primary)]">
                      {Math.round(report.avgDaysToClose)} dias
                    </p>
                    <p className="text-[12.5px] text-[var(--text-muted)]">
                      em média · metade fecha em até {Math.round(report.medianDaysToClose ?? 0)} dias
                    </p>
                  </div>
                </div>
              )}
            </Card>
            <Card>
              <PanelHeader title="Funil do mês" subtitle="Negócios criados, ganhos e perdidos" />
              <Stat label="Criados" value={String(report.createdCount)} />
              <Stat label="Ganhos" value={String(report.wonCount)} />
              <Stat label="Perdidos" value={String(report.lostCount)} />
              <Stat label="Taxa de conversão" value={report.conversion === null ? '—' : `${Math.round(report.conversion * 100)}%`} />
            </Card>
            <Card>
              <PanelHeader title="Atividade" subtitle="O que você fez no mês" />
              <Stat label="Contatos novos" value={String(report.newContacts)} />
              <Stat label="Interações registradas" value={String(report.interactions)} />
              <Stat label="Tarefas concluídas" value={String(report.tasksDone)} />
            </Card>
          </div>

          <Card>
            <PanelHeader title="Onde os negócios emperram" subtitle="Negócios abertos hoje: há quanto tempo estão na etapa atual" />
            {report.stuck.length === 0 ? (
              <p className="py-4 text-[13.5px] text-[var(--text-muted)]">Nenhum negócio aberto.</p>
            ) : (
              <ul className="flex flex-col gap-4">
                {report.stuck.map((item) => {
                  const stage = getStageConfig(item.stage as DealStage)
                  const max = Math.max(...report.stuck.map((entry) => entry.avgDays), 1)
                  return (
                    <li key={item.stage}>
                      <div className="flex items-baseline justify-between gap-3 text-[13px]">
                        <span className="flex items-center gap-2 font-medium text-[var(--text-primary)]">
                          <span className="size-2 rounded-full" style={{ backgroundColor: stage.color }} />
                          {stage.label}
                          <span className="text-[var(--text-muted)]">
                            · {item.count} {item.count === 1 ? 'negócio' : 'negócios'}
                          </span>
                        </span>
                        <span className="tabular-nums text-[var(--text-secondary)]">{Math.round(item.avgDays)} dias em média</span>
                      </div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[var(--bg-muted)]">
                        <div className="h-full rounded-full" style={{ width: `${Math.max((item.avgDays / max) * 100, 3)}%`, backgroundColor: stage.color }} />
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>
        </div>
      )}
    </PageWrapper>
  )
}
