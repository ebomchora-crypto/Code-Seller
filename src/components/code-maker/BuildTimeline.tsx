import { useEffect, useRef, type ReactNode } from 'react'
import { Check, CircleAlert, FileSearch, LayoutTemplate, Loader2, Palette as PaletteIcon, RotateCcw, Sparkles } from 'lucide-react'
import { parsePart, partOrder } from '../../../supabase/functions/code-maker/site'
import type { Site, SiteVersion, StoredPlan } from '@/services/supabase/codeMaker'
import type { BuildPhase, PartProgress } from '@/hooks/useSiteBuilder'

const STYLE_NAMES: Record<string, string> = {
  auto: 'Estilo livre',
  dark: 'Moderno escuro',
  minimal: 'Minimalista',
  elegant: 'Elegante',
  vibrant: 'Vibrante',
}

export function partLabel(plan: StoredPlan | null, id: string): string {
  if (id === 'header') return 'Cabeçalho'
  if (id === 'footer') return 'Rodapé'
  const label = plan?.sections.find((section) => section.id === id)?.label
  return id === 'hero' ? `Topo${label && label.toLowerCase() !== 'início' ? ` · ${label}` : ''}` : label ?? id
}

function formatTime(value: string): string {
  return new Date(value).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function UserBubble({ children, time }: { children: ReactNode; time?: string }) {
  return (
    <div className="flex flex-col items-end gap-1">
      <div className="max-w-[88%] rounded-2xl rounded-br-md bg-[linear-gradient(135deg,#8b5cf6,#6d28d9)] px-3.5 py-2.5 text-[13.5px] leading-relaxed text-white shadow-[0_8px_20px_-12px_rgba(124,58,237,0.9)]">
        {children}
      </div>
      {time && <span className="pr-1 text-[10.5px] text-[var(--text-muted)]">{time}</span>}
    </div>
  )
}

function AiBlock({ title, status, children }: { title: string; status: 'working' | 'done' | 'error' | 'idle'; children?: ReactNode }) {
  return (
    <div className="flex gap-2.5">
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-tint)] text-[var(--accent-text)]">
        <Sparkles className="size-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-[13px] font-semibold text-[var(--text-primary)]">
          {title}
          {status === 'working' && <Loader2 className="size-3.5 animate-spin text-[var(--accent-text)]" />}
          {status === 'done' && <Check className="size-3.5 text-emerald-500" />}
          {status === 'error' && <CircleAlert className="size-3.5 text-red-500" />}
        </p>
        {children && <div className="mt-2">{children}</div>}
      </div>
    </div>
  )
}

function ActionList({ actions, live = false }: { actions: string[]; live?: boolean }) {
  if (actions.length === 0) {
    return live ? <p className="text-[13px] text-[var(--text-muted)]">Pensando…</p> : null
  }
  return (
    <ul className="flex flex-col gap-1.5">
      {actions.map((action, index) => (
        <li key={index} className="flex gap-2 text-[13px] leading-relaxed text-[var(--text-secondary)]">
          <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-[var(--accent-text)]/70" />
          <span>{action}</span>
        </li>
      ))}
    </ul>
  )
}

// Últimas linhas do código que a IA está escrevendo agora.
function CodeTail({ code }: { code: string }) {
  const lines = code.split('\n').slice(-7).join('\n')
  if (!lines.trim()) return null
  return (
    <pre className="mt-2.5 max-h-36 overflow-hidden whitespace-pre-wrap break-all rounded-xl border border-white/5 bg-[#0d0c12] px-3 py-2.5 font-mono text-[11px] leading-[1.6] text-[#b9b9c6] [mask-image:linear-gradient(to_bottom,transparent,black_35%)]">
      {lines}
    </pre>
  )
}

function Palette({ plan }: { plan: StoredPlan }) {
  const colors = [plan.palette.brand, plan.palette.accent, plan.palette.ink, plan.palette.paper, plan.palette.surface]
  return (
    <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-muted)]/50 px-3 py-2.5">
      <span className="flex -space-x-1">
        {colors.map((color, index) => (
          <span key={index} className="size-5 rounded-full ring-2 ring-[var(--panel-bg)]" style={{ background: color }} title={color} />
        ))}
      </span>
      <span className="text-[12px] text-[var(--text-muted)]">
        {plan.fonts.display}
        {plan.fonts.body !== plan.fonts.display && ` + ${plan.fonts.body}`}
      </span>
    </div>
  )
}

