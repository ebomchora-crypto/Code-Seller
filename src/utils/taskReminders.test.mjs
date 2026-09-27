import assert from 'node:assert/strict'
import test from 'node:test'

import { badgeText, buildTaskNotifications, catchUpSince, MAX_CATCH_UP_MS } from './taskReminders.ts'

const TZ = 'America/Sao_Paulo'
const now = new Date('2026-09-27T17:00:00Z') // 14:00 em São Paulo

function event(overrides) {
  return {
    taskId: 't1',
    title: 'Ligar pro João',
    kind: 'due',
    at: '2026-09-27T16:30:00Z',
    dueDate: '2026-09-27T16:30:00Z',
    contactName: null,
    ...overrides,
  }
}

test('nunca volta mais de 24h, mesmo com o app fechado há dias', () => {
  const weekAgo = new Date(now.getTime() - 7 * MAX_CATCH_UP_MS)
  assert.equal(catchUpSince(weekAgo, now).getTime(), now.getTime() - MAX_CATCH_UP_MS)
  const minuteAgo = new Date(now.getTime() - 60_000)
  assert.equal(catchUpSince(minuteAgo, now).getTime(), minuteAgo.getTime())
})

test('prazo vira aviso com horário, contato e link pra tarefa', () => {
  const [notification] = buildTaskNotifications([event({ contactName: 'João Silva' })], now, TZ)
  assert.equal(notification.title, 'Prazo: Ligar pro João')
  assert.equal(notification.body, 'Venceu hoje às 13:30 · João Silva')
  assert.equal(notification.path, '/tasks?task=t1')
})

test('lembrete mostra o prazo da tarefa (outro dia aparece com a data)', () => {
  const [notification] = buildTaskNotifications(
    [event({ kind: 'reminder', at: '2026-09-27T16:55:00Z', dueDate: '2026-09-28T12:00:00Z' })],
    now,
    TZ,
  )
  assert.equal(notification.title, 'Lembrete: Ligar pro João')
  assert.equal(notification.body, 'Prazo 28/09 às 09:00')
})

test('prazo e lembrete da mesma tarefa juntos viram um aviso só', () => {
  const notifications = buildTaskNotifications(
    [event({ kind: 'reminder', at: '2026-09-27T16:20:00Z' }), event({ kind: 'due' })],
    now,
    TZ,
  )
  assert.equal(notifications.length, 1)
  assert.match(notifications[0].title, /^Prazo:/)
})

test('muitas tarefas de uma vez viram um resumo, não uma enxurrada', () => {
  const events = ['A', 'B', 'C', 'D', 'E'].map((title, index) =>
    event({ taskId: `t${index}`, title, at: `2026-09-27T16:0${index}:00Z` }),
  )
  const notifications = buildTaskNotifications(events, now, TZ)
  assert.equal(notifications.length, 1)
  assert.equal(notifications[0].title, '5 tarefas precisam de você')
  assert.equal(notifications[0].body, 'A, B e mais 3.')
  assert.equal(notifications[0].path, '/tasks')
})

test('nada pra avisar, nenhum aviso', () => {
  assert.deepEqual(buildTaskNotifications([], now, TZ), [])
})

test('número no ícone cabe no espaço', () => {
  assert.equal(badgeText(3), '3')
  assert.equal(badgeText(9), '9')
  assert.equal(badgeText(12), '9+')
})
