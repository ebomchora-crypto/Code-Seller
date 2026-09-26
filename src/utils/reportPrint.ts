import { escapeHtml } from '@/utils/printDocument'
import { getStageConfig } from '@/utils/deals'
import type { DealStage } from '@/types'
import type { MonthlyReportData } from '@/services/supabase/report'
import type { ReportBucket } from '@/utils/report'

function brl(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

function bucketTable(title: string, buckets: ReportBucket[]): string {
  if (buckets.length === 0) return `<h3>${title}</h3><p class="muted">Nenhuma venda no mês.</p>`
  const max = Math.max(...buckets.map((bucket) => bucket.value), 1)
  const rows = buckets
    .map(
      (bucket) =>
        `<tr><td>${escapeHtml(bucket.label)}</td><td style="width:40%"><div class="bar" style="width:${Math.max(
          (bucket.value / max) * 100,
          3,
        )}%"></div></td><td class="num">${bucket.count}</td><td class="num">${brl(bucket.value)}</td></tr>`,
    )
    .join('')
  return `<h3>${title}</h3><table><thead><tr><th></th><th></th><th>Vendas</th><th>Valor</th></tr></thead><tbody>${rows}</tbody></table>`
}

// Relatório do mês em HTML próprio para papel/PDF.
export function buildReportHtml(report: MonthlyReportData, monthLabel: string, owner: string): string {
  const kpis: [string, string][] = [
    ['Vendido', brl(report.sold)],
    ['Vendas', String(report.salesCount)],
    ['Ticket médio', report.salesCount > 0 ? brl(report.ticket) : '—'],
    ['Recebido', brl(report.received)],
    ['Despesas pagas', brl(report.expenses)],
    ['Lucro', brl(report.profit)],
  ]
  const stuck = report.stuck
    .map(
      (item) =>
        `<tr><td>${escapeHtml(getStageConfig(item.stage as DealStage).label)}</td><td class="num">${item.count}</td><td class="num">${Math.round(
          item.avgDays,
        )} dias</td></tr>`,
    )
    .join('')

  return `
    <div class="header">
      <div><h1 style="margin:0">Relatório de ${escapeHtml(monthLabel)}</h1><div class="muted">${escapeHtml(owner)}</div></div>
      <div class="muted">Code Sellers · gerado em ${new Date().toLocaleDateString('pt-BR')}</div>
    </div>
    <div class="kpis">${kpis.map(([label, value]) => `<div class="kpi"><span class="muted">${label}</span><b>${value}</b></div>`).join('')}</div>
    <p class="muted">Mês anterior: ${brl(report.soldPrevious)} vendidos.</p>
    ${bucketTable('O que mais vende', report.byService)}
    ${bucketTable('De onde vêm os clientes que fecham', report.byOrigin)}
    <h3>Funil do mês</h3>
    <table><tbody>
      <tr><td>Negócios criados</td><td class="num">${report.createdCount}</td></tr>
      <tr><td>Ganhos</td><td class="num">${report.wonCount}</td></tr>
      <tr><td>Perdidos</td><td class="num">${report.lostCount}</td></tr>
      <tr><td>Taxa de conversão</td><td class="num">${report.conversion === null ? '—' : `${Math.round(report.conversion * 100)}%`}</td></tr>
      <tr><td>Tempo médio até fechar</td><td class="num">${report.avgDaysToClose === null ? '—' : `${Math.round(report.avgDaysToClose)} dias`}</td></tr>
    </tbody></table>
    <h3>Onde os negócios emperram (abertos hoje)</h3>
    ${stuck ? `<table><thead><tr><th>Etapa</th><th>Negócios</th><th>Tempo médio na etapa</th></tr></thead><tbody>${stuck}</tbody></table>` : '<p class="muted">Nenhum negócio aberto.</p>'}
    <h3>Atividade</h3>
    <table><tbody>
      <tr><td>Contatos novos</td><td class="num">${report.newContacts}</td></tr>
      <tr><td>Interações registradas</td><td class="num">${report.interactions}</td></tr>
      <tr><td>Tarefas concluídas</td><td class="num">${report.tasksDone}</td></tr>
    </tbody></table>
  `
}
