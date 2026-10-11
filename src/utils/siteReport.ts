import { escapeHtml } from './printDocument.ts'
import type { SiteStats } from '@/services/supabase/codeMaker'

const number = (value: number) => value.toLocaleString('pt-BR')
const plural = (value: number, one: string, many: string) => `${number(value)} ${value === 1 ? one : many}`
const day = (value: string) => value.split('-').reverse().slice(0, 2).join('/')

/** Frases do relatório, em linguagem de cliente, a partir dos números reais do período. */
export function reportInsights(stats: SiteStats): { summary: string[]; tips: string[] } {
  const { views, whatsapp, phone, email, leads } = stats.totals
  const contacts = whatsapp + phone + email + leads
  const summary: string[] = []
  if (views === 0) {
    summary.push(`O site ainda não teve visitas nos últimos ${stats.days} dias.`)
  } else {
    summary.push(`O site recebeu ${plural(views, 'visita', 'visitas')} nos últimos ${stats.days} dias.`)
    if (contacts > 0) summary.push(`${plural(contacts, 'pessoa entrou', 'pessoas entraram')} em contato: ${[whatsapp && `${whatsapp} pelo WhatsApp`, leads && `${leads} pelo formulário`, phone && `${phone} por telefone`, email && `${email} por e-mail`].filter(Boolean).join(', ')}.`)
    if (views >= 20 && contacts > 0) summary.push(`A cada 100 visitas, ${Math.round((contacts / views) * 100)} viram um contato.`)
    const best = [...stats.daily].sort((a, b) => b.views - a.views)[0]
    if (best && best.views > 0 && stats.daily.length > 1) summary.push(`O melhor dia foi ${day(best.day)}, com ${plural(best.views, 'visita', 'visitas')}.`)
    const origin = stats.refs[0]
    if (origin && origin.n > 0) summary.push(`${origin.name === 'Direto' ? 'A maioria chegou digitando o endereço ou por links de mensagem (acesso direto)' : `A principal origem das visitas foi ${origin.name}`} (${origin.n} de ${views}).`)
  }
  const tips: string[] = []
  if (views < 30) tips.push('Divulgue o link do site no Instagram, no Google Meu Negócio e na assinatura do WhatsApp para aumentar as visitas.')
  if (views >= 30 && contacts / views < 0.05) tips.push('Muitas visitas e poucos contatos: vale deixar o botão de WhatsApp mais visível no topo e revisar a chamada principal.')
  if (leads === 0 && views >= 20) tips.push('Ninguém usou o formulário. Podemos encurtar os campos ou oferecer algo em troca (orçamento grátis, avaliação).')
  if (stats.refs.some((ref) => /instagram/i.test(ref.name)) && contacts > 0) tips.push('O Instagram está trazendo visitas que viram contato: mantenha o link na bio e nos stories.')
  if (tips.length === 0) tips.push('Os números estão saudáveis. Manter o site atualizado com novidades e promoções ajuda a continuar crescendo.')
  return { summary, tips: tips.slice(0, 3) }
}

function chart(stats: SiteStats): string {
  const peak = Math.max(1, ...stats.daily.map((item) => item.views))
  const width = 640
  const height = 120
  const gap = 3
  const bar = (width - gap * (stats.daily.length - 1)) / stats.daily.length
  const bars = stats.daily
    .map((item, index) => {
      const h = Math.max(item.views ? 4 : 1.5, (item.views / peak) * (height - 18))
      return `<rect x="${(index * (bar + gap)).toFixed(1)}" y="${(height - h).toFixed(1)}" width="${bar.toFixed(1)}" height="${h.toFixed(1)}" rx="2" fill="#7c3aed"/>`
    })
    .join('')
  const first = stats.daily[0]
  const last = stats.daily[stats.daily.length - 1]
  return `<svg viewBox="0 0 ${width} ${height + 16}" width="100%" role="img" aria-label="Visitas por dia">${bars}<text x="0" y="${height + 13}" font-size="10" fill="#666">${first ? day(first.day) : ''}</text><text x="${width}" y="${height + 13}" font-size="10" text-anchor="end" fill="#666">${last ? day(last.day) : ''}</text></svg>`
}

function list(title: string, rows: { name: string; n: number }[]): string {
  if (rows.length === 0) return `<h3>${title}</h3><p class="muted">Ainda sem dados.</p>`
  const max = Math.max(1, ...rows.map((row) => row.n))
  return `<h3>${title}</h3><table><tbody>${rows.map((row) => `<tr><td>${escapeHtml(row.name)}</td><td style="width:42%"><div class="bar" style="width:${Math.max(4, (row.n / max) * 100)}%"></div></td><td class="num">${number(row.n)}</td></tr>`).join('')}</tbody></table>`
}

// Relatório do site para entregar ao cliente (papel/PDF): números do período, o que significam e próximos passos.
export function buildSiteReportHtml(stats: SiteStats, site: { name: string; url: string }, preparedBy: string): string {
  const { views, whatsapp, phone, email, leads } = stats.totals
  const kpis: [string, number][] = [
    ['Visitas', views],
    ['Cliques no WhatsApp', whatsapp],
    ['Contatos pelo formulário', leads],
    ['Telefone e e-mail', phone + email],
  ]
  const { summary, tips } = reportInsights(stats)
  return `
    <div class="header">
      <div><h1 style="margin:0">Relatório do site · ${escapeHtml(site.name)}</h1><div class="muted">${escapeHtml(site.url.replace(/^https?:\/\//, ''))} · últimos ${stats.days} dias</div></div>
      <div class="muted">${preparedBy ? `Preparado por ${escapeHtml(preparedBy)} · ` : ''}${new Date().toLocaleDateString('pt-BR')}</div>
    </div>
    <div class="kpis" style="grid-template-columns:repeat(4,1fr)">${kpis.map(([label, value]) => `<div class="kpi"><span class="muted">${label}</span><b>${number(value)}</b></div>`).join('')}</div>
    <h3>Resumo</h3>
    <ul>${summary.map((line) => `<li>${escapeHtml(line)}</li>`).join('')}</ul>
    <h3>Visitas por dia</h3>
    ${chart(stats)}
    ${list('De onde vêm as visitas', stats.refs)}
    ${list('Páginas mais vistas', stats.pages.map((page) => ({ name: page.name ? `/${page.name}` : 'Página inicial', n: page.n })))}
    <h3>Próximos passos</h3>
    <ul>${tips.map((tip) => `<li>${escapeHtml(tip)}</li>`).join('')}</ul>
  `
}
