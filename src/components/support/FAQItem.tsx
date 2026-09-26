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
    <div className={`rounded-2xl transition-colors ${open ? 'bg-black/[0.02] dark:bg-white/[0.03]' : ''}`}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left"
      >
        <span className="text-[14.5px] font-medium text-[var(--text-primary)]">{item.question}</span>
        <span
          className={`flex size-8 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
            open
              ? 'rotate-45 border-transparent bg-[linear-gradient(135deg,#8b5cf6,#6d28d9)] text-white'
              : 'border-[var(--border-default)] text-[var(--text-muted)]'
          }`}
        >
          <Plus className="size-4" />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.3, ease: EASE_PREMIUM }}
            className="overflow-hidden"
          >
            <p className="px-4 pb-4 text-[14px] leading-relaxed text-[var(--text-secondary)]">{item.answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
