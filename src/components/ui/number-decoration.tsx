interface NumberDecorationProps {
  number: string | number
  className?: string
}

// Número gigante decorativo posicionado atrás do conteúdo de uma seção —
// puramente visual (aria-hidden), inspirado na referência codemakers.com.br.
export function NumberDecoration({ number, className = '' }: NumberDecorationProps) {
  const label = typeof number === 'number' ? String(number).padStart(2, '0') : number

  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute -left-2 -top-4 select-none text-[120px] font-black leading-none text-[var(--text-primary)] opacity-[0.03] ${className}`}
    >
      {label}
    </span>
  )
}
