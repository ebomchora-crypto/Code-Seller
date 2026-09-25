import { useNavigate } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Eyebrow } from '@/components/ui/eyebrow'
import { ShaderBackground, PURPLE_MESH_UNIFORMS } from '@/components/ui/mesh-gradient'
import { Reveal } from '@/components/motion/Reveal'
import { reveal } from '@/motion/variants'

export function LandingCta() {
  const navigate = useNavigate()

  return (
    <section className="relative overflow-hidden bg-accent-ink">
      {/* Fundo animado (mesh gradient) — mesma receita do Checklist, fecha a
          landing com movimento sem repetir o buraco negro do Hero. */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <ShaderBackground className="absolute inset-0 opacity-70" uniforms={PURPLE_MESH_UNIFORMS} />
        <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_0%,rgba(11,0,20,0.35)_55%,rgba(11,0,20,0.85)_100%)]" />
      </div>

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
