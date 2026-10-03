import { useNavigate } from 'react-router-dom'
import { LandingFadeIn } from '@/components/landing/LandingFadeIn'

// CTA final com fade — papel claro no topo, horizonte roxo curvo no meio e
// preto embaixo (onde o rodapé continua), como o fechamento da referência.
// Copy diferente do bloco roxo acima pra não repetir a mesma frase duas vezes.
// O texto fica sempre no papel claro; o horizonte é um bloco de altura fixa
// logo abaixo, então no celular (título em mais linhas) o roxo não sobe por
// cima do parágrafo.
export function LandingCta() {
  const navigate = useNavigate()

  return (
    <section className="relative overflow-hidden bg-[#f5f3f5]">
      <LandingFadeIn className="relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center px-6 pt-16 text-center lg:px-8 lg:pt-20">
        <h2 className="text-[34px] font-normal leading-[1.08] tracking-[-0.045em] text-[#0b0b0f] sm:text-[48px] lg:text-[56px]">
          Seu próximo projeto
          <br />
          precisa virar venda.
        </h2>
        <p className="mx-auto mt-5 max-w-[440px] text-[15px] leading-6 text-[#2a2533]">
          Entre pra aprender a criar com IA, encontrar clientes com o Buyers Hunter e
          vender com o método Code Sellers.
        </p>
      </LandingFadeIn>

      <div
        className="relative -mt-12 h-[400px] sm:-mt-8 sm:h-[460px] lg:h-[540px]"
        style={{
          background:
            'radial-gradient(ellipse 130% 90% at 50% 105%, #07050b 0%, #0b0616 44%, #3b0d8f 58%, #7c3aed 66%, #b79cff 73%, #e9e3fb 80%, #f5f3f5 86%)',
        }}
      >
        <LandingFadeIn className="absolute inset-x-0 top-[34%] flex justify-center">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="cs-dark-button inline-flex h-12 items-center justify-center rounded-full bg-[#0b0b0f] px-7 text-[15px] font-medium text-white"
          >
            Começar a vender
          </button>
        </LandingFadeIn>
      </div>
    </section>
  )
}
