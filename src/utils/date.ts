export function formatRelativeDate(value: string): string {
  const date = new Date(value)
  const diffMs = Date.now() - date.getTime()
  const diffMinutes = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMinutes < 1) return 'agora mesmo'
  if (diffMinutes < 60) return `há ${diffMinutes} ${diffMinutes === 1 ? 'minuto' : 'minutos'}`
  if (diffHours < 24) return `há ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`
  if (diffDays < 30) return `há ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`

  return date.toLocaleDateString('pt-BR')
}
