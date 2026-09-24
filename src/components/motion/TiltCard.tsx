import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { useTilt3D } from '@/motion/hooks'

interface TiltCardProps {
  children: ReactNode
  className?: string
  max?: number
}

// 3D Tilt (Fase 6): SOMENTE em cards de destaque (planos, IA, módulos
// especiais). Não usar em tabela, formulário ou grids grandes.
export function TiltCard({ children, className, max }: TiltCardProps) {
  const { ref, rotateX, rotateY, onPointerMove, onPointerLeave, enabled } = useTilt3D({ max })

  return (
    <motion.div
      ref={ref}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      style={enabled ? { rotateX, rotateY, transformPerspective: 800 } : undefined}
      className={className}
    >
      {children}
    </motion.div>
  )
}
