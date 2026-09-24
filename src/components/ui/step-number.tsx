import { ArrowUpRight } from 'lucide-react'

interface StepNumberProps {
  number: string
  size?: 'sm' | 'md'
}

// Círculo numerado (01, 02, 03...) com seta que aparece/rotaciona no hover do
// card pai — usa o seletor `group` do Tailwind, então o elemento ancestral
// precisa da classe `group` para o hover funcionar.
export function StepNumber({ number, size = 'md' }: StepNumberProps) {
  const dimension = size === 'sm' ? 'h-9 w-9 text-xs' : 'h-11 w-11 text-sm'

  return (
    <div className="relative inline-flex items-center justify-center">
      <span
        className={`flex ${dimension} items-center justify-center rounded-full border-2 border-accent-bright font-display font-bold text-accent-bright transition-colors duration-300 group-hover:bg-accent group-hover:text-white`}
      >
        {number}
      </span>
      <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--bg-card)] text-[var(--text-muted)] opacity-0 shadow-[var(--shadow-card)] transition-all duration-300 group-hover:rotate-45 group-hover:bg-accent group-hover:text-white group-hover:opacity-100">
        <ArrowUpRight className="h-3 w-3" />
      </span>
    </div>
  )
}
