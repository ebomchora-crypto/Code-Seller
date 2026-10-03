// Países da busca do Buyers Hunter. Usado pela tela (escolha do país e código
// do WhatsApp) e pelo servidor (onde e em que idioma buscar).

export interface Country {
  /** Código ISO de 2 letras. */
  code: string
  /** Nome na tela. */
  name: string
  /** Nome usado na busca do mapa. */
  searchName: string
  /** Código de discagem do WhatsApp, sem o "+". */
  dial: string
  /** Idioma dos resultados. */
  language: string
  /** Como chamar o "estado" nesse país. */
  regionLabel: string
}

export const COUNTRIES: Country[] = [
  { code: 'BR', name: 'Brasil', searchName: 'Brazil', dial: '55', language: 'pt-BR', regionLabel: 'Estado' },
  { code: 'PT', name: 'Portugal', searchName: 'Portugal', dial: '351', language: 'pt-PT', regionLabel: 'Distrito' },
  { code: 'US', name: 'Estados Unidos', searchName: 'United States', dial: '1', language: 'en', regionLabel: 'Estado' },
  { code: 'CA', name: 'Canadá', searchName: 'Canada', dial: '1', language: 'en', regionLabel: 'Província' },
  { code: 'GB', name: 'Reino Unido', searchName: 'United Kingdom', dial: '44', language: 'en', regionLabel: 'Região' },
  { code: 'IE', name: 'Irlanda', searchName: 'Ireland', dial: '353', language: 'en', regionLabel: 'Condado' },
  { code: 'ES', name: 'Espanha', searchName: 'Spain', dial: '34', language: 'es', regionLabel: 'Província' },
  { code: 'FR', name: 'França', searchName: 'France', dial: '33', language: 'fr', regionLabel: 'Região' },
  { code: 'IT', name: 'Itália', searchName: 'Italy', dial: '39', language: 'it', regionLabel: 'Região' },
  { code: 'DE', name: 'Alemanha', searchName: 'Germany', dial: '49', language: 'de', regionLabel: 'Estado' },
  { code: 'NL', name: 'Holanda', searchName: 'Netherlands', dial: '31', language: 'nl', regionLabel: 'Província' },
  { code: 'BE', name: 'Bélgica', searchName: 'Belgium', dial: '32', language: 'fr', regionLabel: 'Província' },
  { code: 'CH', name: 'Suíça', searchName: 'Switzerland', dial: '41', language: 'de', regionLabel: 'Cantão' },
  { code: 'AT', name: 'Áustria', searchName: 'Austria', dial: '43', language: 'de', regionLabel: 'Estado' },
  { code: 'LU', name: 'Luxemburgo', searchName: 'Luxembourg', dial: '352', language: 'fr', regionLabel: 'Cantão' },
  { code: 'AR', name: 'Argentina', searchName: 'Argentina', dial: '54', language: 'es', regionLabel: 'Província' },
  { code: 'CL', name: 'Chile', searchName: 'Chile', dial: '56', language: 'es', regionLabel: 'Região' },
  { code: 'CO', name: 'Colômbia', searchName: 'Colombia', dial: '57', language: 'es', regionLabel: 'Departamento' },
  { code: 'MX', name: 'México', searchName: 'Mexico', dial: '52', language: 'es', regionLabel: 'Estado' },
  { code: 'PE', name: 'Peru', searchName: 'Peru', dial: '51', language: 'es', regionLabel: 'Região' },
  { code: 'UY', name: 'Uruguai', searchName: 'Uruguay', dial: '598', language: 'es', regionLabel: 'Departamento' },
  { code: 'PY', name: 'Paraguai', searchName: 'Paraguay', dial: '595', language: 'es', regionLabel: 'Departamento' },
  { code: 'AO', name: 'Angola', searchName: 'Angola', dial: '244', language: 'pt-PT', regionLabel: 'Província' },
  { code: 'MZ', name: 'Moçambique', searchName: 'Mozambique', dial: '258', language: 'pt-PT', regionLabel: 'Província' },
  { code: 'AU', name: 'Austrália', searchName: 'Australia', dial: '61', language: 'en', regionLabel: 'Estado' },
  { code: 'AE', name: 'Emirados Árabes', searchName: 'United Arab Emirates', dial: '971', language: 'en', regionLabel: 'Emirado' },
  { code: 'JP', name: 'Japão', searchName: 'Japan', dial: '81', language: 'ja', regionLabel: 'Província' },
]

export const DEFAULT_COUNTRY = 'BR'

export function findCountry(code: string | null | undefined): Country {
  const upper = code?.trim().toUpperCase()
  return COUNTRIES.find((country) => country.code === upper) ?? COUNTRIES[0]
}

// Telefone no formato internacional (+código do país), pronto para o WhatsApp.
// Usa o número internacional que a busca trouxe; senão monta com o código do
// país escolhido (tirando o 0 da frente, comum na Europa).
export function internationalPhone(
  phone: string | null | undefined,
  phoneInternational: string | null | undefined,
  countryCode: string | null | undefined,
): string | null {
  const intl = phoneInternational?.trim()
  if (intl && intl.replace(/\D/g, '').length >= 8) return intl.startsWith('+') ? intl : `+${intl.replace(/\D/g, '')}`
  const raw = phone?.trim()
  if (!raw) return null
  if (raw.startsWith('+')) return raw
  const country = findCountry(countryCode)
  let digits = raw.replace(/\D/g, '')
  if (!digits) return null
  if (digits.startsWith(country.dial) && digits.length > country.dial.length + 7) return `+${digits}`
  digits = digits.replace(/^0+/, '')
  return `+${country.dial}${digits}`
}
