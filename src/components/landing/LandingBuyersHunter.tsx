import { useNavigate } from 'react-router-dom'
import { LandingFadeIn } from '@/components/landing/LandingFadeIn'
import { LandingKicker } from '@/components/landing/LandingKicker'

const checklist = [
  'Método Code Sellers para criar soluções com IA',
  'Buyers Hunter para encontrar clientes qualificados',
  'Playbook de venda com oferta, abordagem e fechamento',
  'Kit de execução com prompts, scripts e proposta',
]

// "O ecossistema completo" — fundo roxo vivo com manchas de luz e sombra à
// deriva (nada estático), frame dividido: painel de destaque com feixe de
// luz à esquerda, arsenal com o radar do Buyers Hunter à direita.
export function LandingBuyersHunter() {
  const navigate = useNavigate()

  return (
    <section id="buyershunter" className="cs-offer px-4 py-24 text-white sm:px-6 lg:px-8 lg:py-28">
      <div className="mx-auto w-full max-w-[1200px]">
        <LandingFadeIn>
          <div className="cs-offer-frame relative overflow-hidden rounded-[22px] border border-[#a78bfa]/30 lg:grid lg:min-h-[640px] lg:grid-cols-[0.9fr_1.1fr] lg:rounded-[26px]">
            {/* Esquerda — destaque roxo com feixe de luz */}
            <div className="cs-accent-card flex flex-col px-7 pb-12 pt-9 lg:p-12">
              <div className="relative z-10 flex h-full flex-col text-center lg:text-left">
                <LandingKicker tone="dark">O ecossistema completo</LandingKicker>
                <h2 className="text-[52px] font-normal leading-[0.95] tracking-[-0.06em] lg:text-[64px]">
                  Crie.
                  <br />
                  Encontre. Venda.
                </h2>
                <p className="mx-auto mt-7 max-w-[460px] text-[16px] leading-7 text-white/[0.74] lg:mx-0 lg:text-[17px]">
                  IA para construir. Buyers Hunter para encontrar. Método para fechar. Um único
                  caminho para transformar habilidade em dinheiro no bolso.
                </p>

                <div className="mt-auto pt-14 lg:pt-16">
                  <p className="text-[11px] uppercase tracking-[0.17em] text-white/[0.56]">
                    Da ideia ao dinheiro no bolso.
                  </p>
                  <p className="font-display mx-auto mt-2 max-w-[310px] text-[26px] leading-[1.12] tracking-[-0.045em] lg:mx-0 lg:max-w-none lg:text-[40px] lg:leading-[1.08]">
                    VOCÊ CRIA. VOCÊ ENCONTRA. VOCÊ VENDE.
                  </p>
                </div>
              </div>
            </div>

            {/* Direita — arsenal */}
            <div className="relative bg-[#0f0d14] px-6 py-9 sm:px-7 lg:p-12">
              <div className="text-center">
                <p className="text-[11px] font-medium uppercase tracking-[0.19em] text-[#c4b5fd]">
                  Tudo o que entra no seu arsenal
                </p>

                <div className="cs-console mt-6 rounded-[20px] border border-[#a78bfa]/30 bg-black/35 p-5 text-left">
                  <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
                    <span className="flex items-center gap-2 whitespace-nowrap text-[11px] font-medium uppercase tracking-[0.14em] text-[#c4b5fd] sm:tracking-[0.18em]">
                      <span className="cs-live-dot size-2 rounded-full bg-[#a78bfa]" />
                      Buyers Hunter
                    </span>
                    <span className="whitespace-nowrap rounded-full border border-white/[0.12] bg-white/[0.055] px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.06em] text-white/[0.55] sm:px-3 sm:tracking-[0.14em]">
                      Nova ferramenta
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-[84px_1fr] items-center gap-5 sm:grid-cols-[104px_1fr]">
                    <div aria-hidden className="cs-radar">
                      <span className="cs-radar-sweep" />
                      <span className="cs-radar-target left-[63%] top-[29%]" />
                      <span className="cs-radar-target bottom-[25%] right-[62%]" />
                    </div>
                    <div>
                      <p className="font-display text-[20px] leading-[1.08] tracking-[-0.04em] text-white sm:text-[22px]">
                        Clientes qualificados na mira.
                      </p>
                      <p className="mt-3 text-[13px] leading-5 text-white/[0.52]">
                        Busque empresas qualificadas e coloque oportunidades reais no seu radar.
                      </p>
                    </div>
                  </div>
                </div>

                <p className="mx-auto mt-5 max-w-[480px] text-[15px] leading-7 text-white/[0.58] lg:text-[16px]">
                  Você não entra apenas para aprender. Entra para executar o ciclo completo e chegar à
                  venda.
                </p>
              </div>

              <div className="mt-8 grid gap-3">
                {checklist.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-4 rounded-[13px] border border-white/10 bg-white/[0.035] px-4 py-3.5 sm:px-5 sm:py-4"
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#6d28d9] text-[14px] shadow-[0_0_18px_rgba(124,58,237,0.45)]">
                      ✓
                    </span>
                    <span className="text-left text-[15px] text-white/[0.82] lg:text-[16px]">{item}</span>
                  </div>
                ))}
              </div>

              {/* bg-[#fff], não bg-white: globals.css remapeia `.dark .bg-white`
                  pra quase-preto (tema padrão do site é dark). */}
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="cs-enroll-button mt-7 flex min-h-[58px] w-full items-center justify-center gap-3 whitespace-nowrap rounded-full bg-[#fff] px-5 text-center text-[14px] font-semibold uppercase text-[#151318] shadow-[0_16px_45px_rgba(255,255,255,0.1)] sm:gap-5 sm:px-7 sm:text-[15px]"
              >
                Entrar no grupo oficial
                <span aria-hidden>↗</span>
              </button>
              <p className="mt-5 text-center text-[12px] leading-5 text-white/[0.38]">
                Você será direcionado para o grupo oficial do Code Sellers.
              </p>
            </div>
          </div>
        </LandingFadeIn>
      </div>
    </section>
  )
}
