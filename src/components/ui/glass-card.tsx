import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface GlassCardProps {
  children: ReactNode
  className?: string
  variant?: 'default' | 'strong' | 'purple' | 'dark'
  hover?: boolean
}

// variant='default' → glass sutil para contextos claros
// variant='strong'  → glass mais opaco para modais sobre fundos escuros
// variant='purple'  → glass com tint roxo para elementos de IA/destaque
// variant='dark'    → glass escuro para o CS Copilot e AuthLayout
export function GlassCard({ children, className, variant = 'default', hover = false }: GlassCardProps) {
  return (
    <div
      className={cn(
        'relative rounded-2xl border backdrop-blur-md transition-all duration-300',
        variant === 'default' && 'border-white/20 bg-white/60 shadow-glass',
        variant === 'strong' && 'border-white/10 bg-white/10 shadow-glass-strong backdrop-blur-xl',
        variant === 'purple' && 'border-purple-500/15 bg-purple-500/5 shadow-glass-purple',
        variant === 'dark' && 'border-white/[0.08] bg-white/[0.04] shadow-glass-strong backdrop-blur-xl',
        hover && variant === 'dark' && 'hover:border-white/[0.15] hover:bg-white/[0.07]',
        hover && variant === 'default' && 'hover:border-white/30 hover:bg-white/70',
        className,
      )}
    >
      {children}
    </div>
  )
}
