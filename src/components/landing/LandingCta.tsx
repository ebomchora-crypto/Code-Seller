import { useNavigate } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { Reveal } from '@/components/motion/Reveal'
import { reveal } from '@/motion/variants'

// CTA final — réplica estrutural da referência (bloco sólido cheio, glow
// radial no canto superior, anel decorativo, eyebrow pequeno + headline
// branca gigante + botão-pílula preto), na paleta roxa do Code Sellers.
export function LandingCta() {
  const navigate = useNavigate()

  return (
    <section
      className="relative overflow-hidden"
      style={{
        background:
          'radial-gradient(140% 120% at 18% 8%, #b79cff 0%, #8b5cf6 22%, #7c3aed 42%, #4c1d95 68%, #1a0b30 88%, #07050b 100%)',
      }}
    >
      {/* Anel decorativo no canto superior direito — discreto, corta na borda. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-[420px] w-[420px] rounded-full border border-white/[0.12] sm:-right-16 sm:-top-16"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 top-10 h-[260px] w-[260px] rounded-full border border-white/[0.08] sm:right-10"
      />

      <div className="relative mx-auto flex w-full max-w-2xl flex-col items-center px-6 py-24 text-center sm:py-32 lg:px-8">
        <Reveal variants={reveal} className="flex flex-col items-center">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
            Crie. Encontre. Venda.
          </span>
          <h2 className="mt-5 text-3xl font-medium leading-[1.15] tracking-[-0.03em] text-white sm:text-4xl lg:text-5xl">
            Seu próximo cliente não precisa aparecer por acaso.
          </h2>
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="group mt-9 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#0b0b0f] px-7 text-base font-semibold text-white transition-colors duration-200 hover:bg-black active:scale-[0.98]"
          >
            Entrar no grupo oficial
            <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>
        </Reveal>
      </div>
    </section>
  )
}
