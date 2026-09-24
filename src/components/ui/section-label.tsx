import type { ReactNode } from 'react'
import { Eyebrow } from '@/components/ui/eyebrow'

interface SectionLabelProps {
  children: ReactNode
}

// Wrapper fino sobre Eyebrow (variant='light') — mantém todos os call sites
// existentes funcionando sem alteração enquanto reaproveita a implementação
// canônica do padrão "• LABEL" da referência.
export function SectionLabel({ children }: SectionLabelProps) {
  return <Eyebrow variant="light">{children}</Eyebrow>
}
