import { useNavigate } from 'react-router-dom'
import { LandingFadeIn } from '@/components/landing/LandingFadeIn'

// Bloco roxo penúltimo — encaixa por cima do fim do "O que você leva" com uma
// língua de papel curva (mesmo papel + grid da seção de cima), e a FAQ
// encaixa por baixo dele do mesmo jeito. Por isso o margin negativo e o
// padding extra em cima e embaixo (profundidade do encaixe: 62px / 120px).
export function LandingCtaBanner() {
  const navigate = useNavigate()

  return (
    <section className="cs-final-push relative z-[1] -mt-[62px] overflow-hidden px-5 pb-[158px] pt-[158px] text-white lg:-mt-[120px] lg:px-8 lg:pb-[230px] lg:pt-[230px]">
      <div aria-hidden className="cs-interlock-down cs-paper absolute inset-x-0 top-0 z-[5] h-[62px] lg:h-[120px]" />
      <div aria-hidden className="cs-final-orbit" />

      <LandingFadeIn className="relative z-10 mx-auto w-full max-w-[1200px] text-center">
        <p className="text-[11px] uppercase tracking-[0.2em] text-white/[0.58]">Crie. Encontre. Venda.</p>
        <h2 className="mx-auto mt-7 max-w-[1000px] text-[44px] font-normal leading-[0.96] tracking-[-0.06em] sm:text-[58px] lg:text-[78px] lg:leading-[0.94] lg:tracking-[-0.065em]">
          Seu próximo cliente não precisa aparecer por acaso. Encontre. Venda. Coloque dinheiro no
          bolso.
        </h2>
        <button
          type="button"
          onClick={() => navigate('/register')}
          className="cs-dark-button mt-10 inline-flex min-h-[60px] items-center gap-6 rounded-full bg-black px-9 text-[16px] font-medium text-white"
        >
          Entrar no grupo oficial
          <span aria-hidden>↗</span>
        </button>
      </LandingFadeIn>
    </section>
  )
}
