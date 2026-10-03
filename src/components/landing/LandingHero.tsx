import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowUpRight } from 'lucide-react'
import { BlackHoleHeroSection } from '@/components/ui/blackhole-hero-section'
import { SectionCurve } from '@/components/ui/section-curve'
import { LandingEyebrow } from '@/components/landing/LandingEyebrow'
import { LandingButton } from '@/components/landing/LandingButton'
import { LandingNavbar } from '@/components/landing/LandingNavbar'
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

// No celular os dois botões ficam lado a lado e menores, pra não cobrir o buraco negro.
const HERO_BUTTON = '!h-11 min-w-fit flex-1 whitespace-nowrap !px-3 !text-[13.5px] sm:!h-12 sm:flex-none sm:!px-6 sm:!text-[15px]'

export function LandingHero() {
  const navigate = useNavigate()
  const narrow = useNarrow()

  // overflow-x-clip (não hidden): hidden vira área de rolagem própria e, no
  // celular, o dedo rolava só a seção em vez da página.
  return (
    <section className="relative w-full overflow-x-clip">
      {/* BlackHoleHeroSection (WebGL) intocado — só o conteúdo por cima muda. */}
      <BlackHoleHeroSection
        focus={narrow ? [0.5, 0.8] : [0.585, 0.45]}
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
        {/* Navbar mora só aqui dentro — pílula flutuante que rola junto com
            o Hero, não fica fixa nas outras seções. */}
        <LandingNavbar />

        {/* Headline + card lateral, dentro do mesmo bloco do buraco negro.
            pb maior pra abrir respiro até o wordmark gigante lá embaixo —
            antes colava direto nos botões. */}
        <div className="relative z-10 px-6 pb-[18rem] pt-32 sm:pb-48 lg:px-8 lg:pb-56 lg:pt-36">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer(0.12)}
            className="relative mx-auto w-full max-w-[1280px]"
          >
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px] lg:items-start lg:gap-10">
              {/* No celular tudo centralizado, alinhado com o buraco negro e o
                  wordmark; uma frase por linha no título. */}
              <div className="mx-auto max-w-xl text-center lg:mx-0 lg:text-left">
                <motion.div variants={fadeInUp} className="hidden lg:block">
                  <LandingEyebrow>Code Sellers + Buyers Hunter</LandingEyebrow>
                </motion.div>

                <motion.h1
                  variants={fadeInUp}
                  className="text-[30px] font-medium leading-[1.1] tracking-[-0.03em] text-landing-text sm:text-[38px] lg:mt-5 lg:text-[2.5rem]"
                >
                  <span className="block lg:inline">Crie com IA.</span>{' '}
                  <span className="block lg:inline">Encontre clientes.</span>{' '}
                  <span className="block font-semibold text-landing-primary-hover">Venda com método.</span>
                </motion.h1>

                <motion.p
                  variants={fadeInUp}
                  className="mx-auto mt-4 max-w-md text-balance text-[14px] leading-relaxed text-landing-text-secondary sm:text-[15px] lg:mx-0"
                >
                  Do site ao cliente pagante, num lugar só.
                </motion.p>

                <motion.div variants={fadeInUp} className="mt-7 flex flex-wrap items-center justify-center gap-2 sm:mt-8 sm:gap-3 lg:justify-start">
                  <LandingButton className={HERO_BUTTON} onClick={() => navigate('/login')}>Acessar a plataforma</LandingButton>
                  <LandingButton
                    variant="secondary"
                    className={HERO_BUTTON}
                    onClick={() => document.getElementById('metodo')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  >
                    Conhecer o método
                  </LandingButton>
                </motion.div>
              </div>

              {/* Card lateral compacto — eyebrow, headline curta, CTA. */}
              <motion.div
                variants={fadeInUp}
                className="hidden rounded-landing-lg border border-white/20 bg-white/[0.06] p-6 shadow-landing-card backdrop-blur-2xl backdrop-saturate-150 lg:block"
              >
                <LandingEyebrow>7 dias grátis</LandingEyebrow>
                <h2 className="mt-3 text-base font-semibold leading-snug text-landing-text">
                  Teste tudo, sem cartão.
                </h2>
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="group mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-landing-md bg-landing-primary px-5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-landing-primary-hover"
                >
                  Começar grátis
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </button>
              </motion.div>
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
