// Datas de venda/recebimento escolhidas num campo de dia (YYYY-MM-DD).
// Testado em src/utils/saleDate.test.mjs.

// Dia local (YYYY-MM-DD) de um instante.
export function localDay(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value
  const offset = date.getTimezoneOffset()
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 10)
}

// Valor de um <input type="datetime-local"> (horário local) para um instante.
export function localDateTimeInput(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value
  const offset = date.getTimezoneOffset()
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16)
}

// Instante que representa um dia escolhido: hoje → agora; outro dia →
// meio-dia local (longe da virada do dia, para nenhum fuso jogar a venda
// para o dia vizinho).
export function dayToTimestamp(day: string, now = new Date()): string {
  if (day === localDay(now)) return now.toISOString()
  return new Date(`${day}T12:00:00`).toISOString()
}

// "Pago em" padrão para um lançamento com a data `day`.
export function defaultPaidAtInput(day: string, now = new Date()): string {
  return localDateTimeInput(dayToTimestamp(day, now))
}
