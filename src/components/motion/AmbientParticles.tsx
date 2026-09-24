import { useMemo } from 'react'
import { motion } from 'motion/react'
import { useReducedMotion } from '@/motion/hooks'

interface AmbientParticlesProps {
  count?: number
  className?: string
}

interface Particle {
  id: number
  left: number
  top: number
  size: number
  duration: number
  delay: number
}

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, id) => ({
    id,
    left: Math.random() * 100,
    top: Math.random() * 100,
    size: 2 + Math.random() * 3,
    duration: 14 + Math.random() * 10,
    delay: Math.random() * -20,
  }))
}

// Partículas MUITO sutis (Fase 18) — reservado para área de IA/automações.
// 2-20 pontos, opacidade baixa, movimento lento. Desligado com reduced
// motion (fica como fundo estático, sem RAF/canvas — puro CSS transform).
export function AmbientParticles({ count = 14, className = '' }: AmbientParticlesProps) {
  const reducedMotion = useReducedMotion()
  const particles = useMemo(() => generateParticles(Math.min(20, Math.max(2, count))), [count])

  if (reducedMotion) return null

  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {particles.map((particle) => (
        <motion.span
          key={particle.id}
          className="absolute rounded-full bg-accent-bright/40"
          style={{ left: `${particle.left}%`, top: `${particle.top}%`, width: particle.size, height: particle.size }}
          animate={{ y: [0, -18, 0], opacity: [0.15, 0.45, 0.15] }}
          transition={{ duration: particle.duration, delay: particle.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}
