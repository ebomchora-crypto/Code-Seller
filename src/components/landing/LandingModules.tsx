import type { ReactNode } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { LandingEyebrow } from '@/components/landing/LandingEyebrow'
import { MockupFrame } from '@/components/landing/MockupFrame'
import { Reveal } from '@/components/motion/Reveal'
import { fadeInLeft, fadeInUp } from '@/motion/variants'

interface ModuleEntry {
  number: string
  moduleLabel: string
  stageLabel: string
  title: string
  description: string
  delivery: string
  visual: ReactNode
}

// Mockup 01 — gerador: prompt → preview → deploy.
function GeneratorMockup() {
  return (
    <MockupFrame label="gerador.app">
      <div className="space-y-4">
        <div className="rounded-landing-sm border border-white/10 bg-white/[0.03] px-4 py-3">
          <p className="text-[11px] uppercase tracking-wide text-landing-text-muted">Prompt</p>
          <p className="mt-1.5 text-sm text-landing-text">
            "Site institucional pra clínica odontológica, com agendamento online."
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 rounded-landing-sm border border-white/10 bg-white/[0.02] p-3">
          <div className="col-span-3 h-2 w-2/3 rounded-full bg-white/10" />
          <div className="h-14 rounded-landing-sm bg-landing-primary/25" />
          <div className="h-14 rounded-landing-sm bg-white/[0.05]" />
          <div className="h-14 rounded-landing-sm bg-white/[0.05]" />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-landing-text-muted">Preview pronto</span>
          <span className="rounded-full bg-landing-primary-hover/15 px-3 py-1 text-xs font-medium text-landing-primary-hover">
            Deploy concluído
          </span>
        </div>
      </div>
    </MockupFrame>
  )
}

// Mockup 02 — valorizar: percepção de valor antes/depois, em barras.
function ValueMockup() {
  const bars = [
    { label: 'Design', value: 92 },
    { label: 'Copy', value: 88 },
    { label: 'Apresentação', value: 95 },
  ]
  return (
    <MockupFrame label="apresentacao.pdf">
      <div className="space-y-5">
        {bars.map((bar) => (
          <div key={bar.label}>
            <div className="flex items-center justify-between text-xs">
              <span className="text-landing-text-muted">{bar.label}</span>
              <span className="font-medium text-landing-primary-hover">{bar.value}%</span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-landing-primary to-landing-primary-hover"
                style={{ width: `${bar.value}%` }}
              />
            </div>
          </div>
        ))}
        <p className="pt-1 text-xs text-landing-text-muted">
          Projeto pronto pra ser apresentado, não só entregue.
        </p>
      </div>
    </MockupFrame>
  )
}

// Mockup 03 — resolver: dor real → sistema → resultado, em nós conectados.
function SystemMockup() {
  const nodes = [
    { label: 'Dor real', detail: 'Processo manual' },
    { label: 'Sistema', detail: 'Automação com IA', highlight: true },
    { label: 'Resultado', detail: 'Horas economizadas' },
  ]
  return (
    <MockupFrame label="sistema.flow">
      <div className="flex items-stretch justify-between gap-2">
        {nodes.map((node, index) => (
          <div key={node.label} className="flex items-center gap-2">
            <div
              className={`w-[104px] rounded-landing-sm border p-3 text-center sm:w-[120px] ${
                node.highlight
                  ? 'border-landing-primary-hover/50 bg-landing-primary-soft'
                  : 'border-white/10 bg-white/[0.03]'
              }`}
            >
              <p className={`text-[13px] font-semibold ${node.highlight ? 'text-landing-primary-hover' : 'text-landing-text'}`}>
                {node.label}
              </p>
              <p className="mt-1 text-[11px] leading-snug text-landing-text-muted">{node.detail}</p>
            </div>
            {index < nodes.length - 1 && <span className="h-px w-4 shrink-0 bg-white/15 sm:w-6" aria-hidden />}
          </div>
        ))}
      </div>
    </MockupFrame>
  )
}

