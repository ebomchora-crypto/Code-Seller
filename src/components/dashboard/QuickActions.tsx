import { Button } from '@/components/ui/Button'

interface QuickActionsProps {
  onNewContact: () => void
  onNewDeal: () => void
}

export function QuickActions({ onNewContact, onNewDeal }: QuickActionsProps) {
  return (
    <div className="flex gap-2">
      <Button variant="secondary" size="sm" onClick={onNewContact}>
        + Novo Contato
      </Button>
      <Button size="sm" onClick={onNewDeal}>
        + Novo Negócio
      </Button>
    </div>
  )
}
