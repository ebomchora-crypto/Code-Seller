import type { Variants } from 'motion/react'
import { duration, easing } from '@/motion/tokens'

// Reexporta as variants já existentes em src/utils/animations.ts (fonte
// original, mantida por compatibilidade com ~19 arquivos que já importam
// dali). Este módulo só ADICIONA o que faltava na biblioteca do PDF.
export {
  EASE_PREMIUM,
  fadeInUp,
  fadeInLeft,
  fadeInRight,
  scaleIn,
  staggerContainer,
  wordReveal,
} from '@/utils/animations'

export const rotateIn: Variants = {
  hidden: { opacity: 0, rotate: -6, scale: 0.96 },
  visible: {
    opacity: 1,
    rotate: 0,
    scale: 1,
    transition: { duration: duration.enter, ease: easing.enter },
  },
}

export const bounceIn: Variants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: { opacity: 1, scale: 1, transition: easing.spring },
}

export const elastic: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 12 },
  },
}

// Reveal por clip-path — cortina que sobe revelando o conteúdo (títulos,
// estados vazios, blocos importantes). Sem transform de layout, então não
// desloca vizinhos.
export const reveal: Variants = {
  hidden: { clipPath: 'inset(100% 0 0 0)', opacity: 0.4 },
  visible: {
    clipPath: 'inset(0% 0 0 0)',
    opacity: 1,
    transition: { duration: duration.cinematic, ease: easing.enter },
  },
}

// Mask reveal — camada sólida desliza para o lado descobrindo o conteúdo.
// Usar com moderação: onboarding, hero, headings grandes.
export const maskCurtain: Variants = {
  hidden: { scaleX: 1 },
  visible: {
    scaleX: 0,
    transition: { duration: duration.cinematic, ease: easing.enter },
  },
}

export const flipAxisEnter: Variants = {
  hidden: { opacity: 0, rotateX: -12, transformPerspective: 800 },
  visible: {
    opacity: 1,
    rotateX: 0,
    transition: { duration: duration.enter, ease: easing.enter },
  },
}

// Feedback de pressão de botão — global, barato, aplicado no Button.tsx.
export const pressFeedback = {
  whileTap: { scale: 0.98 },
  transition: { duration: duration.micro, ease: easing.standard },
}
