import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { useReducedMotion } from '@/motion/hooks'
import { duration, easing } from '@/motion/tokens'

interface FlipItemProps {
  children: ReactNode
  as?: 'div' | 'tr' | 'li'
  className?: string
  layoutId?: string
}

const tagMap = {
  div: motion.div,
  tr: motion.tr,
  li: motion.li,
} as const

// Item de lista/tabela/kanban com layout FLIP automático (Fase 12/24):
// entra com fade + leve slide, sai com fade + scale mínimo, e reflui de
// posição suavemente quando a lista reordena/filtra — sem salto abrupto.
// Envolva a lista com <AnimatePresence>.
export function FlipItem({ children, as = 'div', className, layoutId }: FlipItemProps) {
  const reducedMotion = useReducedMotion()
  const MotionTag = tagMap[as]

  return (
    <MotionTag
      layout={!reducedMotion}
      layoutId={layoutId}
      className={className}
      initial={reducedMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reducedMotion ? undefined : { opacity: 0, scale: 0.98 }}
      transition={{ duration: duration.enter, ease: easing.standard }}
    >
      {children}
    </MotionTag>
  )
}
