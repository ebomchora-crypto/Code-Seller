import { PageWrapper } from '@/components/ui/PageWrapper'
import { SectionLabel } from '@/components/ui/section-label'
import { SplitPanel } from '@/components/ui/split-panel'
import { StepNumber } from '@/components/ui/step-number'
import { Reveal } from '@/components/motion/Reveal'
import { TiltCard } from '@/components/motion/TiltCard'
import { reveal as revealVariant } from '@/motion/variants'

interface ModulePlaceholderProps {
  title: string
  description: string
}

export function ModulePlaceholder({ title, description }: ModulePlaceholderProps) {
  return (
    <PageWrapper>
      <div>
        <Reveal variants={revealVariant}>
          <SectionLabel>Módulo</SectionLabel>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-[var(--text-primary)]">{title}</h1>
          <p className="mt-3 max-w-xl text-base text-[var(--text-secondary)]">{description}</p>
        </Reveal>

        {/* Tela especial (empty state premium) — único lugar do app com Tilt 3D,
            reservado para módulos ainda em construção, conforme a Fase 6. */}
        <TiltCard max={4} className="mt-10">
          <SplitPanel
            className="group border border-[var(--border-subtle)] shadow-[var(--shadow-card)]"
            darkSide={<div className="flex flex-col items-center gap-4 text-center"><StepNumber number="01" /><span className="font-display text-lg font-bold text-white">Próximo módulo</span></div>}
            lightSide={<div className="flex flex-col items-start gap-4">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.4}
              className="h-8 w-8 text-purple-600"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 3v2m6-2v2M5 8h14M6 8v11a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8M10 12v5M14 12v5"
              />
            </svg>
            <div>
              <SectionLabel>Em desenvolvimento</SectionLabel>
              <p className="mt-2 max-w-md text-sm text-[var(--text-secondary)]">
                Esta área está sendo construída como parte da fundação do Code Sellers e será
                detalhada em um próximo momento do desenvolvimento.
              </p>
            </div></div>}
          />
        </TiltCard>
      </div>
    </PageWrapper>
  )
}
