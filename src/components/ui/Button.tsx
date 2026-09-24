import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { motion } from 'motion/react'
import { Spinner } from '@/components/ui/Spinner'
import { useMagnetic } from '@/motion/hooks'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

type NativeButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration'
>

interface ButtonProps extends NativeButtonProps {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  children: ReactNode
  /** Fase 6 — reservar para o CTA principal de uma tela (criar lead/negócio). */
  magnetic?: boolean
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-purple-600 text-white hover:bg-purple-500 shadow-[0_0_20px_rgba(179,92,255,0.2)] focus-visible:ring-purple-300',
  secondary:
    'bg-[var(--bg-muted)] text-[var(--text-primary)] border border-[var(--border-default)] hover:bg-[var(--bg-card-hover)] focus-visible:ring-neutral-300',
  ghost: 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] focus-visible:ring-neutral-200',
  danger: 'bg-red-600/10 text-red-500 border border-red-500/20 hover:bg-red-600/20 focus-visible:ring-red-300',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
}

// Feedback de pressão (Fase 28) via CSS puro — instantâneo, sem custo de JS,
// aplicado a TODO botão do app.
const baseClasses =
  'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100'

// Botão magnético (Fase 6): componente separado para que o hook (springs)
// só exista quando `magnetic` é de fato usado — os outros ~99% dos botões
// do app permanecem <button> puro, sem overhead de motion values.
function MagneticButtonImpl({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className = '',
  children,
  ...props
}: Omit<ButtonProps, 'magnetic'>) {
  const { ref, x, y, onPointerMove, onPointerLeave, enabled } = useMagnetic({ strength: 0.3, range: 40 })
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`

  return (
    <motion.button
      ref={ref as React.Ref<HTMLButtonElement>}
      style={enabled ? { x, y } : undefined}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Spinner size="sm" className={variant === 'primary' ? 'text-white' : 'text-current'} />}
      {children}
    </motion.button>
  )
}

export function Button({ magnetic = false, ...props }: ButtonProps) {
  if (magnetic) return <MagneticButtonImpl {...props} />

  const { variant = 'primary', size = 'md', loading = false, disabled, className = '', children, ...rest } = props
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`

  return (
    <button className={classes} disabled={disabled || loading} {...rest}>
      {loading && <Spinner size="sm" className={variant === 'primary' ? 'text-white' : 'text-current'} />}
      {children}
    </button>
  )
}
