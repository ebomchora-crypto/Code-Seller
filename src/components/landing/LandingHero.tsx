import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
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
    <section className="relative min-h-[640px] w-full lg:min-h-[760px]">
      <BlackHoleHeroSection
        // Empurra o buraco negro pra direita/baixo e escurece o lado do texto
        // — mesma receita do componente original, só reposicionada pro nosso
        // layout (texto à esquerda, sempre).
        focus={narrow ? [0.5, 0.8] : [0.7, 0.5]}
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
        <div className="flex h-full min-h-[640px] items-center px-6 lg:min-h-[760px] lg:px-8">
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

              <motion.h1
                variants={fadeInUp}
                className="mt-6 font-hero text-5xl font-black leading-[0.98] tracking-[-0.02em] text-white sm:text-6xl lg:text-7xl"
              >
                Prospecte. Feche.{' '}
                <span className="text-purple-400">Cresça.</span>
              </motion.h1>

              <motion.p variants={fadeInUp} className="mt-6 max-w-md text-lg leading-relaxed text-neutral-400">
                Do primeiro contato ao pagamento recebido, tudo em um único sistema — leads,
                pipeline, financeiro e tarefas para quem vende serviços digitais.
              </motion.p>

              <motion.div variants={fadeInUp} className="mt-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                <Button size="lg" magnetic className="shadow-purple-glow" onClick={() => navigate('/register')}>
                  Criar conta grátis
                </Button>
                <Button size="lg" variant="ghost" className="text-white hover:bg-white/[0.06]" onClick={() => navigate('/login')}>
                  Já tenho conta
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </BlackHoleHeroSection>

      <SectionCurve toColor="#f5f3f2" />
    </section>
  )
}