// Linhas de etapa no estilo dos construtores de site com IA: o que a IA já
// fez, uma por linha, com ícone.
function StepRow({ icon: Icon, label, working = false }: { icon: typeof Check; label: string; working?: boolean }) {
  return (
    <li className="flex items-center gap-2 text-[12.5px] text-[var(--text-muted)]">
      {working ? <Loader2 className="size-3.5 shrink-0 animate-spin text-[var(--accent-text)]" /> : <Icon className="size-3.5 shrink-0" />}
      <span className={working ? 'text-[var(--text-secondary)]' : undefined}>{label}</span>
    </li>
  )
}

function PlanSteps({ planning, plan, actions }: { planning: boolean; plan: StoredPlan | null; actions: string[] }) {
  if (planning) {
    return (
      <ul className="mb-3 flex flex-col gap-1.5">
        <StepRow icon={FileSearch} label="Pedido lido" />
        <StepRow icon={PaletteIcon} label={actions.length ? 'Direção de arte em andamento' : 'Pensando na direção de arte…'} working />
      </ul>
    )
  }
  if (!plan) return null
  return (
    <ul className="mb-3 flex flex-col gap-1.5">
      <StepRow icon={FileSearch} label="Pedido lido" />
      <StepRow icon={PaletteIcon} label="Cores e fontes escolhidas" />
      <StepRow icon={LayoutTemplate} label={`${plan.sections.length} seções planejadas`} />
    </ul>
  )
}

interface BuildTimelineProps {
  site: Site
  versions: SiteVersion[]
  phase: BuildPhase
  planText: string
  planActions: string[]
  progress: Record<string, PartProgress>
  editText: string
  editActions: string[]
  pendingInstruction: string | null
  error: string | null
  onContinue: () => void
  onOpenPart: (id: string) => void
  onRestore: (version: SiteVersion) => void
  /** Aviso de "site pronto", mostrado logo depois da criação. */
  readyCard?: ReactNode
}

