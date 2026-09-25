import { useNavigate } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { LandingEyebrow } from '@/components/landing/LandingEyebrow'
import { ShaderBackground, PURPLE_MESH_UNIFORMS } from '@/components/ui/mesh-gradient'
import { Reveal } from '@/components/motion/Reveal'
import { reveal } from '@/motion/variants'

export function LandingCta() {
  const navigate = useNavigate()

  return (
    <section className="relative overflow-hidden bg-landing-bg">
      {/* Fundo animado (mesh gradient), opacidade reduzida pra ficar discreto
          — fecha a landing com movimento sutil, sem repetir o buraco negro
          do Hero nem "lavar" o texto por cima. */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <ShaderBackground className="absolute inset-0 opacity-40" uniforms={PURPLE_MESH_UNIFORMS} />
        <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_0%,rgba(8,8,10,0.45)_55%,rgba(8,8,10,0.92)_100%)]" />
      </div>

      <div className="relative mx-auto flex w-full max-w-3xl flex-col items-center px-6 py-28 text-center lg:px-8">
        <Reveal variants={reveal} className="flex flex-col items-center">
          <LandingEyebrow>Organize. Acompanhe. Feche.</LandingEyebrow>
          <h2 className="mt-4 text-4xl font-bold leading-[1.08] tracking-tight text-landing-text sm:text-5xl lg:text-6xl">
            Seu próximo cliente não precisa se perder no caminho.
          </h2>
          <p className="mx-auto mt-5 max-w-md text-base text-landing-text-secondary">
            Crie sua conta gratuitamente e comece a organizar seu funil de vendas hoje mesmo.
          </p>
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="mt-9 inline-flex h-12 items-center gap-2 rounded-full bg-landing-primary px-7 text-base font-semibold text-white shadow-landing-glow transition-colors duration-200 hover:bg-landing-primary-hover active:scale-[0.98]"
          >
            Criar conta grátis
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </Reveal>
      </div>
    </section>
  )
}
