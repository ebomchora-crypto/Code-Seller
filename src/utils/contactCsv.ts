// Ajustes para CSVs exportados de outros lugares — hoje, o "CSV do Google"
// (contacts.google.com → Exportar). Testado em src/utils/contactCsv.test.mjs.

export const FULL_NAME_HEADER = 'Nome completo'

export function normalizeCsvHeader(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

// Colunas do CSV do Google que já têm campo certo no CRM.
export const GOOGLE_HEADER_ALIASES: Record<string, string> = {
  'e-mail 1 - value': 'email',
  'phone 1 - value': 'phone',
  'address 1 - city': 'city',
  'address 1 - region': 'state',
  'website 1 - value': 'current_site',
  [normalizeCsvHeader(FULL_NAME_HEADER)]: 'name',
}

const NAME_HEADERS = new Set(['nome', 'name'])
const NAME_PARTS = [
  ['first name', 'given name'],
  ['middle name', 'additional name'],
  ['last name', 'family name'],
]
const COMPANY_HEADERS = ['organization name', 'organization 1 - name']

// O Google separa o nome em Nome/Nome do meio/Sobrenome (e às vezes só tem a
// empresa). Se o arquivo não tem uma coluna de nome inteiro, cria
// "Nome completo" juntando as partes.
export function addFullNameColumn(
  headers: string[],
  rows: Record<string, string>[],
): { headers: string[]; rows: Record<string, string>[] } {
  const byNormalized = new Map(headers.map((header) => [normalizeCsvHeader(header), header]))
  if (headers.some((header) => NAME_HEADERS.has(normalizeCsvHeader(header)))) return { headers, rows }

  const partHeaders = NAME_PARTS.map((aliases) => aliases.map((alias) => byNormalized.get(alias)).find(Boolean))
  const companyHeader = COMPANY_HEADERS.map((alias) => byNormalized.get(alias)).find(Boolean)
  if (!partHeaders.some(Boolean) && !companyHeader) return { headers, rows }

  const nextRows = rows.map((row) => {
    const fromParts = partHeaders
      .map((header) => (header ? row[header]?.trim() : ''))
      .filter(Boolean)
      .join(' ')
    const fullName = fromParts || (companyHeader ? row[companyHeader]?.trim() ?? '' : '')
    return { [FULL_NAME_HEADER]: fullName, ...row }
  })
  return { headers: [FULL_NAME_HEADER, ...headers], rows: nextRows }
}

// Quando o contato tem mais de um telefone/e-mail, o Google junta tudo no
// mesmo campo separado por " ::: ". Nos campos de um valor só, fica o primeiro
// (senão o botão do WhatsApp e o e-mail quebram). Observações ficam inteiras.
const MULTI_VALUE_SEPARATOR = /\s*:::\s*/

export function firstCsvValue(field: string, value: string): string {
  if (field === 'notes') return value.split(MULTI_VALUE_SEPARATOR).join(' · ')
  return value.split(MULTI_VALUE_SEPARATOR).find((part) => part.trim())?.trim() ?? ''
}
