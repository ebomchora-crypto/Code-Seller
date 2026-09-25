import { useNavigate } from 'react-router-dom'
import { Reveal } from '@/components/motion/Reveal'
import { reveal } from '@/motion/variants'

// Seção de fechamento — réplica estrutural da referência pedida (gradiente
// claro → roxo vivo → preto, headline escura na faixa clara, botão-pílula
// escuro sobre a faixa colorida), na paleta roxa do Code Sellers em vez do
// vermelho da referência. Sem shader/mesh aqui: a referência é um gradiente
// estático limpo, não animado.
export function LandingCta() {
  const navigate = useNavigate()

  return (
    <section
      className="relative overflow-hidden"
      style={{
        background:
          'linear-gradient(180deg, #f5f3f5 0%, #f5f3f5 26%, #b35cff 48%, #3b0072 66%, #08080a 84%, #08080a 100%)',
      }}
    >
      <div className="relative mx-auto flex w-full max-w-3xl flex-col items-center px-6 pb-24 pt-14 text-center sm:pb-28 sm:pt-16 lg:px-8">
        <Reveal variants={reveal} className="flex flex-col items-center">
          <h2 className="text-3xl font-bold leading-[1.12] tracking-tight text-[#0b0b0f] sm:text-4xl lg:text-5xl">
            Seu próximo cliente não precisa se perder no caminho.
          </h2>
          {/* Fica dentro da faixa clara sólida do gradiente (não na transição
              pra roxo) — texto mais escuro pra manter contraste mesmo assim. */}
          <p className="mx-auto mt-3 max-w-md text-base text-[#3f3f46]">
            Crie sua conta gratuitamente e comece a organizar seu funil de vendas hoje mesmo.
          </p>
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="mt-9 inline-flex h-12 items-center justify-center rounded-full bg-[#0b0b0f] px-7 text-base font-semibold text-white transition-colors duration-200 hover:bg-black active:scale-[0.98]"
          >
            Criar conta grátis
          </button>
        </Reveal>
      </div>
    </section>
  )
}
