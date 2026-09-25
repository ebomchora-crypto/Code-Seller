import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowUpRight } from 'lucide-react'
import { BlackHoleHeroSection } from '@/components/ui/blackhole-hero-section'
import { SectionCurve } from '@/components/ui/section-curve'
import { LandingEyebrow } from '@/components/landing/LandingEyebrow'
import { LandingButton } from '@/components/landing/LandingButton'
import { StaggerGroup } from '@/components/motion/StaggerGroup'
import { fadeInUp, staggerContainer, scaleIn } from '@/motion/variants'

/** Verdadeiro em telas estreitas — controla a troca de enquadramento abaixo. */
function useNarrow(query = '(max-width: 767px)') {
  const [narrow, setNarrow] = useState(false)
  useEffect(() => {
    const media = window.matchMedia(query)
    const sync = () => setNarrow(media.matches)
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [query])
  return narrow
}

const trustLine = ['Criar', 'Encontrar', 'Vender']

// O ciclo central do método — agora dentro do Hero, logo abaixo do
// headline, sem vão vazio entre as duas coisas (pedido explícito de
// composição única, igual à referência).
const steps = [
  {
    number: '01',
    label: 'Criar',
    title: 'Crie sites e sistemas com IA.',
    description: 'Transforme ideias em soluções funcionais, responsivas e prontas para apresentar.',
  },
  {
    number: '02',
    label: 'Encontrar',
    title: 'Encontre empresas certas.',
    description: 'Use o Buyers Hunter para colocar oportunidades qualificadas no seu radar.',
  },
  {
    number: '03',
    label: 'Vender',
    title: 'Transforme oportunidade em cliente.',
    description: 'Aprenda oferta, abordagem, demonstração, proposta e fechamento.',
  },
]

function StepCard({ step }: { step: (typeof steps)[number] }) {
  return (
    <motion.div
      variants={scaleIn}
      className="group relative flex min-h-[220px] flex-col overflow-hidden rounded-landing-lg border border-white/[0.07] bg-landing-surface-card/80 p-7 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-white/[0.14] sm:min-h-[240px]"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-8 -right-3 select-none text-[8rem] font-semibold leading-none tracking-tighter text-white/[0.04]"
      >
        {step.number}
      </span>

      <div className="relative flex items-center justify-between">
        <span className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-landing-primary-hover/50 text-xs font-bold text-landing-primary-hover">
            {step.number}
          </span>
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-landing-primary-hover">
            {step.label}
          </span>
        </span>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-white/60 transition-all duration-300 group-hover:rotate-45 group-hover:bg-landing-primary group-hover:text-white">
          <ArrowUpRight className="h-3.5 w-3.5" />
        </span>
      </div>

      <h3 className="relative mt-auto pt-8 text-lg font-medium leading-snug tracking-[-0.02em] text-landing-text">
        {step.title}
      </h3>
      <p className="relative mt-2.5 text-sm leading-relaxed text-landing-text-secondary">{step.description}</p>
    </motion.div>
  )
}

export function LandingHero() {
  const navigate = useNavigate()
  const narrow = useNarrow()

  return (
    <section className="relative w-full overflow-x-hidden">
      {/* BlackHoleHeroSection (WebGL) intocado — só o conteúdo por cima muda. */}
      <BlackHoleHeroSection
        focus={narrow ? [0.5, 0.8] : [0.72, 0.48]}
        scrim={narrow ? 'top' : 'left'}
        scrimStrength={0.92}
        distance={24}
        elevation={narrow ? -7 : -5.5}
        fov={narrow ? 58 : 42}
        hotColor="#FFE8E8"
        midColor="#FF3B3B"
        coolColor="#3D0000"
        glow={narrow ? 0.75 : 0.9}
        steps={narrow ? 160 : 220}
        resolution={narrow ? 0.55 : 0.65}
        maxDpr={1.5}
      >
        {/* Composição única: headline + card lateral + os 3 cards, tudo no
            mesmo bloco, sem vão vazio entre eles (antes o Hero ocupava
            100svh sozinho e os cards só apareciam depois de rolar). */}
        <div className="relative z-10 px-6 pb-20 pt-28 lg:px-8 lg:pb-24 lg:pt-36">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer(0.12)}
            className="relative mx-auto w-full max-w-[1280px]"
          >
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px] lg:items-start lg:gap-10">
              <div className="max-w-xl">
                <motion.div variants={fadeInUp}>
                  <LandingEyebrow>Code Sellers + Buyers Hunter</LandingEyebrow>
                </motion.div>

                <motion.h1
                  variants={fadeInUp}
                  className="mt-6 text-3xl font-medium leading-[1.1] tracking-[-0.03em] text-landing-text sm:text-4xl lg:text-[2.75rem]"
                >
                  Crie com IA. Encontre clientes.{' '}
                  <span className="font-semibold text-landing-primary-hover">Venda com método.</span>
                </motion.h1>

                <motion.p
                  variants={fadeInUp}
                  className="mt-4 max-w-md text-sm leading-relaxed text-landing-text-secondary sm:text-base"
                >
                  Transforme ideias em sites e sistemas, encontre empresas que realmente precisam
                  deles e conduza a venda até o fechamento.
                </motion.p>

                <motion.div variants={fadeInUp} className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                  <LandingButton onClick={() => navigate('/register')}>Entrar no grupo</LandingButton>
                  <LandingButton variant="secondary" onClick={() => navigate('/login')}>
                    Conhecer o método
                  </LandingButton>
                </motion.div>

                <motion.ul
                  variants={fadeInUp}
                  className="mt-7 flex flex-wrap items-center gap-x-2 gap-y-2 text-sm font-medium uppercase tracking-[0.1em] text-landing-text-muted"
                >
                  {trustLine.map((word, index) => (
                    <li key={word} className="flex items-center gap-2">
                      {index > 0 && <span className="text-landing-primary-hover">·</span>}
                      {word}
                    </li>
                  ))}
                </motion.ul>
              </div>

              {/* Card lateral compacto — eyebrow, headline curta, CTA. */}
              <motion.div
                variants={fadeInUp}
                className="hidden rounded-landing-lg border border-white/10 bg-landing-surface/75 p-6 shadow-landing-card backdrop-blur-xl lg:block"
              >
                <LandingEyebrow>Da ideia ao dinheiro no bolso</LandingEyebrow>
                <h2 className="mt-3 text-base font-semibold leading-snug text-landing-text">
                  Uma rota completa para sair do prompt e chegar ao pagamento.
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-landing-text-secondary">
                  Você cria a solução, encontra as empresas certas e aprende a conduzir a conversa
                  até fechar a venda.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  className="group mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-landing-md bg-landing-primary px-5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-landing-primary-hover"
                >
                  Entrar no grupo oficial
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </button>
                <p className="mt-3 text-center text-[11px] font-medium uppercase tracking-[0.1em] text-landing-text-muted">
                  Criar · Encontrar · Vender
                </p>
              </motion.div>
            </div>

            <StaggerGroup delay={0.1} className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-3 lg:mt-14">
              {steps.map((step) => (
                <StepCard key={step.number} step={step} />
              ))}
            </StaggerGroup>
          </motion.div>
        </div>

        {/* Assinatura visual — título gigante quase inteiro visível, só
            tocando a borda de baixo. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 z-0 select-none overflow-hidden"
        >
          <div
            className="translate-y-[8%] whitespace-nowrap text-center font-hero font-thin leading-none tracking-tighter text-transparent"
            style={{
              fontSize: 'clamp(2.5rem, 13vw, 12rem)',
              backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,255,255,0))',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              WebkitTextFillColor: 'transparent',
            }}
          >
            CODE SELLERS
          </div>
        </div>
      </BlackHoleHeroSection>

      {/* Saída pra #07050b (landing-bg) — mesma cor da próxima seção. */}
      <SectionCurve toColor="#07050b" />
    </section>
  )
}
