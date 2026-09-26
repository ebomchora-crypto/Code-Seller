import { useState } from 'react'
import { FileSignature } from 'lucide-react'
import { ContractModal } from '@/components/contracts/ContractModal'
import type { Deal } from '@/types'

export function ContractButton({ deal, className }: { deal: Deal; className?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        <FileSignature className="size-4 text-[var(--accent-text)]" />
        Contrato
      </button>
      {open && <ContractModal open={open} onClose={() => setOpen(false)} deal={deal} />}
    </>
  )
}
