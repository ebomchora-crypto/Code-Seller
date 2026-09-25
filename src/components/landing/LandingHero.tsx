import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { FloatingPathsBackground } from '@/components/ui/floating-paths'
import { SectionCurve } from '@/components/ui/section-curve'
import { Eyebrow } from '@/components/ui/eyebrow'
import { Button } from '@/components/ui/Button'
import { fadeInUp, staggerContainer } from '@/motion/variants'

export function LandingHero() {
  const navigate = useNavigate()

  return (
    <section className="relative overflow-hidden bg-accent-ink">
      {/* Gradientes roxos profundos — mesma receita do AuthLayout, puramente decorativos. */}
      <div
        className="pointer-events-none absolute -right-32 -top-32 h-[600px] w-[600px] rounded-full bg-purple-600/20 blur-[120px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-32 -left-32 h-[400px] w-[400px] rounded-full bg-purple-800/15 blur-[100px]"
        aria-hidden="true"
      />

      <FloatingPathsBackground position={1} pathOpacity={0.5}>
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer(0.12)}
          className="relative mx-auto flex w-full max-w-7xl flex-col items-center px-6 py-28 text-center lg:px-8 lg:py-36"
        >
          <motion.div variants={fadeInUp}>
            <Eyebrow variant="dark">CRM para vendedores digitais</Eyebrow>
          </motion.div>

          <motion.h1
            variants={fadeInUp}
            className="mt-6 max-w-3xl font-display text-5xl font-bold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl"
          >
            Prospecte. Feche.{' '}
            <span className="text-purple-500">Cresça.</span>
          </motion.h1>

          <motion.p variants={fadeInUp} className="mt-6 max-w-xl text-lg leading-relaxed text-neutral-400">
            Do primeiro contato ao pagamento recebido, tudo em um único sistema — leads,
            pipeline, financeiro e tarefas para quem vende serviços digitais.
          </motion.p>

          <motion.div variants={fadeInUp} className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
            <Button size="lg" magnetic className="shadow-purple-glow" onClick={() => navigate('/register')}>
              Criar conta grátis
            </Button>
            <Button size="lg" variant="ghost" className="text-white hover:bg-white/[0.06]" onClick={() => navigate('/login')}>
              Já tenho conta
            </Button>
          </motion.div>
        </motion.div>
      </FloatingPathsBackground>

      <SectionCurve toColor="#f5f3f2" />
    </section>
  )
}
