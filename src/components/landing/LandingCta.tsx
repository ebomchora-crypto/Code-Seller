import { useNavigate } from 'react-router-dom'
import { Reveal } from '@/components/motion/Reveal'
import { reveal } from '@/motion/variants'

// CTA final — o mais forte da página. Gradiente claro → vermelho vivo →
// preto (estático, sem shader), headline escura na faixa clara, botão-pílula
// escuro sobre a faixa colorida.
export function LandingCta() {
  const navigate = useNavigate()

  return (
    <section
      className="relative overflow-hidden"
      style={{
        background:
          'linear-gradient(180deg, #f5f3f5 0%, #f5f3f5 26%, #ff3b3b 48%, #7f1d1d 66%, #07050b 84%, #07050b 100%)',
      }}
    >
      <div className="relative mx-auto flex w-full max-w-3xl flex-col items-center px-6 pb-24 pt-14 text-center sm:pb-28 sm:pt-16 lg:px-8">
        <Reveal variants={reveal} className="flex flex-col items-center">
          <h2 className="text-3xl font-medium leading-[1.12] tracking-[-0.03em] text-[#0b0b0f] sm:text-4xl lg:text-5xl">
            Seu próximo cliente não precisa aparecer por acaso.
          </h2>
          {/* Fica dentro da faixa clara sólida do gradiente (não na transição
              pro vermelho) — texto mais escuro pra manter contraste mesmo assim. */}
          <p className="mx-auto mt-3 max-w-md text-lg font-medium text-[#3f3f46]">Crie. Encontre. Venda.</p>
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="mt-9 inline-flex h-12 items-center justify-center rounded-full bg-[#0b0b0f] px-7 text-base font-semibold text-white transition-colors duration-200 hover:bg-black active:scale-[0.98]"
          >
            Entrar no grupo
          </button>
        </Reveal>
      </div>
    </section>
  )
}
