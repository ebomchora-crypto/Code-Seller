// Link do WhatsApp a partir do telefone salvo. Número com "+" (ou "00") na
// frente já traz o código do país (ex.: +351 Portugal) e é usado como veio;
// número só com DDD é do Brasil (55).
export function whatsappUrl(phone: string | null | undefined): string | null {
  const raw = phone?.trim() ?? ''
  let digits = raw.replace(/\D/g, '')
  if (raw.startsWith('+') || raw.startsWith('00')) {
    if (raw.startsWith('00')) digits = digits.slice(2)
    return digits.length >= 8 && digits.length <= 15 ? `https://wa.me/${digits}` : null
  }
  if (digits.length === 10 || digits.length === 11) return `https://wa.me/55${digits}`
  if (digits.length >= 12 && digits.length <= 13) return `https://wa.me/${digits}`
  return null
}

export function siteUrl(site: string): string {
  return /^https?:\/\//i.test(site) ? site : `https://${site}`
}
