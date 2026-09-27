// Monta a agenda das tarefas no formato iCalendar (RFC 5545), lido por
// Google Agenda, Outlook e o Calendário do iPhone/Mac. Código puro (sem Deno
// nem rede) para poder ser testado em src/utils/icalendar.test.mjs.

export interface CalendarTask {
  id: string
  title: string
  description: string | null
  due_date: string
  reminder_at: string | null
  updated_at: string
  contact: { name: string } | null
  deal: { title: string } | null
}

export interface CalendarOptions {
  now: Date
  siteUrl: string
  timeZone: string
  calendarName: string
}

const EVENT_MINUTES = 30
const MAX_DESCRIPTION = 1000

// Texto dentro de um campo: barra, ponto e vírgula, vírgula e quebra de linha
// precisam de escape.
export function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\r|\n/g, '\\n')
}

// Linhas de no máximo 75 bytes; a continuação começa com um espaço. Corta
// por caractere (nunca no meio de um acento em UTF-8).
export function foldLine(line: string): string {
  const encoder = new TextEncoder()
  const parts: string[] = []
  let current = ''
  let currentBytes = 0
  for (const char of line) {
    const size = encoder.encode(char).length
    const limit = parts.length === 0 ? 75 : 74
    if (currentBytes + size > limit) {
      parts.push(current)
      current = ''
      currentBytes = 0
    }
    current += char
    currentBytes += size
  }
  parts.push(current)
  return parts.join('\r\n ')
}

function pad(value: number) {
  return String(value).padStart(2, '0')
}

// 20260927T173000Z
export function formatUtc(date: Date): string {
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  )
}

// Data e hora de um instante no fuso do usuário.
function localParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '00'
  return { date: `${get('year')}${get('month')}${get('day')}`, hour: Number(get('hour')), minute: Number(get('minute')) }
}

function nextDay(yyyymmdd: string): string {
  const year = Number(yyyymmdd.slice(0, 4))
  const month = Number(yyyymmdd.slice(4, 6))
  const day = Number(yyyymmdd.slice(6, 8))
  const next = new Date(Date.UTC(year, month - 1, day + 1))
  return `${next.getUTCFullYear()}${pad(next.getUTCMonth() + 1)}${pad(next.getUTCDate())}`
}

function describe(task: CalendarTask, link: string): string {
  const lines: string[] = []
  const description = task.description?.trim()
  if (description) lines.push(description.slice(0, MAX_DESCRIPTION))
  const context: string[] = []
  if (task.contact?.name) context.push(`Contato: ${task.contact.name}`)
  if (task.deal?.title) context.push(`Negócio: ${task.deal.title}`)
  if (context.length > 0) lines.push(context.join('\n'))
  lines.push(`Abrir no Code Sellers: ${link}`)
  return lines.join('\n\n')
}

function eventLines(task: CalendarTask, options: CalendarOptions): string[] {
  const due = new Date(task.due_date)
  const link = `${options.siteUrl}/tasks?task=${encodeURIComponent(task.id)}`
  const local = localParts(due, options.timeZone)
  // Prazo à meia-noite = "no dia" (sem horário): vira evento de dia inteiro.
  const allDay = local.hour === 0 && local.minute === 0
  const reminder = task.reminder_at ? new Date(task.reminder_at) : null

  const lines = [
    'BEGIN:VEVENT',
    `UID:task-${task.id}@codesellers`,
    `DTSTAMP:${formatUtc(options.now)}`,
    `LAST-MODIFIED:${formatUtc(new Date(task.updated_at))}`,
  ]
  if (allDay) {
    lines.push(`DTSTART;VALUE=DATE:${local.date}`, `DTEND;VALUE=DATE:${nextDay(local.date)}`)
  } else {
    lines.push(`DTSTART:${formatUtc(due)}`, `DTEND:${formatUtc(new Date(due.getTime() + EVENT_MINUTES * 60 * 1000))}`)
  }
  lines.push(
    `SUMMARY:${escapeText(task.title)}`,
    `DESCRIPTION:${escapeText(describe(task, link))}`,
    `URL:${link}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeText(task.title)}`,
    // Lembrete da tarefa, se tiver; senão 15 min antes (ou 9h, no dia inteiro).
    reminder ? `TRIGGER;VALUE=DATE-TIME:${formatUtc(reminder)}` : allDay ? 'TRIGGER:PT9H' : 'TRIGGER:-PT15M',
    'END:VALARM',
    'END:VEVENT',
  )
  return lines
}

export function buildTaskCalendar(tasks: CalendarTask[], options: CalendarOptions): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Code Sellers//Tarefas//PT-BR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(options.calendarName)}`,
    'X-WR-CALDESC:Suas tarefas com prazo no Code Sellers',
    `X-WR-TIMEZONE:${options.timeZone}`,
    'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
    'X-PUBLISHED-TTL:PT1H',
    ...tasks.flatMap((task) => eventLines(task, options)),
    'END:VCALENDAR',
  ]
  return lines.map(foldLine).join('\r\n') + '\r\n'
}
