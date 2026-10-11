// ============================================================================
// Utilitários de exportação de leads — Buyers Hunter
// Gera CSV (UTF-8 com BOM) e Excel real (.xlsx)
// ============================================================================

import writeExcelFile from 'write-excel-file/browser'
import type { Prospect, ScoredProspect } from '@/types'
import { isMobilePhone } from './prospection'
import { deduplicateProspects } from './prospectionDuplicates'

export type HasWebsiteValue = 'sim' | 'nao' | 'indeterminado'

export function getHasWebsiteValue(prospect: Prospect): HasWebsiteValue {
  if (prospect.website_kind === 'site') return 'sim'
  if (prospect.website_kind === 'none' || prospect.website_kind === 'social') return 'nao'
  return 'indeterminado'
}

interface ExportRow {
  name: string
  niche: string
  category: string
  city: string
  state: string
  country: string
  address: string
  phone: string
  whatsapp: string
  email: string
  website: string
  has_website: HasWebsiteValue
  rating: string
  reviews_count: string
  maps_url: string
  source: string
  created_at: string
}

const COLUMN_HEADERS: { key: keyof ExportRow; label: string; width: number }[] = [
  { key: 'name', label: 'Nome', width: 32 },
  { key: 'niche', label: 'Nicho', width: 20 },
  { key: 'category', label: 'Categoria', width: 22 },
  { key: 'city', label: 'Cidade', width: 20 },
  { key: 'state', label: 'Estado', width: 10 },
  { key: 'country', label: 'País', width: 12 },
  { key: 'address', label: 'Endereço', width: 42 },
  { key: 'phone', label: 'Telefone', width: 18 },
  { key: 'whatsapp', label: 'WhatsApp', width: 18 },
  { key: 'email', label: 'E-mail', width: 25 },
  { key: 'website', label: 'Website', width: 35 },
  { key: 'has_website', label: 'Tem Site', width: 14 },
  { key: 'rating', label: 'Avaliação', width: 12 },
  { key: 'reviews_count', label: 'Qtd. Avaliações', width: 16 },
  { key: 'maps_url', label: 'Google Maps', width: 45 },
  { key: 'source', label: 'Origem', width: 18 },
  { key: 'created_at', label: 'Data de Captura', width: 22 },
]

function prospectToRow(prospect: Prospect, searchNiche?: string): ExportRow {
  const phone = prospect.phone ?? ''
  const whatsapp = isMobilePhone(phone) ? phone : ''
  const hasWebsite = getHasWebsiteValue(prospect)

  return {
    name: prospect.name ?? '',
    niche: searchNiche ?? prospect.category ?? '',
    category: prospect.category ?? '',
    city: prospect.city ?? '',
    state: prospect.state ?? '',
    country: 'Brasil',
    address: prospect.address ?? '',
    phone,
    whatsapp,
    email: '',
    website: prospect.website ?? '',
    has_website: hasWebsite,
    rating: prospect.rating != null ? String(prospect.rating) : '',
    reviews_count: prospect.reviews != null ? String(prospect.reviews) : '0',
    maps_url: prospect.maps_url ?? '',
    source: 'Buyers Hunter',
    created_at: new Date().toLocaleDateString('pt-BR'),
  }
}

function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

export function exportProspectsToCSV(
  prospects: (Prospect | ScoredProspect)[],
  filename = 'leads',
  searchNiche?: string,
): void {
  const unique = deduplicateProspects(prospects)
  const rows = unique.map((p) => prospectToRow(p, searchNiche))

  const headerLine = COLUMN_HEADERS.map((col) => escapeCsvField(col.label)).join(';')
  const dataLines = rows.map((row) =>
    COLUMN_HEADERS.map((col) => escapeCsvField(String(row[col.key]))).join(';'),
  )

  // BOM UTF-8 (\uFEFF) para garantir acentuação correta no Excel brasileiro
  const csvContent = '\uFEFF' + [headerLine, ...dataLines].join('\r\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  downloadBlob(blob, `${filename}.csv`)
}

/** Linhas da planilha: cabeçalho em negrito e os dados na ordem das colunas. */
export function buildProspectSheet(prospects: (Prospect | ScoredProspect)[], searchNiche?: string) {
  const rows = deduplicateProspects(prospects).map((p) => prospectToRow(p, searchNiche))
  const header = COLUMN_HEADERS.map((col) => ({ value: col.label, fontWeight: 'bold' as const }))
  const body = rows.map((row) => COLUMN_HEADERS.map((col) => ({ value: String(row[col.key]) })))
  return { data: [header, ...body], columns: COLUMN_HEADERS.map((col) => ({ width: col.width })) }
}

export async function exportProspectsToExcel(
  prospects: (Prospect | ScoredProspect)[],
  filename = 'leads',
  searchNiche?: string,
): Promise<void> {
  const { data, columns } = buildProspectSheet(prospects, searchNiche)
  await writeExcelFile(data, { columns, sheet: 'Leads' }).toFile(`${filename}.xlsx`)
}

export function buildProspectionFilename(city?: string | null, niche?: string | null): string {
  const sanitize = (val: string) =>
    val
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')

  const date = new Date().toISOString().slice(0, 10)
  const c = city ? sanitize(city) : 'prospeccao'
  const n = niche ? sanitize(niche) : 'leads'
  return `buyers_hunter_${c}_${n}_${date}`
}
