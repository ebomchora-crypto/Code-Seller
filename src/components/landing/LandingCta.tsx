import { useNavigate } from 'react-router-dom'
import { LandingFadeIn } from '@/components/landing/LandingFadeIn'

// CTA final com fade — papel claro no topo, horizonte roxo curvo no meio e
// preto embaixo (onde o rodapé continua), como o fechamento da referência.
// Copy diferente do bloco roxo acima pra não repetir a mesma frase duas vezes.
export function LandingCta() {
  const navigate = useNavigate()

  return (
    <section
      className="relative overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse 130% 90% at 50% 105%, #07050b 0%, #0b0616 44%, #3b0d8f 58%, #7c3aed 66%, #b79cff 73%, #e9e3fb 80%, #f5f3f5 86%)',
      }}
    >
      <LandingFadeIn className="relative mx-auto flex w-full max-w-3xl flex-col items-center px-6 pb-40 pt-16 text-center sm:pb-48 lg:px-8 lg:pb-56 lg:pt-20">
        <h2 className="text-[40px] font-normal leading-[1.08] tracking-[-0.045em] text-[#0b0b0f] sm:text-[48px] lg:text-[56px]">
          Seu próximo projeto
          <br />
          precisa virar venda.
        </h2>
        <p className="mx-auto mt-5 max-w-[440px] text-[15px] leading-6 text-[#2a2533]">
          Entre pra aprender a criar com IA, encontrar clientes com o Buyers Hunter e
          vender com o método Code Sellers.
        </p>
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="cs-dark-button mt-8 inline-flex h-12 items-center justify-center rounded-full bg-[#0b0b0f] px-7 text-[15px] font-medium text-white"
        >
          Login
        </button>
      </LandingFadeIn>
    </section>
  )
}
