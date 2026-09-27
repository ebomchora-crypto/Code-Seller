import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '@/stores/AuthContext'
import { countOverdueTasks, getTaskEventsBetween } from '@/services/supabase/desktopReminders'
import { badgeText, buildTaskNotifications, catchUpSince } from '@/utils/taskReminders'
import { desktopNotificationsEnabled, readLastReminderCheck, writeLastReminderCheck } from '@/utils/desktopPrefs'

const POLL_MS = 60_000

// Desenha o número do ícone da barra de tarefas (círculo vermelho, número branco).
function drawBadge(count: number): string | null {
  const canvas = document.createElement('canvas')
  canvas.width = 32
  canvas.height = 32
  const context = canvas.getContext('2d')
  if (!context) return null
  context.fillStyle = '#ef4444'
  context.beginPath()
  context.arc(16, 16, 16, 0, Math.PI * 2)
  context.fill()
  const text = badgeText(count)
  context.fillStyle = '#ffffff'
  context.font = `bold ${text.length > 1 ? 17 : 21}px "Segoe UI", Arial, sans-serif`
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText(text, 16, 17)
  return canvas.toDataURL('image/png')
}

// Liga o site ao app de Windows: avisos do Windows quando um prazo ou
// lembrete chega, número de atrasadas no ícone da barra de tarefas e clique
// no aviso abrindo a tarefa. Fora do app (navegador) não faz nada. Cada
// função é checada antes do uso: versões antigas do app não têm todas.
export function DesktopIntegration() {
  const { user } = useAuthContext()
  const userId = user?.id ?? null
  const navigate = useNavigate()

  useEffect(() => {
    const desktop = typeof window === 'undefined' ? undefined : window.codeSellersDesktop
    if (!desktop?.onNavigate) return
    return desktop.onNavigate((path) => {
      if (typeof path === 'string' && path.startsWith('/')) navigate(path)
    })
  }, [navigate])

  useEffect(() => {
    const desktop = typeof window === 'undefined' ? undefined : window.codeSellersDesktop
    if (!desktop) return
    if (!userId) {
      desktop.setTaskbarBadge?.(0, null)
      return
    }

    let stopped = false
    let running = false
    let lastBadge = -1
    const currentUserId = userId

    async function refreshBadge() {
      if (!desktop?.setTaskbarBadge) return
      const overdue = await countOverdueTasks()
      if (stopped || overdue === lastBadge) return
      lastBadge = overdue
      desktop.setTaskbarBadge(overdue, overdue > 0 ? drawBadge(overdue) : null)
    }

    async function checkDueTasks() {
      if (!desktop?.notify) return
      const now = new Date()
      const lastCheck = readLastReminderCheck(currentUserId)
      // Primeira vez (ou avisos desligados): só marca o ponto de partida.
      if (!lastCheck || !desktopNotificationsEnabled()) {
        writeLastReminderCheck(currentUserId, now)
        return
      }
      const since = catchUpSince(lastCheck, now)
      if (since >= now) return
      const events = await getTaskEventsBetween(since, now)
      if (stopped) return
      // Só avança depois de consultar com sucesso: se a internet cair, a
      // próxima checagem cobre o mesmo intervalo e nada se perde.
      writeLastReminderCheck(currentUserId, now)
      for (const notification of buildTaskNotifications(events, now)) desktop.notify(notification)
    }

    async function tick() {
      if (running) return
      running = true
      try {
        await Promise.allSettled([refreshBadge(), checkDueTasks()])
      } finally {
        running = false
      }
    }

    void tick()
    const timer = window.setInterval(() => void tick(), POLL_MS)
    const onFocus = () => void tick()
    window.addEventListener('focus', onFocus)
    return () => {
      stopped = true
      window.clearInterval(timer)
      window.removeEventListener('focus', onFocus)
    }
  }, [userId])

  return null
}
