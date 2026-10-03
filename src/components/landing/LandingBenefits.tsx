import { Building2, FileCheck2, ListChecks, MessageSquare, Rocket, Target } from 'lucide-react'
import { LandingFadeIn } from '@/components/landing/LandingFadeIn'
import { LandingKicker } from '@/components/landing/LandingKicker'

// Benefícios concretos, sem métricas inventadas (sem "+10 mil alunos" etc.
// — não existem dados reais pra isso ainda).
const benefits = [
  {
    icon: Rocket,
    title: 'Projeto pronto',
    description: 'Pronto para mostrar e vender.',
  },
  {
    icon: Target,
    title: 'Oferta clara',
    description: 'O que você resolve, sem enrolação.',
  },
  {
    icon: Building2,
    title: 'Empresas qualificadas',
    description: 'Quem precisa do que você faz.',
  },
  {
    icon: MessageSquare,
    title: 'Abordagem pronta',
    description: 'Puxe conversa sem parecer spam.',
  },
  {
    icon: ListChecks,
    title: 'Pipeline organizado',
    description: 'Cada cliente na etapa certa.',
  },
  {
    icon: FileCheck2,
    title: 'Proposta profissional',
    description: 'Escopo, prazo e valor.',
  },
]

// Papel com grid — o bloco roxo seguinte encaixa por cima do fim desta
// seção (curva), por isso o padding de baixo inclui a profundidade do encaixe.
export function LandingBenefits() {
  return (
    <section className="cs-paper pb-[158px] pt-24 text-[#151318] lg:pb-[232px] lg:pt-28">
      <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-8 lg:px-12">
        <LandingFadeIn>
          <div className="border-b border-[rgba(41,25,60,0.14)] pb-9 text-center lg:pb-[52px] lg:text-left">
            <LandingKicker>O que você leva</LandingKicker>
            <h2 className="mx-auto max-w-[760px] text-[42px] font-normal leading-[0.95] tracking-[-0.06em] sm:text-[52px] lg:mx-0 lg:text-[62px]">
              Resultado, não promessa.
            </h2>
          </div>
        </LandingFadeIn>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:mt-16 lg:grid-cols-3 lg:gap-5">
          {benefits.map((benefit, index) => (
            <LandingFadeIn key={benefit.title} className="h-full" delay={(index % 3) * 0.06}>
              <article className="cs-paper-card flex h-full min-h-[200px] flex-col p-7 lg:p-8">
                <div className="flex items-start justify-between">
                  <span className="cs-icon-badge grid size-12 place-items-center rounded-full text-white">
                    <benefit.icon className="h-5 w-5" />
                  </span>
                  <span
                    aria-hidden
                    className="font-display text-[56px] font-semibold leading-none tracking-[-0.06em] text-[rgba(91,33,182,0.07)]"
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>
                <h3 className="mt-10 text-[24px] font-normal leading-[1.05] tracking-[-0.04em]">
                  {benefit.title}
                </h3>
                <p className="mt-3 text-[15px] leading-6 text-[rgba(51,38,72,0.66)]">{benefit.description}</p>
              </article>
            </LandingFadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
