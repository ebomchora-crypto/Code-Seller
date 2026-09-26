import { useEffect, useState } from 'react'
import { Repeat, StopCircle } from 'lucide-react'
import { toast } from 'sonner'
import { hasOpenFollowUp, startFollowUp, stopFollowUp, type FollowUpTarget } from '@/services/supabase/followup'

interface FollowUpButtonProps {
  target: FollowUpTarget
  className?: string
  onChange?: () => void
}

// Liga ou para a sequência de follow-up de um contato.
export function FollowUpButton({ target, className, onChange }: FollowUpButtonProps) {
  const [active, setActive] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    hasOpenFollowUp(target.contact.id)
      .then(setActive)
      .catch(() => setActive(false))
  }, [target.contact.id])

  async function toggle() {
    setBusy(true)
    try {
      if (active) {
        await stopFollowUp(target.contact.id)
        setActive(false)
        toast.success('Follow-up parado. As tarefas em aberto foram canceladas.')
      } else {
        const count = await startFollowUp(target, { force: true })
        setActive(count > 0)
        toast.success(count > 0 ? `${count} follow-ups agendados nas Tarefas, com lembrete.` : 'Nenhum follow-up foi criado.')
      }
      onChange?.()
    } catch {
      toast.error('Não foi possível atualizar o follow-up.')
    } finally {
      setBusy(false)
    }
  }

  if (active === null) return null

  return (
    <button type="button" onClick={() => void toggle()} disabled={busy} className={className}>
      {active ? <StopCircle className="size-4 text-amber-500" /> : <Repeat className="size-4 text-[var(--accent-text)]" />}
      {active ? 'Parar follow-up' : 'Iniciar follow-up'}
    </button>
  )
}
