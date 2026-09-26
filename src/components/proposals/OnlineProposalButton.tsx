import { useRef, useState } from 'react'
import { Link2 } from 'lucide-react'
import { OnlineProposalModal } from '@/components/proposals/OnlineProposalModal'
import type { Deal } from '@/types'

export function OnlineProposalButton({ deal, className, onChanged }: { deal: Deal; className?: string; onChanged?: () => void }) {
  const [open, setOpen] = useState(false)
  // Recarregar o negócio desmonta esta tela; por isso só avisamos ao fechar.
  const changedRef = useRef(false)

  function handleClose() {
    setOpen(false)
    if (changedRef.current) {
      changedRef.current = false
      onChanged?.()
    }
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        <Link2 className="size-4 text-[var(--accent-text)]" />
        Proposta online
      </button>
      {open && (
        <OnlineProposalModal
          open={open}
          onClose={handleClose}
          deal={deal}
          onChanged={() => {
            changedRef.current = true
          }}
        />
      )}
    </>
  )
}
