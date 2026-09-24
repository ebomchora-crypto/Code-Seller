interface SectionCurveProps {
  fromColor?: string
  toColor: string
  flip?: boolean
  className?: string
}

// Curva orgânica de transição entre seções de cores diferentes — SVG puro
// (sem JS/animação), custo de render desprezível.
export function SectionCurve({ fromColor = 'transparent', toColor, flip = false, className = '' }: SectionCurveProps) {
  return (
    <div className={`pointer-events-none relative -mb-px w-full ${flip ? 'rotate-180' : ''} ${className}`} style={{ backgroundColor: fromColor }} aria-hidden="true">
      <svg viewBox="0 0 1440 120" fill="none" preserveAspectRatio="none" className="h-[60px] w-full sm:h-[100px]">
        <path d="M0,0 C480,120 960,120 1440,0 L1440,120 L0,120 Z" fill={toColor} />
      </svg>
    </div>
  )
}
