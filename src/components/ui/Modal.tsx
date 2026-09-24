import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { EASE_PREMIUM } from '@/utils/animations'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
}

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
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
      {open && <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.button
        type="button"
        aria-label="Fechar"
        onClick={onClose}
        initial={reducedMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-accent-ink/40 backdrop-blur-sm"
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        initial={reducedMotion ? false : { opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: reducedMotion ? 0 : 0.4, ease: EASE_PREMIUM }}
        className={`relative w-full rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] p-6 shadow-glass-strong backdrop-blur-xl ${sizeClasses[size]}`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="modal-title" className="font-display text-lg font-semibold tracking-tight text-[var(--text-primary)]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar modal"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-4 w-4">
              <path strokeLinecap="round" d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>}
    </AnimatePresence>,
    document.body,
  )
}
