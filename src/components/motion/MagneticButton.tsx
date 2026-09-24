import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { motion } from 'motion/react'
import { useMagnetic } from '@/motion/hooks'

type NativeButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration'
>

interface MagneticButtonProps extends NativeButtonProps {
  children: ReactNode
  strength?: number
}

// Botão magnético (Fase 6): usar SOMENTE no CTA principal de uma tela (criar
// lead/negócio, CTA de automação). Nunca em botões secundários/tabelas.
export function MagneticButton({ children, strength, className, ...props }: MagneticButtonProps) {
  const { ref, x, y, onPointerMove, onPointerLeave, enabled } = useMagnetic({ strength })

  return (
    <motion.button
      ref={ref as React.Ref<HTMLButtonElement>}
      style={enabled ? { x, y } : undefined}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      whileTap={{ scale: 0.97 }}
      className={className}
      {...props}
    >
      {children}
    </motion.button>
  )
}
