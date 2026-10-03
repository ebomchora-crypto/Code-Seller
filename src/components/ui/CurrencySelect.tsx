import { ChevronDown } from 'lucide-react'
import { useViewCurrency } from '@/hooks/useViewCurrency'
import { CURRENCIES, type CurrencyCode } from '@/utils/currency'
import { cn } from '@/lib/utils'

const OPTIONS: { code: CurrencyCode; label: string }[] = [
  { code: 'USD', label: 'Dólar' },
  { code: 'EUR', label: 'Euro' },
  { code: 'BRL', label: 'Real' },
  { code: 'GBP', label: 'Libra' },
]

// Moeda dos totais: mostra só o que foi vendido/recebido nessa moeda.
// "glass" é para fundos escuros (Sala de receita, card de vidro do Início).
export function CurrencySelect({
  variant = 'default',
  size = 'md',
  className,
}: {
  variant?: 'default' | 'glass'
  size?: 'sm' | 'md'
  className?: string
}) {
  const [currency, setCurrency] = useViewCurrency()
  const symbol = CURRENCIES.find((item) => item.code === currency)?.symbol
  return (
    <label className={cn('relative inline-flex shrink-0 items-center', className)} title="Moeda dos totais">
      <span className="sr-only">Moeda</span>
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute font-semibold',
          size === 'sm' ? 'left-2.5 text-[10.5px]' : 'left-3 text-[12px]',
          variant === 'glass' ? 'text-white/70' : 'text-[var(--accent-text)]',
        )}
      >
        {symbol}
      </span>
      <select
        value={currency}
        onChange={(event) => setCurrency(event.target.value as CurrencyCode)}
        className={cn(
          'cursor-pointer appearance-none rounded-full font-medium outline-none transition-colors',
          size === 'sm' ? 'h-7 pl-8 pr-6 text-[11.5px]' : 'h-9 pl-10 pr-8 text-[12.5px]',
          variant === 'glass'
            ? 'border border-white/10 bg-black/35 text-white backdrop-blur hover:bg-black/45'
            : 'border border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-primary)] hover:bg-[var(--bg-muted)]',
        )}
      >
        {OPTIONS.map((option) => (
          <option key={option.code} value={option.code} className="bg-[#14101f] text-white">
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden
        className={cn('pointer-events-none absolute', size === 'sm' ? 'right-1.5 size-3' : 'right-2.5 size-3.5', variant === 'glass' ? 'text-white/55' : 'text-[var(--text-muted)]')}
      />
    </label>
  )
}
