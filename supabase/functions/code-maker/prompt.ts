export function cleanUserText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}
