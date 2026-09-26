import type { ReactNode } from 'react'
import { LandingFadeIn } from '@/components/landing/LandingFadeIn'
import { LandingKicker } from '@/components/landing/LandingKicker'
import { MockupFrame } from '@/components/landing/MockupFrame'

interface ModuleEntry {
  phase: string
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
        <div className="rounded-[12px] border border-white/10 bg-white/[0.04] px-4 py-3">
          <p className="text-[10px] uppercase tracking-[0.16em] text-white/40">Prompt</p>
          <p className="mt-1.5 text-[13px] leading-5 text-white/90">
            "Site institucional pra clínica odontológica, com agendamento online."
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 rounded-[12px] border border-white/10 bg-white/[0.02] p-3">
          <div className="col-span-3 h-2 w-2/3 rounded-full bg-white/10" />
          <div className="h-14 rounded-[8px] bg-gradient-to-br from-[#8b5cf6]/60 to-[#4c1d95]/40" />
          <div className="h-14 rounded-[8px] bg-white/[0.06]" />
          <div className="h-14 rounded-[8px] bg-white/[0.06]" />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/40">Preview pronto</span>
          <span className="rounded-full border border-[#a78bfa]/30 bg-[#7c3aed]/20 px-3 py-1 text-[11px] font-medium text-[#c4b5fd]">
            Deploy concluído
          </span>
        </div>
      </div>
    </MockupFrame>
  )
}

// Mockup 02 — valorizar: percepção de valor em barras.
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
              <span className="text-white/45">{bar.label}</span>
              <span className="font-medium text-[#c4b5fd]">{bar.value}%</span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#6d28d9] to-[#a78bfa] shadow-[0_0_12px_rgba(167,139,250,0.5)]"
                style={{ width: `${bar.value}%` }}
              />
            </div>
          </div>
        ))}
        <p className="pt-1 text-xs text-white/40">Projeto pronto pra ser apresentado, não só entregue.</p>
      </div>
    </MockupFrame>
  )
}

// Mockup 03 — resolver: dor real → sistema → resultado.
function SystemMockup() {
  const nodes = [
    { label: 'Dor real', detail: 'Processo manual' },
    { label: 'Sistema', detail: 'Automação com IA', highlight: true },
    { label: 'Resultado', detail: 'Horas economizadas' },
  ]
  return (
    <MockupFrame label="sistema.flow">
      <div className="flex items-stretch justify-between gap-1.5">
        {nodes.map((node, index) => (
          <div key={node.label} className="flex flex-1 items-center gap-1.5">
            <div
              className={`flex-1 rounded-[12px] border px-2 py-3 text-center ${
                node.highlight
                  ? 'border-[#a78bfa]/50 bg-[#7c3aed]/20 shadow-[0_0_24px_rgba(124,58,237,0.35)]'
                  : 'border-white/10 bg-white/[0.04]'
              }`}
            >
              <p className={`text-[13px] font-semibold ${node.highlight ? 'text-[#c4b5fd]' : 'text-white'}`}>
                {node.label}
              </p>
              <p className="mt-1 text-[10px] leading-snug text-white/40">{node.detail}</p>
            </div>
            {index < nodes.length - 1 && <span className="h-px w-3 shrink-0 bg-[#a78bfa]/40" aria-hidden />}
          </div>
        ))}
      </div>
    </MockupFrame>
  )
}

// Mockup 04 — vender: pipeline Novo → Fechado.
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
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
        {stages.map((stage) => (
          <div
            key={stage.label}
            className={`flex flex-col items-center gap-2 rounded-[10px] border px-1 py-3 text-center ${
              stage.highlight
                ? 'border-[#a78bfa]/50 bg-[#7c3aed]/20 shadow-[0_0_24px_rgba(124,58,237,0.35)]'
                : 'border-white/10 bg-white/[0.04]'
            }`}
          >
            <span className={`text-lg font-semibold ${stage.highlight ? 'text-[#c4b5fd]' : 'text-white'}`}>
              {stage.count}
            </span>
            <span className="text-[8px] uppercase tracking-wide text-white/40 sm:text-[9px]">{stage.label}</span>
          </div>
        ))}
      </div>
    </MockupFrame>
  )
}

const modules: ModuleEntry[] = [
  {
    phase: 'CRIAR',
    title: 'Crie sites com IA em minutos.',
    description:
      'Transforme prompts em soluções reais, responsivas e prontas para apresentar — mesmo começando do zero.',
    delivery: 'Primeiro projeto funcionando e pronto pra mostrar',
    visual: <GeneratorMockup />,
  },
  {
    phase: 'VALORIZAR',
    title: 'Faça seu projeto parecer premium.',
    description:
      'Aprenda design, copy e apresentação para sair do genérico, aumentar a percepção de valor e cobrar mais.',
    delivery: 'Projeto profissional pronto para vender',
    visual: <ValueMockup />,
  },
  {
    phase: 'RESOLVER',
    title: 'Construa sistemas que empresas realmente precisam.',
    description:
      'Encontre dores reais de um negócio e transforme-as em sistemas, automações e demos que mostram a solução funcionando.',
    delivery: 'Demo resolvendo um problema comercial real',
    visual: <SystemMockup />,
  },
  {
    phase: 'VENDER',
    title: 'Encontre clientes. Conduza a venda.',
    description:
      'Use o Buyers Hunter para encontrar oportunidades e um processo estruturado para conduzir cada conversa até o fechamento.',
    delivery: 'Pipeline real de potenciais clientes',
    visual: <PipelineMockup />,
  },
]

