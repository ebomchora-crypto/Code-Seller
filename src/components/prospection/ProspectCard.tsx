import { Link } from 'react-router-dom'
import { AtSign, Check, CheckCircle2, EyeOff, Globe, MapPin, MessageCircle, Phone, Plus, Sparkles, Star } from 'lucide-react'
import { Spinner } from '@/components/ui/Spinner'
import { siteUrl, whatsappUrl } from '@/utils/contactLinks'
import { isMobilePhone, POTENTIAL_LABELS, WEBSITE_KIND_LABELS } from '@/utils/prospection'
import type { PotentialLevel, ScoredProspect } from '@/types'

interface ProspectCardProps {
  prospect: ScoredProspect
  selected: boolean
  importedContactId: string | undefined
  importing: boolean
  onToggleSelect: () => void
  onImport: () => void
  onDismiss: () => void
  onOutreach: () => void
}

const LEVEL_COLORS: Record<PotentialLevel, string> = {
  high: '#22c55e',
  medium: '#f59e0b',
  low: '#94a3b8',
}

const WEBSITE_BADGE: Record<ScoredProspect['website_kind'], string> = {
  none: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  social: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  site: 'bg-[var(--bg-muted)] text-[var(--text-secondary)]',
}

const iconButton =
  'flex size-9 items-center justify-center rounded-xl border border-[var(--border-default)] text-[var(--text-muted)] transition-colors hover:border-[var(--accent-ring)] hover:text-[var(--accent-text)]'

function ScoreRing({ score, level }: { score: number; level: PotentialLevel }) {
  const color = LEVEL_COLORS[level]
  const circumference = 2 * Math.PI * 19
  return (
    <div className="relative size-12 shrink-0" title={`${POTENTIAL_LABELS[level]} (${score} de 100)`}>
      <svg viewBox="0 0 44 44" className="size-12 -rotate-90">
        <circle cx="22" cy="22" r="19" fill="none" stroke="var(--border-default)" strokeWidth="3" />
        <circle
          cx="22"
          cy="22"
          r="19"
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - score / 100)}
          style={{ filter: `drop-shadow(0 0 4px ${color}66)` }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-display text-[14px] font-bold tabular-nums text-[var(--text-primary)]">
        {score}
      </span>
      <span className="sr-only">{POTENTIAL_LABELS[level]}</span>
    </div>
  )
}

