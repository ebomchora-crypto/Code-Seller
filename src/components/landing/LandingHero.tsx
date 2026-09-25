import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { BlackHoleHeroSection } from '@/components/ui/blackhole-hero-section'
import { SectionCurve } from '@/components/ui/section-curve'
import { LandingEyebrow } from '@/components/landing/LandingEyebrow'
import { LandingButton } from '@/components/landing/LandingButton'
import { fadeInUp, staggerContainer } from '@/motion/variants'

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
        hotColor="#F3E8FF"
        midColor="#B35CFF"
        coolColor="#2C0052"
        glow={narrow ? 0.75 : 0.9}
        steps={narrow ? 160 : 220}
        resolution={narrow ? 0.55 : 0.65}
        maxDpr={1.5}
      >
        <div className="relative z-10 flex h-full min-h-[max(680px,100svh)] items-center px-6 lg:px-8">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer(0.12)}
            className="relative mx-auto w-full max-w-[1280px]"
          >
            <div className="max-w-xl">
              <motion.div variants={fadeInUp}>
                <LandingEyebrow>Code Sellers + Code Hunter</LandingEyebrow>
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
