// Preferências do app de Windows guardadas no próprio computador (são do
// aparelho, não da conta: quem usa o app em dois PCs escolhe em cada um).

const NOTIFY_KEY = 'cs-desktop-task-notifications'
const LAST_CHECK_PREFIX = 'cs-desktop-last-reminder-check:'

export function desktopNotificationsEnabled(): boolean {
  try {
    return localStorage.getItem(NOTIFY_KEY) !== 'off'
  } catch {
    return true
  }
}

export function setDesktopNotificationsEnabled(enabled: boolean) {
  try {
    localStorage.setItem(NOTIFY_KEY, enabled ? 'on' : 'off')
  } catch {
    // Sem storage: vale só enquanto o app estiver aberto.
  }
}

export function readLastReminderCheck(userId: string): Date | null {
  try {
    const raw = localStorage.getItem(LAST_CHECK_PREFIX + userId)
    const date = raw ? new Date(raw) : null
    return date && !Number.isNaN(date.getTime()) ? date : null
  } catch {
    return null
  }
}

export function writeLastReminderCheck(userId: string, date: Date) {
  try {
    localStorage.setItem(LAST_CHECK_PREFIX + userId, date.toISOString())
  } catch {
    // idem
  }
}
