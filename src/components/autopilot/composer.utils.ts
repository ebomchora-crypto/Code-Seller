export function getChatSubmission(value: string): string | null {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function shouldSubmitChat(key: string, shiftKey: boolean): boolean {
  return key === 'Enter' && !shiftKey
}
