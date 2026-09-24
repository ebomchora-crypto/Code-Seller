import type { ReactNode } from 'react'
import { motion, type Variants } from 'motion/react'
import { useRevealOnScroll } from '@/motion/hooks'
import { fadeInUp } from '@/motion/variants'

interface RevealProps {
  children: ReactNode
  variants?: Variants
  className?: string
  as?: 'div' | 'section'
}

// Título, estado vazio ou bloco importante que "aparece" uma única vez ao
// entrar na viewport (Fase 3 — Reveal). Para casos que precisam de outro
// movimento, passe `variants` (ex.: `reveal`, `maskCurtain`, `scaleIn`).
export function Reveal({ children, variants = fadeInUp, className, as = 'div' }: RevealProps) {
  const { ref, isInView } = useRevealOnScroll()
  const MotionTag = as === 'section' ? motion.section : motion.div

  return (
    <MotionTag
      ref={ref}
      className={className}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={variants}
    >
      {children}
    </MotionTag>
  )
}
