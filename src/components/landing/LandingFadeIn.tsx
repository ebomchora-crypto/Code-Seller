import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { useReducedMotion } from '@/motion/hooks'

const EASE = [0.22, 1, 0.36, 1] as const

interface LandingFadeInProps {
  children: ReactNode
  className?: string
  delay?: number
}

// Entrada das seções pós-hero: sobe e sai do desfoque, uma vez só — mesma
// curva e duração da referência.
export function LandingFadeIn({ children, className, delay = 0 }: LandingFadeInProps) {
  const reducedMotion = useReducedMotion()

  if (reducedMotion) return <div className={className}>{children}</div>

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 34, filter: 'blur(10px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, amount: 0.16 }}
      transition={{ duration: 0.78, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  )
}