function ModuleRow({ module, index }: { module: ModuleEntry; index: number }) {
  const flip = index % 2 === 1
  const number = String(index + 1).padStart(2, '0')

  return (
    <LandingFadeIn delay={index * 0.045}>
      <article className="cs-module-row group grid rounded-[22px] lg:min-h-[440px] lg:grid-cols-[minmax(0,1fr)_minmax(0,0.94fr)] lg:rounded-[34px]">
        <div className={`cs-module-visual min-h-[280px] lg:min-h-[440px] ${flip ? 'lg:order-2' : ''}`}>
          <div className="relative z-[2] flex h-full items-center justify-center px-5 pb-16 pt-20 sm:px-10 lg:px-12 lg:py-16">
            <div className="cs-module-mock w-full max-w-[440px]">{module.visual}</div>
          </div>
          <div aria-hidden className={`cs-module-shade ${flip ? 'cs-module-shade-flip' : ''}`} />
          <span className="cs-module-label">
            {number} / {module.phase}
          </span>
          <span className="cs-module-brand" aria-hidden>
            <img src="/logo.png" alt="" className="h-4 w-4 object-contain" />
            CODE SELLERS
          </span>
        </div>

        <div
          className={`cs-module-copy flex flex-col justify-between px-6 pb-6 pt-8 sm:px-10 sm:pb-9 sm:pt-10 lg:px-[52px] lg:pb-11 lg:pt-12 ${
            flip ? 'lg:order-1' : ''
          }`}
        >
          <div>
            <div className="flex items-center justify-between border-b border-[rgba(49,29,80,0.12)] pb-4 text-[10px] font-semibold tracking-[0.18em] text-[#5b21b6]">
              <span>MÓDULO {number}</span>
              <span className="text-[rgba(42,28,64,0.4)]">ETAPA {module.phase}</span>
            </div>
            <h3 className="mt-[26px] max-w-[620px] text-[34px] font-normal leading-[0.98] tracking-[-0.055em] text-[#151318] sm:text-[40px] lg:text-[clamp(2.3rem,3vw,3.25rem)]">
              {module.title}
            </h3>
            <p className="mt-5 max-w-[560px] text-[15px] leading-[1.62] text-[rgba(51,38,72,0.66)] lg:text-[17px]">
              {module.description}
            </p>
          </div>

          <div className="cs-module-outcome mt-8 grid grid-cols-[1fr_auto] items-center gap-x-6 gap-y-2 rounded-[18px] py-[18px] pl-5 pr-[18px]">
            <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#5b21b6]">
              Entrega do módulo
            </span>
            <span className="text-[15px] font-medium leading-[1.45] text-[rgba(35,22,56,0.9)]">{module.delivery}</span>
            <span
              aria-hidden
              className="cs-module-arrow col-start-2 row-span-2 row-start-1 grid size-[42px] place-items-center rounded-full bg-[#6d28d9] text-[18px] text-white"
            >
              ↗
            </span>
          </div>
        </div>
      </article>
    </LandingFadeIn>
  )
}

export function LandingModules() {
  return (
    <section id="modulos" className="cs-curriculum py-24 text-[#151318] lg:py-28">
      <div className="relative z-10 mx-auto w-full max-w-[1280px] px-5 sm:px-8 lg:px-12">
        <LandingFadeIn>
          <div className="grid gap-9 border-b border-[rgba(41,25,60,0.14)] pb-9 lg:grid-cols-[1.08fr_0.52fr] lg:items-end lg:gap-20 lg:pb-[52px]">
            <div className="text-center lg:text-left">
              <LandingKicker>Da ideia ao dinheiro</LandingKicker>
              <h2 className="mx-auto max-w-[760px] text-[42px] font-normal leading-[0.95] tracking-[-0.06em] sm:text-[52px] lg:mx-0 lg:text-[62px]">
                4 entregas. De ideia a cliente pagante.
              </h2>
            </div>

            <div className="cs-route-summary">
              <div className="flex items-center justify-between border-b border-[rgba(43,24,70,0.12)] pb-5">
                <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#5b21b6]">
                  Aprenda fazendo
                </span>
                <span className="font-mono text-[13px] text-[rgba(38,23,60,0.42)]">01 — 04</span>
              </div>
              <p className="pt-5 text-[16px] leading-7 text-[rgba(48,36,70,0.68)]">
                Cada etapa termina com algo que você pode mostrar, oferecer e vender. Nada fica preso
                no tutorial.
              </p>
            </div>
          </div>
        </LandingFadeIn>

        <div className="mt-14 flex flex-col gap-[18px] lg:mt-20 lg:gap-6">
          {modules.map((module, index) => (
            <ModuleRow key={module.phase} module={module} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}
