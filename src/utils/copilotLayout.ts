const SIDEBAR_COLLAPSED_KEY = 'cs-copilot:sidebar-collapsed'

interface ReadableStorage {
  getItem(key: string): string | null
}

interface WritableStorage {
  setItem(key: string, value: string): void
}

export function readCopilotSidebarCollapsed(storage: ReadableStorage): boolean {
  try {
    return storage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true'
  } catch {
    return false
  }
}

export function writeCopilotSidebarCollapsed(storage: WritableStorage, collapsed: boolean): void {
  try {
    storage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed))
  } catch {
    // Storage can be unavailable in private or restricted browser contexts.
  }
}
