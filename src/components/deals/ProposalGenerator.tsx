import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import type { ProposalGenerationPayload } from '@/types'

interface ProposalGeneratorProps {
  open: boolean
  onClose: () => void
  basePayload: Omit<ProposalGenerationPayload, 'additional_context'>
  generating: boolean
  onGenerate: (payload: ProposalGenerationPayload) => Promise<string | null>
}

function ShimmerLine({ width }: { width: string }) {
  return <div className={`h-3 animate-pulse rounded bg-neutral-200/70`} style={{ width }} />
}

export function ProposalGenerator({ open, onClose, basePayload, generating, onGenerate }: ProposalGeneratorProps) {
  const [additionalContext, setAdditionalContext] = useState('')
  const [result, setResult] = useState<string | null>(null)

  async function handleGenerate() {
    const text = await onGenerate({ ...basePayload, additional_context: additionalContext.trim() || undefined })
    if (text) setResult(text)
  }

  function handleClose() {
    setResult(null)
    setAdditionalContext('')
    onClose()
  }

  async function handleCopy() {
    if (!result) return
    await navigator.clipboard.writeText(result)
    toast.success('Proposta copiada para a área de transferência.')
  }

  function handleDownload() {
    if (!result) return
    const blob = new Blob([result], { type: 'text/plain;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `proposta-${basePayload.deal.title.toLowerCase().replace(/\s+/g, '-')}.txt`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Modal open={open} onClose={handleClose} title="Gerar proposta com IA" size="lg">
      {!result && !generating && (
        <div className="flex flex-col gap-4">
          <Textarea
            label="Contexto adicional (opcional)"
            placeholder='Ex: "cliente quer site de advocacia previdenciária com blog"'
            value={additionalContext}
            onChange={(event) => setAdditionalContext(event.target.value)}
          />
          <div className="flex justify-end">
            <Button onClick={handleGenerate}>Gerar proposta</Button>
          </div>
        </div>
      )}

      {generating && (
        <div className="flex flex-col items-center gap-4 py-10">
          <p className="text-sm font-medium text-purple-600">Gerando sua proposta…</p>
          <div className="w-full space-y-3">
            <ShimmerLine width="60%" />
            <ShimmerLine width="90%" />
            <ShimmerLine width="80%" />
            <ShimmerLine width="95%" />
            <ShimmerLine width="70%" />
          </div>
        </div>
      )}

      {result && !generating && (
        <div className="flex flex-col gap-4">
          <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
            Revise o conteúdo antes de enviar ao cliente.
          </div>

          <div className="proposal-markdown max-h-[50vh] overflow-y-auto rounded-lg border border-neutral-200 p-4 text-sm text-neutral-700">
            <ReactMarkdown>{result}</ReactMarkdown>
          </div>

          <div className="flex flex-wrap justify-end gap-3">
            <Button variant="ghost" onClick={handleClose}>
              Fechar
            </Button>
            <Button variant="secondary" onClick={handleGenerate}>
              Regenerar
            </Button>
            <Button variant="secondary" onClick={handleDownload}>
              Baixar como .txt
            </Button>
            <Button onClick={handleCopy}>Copiar texto</Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
