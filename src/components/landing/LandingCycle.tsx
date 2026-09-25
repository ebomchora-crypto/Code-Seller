import { useNavigate } from 'react-router-dom'
import { LandingEyebrow } from '@/components/landing/LandingEyebrow'
import { LandingButton } from '@/components/landing/LandingButton'
import { Reveal } from '@/components/motion/Reveal'
import { TiltCard } from '@/components/motion/TiltCard'
import { fadeInLeft, fadeInUp } from '@/motion/variants'

// Linhas do mock de código — a jornada inteira do método em uma função só,
// sintaxe destacada em roxo (nunca colorido demais: só branco, cinza e roxo).
const codeLines: Array<{ tokens: Array<{ text: string; className: string }> }> = [
  {
    tokens: [
      { text: 'const ', className: 'text-landing-primary-hover' },
      { text: 'ideia', className: 'text-landing-text' },
      { text: ' = ', className: 'text-landing-text-muted' },
      { text: 'encontrarProblemaReal();', className: 'text-landing-text-secondary' },
    ],
  },
  {
    tokens: [
      { text: 'const ', className: 'text-landing-primary-hover' },
      { text: 'produto', className: 'text-landing-text' },
      { text: ' = ', className: 'text-landing-text-muted' },
      { text: 'criarComIA(ideia);', className: 'text-landing-text-secondary' },
    ],
  },
  {
    tokens: [
      { text: 'const ', className: 'text-landing-primary-hover' },
      { text: 'oferta', className: 'text-landing-text' },
      { text: ' = ', className: 'text-landing-text-muted' },
      { text: 'transformarEmOferta(produto);', className: 'text-landing-text-secondary' },
    ],
  },
  {
    tokens: [
      { text: 'const ', className: 'text-landing-primary-hover' },
      { text: 'empresas', className: 'text-landing-text' },
      { text: ' = ', className: 'text-landing-text-muted' },
      { text: 'codeHunter.buscar(oferta);', className: 'text-landing-text-secondary' },
    ],
  },
  {
    tokens: [
      { text: 'const ', className: 'text-landing-primary-hover' },
      { text: 'conversas', className: 'text-landing-text' },
      { text: ' = ', className: 'text-landing-text-muted' },
      { text: 'abordar(empresas);', className: 'text-landing-text-secondary' },
    ],
  },
  {
    tokens: [
      { text: 'const ', className: 'text-landing-primary-hover' },
      { text: 'venda', className: 'text-landing-text' },
      { text: ' = ', className: 'text-landing-text-muted' },
      { text: 'fechar(conversas);', className: 'text-landing-text-secondary' },
    ],
  },
  {
    tokens: [
      { text: 'return ', className: 'text-landing-primary-hover' },
      { text: 'dinheiroNoBolso(venda);', className: 'text-landing-text-secondary' },
    ],
  },
]

export function LandingCycle() {
  const navigate = useNavigate()

  return (
    <section className="relative overflow-hidden bg-landing-surface-2 py-24 sm:py-32">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 top-1/2 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-landing-primary/[0.08] blur-[130px]"
      />

      <div className="relative mx-auto grid w-full max-w-[1280px] grid-cols-1 items-center gap-14 px-6 sm:px-8 lg:grid-cols-2 lg:px-12">
        <Reveal variants={fadeInLeft}>
          <LandingEyebrow>O código, por trás</LandingEyebrow>
          <h2 className="mt-4 text-3xl font-medium leading-[1.1] tracking-[-0.03em] text-landing-text sm:text-4xl">
            Um problema real vira{' '}
            <span className="font-semibold text-landing-primary-hover">dinheiro no bolso.</span>
          </h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-landing-text-secondary">
            Não é sobre aprender mais uma ferramenta. É sobre ter um caminho claro entre a ideia e
            o pagamento recebido.
          </p>
          <div className="mt-8">
            <LandingButton onClick={() => navigate('/register')} arrow>
              Entrar no grupo
            </LandingButton>
          </div>
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
                <span className="font-mono text-[11px] uppercase tracking-wide text-landing-text-muted">
                  metodo.ts
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