export function ProspectCard({
  prospect,
  selected,
  importedContactId,
  importing,
  onToggleSelect,
  onImport,
  onDismiss,
  onOutreach,
}: ProspectCardProps) {
  const imported = importedContactId !== undefined
  const whatsapp = isMobilePhone(prospect.phone) ? whatsappUrl(prospect.phone) : null
  const location = [prospect.city, prospect.state].filter(Boolean).join(' · ')

  return (
    <article
      className={`group flex flex-col gap-4 border-b border-[var(--border-subtle)] px-5 py-4 transition-colors duration-150 last:border-0 sm:flex-row sm:items-center ${
        selected ? 'bg-[var(--accent-tint)]' : 'hover:bg-black/[0.02] dark:hover:bg-white/[0.025]'
      }`}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3.5">
        <button
          type="button"
          role="checkbox"
          aria-checked={selected}
          aria-label={`Selecionar ${prospect.name}`}
          disabled={imported}
          onClick={onToggleSelect}
          className={`mt-3.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${
            selected
              ? 'border-transparent bg-[linear-gradient(135deg,#8b5cf6,#6d28d9)] text-white'
              : 'border-[var(--border-strong)] hover:border-[var(--accent-ring)]'
          }`}
        >
          {selected && <Check className="size-3.5" strokeWidth={3} />}
        </button>

        <ScoreRing score={prospect.potential.score} level={prospect.potential.level} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="truncate text-[15px] font-semibold text-[var(--text-primary)]">{prospect.name}</h3>
            {imported && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--accent-tint)] px-2 py-0.5 text-[11px] font-medium text-[var(--accent-text)]">
                <CheckCircle2 className="size-3" />
                No CRM
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-[12.5px] text-[var(--text-muted)]">
            {[prospect.category, location].filter(Boolean).join(' · ')}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12px]">
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${WEBSITE_BADGE[prospect.website_kind]}`}>
              {prospect.website_kind === 'social' ? <AtSign className="size-3" /> : <Globe className="size-3" />}
              {WEBSITE_KIND_LABELS[prospect.website_kind]}
            </span>
            {prospect.rating !== null && (
              <span className="inline-flex items-center gap-1 text-[var(--text-secondary)]">
                <Star className="size-3.5 fill-amber-400 text-amber-400" />
                <span className="font-medium tabular-nums">{prospect.rating.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}</span>
                <span className="text-[var(--text-muted)]">({prospect.reviews.toLocaleString('pt-BR')})</span>
              </span>
            )}
            {prospect.phone && (
              <span className="inline-flex items-center gap-1 tabular-nums text-[var(--text-secondary)]">
                <Phone className="size-3.5 text-[var(--text-muted)]" />
                {prospect.phone}
              </span>
            )}
            {prospect.website && prospect.website_kind !== 'none' && (
              <a
                href={siteUrl(prospect.website)}
                target="_blank"
                rel="noreferrer"
                className="max-w-[200px] truncate text-[var(--text-muted)] hover:text-[var(--accent-text)]"
              >
                {prospect.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
              </a>
            )}
          </div>

          <p className="mt-2 text-[12px] text-[var(--text-muted)]">
            <span className="font-medium text-[var(--text-secondary)]">Por quê: </span>
            {prospect.potential.reasons.join(' · ')}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 pl-[70px] sm:pl-0">
        <button type="button" onClick={onOutreach} className={iconButton} title="Gerar abordagem" aria-label={`Gerar abordagem para ${prospect.name}`}>
          <Sparkles className="size-4" />
        </button>
        {whatsapp ? (
          <a href={whatsapp} target="_blank" rel="noreferrer" className={iconButton} title="Abrir WhatsApp" aria-label={`WhatsApp de ${prospect.name}`}>
            <MessageCircle className="size-4" />
          </a>
        ) : prospect.phone ? (
          <a href={`tel:${prospect.phone.replace(/[^\d+]/g, '')}`} className={iconButton} title="Ligar" aria-label={`Ligar para ${prospect.name}`}>
            <Phone className="size-4" />
          </a>
        ) : null}
        {prospect.maps_url && (
          <a href={prospect.maps_url} target="_blank" rel="noreferrer" className={iconButton} title="Ver no mapa" aria-label={`Ver ${prospect.name} no mapa`}>
            <MapPin className="size-4" />
          </a>
        )}
        {!imported && (
          <button type="button" onClick={onDismiss} className={iconButton} title="Ignorar" aria-label={`Ignorar ${prospect.name}`}>
            <EyeOff className="size-4" />
          </button>
        )}
        {imported ? (
          <Link
            to={`/crm/${importedContactId}`}
            className="inline-flex h-9 min-w-[108px] items-center justify-center gap-1.5 rounded-xl border border-[var(--border-default)] px-3.5 text-[13px] font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--accent-ring)] hover:text-[var(--accent-text)]"
          >
            Ver contato
          </Link>
        ) : (
          <button
            type="button"
            onClick={onImport}
            title="Adicionar ao CRM"
            aria-label={`Adicionar ${prospect.name} ao CRM`}
            disabled={importing}
            className="inline-flex h-9 min-w-[108px] items-center justify-center gap-1.5 rounded-xl bg-[linear-gradient(135deg,#8b5cf6,#6d28d9)] px-3.5 text-[13px] font-medium text-white shadow-[0_8px_22px_-12px_rgba(124,58,237,0.9)] transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
          >
            {importing ? <Spinner size="sm" className="text-white" /> : <Plus className="size-4" strokeWidth={2.4} />}
            CRM
          </button>
        )}
      </div>
    </article>
  )
}
