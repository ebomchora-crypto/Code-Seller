// Datas da sequência de follow-up: N dias depois de hoje, às 10h (horário local).
export const DEFAULT_FOLLOWUP_DAYS = [2, 5, 10]

export function followUpDates(days: number[], from = new Date()): Date[] {
  return days
    .filter((day) => Number.isFinite(day) && day > 0)
    .sort((a, b) => a - b)
    .map((day) => new Date(from.getFullYear(), from.getMonth(), from.getDate() + day, 10, 0, 0))
}
