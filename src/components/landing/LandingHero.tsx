import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowUpRight } from 'lucide-react'
import { BlackHoleHeroSection } from '@/components/ui/blackhole-hero-section'
import { SectionCurve } from '@/components/ui/section-curve'
import { Eyebrow } from '@/components/ui/eyebrow'
import { Button } from '@/components/ui/Button'
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
      <BlackHoleHeroSection
        // Empurra o buraco negro pra direita/baixo e escurece o lado do texto
        // — mesma receita do componente original, só reposicionada pro nosso
        // layout (texto à esquerda, sempre).
        focus={narrow ? [0.5, 0.8] : [0.72, 0.48]}
        scrim={narrow ? 'top' : 'left'}
        scrimStrength={0.92}
        distance={24}
        elevation={narrow ? -7 : -5.5}
        fov={narrow ? 58 : 42}
        // Paleta do disco de acreção na identidade roxa do Code Sellers, em
        // vez do laranja padrão do componente.
        hotColor="#F3E8FF"
        midColor="#B35CFF"
        coolColor="#2C0052"
        // Ajustes conservadores de performance — é a home pública, precisa
        // rodar bem em qualquer aparelho, não só no nosso.
        glow={narrow ? 0.75 : 0.9}
        steps={narrow ? 160 : 220}
        resolution={narrow ? 0.55 : 0.65}
        maxDpr={1.5}
      >
        {/* Altura = viewport, pra o título gigante cortar exatamente na borda de baixo da tela */}
        <div className="relative z-10 flex h-full min-h-[max(640px,100svh)] items-center px-6 lg:px-8">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer(0.12)}
            className="relative mx-auto w-full max-w-7xl"
          >
            <div className="max-w-xl">
              <motion.div variants={fadeInUp}>
                <Eyebrow variant="dark">CRM para vendedores digitais</Eyebrow>
              </motion.div>

              <motion.div
                variants={fadeInUp}
                className="mt-6 max-w-xs font-hero text-lg font-medium leading-snug text-white sm:text-xl"
              >
                <p>Prospecte com dados.</p>
                <p>Feche com o CRM.</p>
                <p className="text-purple-400">Cresça com o AutoPilot.</p>
              </motion.div>

              <motion.div variants={fadeInUp} className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                <Button size="lg" magnetic className="shadow-purple-glow" onClick={() => navigate('/register')}>
                  Criar conta grátis
                </Button>
                <Button size="lg" variant="ghost" className="text-white hover:bg-white/[0.06]" onClick={() => navigate('/login')}>
                  Já tenho conta
                </Button>
              </motion.div>
            </div>

            {/* Card lateral — ancorado à direita do container full-width (max-w-7xl),
                não do bloco de texto (max-w-xl), pra não colidir com o título/parágrafo. */}
            <motion.div
              variants={fadeInUp}
              className="pointer-events-auto absolute right-0 top-[28%] hidden w-[300px] rounded-2xl border border-white/10 bg-gradient-to-b from-accent-ink/75 to-accent-deep/65 p-6 shadow-glass-strong backdrop-blur-xl lg:block xl:right-6"
            >
              <Eyebrow variant="dark">Code Sellers + AutoPilot</Eyebrow>
              <h4 className="mt-3 font-hero text-lg font-bold leading-snug text-white">
                Do lead ao dinheiro no bolso.
              </h4>
              <p className="mt-2 text-sm leading-relaxed text-neutral-400">
                Prospecte, organize no CRM e feche com a ajuda da IA — do primeiro contato ao
                pagamento recebido.
              </p>
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-white transition-colors hover:text-accent-bright"
              >
                Começar agora
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          </motion.div>
        </div>

        {/* Assinatura visual — título gigante cortado no rodapé do hero */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 z-0 select-none overflow-hidden"
        >
          <div
            className="translate-y-[42%] whitespace-nowrap text-center font-hero font-black leading-none tracking-tighter text-transparent"
            // backgroundImage, não o shorthand `background`: o shorthand reseta
            // background-clip e o gradiente vaza como um retângulo cinza.
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

      <SectionCurve toColor="#f5f3f2" />
    </section>
  )
}
