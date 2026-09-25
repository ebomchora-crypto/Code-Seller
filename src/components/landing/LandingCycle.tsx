import { useNavigate } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { LandingEyebrow } from '@/components/landing/LandingEyebrow'
import { Reveal } from '@/components/motion/Reveal'
import { TiltCard } from '@/components/motion/TiltCard'
import { fadeInLeft, fadeInUp } from '@/motion/variants'

// Linhas do mock de código — jornada real do produto (lead → CRM → pipeline
// → financeiro → venda fechada), sintaxe destacada em roxo vivo (mesmo
// primary da paleta dark-premium, em vez do laranja padrão de editor).
const codeLines: Array<{ tokens: Array<{ text: string; className: string }> }> = [
  {
    tokens: [
      { text: 'const ', className: 'text-landing-primary-hover' },
      { text: 'lead', className: 'text-landing-text' },
      { text: ' = ', className: 'text-landing-text-muted' },
      { text: 'novoContato;', className: 'text-landing-text-secondary' },
    ],
  },
  {
    tokens: [
      { text: 'const ', className: 'text-landing-primary-hover' },
      { text: 'relacionamento', className: 'text-landing-text' },
      { text: ' = ', className: 'text-landing-text-muted' },
      { text: 'crm.organizar(lead);', className: 'text-landing-text-secondary' },
    ],
  },
  {
    tokens: [
      { text: 'const ', className: 'text-landing-primary-hover' },
      { text: 'negociacao', className: 'text-landing-text' },
      { text: ' = ', className: 'text-landing-text-muted' },
      { text: 'pipeline.avancar(relacionamento);', className: 'text-landing-text-secondary' },
    ],
  },
  {
    tokens: [
      { text: 'const ', className: 'text-landing-primary-hover' },
      { text: 'pagamento', className: 'text-landing-text' },
      { text: ' = ', className: 'text-landing-text-muted' },
      { text: 'financeiro.registrar(negociacao);', className: 'text-landing-text-secondary' },
    ],
  },
  {
    tokens: [
      { text: 'return ', className: 'text-landing-primary-hover' },
      { text: 'fecharVenda(pagamento);', className: 'text-landing-text-secondary' },
    ],
  },
]

const tabs = ['01 · Organizar', '02 · Negociar', '03 · Receber']

// Seção "o ciclo que gera receita" — texto à esquerda + mockup de editor de
// código à direita. Fundo em surface-2 (#17171c), um tom acima do bg
// (#08080a) das seções vizinhas — cria a separação visual entre seções que
// o "tudo preto igual" original não tinha.
export function LandingCycle() {
  const navigate = useNavigate()

  return (
    <section className="relative overflow-hidden bg-landing-surface-2 py-24">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 top-1/2 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-landing-primary/[0.08] blur-[130px]"
      />

      <div className="relative mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-14 px-6 lg:grid-cols-2 lg:px-8">
        <Reveal variants={fadeInLeft}>
          <LandingEyebrow>O ciclo que gera receita</LandingEyebrow>
          <h2 className="mt-4 text-4xl font-bold leading-[1.08] tracking-tight text-landing-text sm:text-5xl">
            Criar o CRM é só o começo.{' '}
            <span className="text-landing-primary-hover">O dinheiro entra quando você organiza e vende.</span>
          </h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-landing-text-secondary">
            O Code Sellers organiza cada lead, acompanha a negociação e mostra exatamente quando o
            pagamento entra — do primeiro contato ao dinheiro no bolso.
          </p>
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="mt-8 inline-flex h-12 items-center gap-2 rounded-xl bg-landing-primary px-6 text-base font-semibold text-white shadow-landing-glow transition-colors duration-200 hover:bg-landing-primary-hover active:scale-[0.98]"
          >
            Criar conta grátis
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </Reveal>

        <Reveal variants={fadeInUp}>
          <TiltCard max={4}>
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#0b0b0e] shadow-landing-card">
              <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
                </div>
                <span className="font-mono text-[11px] uppercase tracking-wide text-landing-text-muted">
                  crm_to_cash.flow
                </span>
              </div>

              <div className="space-y-3 px-5 py-6 font-mono text-[13px] leading-relaxed">
                {codeLines.map((line, index) => (
                  <p key={index}>
                    {line.tokens.map((token, tokenIndex) => (
                      <span key={tokenIndex} className={token.className}>
                        {token.text}
                      </span>
                    ))}
                  </p>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-px border-t border-white/[0.06] bg-white/[0.03]">
                {tabs.map((tab, index) => (
                  <div
                    key={tab}
                    className={`px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-wide ${
                      index === 0
                        ? 'bg-landing-primary-soft text-landing-primary-hover'
                        : 'bg-[#0b0b0e] text-landing-text-muted'
                    }`}
                  >
                    {tab}
                  </div>
                ))}
              </div>
            </div>
          </TiltCard>
        </Reveal>
      </div>
    </section>
  )
}
