import assert from 'node:assert/strict'
import test from 'node:test'

import { buildTaskCalendar, escapeText, foldLine, formatUtc } from '../../supabase/functions/calendar-feed/ics.ts'

const options = {
  now: new Date('2026-09-27T12:00:00Z'),
  siteUrl: 'https://codesellers.vercel.app',
  timeZone: 'America/Sao_Paulo',
  calendarName: 'Code Sellers — Tarefas',
}

function task(overrides) {
  return {
    id: 'abc-123',
    title: 'Ligar pro João',
    description: null,
    due_date: '2026-09-28T17:30:00Z', // 14:30 em São Paulo
    reminder_at: null,
    updated_at: '2026-09-27T10:00:00Z',
    contact: null,
    deal: null,
    ...overrides,
  }
}

function unfold(ics) {
  return ics.replace(/\r\n /g, '')
}

test('escapa vírgula, ponto e vírgula, barra e quebra de linha', () => {
  assert.equal(escapeText('a,b;c\\d\ne'), 'a\\,b\\;c\\\\d\\ne')
})

test('quebra linhas longas em até 75 bytes sem cortar acentos', () => {
  const line = `SUMMARY:${'ação '.repeat(40)}`
  const folded = foldLine(line)
  for (const part of folded.split('\r\n')) {
    assert.ok(new TextEncoder().encode(part).length <= 75)
  }
  assert.equal(folded.replace(/\r\n /g, ''), line)
})

test('data no formato UTC da agenda', () => {
  assert.equal(formatUtc(new Date('2026-09-28T17:30:05Z')), '20260928T173005Z')
})

test('tarefa com horário vira evento de 30 minutos com aviso 15 min antes', () => {
  const ics = unfold(buildTaskCalendar([task({ contact: { name: 'João, da Padaria' } })], options))
  assert.match(ics, /DTSTART:20260928T173000Z\r\n/)
  assert.match(ics, /DTEND:20260928T180000Z\r\n/)
  assert.match(ics, /SUMMARY:Ligar pro João\r\n/)
  assert.match(ics, /Contato: João\\, da Padaria/)
  assert.match(ics, /URL:https:\/\/codesellers\.vercel\.app\/tasks\?task=abc-123\r\n/)
  assert.match(ics, /TRIGGER:-PT15M\r\n/)
  assert.match(ics, /UID:task-abc-123@codesellers\r\n/)
})

test('prazo à meia-noite vira evento de dia inteiro, com aviso às 9h', () => {
  const ics = unfold(buildTaskCalendar([task({ due_date: '2026-09-29T03:00:00Z' })], options)) // 00:00 em SP
  assert.match(ics, /DTSTART;VALUE=DATE:20260929\r\n/)
  assert.match(ics, /DTEND;VALUE=DATE:20260930\r\n/)
  assert.match(ics, /TRIGGER:PT9H\r\n/)
})

test('usa o lembrete da tarefa quando existe', () => {
  const ics = unfold(buildTaskCalendar([task({ reminder_at: '2026-09-28T16:00:00Z' })], options))
  assert.match(ics, /TRIGGER;VALUE=DATE-TIME:20260928T160000Z\r\n/)
})

test('agenda completa: cabeçalho, fim e linhas terminando em CRLF', () => {
  const ics = buildTaskCalendar([task({}), task({ id: 'def-456' })], options)
  assert.ok(ics.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0\r\n'))
  assert.ok(ics.endsWith('END:VCALENDAR\r\n'))
  assert.equal(ics.match(/BEGIN:VEVENT/g).length, 2)
  assert.equal(ics.replace(/\r\n/g, '').includes('\n'), false)
})
