import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Check, Sparkles } from 'lucide-react'
import { Eyebrow } from '@/components/ui/eyebrow'
import { Button } from '@/components/ui/Button'
import { SectionCurve } from '@/components/ui/section-curve'
import { Reveal } from '@/components/motion/Reveal'
import { StaggerGroup } from '@/components/motion/StaggerGroup'
import { fadeInLeft, bounceIn } from '@/motion/variants'

const checklist = [
  'CRM completo de leads e contatos',
  'Pipeline visual (Kanban) por etapa',
  'Financeiro integrado, sem planilha paralela',
  'AutoPilot: IA que sugere o próximo passo',
]

export function LandingChecklist() {
  const navigate = useNavigate()

  return (
    <section className="relative overflow-hidden bg-accent-ink">
      <SectionCurve fromColor="#f5f3f2" toColor="#0b0014" />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 top-0 h-[560px] w-[560px] rounded-full bg-purple-700/25 blur-[140px]"
      />

      <div className="relative mx-auto grid w-full max-w-7xl grid-cols-1 gap-12 px-6 py-24 lg:grid-cols-2 lg:items-center lg:px-8">
        <Reveal variants={fadeInLeft}>
          <Eyebrow variant="dark">Por que Code Sellers</Eyebrow>
          <h2 className="mt-3 font-display text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl">
            Seus leads não precisam se perder no caminho.
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-neutral-400">
            Organize, acompanhe e feche — tudo com o histórico completo de cada contato a um
            clique de distância.
          </p>
        </Reveal>

        <div className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-6 shadow-glass-strong backdrop-blur-xl sm:p-8">
          {/* Mini-card de destaque do AutoPilot — reforça o diferencial de IA
              sem repetir literalmente a grade de módulos de cima. */}
          <div className="flex items-center gap-4 rounded-2xl border border-purple-500/20 bg-purple-500/10 p-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-500/20 text-purple-300">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-purple-300">AutoPilot</p>
              <p className="mt-0.5 text-sm font-medium text-white">Sugestões que aparecem na hora certa.</p>
            </div>
          </div>

          <p className="mt-6 text-sm leading-relaxed text-neutral-400">
            Você não entra só para organizar. Entra para fechar mais rápido, com um sistema que
            acompanha cada etapa junto com você.
          </p>

          <StaggerGroup delay={0.08} className="mt-6 flex flex-col gap-3">
            {checklist.map((item) => (
              <motion.div
                key={item}
                variants={bounceIn}
                className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-600">
                  <Check className="h-3.5 w-3.5 text-white" />
                </span>
                <span className="text-sm text-neutral-200">{item}</span>
              </motion.div>
            ))}
          </StaggerGroup>

          <Button
            size="lg"
            magnetic
            className="mt-7 w-full !rounded-full !bg-white !text-accent-ink hover:!bg-white/90"
            onClick={() => navigate('/register')}
          >
            Criar conta grátis
          </Button>
        </div>
      </div>
    </section>
  )
}
