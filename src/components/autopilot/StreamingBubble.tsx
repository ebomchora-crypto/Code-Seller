import ReactMarkdown from 'react-markdown'
import { CopilotOrb } from '@/components/autopilot/CopilotOrb'
import { streamingPreview } from '@/utils/autopilot'

// Resposta do CS Copilot enquanto a IA escreve: o texto aparece aos poucos.
// No fim ela é trocada pela resposta final (já conferida e com os botões).
export function StreamingBubble({ text, status, onCancel }: { text: string; status: string | null; onCancel?: () => void }) {
  const preview = streamingPreview(text)
  return (
    <div className="flex justify-start gap-3" role="status" aria-live="polite" aria-busy="true">
      <CopilotOrb size="sm" thinking />
      <div className="min-w-0 flex-1">
        <p className="mb-1.5 flex items-center gap-2 text-[12.5px]">
          <span className="font-semibold text-[var(--text-primary)]">CS Copilot</span>
          <span className="text-[var(--text-muted)]">{status ? `${status}...` : 'escrevendo...'}</span>
          {onCancel && (
            <button type="button" onClick={onCancel} className="ml-auto text-xs text-[var(--text-muted)] underline">
              Parar
            </button>
          )}
        </p>
        <div className="autopilot-markdown autopilot-streaming text-[14.5px] leading-relaxed text-[var(--text-primary)]">
          <ReactMarkdown>{preview}</ReactMarkdown>
        </div>
      </div>
    </div>
  )
}
