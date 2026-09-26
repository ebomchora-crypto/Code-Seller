import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Eye, FileText, Loader2, Paperclip, Sparkles, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { PanelHeader } from '@/components/ui/PanelHeader'
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
    <Card>
      <PanelHeader
        title="Proposta"
        subtitle={deal.proposal_url ? 'Arquivo anexado a este negócio' : 'Gere com IA ou anexe um PDF/DOCX'}
      />
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

      {!deal.proposal_url ? (
        <div className="grid gap-2.5 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setGeneratorOpen(true)}
            className="group flex items-center gap-3 rounded-[18px] border border-[var(--accent-ring)] bg-[var(--accent-tint)] p-3.5 text-left transition hover:brightness-110"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#8b5cf6,#6d28d9)] text-white">
              <Sparkles className="size-4" />
            </span>
            <span>
              <span className="block text-[13.5px] font-semibold text-[var(--text-primary)]">Gerar com IA</span>
              <span className="block text-[12px] text-[var(--text-muted)]">Usa os dados do negócio</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingProposal}
            className="flex items-center gap-3 rounded-[18px] border border-[var(--border-default)] p-3.5 text-left transition hover:border-[var(--border-strong)] disabled:opacity-60"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--bg-muted)] text-[var(--text-secondary)]">
              {uploadingProposal ? <Loader2 className="size-4 animate-spin" /> : <Paperclip className="size-4" />}
            </span>
            <span>
              <span className="block text-[13.5px] font-semibold text-[var(--text-primary)]">Anexar arquivo</span>
              <span className="block text-[12px] text-[var(--text-muted)]">PDF ou DOCX</span>
            </span>
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-[var(--border-default)] p-3.5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-tint)] text-[var(--accent-text)]">
              <FileText className="size-4" />
            </span>
            <span className="min-w-0 truncate text-[13.5px] font-medium text-[var(--text-primary)]">
              {fileNameFromPath(deal.proposal_url)}
            </span>
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={handleView}
              disabled={viewing}
              className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium text-[var(--accent-text)] transition hover:bg-[var(--accent-tint)] disabled:opacity-50"
            >
              <Eye className="size-3.5" />
              Abrir
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex h-8 items-center rounded-full px-3 text-[12.5px] font-medium text-[var(--text-secondary)] transition hover:bg-[var(--bg-muted)]"
            >
              Substituir
            </button>
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              aria-label="Remover proposta"
              title="Remover"
              className="flex size-8 items-center justify-center rounded-full text-[var(--text-muted)] transition hover:bg-red-500/10 hover:text-red-500"
            >
              <Trash2 className="size-3.5" />
            </button>
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
    </Card>
  )
}