export function BuildTimeline(props: BuildTimelineProps) {
  const { site, versions, phase, planActions, progress, editText, editActions, pendingInstruction, error } = props
  const bottom = useRef<HTMLDivElement>(null)
  const plan = site.plan
  const brief = site.brief
  const planning = phase === 'planning'
  const building = phase === 'building'
  const busy = phase !== 'idle'

  const parts = plan ? partOrder(plan) : []
  const partStatus = (id: string): PartProgress['status'] =>
    progress[id]?.status ?? (site.parts[id] ? 'done' : 'queued')
  const doneCount = parts.filter((id) => partStatus(id) === 'done').length
  const writing = parts.filter((id) => progress[id]?.status === 'writing')
  const latestWriting = writing[writing.length - 1]
  const history = versions.filter((version) => version.kind !== 'create')
  const lastVersionId = versions[versions.length - 1]?.id
  const createVersion = versions.find((version) => version.kind === 'create')

  // Acompanha o fim da conversa enquanto a IA trabalha.
  useEffect(() => {
    bottom.current?.scrollIntoView({ block: 'end' })
  }, [planActions.length, doneCount, editActions.length, pendingInstruction, error, versions.length])

  const briefChips = [brief.niche, brief.city, brief.style && brief.style !== 'auto' ? STYLE_NAMES[brief.style] : null].filter(Boolean) as string[]
  const planStatus = planning ? 'working' : plan ? 'done' : error ? 'error' : 'idle'
  const needsContinue = !busy && site.status !== 'ready'

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-5">
      <UserBubble time={formatTime(site.created_at)}>
        {brief.details ? (
          <p className="whitespace-pre-wrap">{brief.details}</p>
        ) : (
          <p>
            Criar o site da <strong className="font-semibold">{brief.businessName}</strong>
          </p>
        )}
        {briefChips.length > 0 && (
          <p className="mt-2 flex flex-wrap gap-1">
            {briefChips.map((chip) => (
              <span key={chip} className="rounded-full bg-white/15 px-2 py-0.5 text-[11.5px]">
                {chip}
              </span>
            ))}
          </p>
        )}
        {brief.assets && brief.assets.length > 0 && (
          <span className="mt-2 flex flex-wrap gap-1.5">
            {brief.assets.map((asset) => (
              <img
                key={asset.url}
                src={asset.url}
                alt={asset.kind === 'logo' ? 'Logo enviada' : 'Foto enviada'}
                className={`size-10 rounded-lg bg-white/15 ${asset.kind === 'logo' ? 'object-contain p-1' : 'object-cover'}`}
              />
            ))}
          </span>
        )}
      </UserBubble>

      <AiBlock title={planning || !plan ? 'Planejando o site' : 'Direção de arte'} status={planStatus}>
        <PlanSteps planning={planning} plan={plan} actions={planActions} />
        <ActionList actions={planning ? planActions : plan?.actions ?? []} live={planning} />
        {plan && !planning && <Palette plan={plan} />}
      </AiBlock>

      {plan && (
        <AiBlock
          title={site.status === 'ready' && !building ? `Site pronto · ${parts.length} partes` : `Escrevendo o site · ${doneCount} de ${parts.length}`}
          status={building ? 'working' : site.status === 'ready' ? 'done' : 'idle'}
        >
          <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
            {parts.map((id) => {
              const status = partStatus(id)
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => props.onOpenPart(id)}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[12.5px] text-[var(--text-secondary)] transition hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]"
                  >
                    {status === 'done' ? (
                      <Check className="size-3.5 shrink-0 text-emerald-500" />
                    ) : status === 'writing' ? (
                      <Loader2 className="size-3.5 shrink-0 animate-spin text-[var(--accent-text)]" />
                    ) : status === 'error' ? (
                      <CircleAlert className="size-3.5 shrink-0 text-red-500" />
                    ) : (
                      <span className="size-3.5 shrink-0 rounded-full border border-[var(--border-strong)]" />
                    )}
                    <span className="truncate">{partLabel(plan, id)}</span>
                  </button>
                </li>
              )
            })}
          </ul>
          {latestWriting && <CodeTail code={parsePart(progress[latestWriting]?.text ?? '').html} />}
          {createVersion && versions.length > 1 && lastVersionId !== createVersion.id && !busy && (
            <RestoreButton onClick={() => props.onRestore(createVersion)} />
          )}
        </AiBlock>
      )}

      {props.readyCard && site.status === 'ready' && !building && history.length === 0 && props.readyCard}

      {history.map((version) =>
        version.kind === 'restore' ? (
          <p key={version.id} className="flex items-center justify-center gap-1.5 text-[11.5px] text-[var(--text-muted)]">
            <RotateCcw className="size-3" /> Versão anterior restaurada · {formatTime(version.created_at)}
          </p>
        ) : (
          <div key={version.id} className="flex flex-col gap-3">
            <UserBubble time={formatTime(version.created_at)}>{version.instruction}</UserBubble>
            <AiBlock title="Alteração feita" status="done">
              <ActionList actions={version.actions} />
              {version.id !== lastVersionId && !busy && <RestoreButton onClick={() => props.onRestore(version)} />}
            </AiBlock>
          </div>
        ),
      )}

      {pendingInstruction && (
        <div className="flex flex-col gap-3">
          <UserBubble>{pendingInstruction}</UserBubble>
          <AiBlock title="Alterando o site" status="working">
            <ActionList actions={editActions} live />
            <CodeTail code={editText.split(/<\/acoes>/i)[1] ?? ''} />
          </AiBlock>
        </div>
      )}

      {error && !busy && (
        <div className="rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-[13px] text-red-600 dark:text-red-300">
          {error}
        </div>
      )}

      {needsContinue && (
        <button
          type="button"
          onClick={props.onContinue}
          className="self-start rounded-full bg-[linear-gradient(135deg,#8b5cf6,#6d28d9)] px-4 py-2 text-[13px] font-semibold text-white shadow-[0_8px_22px_-10px_rgba(124,58,237,0.9)] transition hover:brightness-110"
        >
          {plan ? 'Continuar criação' : 'Gerar site'}
        </button>
      )}
      <div ref={bottom} />
    </div>
  )
}

function RestoreButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-[var(--border-default)] px-2.5 py-1 text-[11.5px] font-medium text-[var(--text-muted)] transition hover:border-[var(--accent-ring)] hover:text-[var(--accent-text)]"
    >
      <RotateCcw className="size-3" /> Voltar para esta versão
    </button>
  )
}
