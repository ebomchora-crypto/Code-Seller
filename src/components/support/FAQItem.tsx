import { Plus } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import type { FAQItem as FAQItemType } from '@/types'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { EASE_PREMIUM } from '@/utils/animations'

interface FAQItemProps {
  item: FAQItemType
  open: boolean
  onToggle: () => void
}

export function FAQItem({ item, open, onToggle }: FAQItemProps) {
  const reducedMotion = useReducedMotion()
  return (
    <div className="border-b border-[var(--border-subtle)]">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 py-4 text-left transition-colors hover:text-purple-500"
      >
        <span className="text-sm font-medium text-[var(--text-primary)]">{item.question}</span>
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${open ? 'rotate-45 border-accent bg-accent text-white' : 'border-[var(--border-default)] text-[var(--text-muted)]'}`}>
        <Plus
          className="h-4 w-4"
        />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: reducedMotion ? 0 : 0.3, ease: EASE_PREMIUM }}
          className="pb-4"
        >
          <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{item.answer}</p>
        </motion.div>}
      </AnimatePresence>
    </div>
  )
}
