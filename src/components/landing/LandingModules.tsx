import type { ComponentType, SVGProps } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { Eyebrow } from '@/components/ui/eyebrow'
import { Reveal } from '@/components/motion/Reveal'
import { CrmIcon, DealsIcon, FinancialIcon, AutopilotIcon } from '@/components/layout/navIcons'
import { fadeInLeft, fadeInUp } from '@/motion/variants'

interface ModuleEntry {
  number: string
  moduleLabel: string
  stageLabel: string
  title: string
  description: string
  delivery: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
}

// Réplica da estrutura "4 entregas" da referência — cada módulo é um passo
// real do produto (não texto genérico), com a mesma anatomia visual: painel
// escuro com badge numerado + painel claro com título, descrição e "entrega".
const modules: ModuleEntry[] = [
  {
    number: '01',
    moduleLabel: 'Módulo 01',
    stageLabel: 'Etapa organizar',
    title: 'Organize seus leads com o CRM.',
    description:
      'Cadastre contatos, adicione tags e acompanhe o histórico completo de cada relacionamento — sem planilha paralela.',
    delivery: 'Sua base de leads organizada e pronta pra trabalhar',
    icon: CrmIcon,
  },
  {
    number: '02',
    moduleLabel: 'Módulo 02',
    stageLabel: 'Etapa acompanhar',
    title: 'Acompanhe cada negociação no Kanban.',
    description:
      'Mova negócios pelas etapas do funil conforme a conversa avança, sem perder o timing de follow-up.',
    delivery: 'Pipeline visual com cada negociação no lugar certo',
    icon: DealsIcon,
  },
  {
    number: '03',
    moduleLabel: 'Módulo 03',
    stageLabel: 'Etapa receber',
    title: 'Controle recebíveis sem sair do CRM.',
    description:
      'Registre pagamentos, acompanhe recorrências e saiba exatamente quando o dinheiro entra.',
    delivery: 'Financeiro integrado, dinheiro rastreado',
    icon: FinancialIcon,
  },
  {
    number: '04',
    moduleLabel: 'Módulo 04',
    stageLabel: 'Etapa vender',
    title: 'Feche mais rápido com o AutoPilot.',
    description:
      'A IA analisa seu pipeline, sugere o próximo passo e ajuda a conduzir a conversa até o fechamento.',
    delivery: 'Clientes no radar e um processo claro para fechar vendas',
    icon: AutopilotIcon,
  },
]

function ModulePanel({ module, flip }: { module: ModuleEntry; flip: boolean }) {
  const Icon = module.icon

  const visual = (
    <div
      className={`relative flex min-h-[220px] items-center justify-center overflow-hidden bg-accent-ink p-8 sm:min-h-[280px] ${
        flip ? 'sm:order-2' : ''
      }`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(circle at 30% 30%, rgba(179,92,255,0.28), transparent 65%)' }}
      />
      <span className="absolute left-5 top-5 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white/80 backdrop-blur-sm">
        {module.number} / {module.stageLabel.replace('Etapa ', '')}
      </span>
      <span className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-accent-bright/30 bg-accent-500/15 text-accent-bright">
        <Icon className="h-9 w-9" />
      </span>
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-8 -right-4 select-none font-display text-[9rem] font-black leading-none text-white/[0.04]"
      >
        {module.number}
      </span>
    </div>
  )

  const text = (
    <div className="flex flex-col justify-center bg-white p-8 sm:p-10">
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

          <Reveal variants={fadeInUp} className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
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
