import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { EASE_PREMIUM } from '@/utils/animations'

interface DrawerProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export function Drawer({ open, onClose, title, children }: DrawerProps) {
  const reducedMotion = useReducedMotion()
  useEffect(() => {
    if (!open) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  return createPortal(
    <AnimatePresence>
      {open && <motion.div className="fixed inset-0 z-50 flex justify-end">
      <motion.button
        type="button"
        aria-label="Fechar"
        onClick={onClose}
        initial={reducedMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-accent-ink/40 backdrop-blur-sm"
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        initial={reducedMotion ? false : { opacity: 0, x: 36 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 36 }}
        transition={{ duration: reducedMotion ? 0 : 0.4, ease: EASE_PREMIUM }}
        className="relative flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-[var(--border-default)] bg-[var(--bg-card)] shadow-glass-strong backdrop-blur-xl"
      >
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-6 py-5">
          <h2 id="drawer-title" className="font-display text-lg font-semibold tracking-tight text-[var(--text-primary)]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar painel"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-4 w-4">
              <path strokeLinecap="round" d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 px-6 py-5">{children}</div>
      </motion.div>
    </motion.div>}
    </AnimatePresence>,
    document.body,
  )
}
