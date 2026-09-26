// Link do WhatsApp a partir do telefone salvo; assume Brasil (55) quando o
// número vem só com DDD.
export function whatsappUrl(phone: string | null | undefined): string | null {
  const digits = phone?.replace(/\D/g, '') ?? ''
  if (digits.length === 10 || digits.length === 11) return `https://wa.me/55${digits}`
  if (digits.length >= 12 && digits.length <= 13) return `https://wa.me/${digits}`
  return null
}

export function siteUrl(site: string): string {
  return /^https?:\/\//i.test(site) ? site : `https://${site}`
}
