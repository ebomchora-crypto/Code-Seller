import { useRef } from 'react'
import { useInView } from 'motion/react'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { staggerContainer } from '@/utils/animations'

// Revela um elemento uma única vez ao entrar na viewport — nunca reanima ao
// subir/descer a página (isso é o que evita o travamento de animações
// contínuas já identificado no AutoPilot).
export function useRevealOnScroll<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null)
  const reducedMotion = useReducedMotion()
  const inView = useInView(ref, { margin: '-60px', once: true })

  return { ref, isInView: reducedMotion || inView }
}

export function useStaggerChildren(staggerDelay = 0.08) {
  return staggerContainer(staggerDelay)
}

export { useReducedMotion }
