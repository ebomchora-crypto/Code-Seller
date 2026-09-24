import { motion } from 'motion/react'
import { useReducedMotion } from '@/motion/hooks'

interface AmbientBackgroundProps {
  src: string
  className?: string
  /** Opacidade da imagem — mantém contraste do conteúdo por cima. */
  opacity?: number
}

// Fundo roxo com "breathing scale" muito sutil (Fase 22) — reservado para
// telas imersivas/especiais (hoje: Autopilot). Nunca deforma a imagem
// permanentemente, só um zoom lento de ida e volta; desliga com reduced
// motion (fica estático).
export function AmbientBackground({ src, className = '', opacity = 0.4 }: AmbientBackgroundProps) {
  const reducedMotion = useReducedMotion()

  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <motion.img
        src={src}
        alt=""
        className="h-full w-full object-cover"
        style={{ opacity }}
        animate={reducedMotion ? undefined : { scale: [1, 1.06, 1] }}
        transition={reducedMotion ? undefined : { duration: 26, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Overlay escuro — garante contraste do conteúdo (texto branco/glass)
          sobre a imagem, principalmente nos cantos mais claros. */}
      <div className="absolute inset-0 bg-gradient-to-b from-accent-ink/60 via-accent-ink/70 to-accent-ink/90" />
    </div>
  )
}
