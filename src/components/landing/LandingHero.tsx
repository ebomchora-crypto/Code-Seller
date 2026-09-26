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
        {/* Navbar mora só aqui dentro — pílula flutuante que rola junto com
            o Hero, não fica fixa nas outras seções. */}
        <LandingNavbar />

        {/* Headline + card lateral, dentro do mesmo bloco do buraco negro.
            pb maior pra abrir respiro até o wordmark gigante lá embaixo —
            antes colava direto nos botões. */}
        <div className="relative z-10 px-6 pb-40 pt-28 sm:pb-48 lg:px-8 lg:pb-56 lg:pt-36">
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
              </div>

              {/* Card lateral compacto — eyebrow, headline curta, CTA. */}
              <motion.div
                variants={fadeInUp}
                className="hidden rounded-landing-lg border border-white/20 bg-white/[0.06] p-6 shadow-landing-card backdrop-blur-2xl backdrop-saturate-150 lg:block"
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
