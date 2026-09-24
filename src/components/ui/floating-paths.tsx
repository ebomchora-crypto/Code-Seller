import { useMemo, type ReactNode } from 'react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { useReducedMotion } from '@/hooks/useReducedMotion'

interface FloatingPathsBackgroundProps {
  position: number
  className?: string
  children: ReactNode
  /** Multiplicador de opacidade do conjunto de paths (0–1). Não afeta os
   * children — só a camada do SVG, para poder deixar o efeito quase
   * imperceptível em contextos como o AppLayout sem tocar no conteúdo. */
  pathOpacity?: number
  /** Quantidade de paths animados. Cada um anima via JS (motion), então o
   * custo por frame escala direto com esse número — reduza em contextos onde
   * o SVG convive com outras animações (ex: AutoPilot, que já tem BorderBeam). */
  pathCount?: number
}

// Adaptação Code Sellers: a cor dos paths foi alterada para purple-500 (em vez
// de slate-950) para manter a identidade roxa do produto, e a opacidade é
// controlada por quem usa o componente (via className/context) para não
// competir com o conteúdo em telas de trabalho comuns.
export function FloatingPathsBackground({
  position,
  children,
  className,
  pathOpacity = 1,
  pathCount = 18,
}: FloatingPathsBackgroundProps) {
  const reducedMotion = useReducedMotion()
  // Memoizado por `position`/`pathCount`: sem isso, cada re-render do componente
  // pai (ex: nova mensagem chegando no chat do AutoPilot) recriaria o array com
  // novas durações aleatórias, fazendo as animações "pularem"/reiniciarem.
  const paths = useMemo(
    () =>
      Array.from({ length: pathCount }, (_, i) => ({
        id: i,
        d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${380 - i * 5 * position} -${189 + i * 6} -${
          312 - i * 5 * position
        } ${216 - i * 6} ${152 - i * 5 * position} ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
          684 - i * 5 * position
        } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
        width: 0.5 + i * 0.03,
        duration: 20 + ((i * 7 + Math.abs(position) * 3) % 10),
      })),
    [position, pathCount],
  )

  return (
    <div className={cn('relative w-full', className)}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ opacity: pathOpacity }}>
        <svg className="h-full w-full text-purple-500" viewBox="0 0 696 316" fill="none">
          {paths.map((path) => (
            <motion.path
              key={path.id}
              d={path.d}
              stroke="currentColor"
              strokeWidth={path.width}
              strokeOpacity={0.08 + path.id * 0.015}
              initial={{ pathLength: 0.3, opacity: 0.6 }}
              animate={{
                pathLength: 1,
                opacity: [0.3, 0.6, 0.3],
                pathOffset: [0, 1, 0],
              }}
              transition={{
                duration: path.duration,
                repeat: reducedMotion ? 0 : Infinity,
                ease: 'linear',
              }}
            />
          ))}
        </svg>
      </div>
      {children}
    </div>
  )
}
