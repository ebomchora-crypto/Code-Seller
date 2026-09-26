import { useNavigate } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { LandingEyebrow } from '@/components/landing/LandingEyebrow'
import { Reveal } from '@/components/motion/Reveal'
import { TiltCard } from '@/components/motion/TiltCard'
import { fadeInLeft, fadeInUp } from '@/motion/variants'

// Linhas do mock de código — a jornada inteira do método em uma função só.
const codeLines: Array<{ tokens: Array<{ text: string; className: string }> }> = [
  {
    tokens: [
      { text: 'const ', className: 'text-landing-primary-hover' },
      { text: 'ideia', className: 'text-white' },
      { text: ' = ', className: 'text-neutral-500' },
      { text: 'encontrarProblemaReal();', className: 'text-neutral-300' },
    ],
  },
  {
    tokens: [
      { text: 'const ', className: 'text-landing-primary-hover' },
      { text: 'produto', className: 'text-white' },
      { text: ' = ', className: 'text-neutral-500' },
      { text: 'criarComIA(ideia);', className: 'text-neutral-300' },
    ],
  },
  {
    tokens: [
      { text: 'const ', className: 'text-landing-primary-hover' },
      { text: 'oferta', className: 'text-white' },
      { text: ' = ', className: 'text-neutral-500' },
      { text: 'transformarEmOferta(produto);', className: 'text-neutral-300' },
    ],
  },
  {
    tokens: [
      { text: 'const ', className: 'text-landing-primary-hover' },
      { text: 'empresas', className: 'text-white' },
      { text: ' = ', className: 'text-neutral-500' },
      { text: 'buyersHunter.buscar(oferta);', className: 'text-neutral-300' },
    ],
  },
  {
    tokens: [
      { text: 'return ', className: 'text-landing-primary-hover' },
      { text: 'dinheiroNoBolso(fechar(empresas));', className: 'text-neutral-300' },
    ],
  },
]

// Único momento de fundo claro da landing — contraste deliberado com o resto
// (dark premium). Texto + CTA à esquerda, mockup de código à direita — igual
// à referência, na paleta roxa do Code Sellers.
export function LandingProblem() {
  const navigate = useNavigate()

  return (
    <section className="relative overflow-hidden bg-landing-bg-light py-24 sm:py-32">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage: 'linear-gradient(to right, rgba(17,16,20,0.035) 1px, transparent 1px)',
          backgroundSize: '80px 100%',
        }}
      />

      <div className="relative mx-auto grid w-full max-w-[1280px] grid-cols-1 items-center gap-14 px-6 sm:px-8 lg:grid-cols-2 lg:px-12">
        <Reveal variants={fadeInLeft}>
          <LandingEyebrow tone="light">O ciclo que gera receita</LandingEyebrow>
          <h2 className="mt-4 text-3xl font-medium leading-[1.12] tracking-[-0.03em] text-landing-text-dark sm:text-4xl lg:text-5xl">
            Criar é só o começo.{' '}
            <span className="font-semibold text-landing-primary">O dinheiro entra quando você encontra e vende.</span>
          </h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-[#4a4750]">
            A maioria aprende ferramenta. Poucos aprendem a transformar habilidade em oferta,
            oportunidade e venda.
          </p>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-landing-text-dark px-6 text-sm font-semibold text-white transition-colors duration-200 hover:bg-black"
          >
            Quero transformar em venda
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </Reveal>

        <Reveal variants={fadeInUp}>
          <TiltCard max={4}>
            <div className="overflow-hidden rounded-landing-lg border border-white/10 bg-[#0b0710] shadow-landing-card">
              <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3.5">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
                  <span className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
                </div>
                <span className="font-mono text-[11px] uppercase tracking-wide text-neutral-500">
                  code_to_cash.flow
                </span>
              </div>

              <div className="space-y-3 px-6 py-8 font-mono text-[13px] leading-relaxed">
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
            </div>
          </TiltCard>
        </Reveal>
      </div>
    </section>
  )
}
