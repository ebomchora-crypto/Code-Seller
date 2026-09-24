import { useState } from 'react'
import Papa from 'papaparse'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { importContacts, type ImportContactsResult } from '@/services/supabase/contacts'
import type { Contact, ContactStatus } from '@/types'

interface ImportCSVModalProps {
  open: boolean
  onClose: () => void
  onImported: () => void
}

type ContactField = keyof Pick<
  Contact,
  'name' | 'email' | 'phone' | 'niche' | 'city' | 'state' | 'status' | 'origin' | 'current_site' | 'notes'
>

const FIELD_OPTIONS: { value: ContactField | 'ignore'; label: string }[] = [
  { value: 'ignore', label: 'Ignorar coluna' },
  { value: 'name', label: 'Nome' },
  { value: 'email', label: 'E-mail' },
  { value: 'phone', label: 'Telefone' },
  { value: 'niche', label: 'Nicho' },
  { value: 'city', label: 'Cidade' },
  { value: 'state', label: 'Estado' },
  { value: 'status', label: 'Status' },
  { value: 'origin', label: 'Origem' },
  { value: 'current_site', label: 'Site atual' },
  { value: 'notes', label: 'Observações' },
]

const HEADER_TO_FIELD: Record<string, ContactField> = {
  nome: 'name',
  name: 'name',
  email: 'email',
  telefone: 'phone',
  phone: 'phone',
  nicho: 'niche',
  cidade: 'city',
  city: 'city',
  estado: 'state',
  state: 'state',
  status: 'status',
  origem: 'origin',
  origin: 'origin',
  site_atual: 'current_site',
  observacoes: 'notes',
  notes: 'notes',
}

const TEMPLATE_HEADERS = 'nome,email,telefone,nicho,cidade,estado,status,origem,site_atual,observacoes'

function normalizeHeader(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

function downloadTemplate() {
  const blob = new Blob([`${TEMPLATE_HEADERS}\n`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'code-sellers-contatos-modelo.csv'
  link.click()
  URL.revokeObjectURL(url)
}

function downloadErrorReport(errors: ImportContactsResult['errorDetails']) {
  const rows = ['linha,erro', ...errors.map((item) => `${item.row},"${item.message.replace(/"/g, "'")}"`)]
  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'code-sellers-erros-importacao.csv'
  link.click()
  URL.revokeObjectURL(url)
}

type Step = 'upload' | 'mapping' | 'result'

export function ImportCSVModal({ open, onClose, onImported }: ImportCSVModalProps) {
  const [step, setStep] = useState<Step>('upload')
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<Record<string, string>[]>([])
  const [mapping, setMapping] = useState<Record<string, ContactField | 'ignore'>>({})
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportContactsResult | null>(null)

  function reset() {
    setStep('upload')
    setHeaders([])
    setRows([])
    setMapping({})
    setResult(null)
  }

  function handleClose() {
    reset()
    onClose()
  }

  function handleFile(file: File) {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (parsed) => {
        const parsedHeaders = parsed.meta.fields ?? []
        if (parsedHeaders.length === 0 || parsed.data.length === 0) {
          toast.error('Não foi possível ler colunas ou linhas no arquivo enviado.')
          return
        }

        const autoMapping: Record<string, ContactField | 'ignore'> = {}
        for (const header of parsedHeaders) {
          const normalized = normalizeHeader(header)
          autoMapping[header] = HEADER_TO_FIELD[normalized] ?? 'ignore'
        }

        setHeaders(parsedHeaders)
        setRows(parsed.data)
        setMapping(autoMapping)
        setStep('mapping')
      },
      error: () => toast.error('Erro ao processar o arquivo CSV.'),
    })
  }

  async function handleImport() {
    setImporting(true)
    try {
      const contacts = rows.map((row) => {
        const contact: Partial<Contact> = {}
        for (const header of headers) {
          const field = mapping[header]
          if (field === 'ignore' || !field) continue
          const value = row[header]?.trim()
          if (!value) continue
          if (field === 'status') {
            contact.status = value.toLowerCase() as ContactStatus
          } else {
            contact[field] = value
          }
        }
        return contact
      })

      const importResult = await importContacts(contacts)
      setResult(importResult)
      setStep('result')
      if (importResult.success > 0) {
        onImported()
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível importar os contatos.')
    } finally {
      setImporting(false)
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Importar contatos via CSV" size="lg">
      {step === 'upload' && (
        <div className="flex flex-col gap-4">
          <div className="rounded-lg bg-purple-50 p-4 text-sm text-purple-700">
            <p>
              O arquivo deve conter as colunas: <strong>{TEMPLATE_HEADERS}</strong>.
            </p>
            <button type="button" onClick={downloadTemplate} className="mt-2 font-medium underline">
              Baixar modelo CSV
            </button>
          </div>

          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-300 px-6 py-12 text-center transition-colors hover:border-purple-300 hover:bg-purple-50/40">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} className="h-8 w-8 text-purple-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0 4 4m-4-4-4 4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
            </svg>
            <span className="text-sm font-medium text-neutral-700">Clique ou arraste o arquivo CSV aqui</span>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) handleFile(file)
              }}
            />
          </label>
        </div>
      )}

      {step === 'mapping' && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-neutral-600">
            Associe cada coluna do seu arquivo a um campo do contato. Mostrando prévia das 5 primeiras linhas.
          </p>

          <div className="overflow-x-auto rounded-lg border border-neutral-200">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50">
                  {headers.map((header) => (
                    <th key={header} className="min-w-[160px] px-3 py-2">
                      <p className="mb-1 font-medium text-neutral-700">{header}</p>
                      <Select
                        value={mapping[header] ?? 'ignore'}
                        onChange={(event) =>
                          setMapping((current) => ({
                            ...current,
                            [header]: event.target.value as ContactField | 'ignore',
                          }))
                        }
                        className="h-8 text-xs"
                      >
                        {FIELD_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </Select>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 5).map((row, index) => (
                  <tr key={index} className="border-b border-neutral-100 last:border-0">
                    {headers.map((header) => (
                      <td key={header} className="px-3 py-2 text-neutral-500">
                        {row[header] || '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-neutral-500">{rows.length} linhas encontradas no arquivo.</p>

          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={reset}>
              Voltar
            </Button>
            <Button onClick={handleImport} loading={importing}>
              Importar
            </Button>
          </div>
        </div>
      )}

      {step === 'result' && result && (
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-50 text-purple-600">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
            </svg>
          </div>
          <p className="text-base font-medium text-neutral-900">
            {result.success} contatos importados com sucesso. {result.errors} erros.
          </p>
          {result.errors > 0 && (
            <button
              type="button"
              onClick={() => downloadErrorReport(result.errorDetails)}
              className="text-sm font-medium text-purple-600 hover:text-purple-700"
            >
              Baixar relatório de erros
            </button>
          )}
          <Button onClick={handleClose}>Concluir</Button>
        </div>
      )}
    </Modal>
  )
}
