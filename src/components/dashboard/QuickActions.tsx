import { Button } from '@/components/ui/Button'
import { RippleContainer } from '@/components/motion/RippleContainer'

interface QuickActionsProps {
  onNewContact: () => void
  onNewDeal: () => void
}

export function QuickActions({ onNewContact, onNewDeal }: QuickActionsProps) {
  return (
    <div className="flex gap-2">
      <RippleContainer className="rounded-xl" color="rgba(95,0,178,0.18)">
        <Button variant="secondary" size="sm" onClick={onNewContact}>
          + Novo Contato
        </Button>
      </RippleContainer>
      <RippleContainer className="rounded-xl" color="rgba(255,255,255,0.35)">
        <Button size="sm" onClick={onNewDeal}>
          + Novo Negócio
        </Button>
      </RippleContainer>
    </div>
  )
}
