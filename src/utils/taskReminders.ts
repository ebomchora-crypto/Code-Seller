// Avisos de tarefas do app de Windows (ver components/desktop/DesktopIntegration).
// Funções puras: decidem O QUE avisar a partir dos prazos/lembretes que caíram
// desde a última checagem.

export type TaskEventKind = 'due' | 'reminder'

export interface TaskEvent {
  taskId: string
  title: string
  kind: TaskEventKind
  /** Momento do prazo (due) ou do lembrete (reminder), em ISO. */
  at: string
  dueDate: string | null
  contactName: string | null
}

export interface DesktopNotificationPayload {
  title: string
  body: string
  path: string
}

export const MAX_CATCH_UP_MS = 24 * 60 * 60 * 1000
export const MAX_INDIVIDUAL_NOTIFICATIONS = 3

// Desde quando procurar prazos e lembretes que chegaram: da última checagem,
// mas nunca mais de 24h pra trás — app fechado por dias não vira uma
// enxurrada de avisos velhos (as atrasadas aparecem no contador do ícone).
export function catchUpSince(lastCheck: Date, now: Date): Date {
  return new Date(Math.max(lastCheck.getTime(), now.getTime() - MAX_CATCH_UP_MS))
}

function dayKey(date: Date, timeZone?: string) {
  return date.toLocaleDateString('en-CA', { timeZone })
}

// "hoje às 14:30" ou "28/09 às 09:00".
export function formatWhen(iso: string, now: Date, timeZone?: string): string {
  const date = new Date(iso)
  const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone })
  if (dayKey(date, timeZone) === dayKey(now, timeZone)) return `hoje às ${time}`
  const day = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone })
  return `${day} às ${time}`
}

function taskPath(taskId: string) {
  return `/tasks?task=${encodeURIComponent(taskId)}`
}

function withContact(text: string, contactName: string | null) {
  return contactName ? `${text} · ${contactName}` : text
}

export function buildTaskNotifications(events: TaskEvent[], now: Date, timeZone?: string): DesktopNotificationPayload[] {
  // Prazo e lembrete da mesma tarefa na mesma checagem: um aviso só (o do prazo).
  const byTask = new Map<string, TaskEvent>()
  for (const event of events) {
    const existing = byTask.get(event.taskId)
    if (!existing || (existing.kind === 'reminder' && event.kind === 'due')) byTask.set(event.taskId, event)
  }
  const unique = [...byTask.values()].sort((a, b) => a.at.localeCompare(b.at))
  if (unique.length === 0) return []

  if (unique.length > MAX_INDIVIDUAL_NOTIFICATIONS) {
    const names = unique.slice(0, 2).map((event) => event.title).join(', ')
    return [
      {
        title: `${unique.length} tarefas precisam de você`,
        body: `${names} e mais ${unique.length - 2}.`,
        path: '/tasks',
      },
    ]
  }

  return unique.map((event) => {
    if (event.kind === 'due') {
      return {
        title: `Prazo: ${event.title}`,
        body: withContact(`Venceu ${formatWhen(event.at, now, timeZone)}`, event.contactName),
        path: taskPath(event.taskId),
      }
    }
    return {
      title: `Lembrete: ${event.title}`,
      body: withContact(event.dueDate ? `Prazo ${formatWhen(event.dueDate, now, timeZone)}` : 'Sem prazo definido', event.contactName),
      path: taskPath(event.taskId),
    }
  })
}

// Texto do número no ícone da barra de tarefas (o espaço é minúsculo).
export function badgeText(count: number): string {
  return count > 9 ? '9+' : String(count)
}
