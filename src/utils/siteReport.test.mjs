import assert from 'node:assert/strict'
import test from 'node:test'
import { buildSiteReportHtml, reportInsights } from './siteReport.ts'

const stats = {
  days: 7,
  totals: { views: 120, whatsapp: 12, phone: 2, email: 1, leads: 4 },
  daily: [3, 8, 12, 20, 15, 34, 28].map((views, index) => ({ day: `2026-10-0${index + 4}`, views })),
  refs: [{ name: 'instagram.com', n: 60 }, { name: 'Direto', n: 40 }],
  pages: [{ name: '', n: 100 }, { name: 'servicos', n: 20 }],
}

test('relatório do cliente: resumo e próximos passos vêm dos números reais', () => {
  const { summary, tips } = reportInsights(stats)
  assert.match(summary[0], /120 visitas/)
  assert.ok(summary.some((line) => /19 pessoas entraram em contato/.test(line) && /12 pelo WhatsApp/.test(line) && /4 pelo formulário/.test(line)))
  assert.ok(summary.some((line) => /16 viram um contato/.test(line)))
  assert.ok(summary.some((line) => /melhor dia foi 09\/10/.test(line)))
  assert.ok(summary.some((line) => /instagram\.com/.test(line)))
  assert.ok(tips.some((tip) => /Instagram/.test(tip)))
  const empty = reportInsights({ ...stats, totals: { views: 0, whatsapp: 0, phone: 0, email: 0, leads: 0 }, daily: [], refs: [], pages: [] })
  assert.match(empty.summary[0], /ainda não teve visitas/)
  assert.ok(empty.tips.length > 0)
})

test('o PDF do cliente escapa o nome e mostra os números', () => {
  const html = buildSiteReportHtml(stats, { name: 'Padaria <b>Aurora</b>', url: 'https://codesellers.vercel.app/aurora' }, 'Code Sellers Ltda')
  assert.ok(!html.includes('<b>Aurora</b>'))
  assert.match(html, /codesellers\.vercel\.app\/aurora/)
  assert.match(html, /Preparado por Code Sellers Ltda/)
  assert.match(html, /<b>120<\/b>/)
  assert.match(html, /<svg/)
})
