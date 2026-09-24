import type { Variants } from 'motion/react'

// Easing "premium" (expo-out) usado em toda animação de entrada do app —
// mesma curva usada na referência, para a mesma sensação de suavidade.
export const EASE_PREMIUM = [0.16, 1, 0.3, 1] as const
const IS_MOBILE = typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches
const mobileDuration = (desktop: number) => IS_MOBILE ? desktop * 0.7 : desktop

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: mobileDuration(0.8), ease: EASE_PREMIUM } },
}

export const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -36 },
  visible: { opacity: 1, x: 0, transition: { duration: mobileDuration(0.8), ease: EASE_PREMIUM } },
}

export const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 36 },
  visible: { opacity: 1, x: 0, transition: { duration: mobileDuration(0.8), ease: EASE_PREMIUM } },
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: { opacity: 1, scale: 1, transition: { duration: mobileDuration(0.7), ease: EASE_PREMIUM } },
}

export function staggerContainer(staggerDelay = 0.08): Variants {
  const delay = IS_MOBILE ? Math.min(staggerDelay, 0.03) : staggerDelay
  return {
    hidden: {},
    visible: { transition: { staggerChildren: delay, delayChildren: IS_MOBILE ? 0.03 : 0.1 } },
  }
}

export const wordReveal: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: mobileDuration(0.55), ease: EASE_PREMIUM } },
}
