import { useNavigate } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { Eyebrow } from '@/components/ui/eyebrow'
import { Reveal } from '@/components/motion/Reveal'
import { TiltCard } from '@/components/motion/TiltCard'
import { fadeInLeft, fadeInUp } from '@/motion/variants'

// Linhas do mock de código — jornada real do produto (lead → CRM → pipeline
// → financeiro → venda fechada), sintaxe destacada em roxo em vez do laranja
// do editor padrão.
const codeLines: Array<{ tokens: Array<{ text: string; className: string }> }> = [
  {
    tokens: [
      { text: 'const ', className: 'text-accent-bright' },
      { text: 'lead', className: 'text-white' },
      { text: ' = ', className: 'text-neutral-500' },
      { text: 'novoContato;', className: 'text-neutral-300' },
    ],
  },
  {
    tokens: [
      { text: 'const ', className: 'text-accent-bright' },
      { text: 'relacionamento', className: 'text-white' },
      { text: ' = ', className: 'text-neutral-500' },
      { text: 'crm.organizar(lead);', className: 'text-neutral-300' },
    ],
  },
  {
    tokens: [
      { text: 'const ', className: 'text-accent-bright' },
      { text: 'negociacao', className: 'text-white' },
      { text: ' = ', className: 'text-neutral-500' },
      { text: 'pipeline.avancar(relacionamento);', className: 'text-neutral-300' },
    ],
  },
  {
    tokens: [
      { text: 'const ', className: 'text-accent-bright' },
      { text: 'pagamento', className: 'text-white' },
      { text: ' = ', className: 'text-neutral-500' },
      { text: 'financeiro.registrar(negociacao);', className: 'text-neutral-300' },
    ],
  },
  {
    tokens: [
      { text: 'return ', className: 'text-accent-bright' },
      { text: 'fecharVenda(pagamento);', className: 'text-neutral-300' },
    ],
  },
]

const tabs = ['01 · Organizar', '02 · Negociar', '03 · Receber']

// Seção "o ciclo que gera receita" — texto à esquerda + mockup de editor de
// código à direita, no lugar da foto de mesa da referência (mantém a mesma
// ideia: "criar é só o começo").
export function LandingCycle() {
  const navigate = useNavigate()

  return (
    <section className="bg-paper py-24">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-14 px-6 lg:grid-cols-2 lg:px-8">
        <Reveal variants={fadeInLeft}>
          <Eyebrow>O ciclo que gera receita</Eyebrow>
          <h2 className="mt-3 font-display text-4xl font-bold leading-[1.08] tracking-tight text-ink sm:text-5xl">
            Criar o CRM é só o começo.{' '}
            <span className="text-accent-500">O dinheiro entra quando você organiza e vende.</span>
          </h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-neutral-600">
            O Code Sellers organiza cada lead, acompanha a negociação e mostra exatamente quando o
            pagamento entra — do primeiro contato ao dinheiro no bolso.
          </p>
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-ink/90"
          >
            Criar conta grátis
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </Reveal>

        <Reveal variants={fadeInUp}>
          <TiltCard max={4}>
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b0b0e] shadow-glass-strong">
              <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
                </div>
                <span className="font-mono text-[11px] uppercase tracking-wide text-neutral-500">
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
                      index === 0 ? 'bg-accent-500/15 text-accent-bright' : 'bg-[#0b0b0e] text-neutral-500'
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
