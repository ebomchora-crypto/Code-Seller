import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ProposalGenerator } from '@/components/deals/ProposalGenerator'
import { getSignedProposalUrl } from '@/services/supabase/proposals'
import type { Deal, ProposalGenerationPayload } from '@/types'

interface ProposalSectionProps {
  deal: Deal
  contactName: string
  contactNiche: string | null
  userName: string
  uploadProposal: (file: File) => Promise<void>
  uploadingProposal: boolean
  deleteProposal: () => Promise<void>
  generateProposal: (payload: ProposalGenerationPayload) => Promise<string | null>
  generatingProposal: boolean
}

function fileNameFromPath(path: string): string {
  return path.split('/').pop() ?? path
}

export function ProposalSection({
  deal,
  contactName,
  contactNiche,
  userName,
  uploadProposal,
  uploadingProposal,
  deleteProposal,
  generateProposal,
  generatingProposal,
}: ProposalSectionProps) {
  const [generatorOpen, setGeneratorOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [viewing, setViewing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileSelected(file: File) {
    await uploadProposal(file)
  }

  async function handleView() {
    if (!deal.proposal_url) return
    // Abrimos a aba em branco de forma síncrona (dentro do clique) para evitar
    // que o navegador bloqueie o popup enquanto aguardamos a signed URL.
    const newTab = window.open('', '_blank')
    setViewing(true)
    try {
      const url = await getSignedProposalUrl(deal.proposal_url)
      if (newTab) newTab.location.href = url
    } catch (err) {
      newTab?.close()
      toast.error(err instanceof Error ? err.message : 'Não foi possível abrir a proposta.')
    } finally {
      setViewing(false)
    }
  }

  async function handleConfirmDelete() {
    setDeleting(true)
    await deleteProposal()
    setDeleting(false)
    setDeleteOpen(false)
  }

  const basePayload: Omit<ProposalGenerationPayload, 'additional_context'> = {
    deal,
    contact_name: contactName,
    contact_niche: contactNiche,
    user_name: userName,
  }

  return (
    <div className="rounded-xl border border-purple-200 bg-white p-4">
      <p className="label-caps mb-3">Proposta</p>

      {!deal.proposal_url ? (
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" size="sm" onClick={() => setGeneratorOpen(true)}>
            Gerar com IA
          </Button>
          <Button
            variant="ghost"
            size="sm"
            loading={uploadingProposal}
            onClick={() => fileInputRef.current?.click()}
          >
            Anexar proposta
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) void handleFileSelected(file)
              event.target.value = ''
            }}
          />
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-5 w-5 text-purple-600">
              <path d="M9 3v2m6-2v2M5 8h14M6 8v11a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8" />
            </svg>
            <span className="max-w-[160px] truncate text-sm text-neutral-700">
              {fileNameFromPath(deal.proposal_url)}
            </span>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleView}
              disabled={viewing}
              className="text-xs font-medium text-purple-600 hover:text-purple-700 disabled:opacity-50"
            >
              Visualizar
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-medium text-neutral-500 hover:text-neutral-700"
            >
              Substituir
            </button>
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className="text-xs font-medium text-neutral-500 hover:text-red-600"
            >
              Remover
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) void handleFileSelected(file)
                event.target.value = ''
              }}
            />
          </div>
        </div>
      )}

      <ProposalGenerator
        open={generatorOpen}
        onClose={() => setGeneratorOpen(false)}
        basePayload={basePayload}
        generating={generatingProposal}
        onGenerate={generateProposal}
      />

      <ConfirmDialog
        open={deleteOpen}
        title="Remover proposta"
        message="Tem certeza que deseja remover o arquivo de proposta anexado a este negócio?"
        confirmLabel="Remover"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  )
}
