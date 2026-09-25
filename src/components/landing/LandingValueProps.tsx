import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowUpRight, Check } from 'lucide-react'
import { Eyebrow } from '@/components/ui/eyebrow'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/motion/Reveal'
import { StaggerGroup } from '@/components/motion/StaggerGroup'
import { TiltCard } from '@/components/motion/TiltCard'
import { fadeInUp, fadeInLeft, scaleIn } from '@/motion/variants'

const steps = [
  {
    number: '01',
    label: 'Organizar',
    title: 'Organize seus leads',
    description: 'Cadastre contatos, adicione tags e acompanhe o histórico de cada relacionamento.',
    tagline: 'Seu funil, sempre visível',
  },
  {
    number: '02',
    label: 'Acompanhar',
    title: 'Acompanhe o pipeline',
    description: 'Mova negócios pelo Kanban conforme cada negociação avança, sem perder o timing.',
    tagline: 'Nada esquecido no meio do caminho',
  },
  {
    number: '03',
    label: 'Fechar',
    title: 'Feche e receba',
    description: 'Registre o pagamento e acompanhe recebíveis direto no módulo financeiro.',
    tagline: 'Venda fechada, dinheiro rastreado',
  },
]

// Card numerado com badge + botão-seta (Fase 6: Hover Animation) + número
// gigante em marca d'água (puro CSS, sem custo) — padrão de referência
// adaptado à paleta e ao conteúdo real do Code Sellers.
function StepCard({ step }: { step: (typeof steps)[number] }) {
  return (
    <motion.div variants={scaleIn} className="group relative overflow-hidden rounded-2xl border border-neutral-200 bg-white p-6 shadow-[var(--shadow-card)] transition-shadow duration-300 hover:shadow-glass-purple">
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-6 -right-2 font-display text-[7rem] font-bold leading-none text-neutral-100 transition-colors duration-300 group-hover:text-purple-50"
      >
        {step.number}
      </span>

      <div className="relative flex items-center justify-between">
        <span className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-xs font-bold text-white">
            {step.number}
          </span>
          <span className="text-xs font-semibold uppercase tracking-wide text-purple-600">{step.label}</span>
        </span>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 transition-all duration-300 group-hover:rotate-45 group-hover:bg-purple-600 group-hover:text-white">
          <ArrowUpRight className="h-3.5 w-3.5" />
        </span>
      </div>

      <h3 className="relative mt-5 font-display text-lg font-semibold text-ink">{step.title}</h3>
      <p className="relative mt-2 text-sm leading-relaxed text-neutral-600">{step.description}</p>

      <p className="relative mt-4 flex items-center gap-1.5 text-xs font-medium text-neutral-500">
        <Check className="h-3.5 w-3.5 text-purple-600" />
        {step.tagline}
      </p>
    </motion.div>
  )
}

export function LandingValueProps() {
  const navigate = useNavigate()

  return (
    <section id="como-funciona" className="bg-paper py-24">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center">
          <Reveal variants={fadeInLeft}>
            <Eyebrow>O ecossistema completo</Eyebrow>
            <h2 className="mt-3 font-display text-4xl font-bold leading-[1.08] tracking-tight text-ink sm:text-5xl">
              Organize. Acompanhe. Feche.
            </h2>
            <p className="mt-4 max-w-md text-base leading-relaxed text-neutral-600">
              CRM, pipeline, financeiro e IA em um único caminho — sem planilha paralela, sem
              perder o fio da negociação.
            </p>
          </Reveal>

          <Reveal variants={fadeInUp}>
            <TiltCard max={3}>
              <div className="rounded-3xl border border-purple-200/60 bg-gradient-to-br from-purple-50 to-white p-8 shadow-glass-purple">
                <Eyebrow>Da ideia ao pagamento no bolso</Eyebrow>
                <h3 className="mt-3 font-display text-2xl font-bold tracking-tight text-ink">
                  Uma rota completa, do primeiro contato ao recebimento.
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-neutral-600">
                  Você organiza os leads, acompanha cada negociação e sabe exatamente quando o
                  dinheiro entra — tudo no mesmo sistema.
                </p>
                <Button
                  size="lg"
                  magnetic
                  className="mt-6 w-full shadow-purple-glow"
                  onClick={() => navigate('/register')}
                >
                  Criar conta grátis
                </Button>
              </div>
            </TiltCard>
          </Reveal>
        </div>

        <StaggerGroup delay={0.1} className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {steps.map((step) => (
            <StepCard key={step.number} step={step} />
          ))}
        </StaggerGroup>
      </div>
    </section>
  )
}
