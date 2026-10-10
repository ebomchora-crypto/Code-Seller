import { useCallback, useEffect, useState } from 'react'
import { useBilling } from '@/stores/BillingContext'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, Globe, Loader2, PanelLeft, Sparkles, TriangleAlert } from 'lucide-react'
import { toast } from 'sonner'
import { PageWrapper } from '@/components/ui/PageWrapper'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { PromptBox, PROMPT_IDEAS } from '@/components/code-maker/PromptBox'
import { useAttachments } from '@/components/code-maker/Attachments'
import { SiteThumbnail } from '@/components/code-maker/SiteThumbnail'
import { SiteFavicon } from '@/components/code-maker/SiteFavicon'
import { createSite, getCodeMakerUsage, listSites, type CodeMakerUsage, type SiteSummary } from '@/services/supabase/codeMaker'
import type { SiteBrief, SiteStyle } from '../../../supabase/functions/code-maker/site'
import { useCodeMakerShell } from './layout'

function relativeDate(value: string): string {
  const date = new Date(value)
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000)
  if (days <= 0) return `hoje, ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
  if (days === 1) return 'ontem'
  if (days < 7) return `há ${days} dias`
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function StatusBadge({ site }: { site: SiteSummary }) {
  if (site.status === 'ready') {
    return site.published ? (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/12 px-2 py-0.5 text-[11px] font-semibold text-emerald-500">
        <Globe className="size-3" /> No ar
      </span>
    ) : (
      <span className="rounded-full bg-[var(--bg-muted)] px-2 py-0.5 text-[11px] font-semibold text-[var(--text-muted)]">Fora do ar</span>
    )
  }
  if (site.status === 'error') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/12 px-2 py-0.5 text-[11px] font-semibold text-red-500">
        <TriangleAlert className="size-3" /> Parou no meio
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--accent-tint)] px-2 py-0.5 text-[11px] font-semibold text-[var(--accent-text)]">
      <Loader2 className="size-3 animate-spin" /> Em criação
    </span>
  )
}

// Dados que vieram do CRM ou do Buyers Hunter (?novo=1&nome=…&nicho=…).
interface Prefill {
  businessName: string | null
  niche: string | null
  city: string | null
  phone: string | null
  contactId: string | null
  rating: number | null
  reviews: number | null
}

function prefillFromParams(params: URLSearchParams): Prefill {
  const number = (key: string) => {
    const value = Number(params.get(key))
    return Number.isFinite(value) && value > 0 ? value : null
  }
  return {
    businessName: params.get('nome'),
    niche: params.get('nicho'),
    city: params.get('cidade'),
    phone: params.get('telefone'),
    contactId: params.get('contato'),
    rating: number('nota'),
    reviews: number('avaliacoes'),
  }
}

// Começa o pedido com o que já se sabe do negócio; a pessoa completa.
function promptFromPrefill(prefill: Prefill): string {
  const where = [prefill.niche, prefill.city ? `em ${prefill.city}` : null].filter(Boolean).join(' ')
  return [
    `Site para ${prefill.businessName ?? 'o meu cliente'}${where ? `, ${where}` : ''}.`,
    prefill.phone ? `WhatsApp: ${prefill.phone}.` : null,
    prefill.rating && prefill.reviews ? `Nota ${prefill.rating.toLocaleString('pt-BR')} no Google com ${prefill.reviews} avaliações.` : null,
    '',
  ]
    .filter((line) => line !== null)
    .join(' ')
}

export default function CodeMakerPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [sites, setSites] = useState<SiteSummary[]>([])
  const [usage, setUsage] = useState<CodeMakerUsage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [prompt, setPrompt] = useState('')
  const [prefill, setPrefill] = useState<Prefill | null>(null)
  const [creating, setCreating] = useState(false)
  const attachments = useAttachments()
  const shell = useCodeMakerShell()

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [list, today] = await Promise.all([listSites(), getCodeMakerUsage().catch(() => null)])
      setSites(list)
      setUsage(today)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  // Chegou do CRM ou do Buyers Hunter: o pedido já vem começado.
  useEffect(() => {
    if (searchParams.get('novo') !== '1') return
    const data = prefillFromParams(searchParams)
    setPrefill(data)
    setPrompt(promptFromPrefill(data))
    setSearchParams(new URLSearchParams(), { replace: true })
  }, [searchParams, setSearchParams])

  const billing = useBilling().status
  const limitReached = usage?.sites_limit != null ? usage.sites_today >= usage.sites_limit : false

  async function create(style: SiteStyle) {
    const text = prompt.trim()
    if (!text || creating) return
    setCreating(true)
    try {
      const brief: SiteBrief = {
        businessName: prefill?.businessName ?? '',
        niche: prefill?.niche ?? null,
        city: prefill?.city ?? null,
        phone: prefill?.phone ?? null,
        rating: prefill?.rating ?? null,
        reviews: prefill?.reviews ?? null,
        style,
        details: text,
        assets: attachments.assets,
      }
      const site = await createSite(brief, prefill?.contactId)
      navigate(`/code-maker/${site.id}?gerar=1`)
    } catch (err) {
      toast.error((err as Error).message)
      setCreating(false)
    }
  }

  return (
    <div data-lenis-prevent className="min-h-0 flex-1 overflow-y-auto">
    <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] px-3 py-2.5 lg:hidden">
      <button
        type="button"
        onClick={shell.openSites}
        className="flex size-9 items-center justify-center rounded-xl text-[var(--text-muted)] transition hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]"
        aria-label="Ver seus sites"
      >
        <PanelLeft className="size-4.5" />
      </button>
      <span className="font-display text-[15px] font-semibold tracking-tight">Code Maker</span>
    </div>
    <PageWrapper>
      <section className="relative mx-auto max-w-3xl pb-4 pt-6 text-center sm:pt-14">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-10 left-1/2 h-[460px] w-[1100px] max-w-[160%] -translate-x-1/2 opacity-70 [background-image:linear-gradient(var(--border-subtle)_1px,transparent_1px),linear-gradient(90deg,var(--border-subtle)_1px,transparent_1px)] [background-size:46px_46px] [mask-image:radial-gradient(55%_65%_at_50%_0%,black,transparent)]"
        />
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-0 h-64 w-[640px] max-w-full -translate-x-1/2 rounded-full bg-[#7c3aed]/25 blur-[100px]" />
        <span className="relative inline-flex items-center gap-1.5 rounded-full border border-[var(--purple-border)] bg-[var(--purple-soft)] px-3 py-1 text-[12px] font-semibold text-[var(--accent-text)]">
          <Sparkles className="size-3.5" /> Site completo em poucos minutos
        </span>
        <h1 className="relative mt-4 bg-gradient-to-r from-[var(--text-primary)] via-[var(--text-primary)] to-[var(--accent-text)] bg-clip-text font-display text-[34px] font-bold leading-[1.08] tracking-tight text-transparent sm:text-[52px]">
          O que vamos criar hoje?
        </h1>
        <p className="relative mx-auto mt-3 max-w-xl text-[15.5px] leading-relaxed text-[var(--text-muted)]">
          Descreva o site do seu jeito e anexe a logo e as fotos do cliente. A IA cria e você ajusta conversando.
        </p>
        <div className="relative mt-8 text-left">
          <PromptBox
            value={prompt}
            onChange={setPrompt}
            onSubmit={(style) => void create(style)}
            busy={creating}
            disabled={limitReached}
            footnote={usage?.sites_limit != null ? `${usage.sites_today} de ${usage.sites_limit} ${usage.sites_limit === 1 ? 'site' : 'sites'} hoje` : null}
            attachments={attachments}
          />
        </div>
        {limitReached ? (
          <p className="relative mt-4 text-[13.5px] text-amber-600 dark:text-amber-300">
            {billing?.state === 'trial'
              ? `No teste grátis dá para criar ${usage?.sites_limit} sites por dia. Assine para criar até 10 por dia — e dá para continuar alterando o que já existe.`
              : `Você já criou os ${usage?.sites_limit} sites de hoje. Amanhã libera de novo — dá para continuar alterando os que já existem.`}
          </p>
        ) : (
          <div className="relative mt-4 flex flex-wrap justify-center gap-2">
            {PROMPT_IDEAS.map((idea) => (
              <button
                key={idea.label}
                type="button"
                onClick={() => {
                  setPrefill(null)
                  setPrompt(idea.prompt)
                }}
                className="rounded-full border border-[var(--border-default)] bg-[var(--bg-card)] px-3 py-1.5 text-[12.5px] text-[var(--text-secondary)] transition hover:border-[var(--accent-ring)] hover:text-[var(--accent-text)]"
              >
                {idea.label}
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="mb-4 flex items-center gap-2 font-display text-[18px] font-semibold tracking-tight text-[var(--text-primary)]">
          Seus sites
          {!loading && (
            <span className="rounded-full border border-[var(--border-default)] px-2 py-0.5 font-sans text-[12px] font-semibold tabular-nums text-[var(--text-secondary)]">
              {sites.length}
            </span>
          )}
        </h2>
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="aspect-[16/13] rounded-[22px]" />
            ))}
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={() => void load()} />
        ) : sites.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[var(--border-default)] px-5 py-8 text-center text-[14px] text-[var(--text-muted)]">
            Os sites que você criar aparecem aqui, com o link para mandar ao cliente.
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {sites.map((site) => (
              <Link
                key={site.id}
                to={`/code-maker/${site.id}`}
                className="group overflow-hidden rounded-[22px] border border-[var(--border-default)] bg-[var(--bg-card)] transition duration-200 hover:-translate-y-0.5 hover:border-[var(--accent-ring)] hover:shadow-[var(--shadow-modal)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)]"
              >
                <SiteThumbnail html={site.html} title={site.name} />
                <div className="flex items-start justify-between gap-3 border-t border-[var(--border-subtle)] px-4 py-3.5">
                  <div className="flex min-w-0 items-center gap-3">
                    <SiteFavicon site={site} size={34} />
                    <div className="min-w-0">
                      <p className="truncate font-display text-[15px] font-semibold tracking-tight text-[var(--text-primary)]">{site.name}</p>
                      <p className="mt-0.5 truncate text-[12.5px] text-[var(--text-muted)]">/s/{site.slug}</p>
                    </div>
                  </div>
                  <StatusBadge site={site} />
                </div>
                <div className="flex items-center justify-between px-4 pb-3.5 text-[12px] text-[var(--text-muted)]">
                  <span>Alterado {relativeDate(site.updated_at)}</span>
                  <span className="inline-flex items-center gap-1 tabular-nums">
                    <Eye className="size-3.5" /> {site.views.toLocaleString('pt-BR')}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </PageWrapper>
    </div>
  )
}
