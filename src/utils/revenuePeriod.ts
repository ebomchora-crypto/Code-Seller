import type {
  CustomRange,
  ResolvedRange,
  RevenueChange,
  RevenueEntry,
  RevenuePeriod,
  RevenuePoint,
} from '@/types'

const DAY_MS = 24 * 60 * 60 * 1000
// Início de "o tempo todo": antes de qualquer venda possível no sistema.
const ALL_TIME_START = new Date(2000, 0, 1).getTime()
const MIN_MONTHS_ALL_TIME = 6

export const PERIOD_OPTIONS: { value: RevenuePeriod; label: string }[] = [
  { value: 'today', label: 'Hoje' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mês' },
  { value: 'custom', label: 'Período' },
]

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

// Segunda-feira da semana (semana comercial).
function startOfWeek(date: Date): Date {
  const day = startOfDay(date)
  const offset = (day.getDay() + 6) % 7
  return addDays(day, -offset)
}

export function parseDateInput(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function toDateInput(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function resolveRange(period: RevenuePeriod, custom: CustomRange | null, now = new Date()): ResolvedRange {
  if (period === 'today') {
    const start = startOfDay(now)
    return {
      start,
      end: addDays(start, 1),
      previousStart: addDays(start, -1),
      previousEnd: start,
      granularity: 'hour',
      compareLabel: 'vs. ontem',
      compare: true,
    }
  }

  if (period === 'week') {
    const start = startOfWeek(now)
    return {
      start,
      end: addDays(start, 7),
      previousStart: addDays(start, -7),
      previousEnd: start,
      granularity: 'day',
      compareLabel: 'vs. semana passada',
      compare: true,
    }
  }

  if (period === 'custom' && custom) {
    let start = parseDateInput(custom.from)
    let last = parseDateInput(custom.to)
    if (last < start) [start, last] = [last, start]
    const end = addDays(last, 1)
    const days = Math.round((end.getTime() - start.getTime()) / DAY_MS)
    return {
      start,
      end,
      previousStart: addDays(start, -days),
      previousEnd: start,
      granularity: days <= 1 ? 'hour' : 'day',
      compareLabel: days <= 1 ? 'vs. dia anterior' : `vs. ${days} dias anteriores`,
      compare: true,
    }
  }

  if (period === 'all') {
    // O tempo todo: tudo até o fim deste mês, mês a mês, sem comparação.
    const start = new Date(ALL_TIME_START)
    return {
      start,
      end: new Date(now.getFullYear(), now.getMonth() + 1, 1),
      previousStart: start,
      previousEnd: start,
      granularity: 'month',
      compareLabel: '',
      compare: false,
    }
  }

  // Mês (padrão): mesmo recorte que o Início sempre usou.
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  return {
    start,
    end: new Date(now.getFullYear(), now.getMonth() + 1, 1),
    previousStart: new Date(now.getFullYear(), now.getMonth() - 1, 1),
    previousEnd: start,
    granularity: 'day',
    compareLabel: 'vs. mês anterior',
    compare: true,
  }
}

export function computeChange(current: number, previous: number, label: string): RevenueChange {
  if (previous === 0) {
    if (current === 0) return { value: 0, direction: 'neutral', label }
    return { value: 100, direction: 'up', label }
  }
  const diff = ((current - previous) / previous) * 100
  return {
    value: Math.round(Math.abs(diff) * 10) / 10,
    direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'neutral',
    label,
  }
}

function sumBetween(entries: RevenueEntry[], start: Date, end: Date): number {
  return entries.reduce((sum, entry) => {
    const time = new Date(entry.date).getTime()
    return time >= start.getTime() && time < end.getTime() ? sum + entry.amount : sum
  }, 0)
}

export function entriesInRange(entries: RevenueEntry[], start: Date, end: Date): RevenueEntry[] {
  return entries.filter((entry) => {
    const time = new Date(entry.date).getTime()
    return time >= start.getTime() && time < end.getTime()
  })
}

// Série do período (por hora ou por dia) com o valor do período anterior no
// mesmo índice — base do gráfico "hoje vs. ontem".
export function buildSeries(entries: RevenueEntry[], range: ResolvedRange): RevenuePoint[] {
  const points: RevenuePoint[] = []

  if (range.granularity === 'hour') {
    for (let hour = 0; hour < 24; hour++) {
      const start = new Date(range.start.getTime() + hour * 60 * 60 * 1000)
      const end = new Date(start.getTime() + 60 * 60 * 1000)
      const previousStart = new Date(range.previousStart.getTime() + hour * 60 * 60 * 1000)
      const previousEnd = new Date(previousStart.getTime() + 60 * 60 * 1000)
      const label = `${String(hour).padStart(2, '0')}h`
      points.push({
        label,
        full_label: `${label} – ${String(hour + 1).padStart(2, '0')}h`,
        value: sumBetween(entries, start, end),
        previous: sumBetween(entries, previousStart, previousEnd),
      })
    }
    return points
  }

  if (range.granularity === 'month') {
    // Da primeira venda até o mês atual (no mínimo os últimos 6 meses).
    const lastMonth = new Date(range.end.getFullYear(), range.end.getMonth() - 1, 1)
    let first = new Date(lastMonth.getFullYear(), lastMonth.getMonth() - (MIN_MONTHS_ALL_TIME - 1), 1)
    for (const entry of entriesInRange(entries, range.start, range.end)) {
      const date = new Date(entry.date)
      const month = new Date(date.getFullYear(), date.getMonth(), 1)
      if (month < first) first = month
    }
    const multipleYears = first.getFullYear() !== lastMonth.getFullYear()
    for (let month = first; month <= lastMonth; month = new Date(month.getFullYear(), month.getMonth() + 1, 1)) {
      const next = new Date(month.getFullYear(), month.getMonth() + 1, 1)
      const short = month.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
      const name = short.charAt(0).toUpperCase() + short.slice(1)
      points.push({
        label: multipleYears ? `${name}/${String(month.getFullYear()).slice(2)}` : name,
        full_label: month.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
        value: sumBetween(entries, month, next),
        previous: 0,
      })
    }
    return points
  }

  const days = Math.round((range.end.getTime() - range.start.getTime()) / DAY_MS)
  for (let index = 0; index < days; index++) {
    const start = addDays(range.start, index)
    const previousStart = addDays(range.previousStart, index)
    const weekday = start.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')
    points.push({
      label: days <= 7 ? weekday.charAt(0).toUpperCase() + weekday.slice(1) : String(start.getDate()).padStart(2, '0'),
      full_label: start.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }),
      value: sumBetween(entries, start, addDays(start, 1)),
      previous: sumBetween(entries, previousStart, addDays(previousStart, 1)),
    })
  }
  return points
}

export function formatRangeLabel(range: ResolvedRange): string {
  const last = new Date(range.end.getTime() - 1)
  const sameDay = startOfDay(range.start).getTime() === startOfDay(last).getTime()
  const format = (date: Date) => date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')
  return sameDay ? format(range.start) : `${format(range.start)} – ${format(last)}`
}
