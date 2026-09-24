import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { useRevealOnScroll } from '@/motion/hooks'
import { staggerContainer } from '@/motion/variants'

interface StaggerGroupProps {
  children: ReactNode
  delay?: number
  className?: string
}

// Wrapper para listas curtas / grids de cards (métricas, itens de menu,
// resultados de busca) — cada filho precisa declarar `variants={scaleIn}`
// (ou `fadeInUp`) e herda o stagger do pai (Fase 3 — Stagger).
export function StaggerGroup({ children, delay = 0.08, className }: StaggerGroupProps) {
  const { ref, isInView } = useRevealOnScroll()

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={staggerContainer(delay)}
    >
      {children}
    </motion.div>
  )
}
