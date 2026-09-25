import { ArrowUpRight } from 'lucide-react'
import { Eyebrow } from '@/components/ui/eyebrow'
import { Reveal } from '@/components/motion/Reveal'
import { fadeInLeft, fadeInUp } from '@/motion/variants'

interface ModuleEntry {
  number: string
  moduleLabel: string
  stageLabel: string
  title: string
  description: string
  delivery: string
  image: string
  imageAlt: string
}

// Réplica da estrutura "4 entregas" da referência — cada módulo é um passo
// real do produto (não texto genérico), com a mesma anatomia visual: painel
// com print real do produto + painel claro com título, descrição e "entrega".
const modules: ModuleEntry[] = [
  {
    number: '01',
    moduleLabel: 'Módulo 01',
    stageLabel: 'Etapa organizar',
    title: 'Organize seus leads com o CRM.',
    description:
      'Cadastre contatos, adicione tags e acompanhe o histórico completo de cada relacionamento — sem planilha paralela.',
    delivery: 'Sua base de leads organizada e pronta pra trabalhar',
    image: '/landing/modules/module-01-crm.webp',
    imageAlt: 'Tela do módulo de Leads do Code Sellers, com métricas e lista de contatos',
  },
  {
    number: '02',
    moduleLabel: 'Módulo 02',
    stageLabel: 'Etapa acompanhar',
    title: 'Acompanhe cada negociação no Kanban.',
    description:
      'Mova negócios pelas etapas do funil conforme a conversa avança, sem perder o timing de follow-up.',
    delivery: 'Pipeline visual com cada negociação no lugar certo',
    image: '/landing/modules/module-02-pipeline.webp',
    imageAlt: 'Tela do pipeline de Negócios do Code Sellers em Kanban',
  },
  {
    number: '03',
    moduleLabel: 'Módulo 03',
    stageLabel: 'Etapa receber',
    title: 'Controle recebíveis sem sair do CRM.',
    description:
      'Registre pagamentos, acompanhe recorrências e saiba exatamente quando o dinheiro entra.',
    delivery: 'Financeiro integrado, dinheiro rastreado',
    image: '/landing/modules/module-03-financeiro.webp',
    imageAlt: 'Tela do módulo Financeiro do Code Sellers com recebimentos',
  },
  {
    number: '04',
    moduleLabel: 'Módulo 04',
    stageLabel: 'Etapa vender',
    title: 'Feche mais rápido com o AutoPilot.',
    description:
      'A IA analisa seu pipeline, sugere o próximo passo e ajuda a conduzir a conversa até o fechamento.',
    delivery: 'Clientes no radar e um processo claro para fechar vendas',
    image: '/landing/modules/module-04-autopilot.webp',
    imageAlt: 'Tela do AutoPilot do Code Sellers sugerindo próximos passos com IA',
  },
]

function ModulePanel({ module, flip }: { module: ModuleEntry; flip: boolean }) {
  const visual = (
    <div
      className={`relative min-h-[220px] overflow-hidden bg-accent-ink sm:min-h-[280px] ${flip ? 'sm:order-2' : ''}`}
    >
      <img src={module.image} alt={module.imageAlt} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-accent-ink/70 via-transparent to-transparent"
      />
      <span className="absolute left-5 top-5 rounded-full border border-white/15 bg-white/[0.08] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
        {module.number} / {module.stageLabel.replace('Etapa ', '')}
      </span>
    </div>
  )

  // bg-[#fff], não bg-white: globals.css remapeia `.dark .bg-white` pra
  // var(--bg-card) (quase preto), e o tema padrão do site é dark — com
  // bg-white o painel virava fundo escuro + texto escuro (ilegível). Mesmo
  // escape já usado no LandingNavbar.
  const text = (
    <div className={`flex flex-col justify-center bg-[#fff] p-8 sm:p-10 ${flip ? 'sm:order-1' : ''}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-accent-500">{module.moduleLabel}</span>
        <span className="text-xs font-medium uppercase tracking-wide text-neutral-400">{module.stageLabel}</span>
      </div>

      <h3 className="mt-3 font-display text-2xl font-bold leading-snug tracking-tight text-ink">{module.title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-neutral-600">{module.description}</p>

      <div className="mt-6 flex items-center justify-between gap-4 rounded-xl border border-accent-500/15 bg-accent-500/[0.05] px-4 py-3">
        <span className="text-xs font-medium leading-snug text-neutral-700">{module.delivery}</span>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-500 text-white">
          <ArrowUpRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </div>
  )

  return (
    <Reveal variants={flip ? fadeInLeft : fadeInUp} className="overflow-hidden rounded-2xl border border-neutral-200 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <div className="grid grid-cols-1 sm:grid-cols-2">
        {visual}
        {text}
      </div>
    </Reveal>
  )
}

// Seção "N entregas" — cabeçalho (headline + card "aprenda fazendo") seguido
// da pilha de painéis alternados, réplica direta da estrutura das prints.
export function LandingModules() {
  return (
    <section id="funcionalidades" className="bg-paper py-24">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-8 border-b border-neutral-200 pb-10 lg:grid-cols-[1fr_320px]">
          <Reveal variants={fadeInLeft}>
            <Eyebrow>Da ideia ao dinheiro</Eyebrow>
            <h2 className="mt-3 font-display text-4xl font-bold leading-[1.08] tracking-tight text-ink sm:text-5xl">
              4 entregas. De leads organizados a vendas fechadas.
            </h2>
          </Reveal>

          {/* bg-[#fff] pelo mesmo motivo do painel de texto acima */}
          <Reveal variants={fadeInUp} className="rounded-2xl border border-neutral-200 bg-[#fff] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <Eyebrow>Aprenda fazendo</Eyebrow>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">
              Cada etapa termina com algo que você pode usar de verdade — nada fica preso num
              tutorial.
            </p>
          </Reveal>
        </div>

        <div className="mt-10 flex flex-col gap-6">
          {modules.map((module, index) => (
            <ModulePanel key={module.number} module={module} flip={index % 2 === 1} />
          ))}
        </div>
      </div>
    </section>
  )
}
