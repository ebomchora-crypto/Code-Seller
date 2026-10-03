// "De onde vêm as vendas": faturamento, vendas, leads e taxa de fechamento por
// origem ou por nicho. Testado em src/utils/salesSources.test.mjs.

import { normalizeChoice } from './choiceList.ts'
import { formatMoney } from './currency.ts'

export type SourceDimension = 'origin' | 'niche'

export interface SourceDeal {
  value: number | null
  status: 'open' | 'won' | 'lost'
  won_at?: string | null
  updated_at: string
  origin: string | null
  contact_origin: string | null
  contact_niche: string | null
}

export interface SourceContact {
  created_at: string
  origin: string | null
  niche: string | null
}

export interface SourceRow {
  key: string
  label: string
  leads: number
  won: number
  lost: number
  revenue: number
  // Vendas ÷ negócios decididos (ganhos + perdidos). null sem nenhum decidido.
  closeRate: number | null
  ticket: number | null
  // Parte do faturamento total (0–1).
  share: number
}

// Taxa de fechamento só entra nos destaques com pelo menos isto de negócios
// decididos — 1 de 1 (100%) não quer dizer nada.
export const MIN_DECIDED_FOR_RATE = 3

const UNKNOWN: Record<SourceDimension, string> = {
  origin: 'Origem não informada',
  niche: 'Nicho não informado',
}

function inRange(iso: string | null | undefined, start: Date | null, end: Date): boolean {
  if (!iso) return false
  const time = new Date(iso).getTime()
  return (start === null || time >= start.getTime()) && time < end.getTime()
}

function dealLabel(deal: SourceDeal, dimension: SourceDimension): string | null {
  const value = dimension === 'origin' ? deal.contact_origin?.trim() || deal.origin?.trim() : deal.contact_niche?.trim()
  return value || null
}

export function buildSourceStats(
  deals: SourceDeal[],
  contacts: SourceContact[],
  dimension: SourceDimension,
  start: Date | null,
  end: Date,
): SourceRow[] {
  const rows = new Map<string, SourceRow>()
  const row = (raw: string | null): SourceRow => {
    const label = raw ?? UNKNOWN[dimension]
    const key = raw ? normalizeChoice(raw) : '__unknown__'
    let current = rows.get(key)
    if (!current) {
      current = { key, label, leads: 0, won: 0, lost: 0, revenue: 0, closeRate: null, ticket: null, share: 0 }
      rows.set(key, current)
    }
    return current
  }

  for (const contact of contacts) {
    if (!inRange(contact.created_at, start, end)) continue
    const raw = (dimension === 'origin' ? contact.origin : contact.niche)?.trim() || null
    row(raw).leads += 1
  }

  for (const deal of deals) {
    if (deal.status === 'won' && inRange(deal.won_at ?? deal.updated_at, start, end)) {
      const target = row(dealLabel(deal, dimension))
      target.won += 1
      target.revenue += Number(deal.value ?? 0)
    } else if (deal.status === 'lost' && inRange(deal.updated_at, start, end)) {
      row(dealLabel(deal, dimension)).lost += 1
    }
  }

  const total = [...rows.values()].reduce((sum, item) => sum + item.revenue, 0)
  return [...rows.values()]
    .map((item) => {
      const decided = item.won + item.lost
      return {
        ...item,
        closeRate: decided > 0 ? item.won / decided : null,
        ticket: item.won > 0 ? item.revenue / item.won : null,
        share: total > 0 ? item.revenue / total : 0,
      }
    })
    .sort((a, b) => b.revenue - a.revenue || b.won - a.won || b.leads - a.leads || a.label.localeCompare(b.label, 'pt-BR'))
}

function brl(value: number): string {
  return formatMoney(value, undefined, { decimals: false })
}

function percent(value: number): string {
  return `${Math.round(value * 100)}%`
}

function times(ratio: number): string {
  const rounded = Math.round(ratio * 10) / 10
  return `${rounded.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}x`
}

// Frases curtas que dizem onde vale colocar esforço.
export function sourceInsights(rows: SourceRow[], dimension: SourceDimension): string[] {
  const known = rows.filter((row) => row.key !== '__unknown__')
  const insights: string[] = []
  const noun = dimension === 'origin' ? { the: 'a origem', among: 'entre as origens' } : { the: 'o nicho', among: 'entre os nichos' }

  const selling = known.filter((row) => row.revenue > 0)
  const [first, second] = selling
  if (first) {
    insights.push(`${first.label} é ${noun.the} que mais fatura: ${brl(first.revenue)} (${percent(first.share)} do total).`)
  }
  if (first && second && first.revenue / second.revenue >= 1.5) {
    insights.push(`${first.label} vende ${times(first.revenue / second.revenue)} mais que ${second.label}.`)
  }

  const rated = known.filter((row) => row.won + row.lost >= MIN_DECIDED_FOR_RATE && row.closeRate !== null)
  if (rated.length > 0) {
    const best = [...rated].sort((a, b) => (b.closeRate ?? 0) - (a.closeRate ?? 0))[0]
    const worst = [...rated].sort((a, b) => (a.closeRate ?? 0) - (b.closeRate ?? 0))[0]
    insights.push(
      rated.length > 1
        ? `${best.label} fecha ${percent(best.closeRate ?? 0)} dos negócios — a melhor taxa ${noun.among}.`
        : `${best.label} fecha ${percent(best.closeRate ?? 0)} dos negócios.`,
    )
    if (worst.key !== best.key && (best.closeRate ?? 0) - (worst.closeRate ?? 0) >= 0.15) {
      insights.push(`${worst.label} fecha só ${percent(worst.closeRate ?? 0)}.`)
    }
  }

  const cold = known
    .filter((row) => row.leads >= 5 && row.won === 0)
    .sort((a, b) => b.leads - a.leads)[0]
  if (cold) {
    insights.push(`${cold.label} trouxe ${cold.leads} leads e ainda nenhuma venda.`)
  }

  return insights
}
