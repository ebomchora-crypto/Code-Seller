import { ArrowUpRight } from 'lucide-react'
import { LandingEyebrow } from '@/components/landing/LandingEyebrow'
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
// real do produto (não texto genérico), com a anatomia: painel com print
// real do produto + painel de texto, ambos dentro do mesmo card dark.
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
      className={`relative min-h-[300px] overflow-hidden bg-landing-bg sm:min-h-[380px] ${flip ? 'sm:order-2' : ''}`}
    >
      <img
        src={module.image}
        alt={module.imageAlt}
        className="absolute inset-0 h-full w-full object-cover"
        loading="lazy"
      />
      {/* Overlay bem discreto — só o suficiente pra dar contraste ao badge,
          sem "lavar" a imagem (pedido explícito: nada de overlay forte). */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent"
      />
      {/* Borda interna sutil — separa a foto do card sem precisar de moldura pesada */}
      <div aria-hidden className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/[0.06]" />
      <span className="absolute left-5 top-5 rounded-full border border-white/15 bg-black/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white backdrop-blur-md">
        {module.number} / {module.stageLabel.replace('Etapa ', '')}
      </span>
    </div>
  )

  const text = (
    <div className={`flex flex-col justify-center bg-[#101014] p-8 sm:p-10 ${flip ? 'sm:order-1' : ''}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-landing-primary-hover">
          {module.moduleLabel}
        </span>
        <span className="text-xs font-medium uppercase tracking-wide text-landing-text-muted">
          {module.stageLabel}
        </span>
      </div>

      <h3 className="mt-3 text-2xl font-bold leading-snug tracking-tight text-landing-text">{module.title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-landing-text-secondary">{module.description}</p>

      <div className="mt-6 flex items-center justify-between gap-4 rounded-xl border border-landing-primary/20 bg-landing-primary-soft px-4 py-3">
        <span className="text-xs font-medium leading-snug text-landing-text">{module.delivery}</span>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-landing-primary text-white">
          <ArrowUpRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </div>
  )

  return (
    <Reveal
      variants={flip ? fadeInLeft : fadeInUp}
      className="group overflow-hidden rounded-3xl border border-white/[0.07] shadow-landing-card transition-colors duration-300 hover:border-white/[0.12]"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2">
        {visual}
        {text}
      </div>
    </Reveal>
  )
}

// Seção "N entregas" — cabeçalho (headline + card "aprenda fazendo") seguido
// da pilha de painéis alternados. Fundo volta pro landing-bg (#08080a),
// criando o ritmo claro/escuro-de-tom entre seções (surface-2 → bg).
export function LandingModules() {
  return (
    <section id="funcionalidades" className="relative overflow-hidden bg-landing-bg py-24">
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-0 h-[420px] w-[700px] translate-x-1/3 -translate-y-1/3 rounded-full bg-landing-primary/[0.06] blur-[120px]"
      />

      <div className="relative mx-auto w-full max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-6 border-b border-white/[0.08] pb-10 lg:grid-cols-[1fr_320px] lg:gap-8">
          <Reveal variants={fadeInLeft}>
            <LandingEyebrow>Da ideia ao dinheiro</LandingEyebrow>
            <h2 className="mt-4 text-4xl font-bold leading-[1.08] tracking-tight text-landing-text sm:text-5xl">
              4 entregas. De leads organizados a vendas fechadas.
            </h2>
          </Reveal>

          <Reveal
            variants={fadeInUp}
            className="rounded-3xl border border-white/[0.07] bg-[#101014] p-5 shadow-landing-card"
          >
            <LandingEyebrow>Aprenda fazendo</LandingEyebrow>
            <p className="mt-2 text-sm leading-relaxed text-landing-text-secondary">
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
