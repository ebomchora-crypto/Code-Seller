import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowUpRight, Check } from 'lucide-react'
import { BlackHoleHeroSection } from '@/components/ui/blackhole-hero-section'
import { SectionCurve } from '@/components/ui/section-curve'
import { LandingEyebrow } from '@/components/landing/LandingEyebrow'
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

const trustPoints = ['Grátis para começar', 'Sem cartão de crédito', 'Configuração em minutos']

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
            className="relative mx-auto w-full max-w-7xl"
          >
            <div className="max-w-xl">
              <motion.div variants={fadeInUp}>
                <LandingEyebrow>CRM para vendedores digitais</LandingEyebrow>
              </motion.div>

              <motion.h1
                variants={fadeInUp}
                className="mt-6 text-3xl font-bold leading-[1.08] tracking-tight text-landing-text sm:text-4xl lg:text-[2.75rem]"
              >
                Prospecte com dados.
                <br />
                Feche com o CRM.
                <br />
                <span className="text-landing-primary-hover">Cresça com o AutoPilot.</span>
              </motion.h1>

              <motion.p
                variants={fadeInUp}
                className="mt-4 max-w-md text-sm leading-relaxed text-landing-text-secondary sm:text-base"
              >
                Organize leads, acompanhe negociações e feche vendas com a ajuda da IA — tudo em um
                só lugar, do primeiro contato ao pagamento recebido.
              </motion.p>

              <motion.div variants={fadeInUp} className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-landing-primary px-6 text-base font-semibold text-white shadow-landing-glow transition-colors duration-200 hover:bg-landing-primary-hover active:scale-[0.98]"
                >
                  Criar conta grátis
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="inline-flex h-12 items-center justify-center rounded-xl border border-white/15 px-6 text-base font-medium text-landing-text transition-colors duration-200 hover:border-white/25 hover:bg-white/[0.06]"
                >
                  Já tenho conta
                </button>
              </motion.div>

              {/* Indicador de confiança — sem inventar número de usuários/depoimentos,
                  só os pontos de atrito reais que já são verdade no cadastro. */}
              <motion.ul
                variants={fadeInUp}
                className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-landing-text-muted"
              >
                {trustPoints.map((point) => (
                  <li key={point} className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-landing-primary-hover" />
                    {point}
                  </li>
                ))}
              </motion.ul>
            </div>

            {/* Card lateral — ancorado à direita do container full-width (max-w-7xl),
                não do bloco de texto (max-w-xl), pra não colidir com o título/parágrafo. */}
            <motion.div
              variants={fadeInUp}
              className="pointer-events-auto absolute right-0 top-[26%] hidden w-[300px] rounded-3xl border border-white/10 bg-landing-surface/70 p-6 shadow-landing-card backdrop-blur-xl lg:block xl:right-6"
            >
              <LandingEyebrow>Code Sellers + AutoPilot</LandingEyebrow>
              <h4 className="mt-3 text-lg font-bold leading-snug text-landing-text">
                Do lead ao dinheiro no bolso.
              </h4>
              <p className="mt-2 text-sm leading-relaxed text-landing-text-secondary">
                Prospecte, organize no CRM e feche com a ajuda da IA — do primeiro contato ao
                pagamento recebido.
              </p>
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-landing-text transition-colors hover:text-landing-primary-hover"
              >
                Começar agora
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          </motion.div>
        </div>

        {/* Assinatura visual — título gigante quase inteiro visível, só
            tocando a borda de baixo (igual à referência: antes o
            translate-y de 42% cortava quase 3/4 da altura das letras). */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 z-0 select-none overflow-hidden"
        >
          <div
            className="translate-y-[8%] whitespace-nowrap text-center font-hero font-black leading-none tracking-tighter text-transparent"
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

      {/* Saída pra #08080a (landing-bg) — mesma cor da próxima seção, unifica
          a landing inteira em tons escuros (antes ia pro bege "paper"). */}
      <SectionCurve toColor="#08080a" />
    </section>
  )
}
