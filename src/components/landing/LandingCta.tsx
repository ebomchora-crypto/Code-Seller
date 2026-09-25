import { useNavigate } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Eyebrow } from '@/components/ui/eyebrow'
import { Reveal } from '@/components/motion/Reveal'
import { reveal } from '@/motion/variants'

export function LandingCta() {
  const navigate = useNavigate()

  return (
    <section className="relative overflow-hidden bg-accent-ink">
      {/* Glow radial centralizado — mesma ideia do fundo vermelho da
          referência, na nossa paleta roxa. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[700px] w-[1100px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(179,92,255,0.18)_0%,rgba(95,0,178,0.08)_45%,transparent_75%)]"
      />

      <div className="relative mx-auto flex w-full max-w-3xl flex-col items-center px-6 py-28 text-center lg:px-8">
        <Reveal variants={reveal} className="flex flex-col items-center">
          <Eyebrow variant="dark">Organize. Acompanhe. Feche.</Eyebrow>
          <h2 className="mt-4 font-display text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
            Seu próximo cliente não precisa se perder no caminho.
          </h2>
          <p className="mx-auto mt-5 max-w-md text-base text-neutral-400">
            Crie sua conta gratuitamente e comece a organizar seu funil de vendas hoje mesmo.
          </p>
          <Button
            size="lg"
            magnetic
            className="mt-9 !rounded-full shadow-purple-glow"
            onClick={() => navigate('/register')}
          >
            Criar conta grátis
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        </Reveal>
      </div>
    </section>
  )
}
