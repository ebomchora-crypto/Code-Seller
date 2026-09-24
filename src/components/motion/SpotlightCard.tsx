import type { ReactNode } from 'react'
import { motion, useMotionTemplate } from 'motion/react'
import { useSpotlight } from '@/motion/hooks'

interface SpotlightCardProps {
  children: ReactNode
  className?: string
}

// Glass card com highlight radial que segue o cursor (Fase 14/15). Usar
// apenas em cards importantes (poucos por tela) — o gradiente é puro CSS
// via motion value, sem RAF loop custom.
export function SpotlightCard({ children, className = '' }: SpotlightCardProps) {
  const { ref, x, y, onPointerMove } = useSpotlight()
  const background = useMotionTemplate`radial-gradient(220px circle at ${x}% ${y}%, rgba(179, 92, 255, 0.14), transparent 70%)`

  return (
    <div
      ref={ref}
      onPointerMove={onPointerMove}
      className={`group relative overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] shadow-glass backdrop-blur-xl ${className}`}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background }}
      />
      <div className="relative">{children}</div>
    </div>
  )
}
