import { useState } from 'react'
import { MessageSquareText } from 'lucide-react'
import { SendMessageModal, type MessageTarget } from '@/components/messages/SendMessageModal'
import type { TemplateCategory } from '@/types'

interface SendMessageButtonProps {
  target: MessageTarget
  initialCategory?: TemplateCategory
  onSent?: () => void
  className?: string
}

export function SendMessageButton({ target, initialCategory, onSent, className }: SendMessageButtonProps) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        <MessageSquareText className="size-4 text-[var(--accent-text)]" />
        Mensagem pronta
      </button>
      <SendMessageModal open={open} onClose={() => setOpen(false)} target={target} initialCategory={initialCategory} onSent={onSent} />
    </>
  )
}
