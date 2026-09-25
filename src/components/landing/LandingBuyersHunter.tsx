import { useNavigate } from 'react-router-dom'
import { Check, Radar } from 'lucide-react'
import { Reveal } from '@/components/motion/Reveal'
import { fadeInLeft, fadeInRight } from '@/motion/variants'

const checklist = [
  'Método Code Sellers para criar soluções com IA',
  'Buyers Hunter para encontrar clientes qualificados',
  'Playbook de venda com oferta, abordagem e fechamento',
  'Kit de execução com prompts, scripts e proposta',
]

// Painel dividido — réplica estrutural da referência (esquerda colorida com
// feixes de luz cruzando a tela, direita escura com o callout da ferramenta
// + checklist + CTA), na paleta e nomes do Code Sellers.
export function LandingBuyersHunter() {
  const navigate = useNavigate()

  return (
    <section id="buyershunter" className="relative overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* Esquerda — painel colorido com feixes animados */}
        <Reveal
          variants={fadeInLeft}
          className="relative overflow-hidden bg-gradient-to-br from-landing-primary to-landing-deep px-6 py-20 sm:px-10 sm:py-24 lg:px-14"
        >
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            {/* Glow à deriva — o fundo deixa de ser um gradiente parado. */}
            <span
              className="absolute -left-1/4 -top-1/4 h-[70%] w-[70%] rounded-full bg-landing-highlight/40 blur-[100px] animate-aurora"
            />
            <span
              className="absolute -bottom-1/4 -right-1/4 h-[70%] w-[70%] rounded-full bg-landing-vivid/40 blur-[110px] animate-aurora-slow"
            />
            {[0, 1.6, 3.2].map((delay) => (
              <span
                key={delay}
                className="absolute top-0 h-full w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                style={{ animation: 'beam-move 5s linear infinite', animationDelay: `${delay}s` }}
              />
            ))}
          </div>

          <div className="relative">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">
              O ecossistema completo
            </span>
            <h2 className="mt-4 text-4xl font-medium leading-[1.05] tracking-[-0.03em] text-white sm:text-5xl">
              Crie.
              <br />
              Encontre.
              <br />
              Venda.
            </h2>
            <p className="mt-5 max-w-sm text-base leading-relaxed text-white/80">
              IA para construir. Buyers Hunter para encontrar. Método para fechar. Um único
              caminho para transformar habilidade em dinheiro no bolso.
            </p>

            <div className="mt-16">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/60">
                Da ideia ao dinheiro no bolso.
              </span>
              <p className="mt-3 text-2xl font-semibold uppercase leading-snug tracking-[-0.01em] text-white/90 sm:text-3xl">
                Você cria. Você encontra. Você vende.
              </p>
            </div>
          </div>
        </Reveal>

        {/* Direita — escura, com o callout da ferramenta + checklist + CTA */}
        <Reveal variants={fadeInRight} className="bg-landing-bg px-6 py-20 sm:px-10 sm:py-24 lg:px-14">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.16em] text-landing-text-muted">
            Tudo o que entra no seu arsenal
          </p>

          <div className="mt-6 rounded-landing-lg border border-landing-border bg-landing-surface-card p-6">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-landing-primary-hover" />
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-landing-primary-hover">
                  Buyers Hunter
                </span>
              </span>
              <span className="rounded-full border border-landing-border px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-landing-text-muted">
                Nova ferramenta
              </span>
            </div>

            <div className="mt-4 flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-landing-primary-soft text-landing-primary-hover">
                <Radar className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-base font-semibold leading-snug text-landing-text">
                  Clientes qualificados na mira.
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-landing-text-secondary">
                  Busque empresas qualificadas e coloque oportunidades reais no seu radar.
                </p>
              </div>
            </div>
          </div>

          <p className="mt-6 text-sm leading-relaxed text-landing-text-secondary">
            Você não entra apenas para aprender. Entra para executar o ciclo completo e chegar à
            venda.
          </p>

          <ul className="mt-6 space-y-3">
            {checklist.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 rounded-landing-md border border-landing-border bg-white/[0.02] px-4 py-3 text-sm text-landing-text-secondary"
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-landing-primary-hover">
                  <Check className="h-3 w-3 text-white" />
                </span>
                {item}
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() => navigate('/register')}
            // bg-[#fff], não bg-white: globals.css remapeia `.dark .bg-white`
            // pra quase-preto (tema padrão do site é dark), o que deixava o
            // texto do botão invisível.
            className="mt-7 inline-flex h-12 w-full items-center justify-center rounded-full bg-[#fff] text-sm font-semibold text-landing-text-dark transition-colors duration-200 hover:bg-[#fff]/90"
          >
            Entrar no grupo oficial
          </button>
          <p className="mt-3 text-center text-xs text-landing-text-muted">
            Você será direcionado para o grupo oficial do Code Sellers.
          </p>
        </Reveal>
      </div>
    </section>
  )
}
