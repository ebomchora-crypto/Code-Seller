import { EASE_PREMIUM } from '@/utils/animations'

// Escala de duração única para toda animação nova do motion system.
// Mantém o CRM operacional rápido (feedback quase instantâneo) e reserva
// durações maiores só para transições de página e momentos "especiais".
export const duration = {
  micro: 0.12, // pointer down/up, ripple start
  hover: 0.18, // hover, focus
  enter: 0.28, // fade/slide/scale de entrada padrão
  panel: 0.4, // modal, drawer, popover
  page: 0.45, // page transition
  cinematic: 0.7, // hero/onboarding, usado com moderação
} as const

export const easing = {
  standard: EASE_PREMIUM,
  enter: EASE_PREMIUM,
  exit: [0.4, 0, 1, 1] as const,
  spring: { type: 'spring', stiffness: 420, damping: 32 } as const,
  springSoft: { type: 'spring', stiffness: 260, damping: 26 } as const,
}