// Mockup 04 — vender: pipeline Novo → Contato → Reunião → Proposta → Fechado.
function PipelineMockup() {
  const stages = [
    { label: 'Novo', count: 12 },
    { label: 'Contato', count: 8 },
    { label: 'Reunião', count: 5 },
    { label: 'Proposta', count: 3 },
    { label: 'Fechado', count: 2, highlight: true },
  ]
  return (
    <MockupFrame label="pipeline.crm">
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2.5">
        {stages.map((stage) => (
          <div
            key={stage.label}
            className={`flex flex-col items-center gap-2 rounded-landing-sm border p-2 text-center sm:p-3 ${
              stage.highlight ? 'border-landing-primary-hover/50 bg-landing-primary-soft' : 'border-white/10 bg-white/[0.03]'
            }`}
          >
            <span className={`text-lg font-semibold sm:text-xl ${stage.highlight ? 'text-landing-primary-hover' : 'text-landing-text'}`}>
              {stage.count}
            </span>
            <span className="text-[9px] uppercase tracking-wide text-landing-text-muted sm:text-[10px]">{stage.label}</span>
          </div>
        ))}
      </div>
    </MockupFrame>
  )
}

const modules: ModuleEntry[] = [
  {
    number: '01',
    moduleLabel: 'Módulo 01',
    stageLabel: 'Etapa criar',
    title: 'Crie sites com IA em minutos.',
    description: 'Transforme prompts em soluções reais, responsivas e prontas para apresentar.',
    delivery: 'Primeiro projeto funcionando',
    visual: <GeneratorMockup />,
  },
  {
    number: '02',
    moduleLabel: 'Módulo 02',
    stageLabel: 'Etapa valorizar',
    title: 'Faça seu projeto parecer premium.',
    description: 'Aprenda design, copy e apresentação para aumentar a percepção de valor.',
    delivery: 'Projeto profissional pronto para vender',
    visual: <ValueMockup />,
  },
  {
    number: '03',
    moduleLabel: 'Módulo 03',
    stageLabel: 'Etapa resolver',
    title: 'Construa sistemas que empresas realmente precisam.',
    description: 'Encontre dores reais e transforme-as em sistemas, automações e soluções.',
    delivery: 'Demo resolvendo um problema comercial real',
    visual: <SystemMockup />,
  },
  {
    number: '04',
    moduleLabel: 'Módulo 04',
    stageLabel: 'Etapa vender',
    title: 'Encontre clientes. Conduza a venda.',
    description: 'Use o Buyers Hunter para encontrar oportunidades e um processo estruturado para conduzir cada conversa.',
    delivery: 'Pipeline real de potenciais clientes',
    visual: <PipelineMockup />,
  },
]

function ModuleRow({ module, flip }: { module: ModuleEntry; flip: boolean }) {
  return (
    <Reveal
      variants={flip ? fadeInLeft : fadeInUp}
      className="grid grid-cols-1 items-center gap-10 border-t border-landing-border py-16 first:border-t-0 first:pt-0 sm:py-20 lg:grid-cols-2 lg:gap-16"
    >
      <div className={flip ? 'lg:order-2' : ''}>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-landing-primary-hover">
            {module.moduleLabel}
          </span>
          <span className="h-1 w-1 rounded-full bg-landing-text-muted" />
          <span className="text-xs font-medium uppercase tracking-[0.14em] text-landing-text-muted">
            {module.stageLabel}
          </span>
        </div>

        <h3 className="mt-4 text-2xl font-medium leading-snug tracking-[-0.02em] text-landing-text sm:text-3xl">
          {module.title}
        </h3>
        <p className="mt-4 max-w-md text-base leading-relaxed text-landing-text-secondary">{module.description}</p>

        <div className="mt-7 inline-flex items-center gap-2.5 rounded-full border border-landing-border bg-white/[0.03] py-2 pl-4 pr-2 text-sm text-landing-text-secondary">
          {module.delivery}
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-landing-primary text-white">
            <ArrowUpRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>

      <div className={flip ? 'lg:order-1' : ''}>{module.visual}</div>
    </Reveal>
  )
}

export function LandingModules() {
  return (
    <section id="modulos" className="relative overflow-hidden bg-landing-bg py-24 sm:py-32">
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-0 h-[420px] w-[700px] translate-x-1/3 -translate-y-1/3 rounded-full bg-landing-primary/[0.06] blur-[120px]"
      />

      <div className="relative mx-auto w-full max-w-[1280px] px-6 sm:px-8 lg:px-12">
        <Reveal variants={fadeInUp} className="max-w-2xl">
          <LandingEyebrow>Os módulos</LandingEyebrow>
          <h2 className="mt-4 text-3xl font-medium leading-[1.1] tracking-[-0.03em] text-landing-text sm:text-4xl">
            4 entregas. De ideia a cliente pagante.
          </h2>
        </Reveal>

        <div className="mt-4">
          {modules.map((module, index) => (
            <ModuleRow key={module.number} module={module} flip={index % 2 === 1} />
          ))}
        </div>
      </div>
    </section>
  )
}
