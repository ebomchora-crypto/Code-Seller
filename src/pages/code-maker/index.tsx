import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, Globe, Loader2, Plus, Sparkles, TriangleAlert } from 'lucide-react'
import { PageHeader, PageWrapper } from '@/components/ui/PageWrapper'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { NewSiteModal, type NewSitePrefill } from '@/components/code-maker/NewSiteModal'
import { SiteThumbnail } from '@/components/code-maker/SiteThumbnail'
import { getCodeMakerUsage, listSites, type CodeMakerUsage, type SiteSummary } from '@/services/supabase/codeMaker'

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

// Lê ?novo=1&nome=…&nicho=… (botões "Criar site" do CRM e do Buyers Hunter).
function prefillFromParams(params: URLSearchParams): NewSitePrefill {
  const number = (key: string) => {
    const value = Number(params.get(key))
    return Number.isFinite(value) && value > 0 ? value : null
  }
  return {
    businessName: params.get('nome') ?? undefined,
    niche: params.get('nicho') ?? undefined,
    city: params.get('cidade') ?? undefined,
    phone: params.get('telefone') ?? undefined,
    contactId: params.get('contato'),
    rating: number('nota'),
    reviews: number('avaliacoes'),
  }
}

export default function CodeMakerPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [sites, setSites] = useState<SiteSummary[]>([])
  const [usage, setUsage] = useState<CodeMakerUsage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [prefill, setPrefill] = useState<NewSitePrefill | null>(null)

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

  // Chegou de outro lugar pedindo um site novo, já com os dados do negócio.
  useEffect(() => {
    if (searchParams.get('novo') !== '1') return
    setPrefill(prefillFromParams(searchParams))
    setModalOpen(true)
    setSearchParams(new URLSearchParams(), { replace: true })
  }, [searchParams, setSearchParams])

  const limitReached = usage ? usage.sites_today >= usage.sites_limit : false
  const left = usage ? Math.max(0, usage.sites_limit - usage.sites_today) : null

  const usageLabel = useMemo(() => {
    if (!usage) return null
    return `${usage.sites_today} de ${usage.sites_limit} sites hoje`
  }, [usage])

  function openNew() {
    setPrefill(null)
    setModalOpen(true)
  }

  return (
    <PageWrapper>
      <PageHeader
        title="Code Maker"
        count={loading ? undefined : sites.length}
        subtitle="Descreva o negócio e a IA cria um site profissional, pronto para mandar ao cliente em um link."
        actions={
          <>
            {usageLabel && (
              <span
                className="rounded-full border border-[var(--border-default)] bg-[var(--bg-card)] px-3 py-1.5 text-[12.5px] font-medium tabular-nums text-[var(--text-secondary)]"
                title="Libera de novo à meia-noite"
              >
                {usageLabel}
              </span>
            )}
            <Button onClick={openNew} disabled={limitReached} magnetic>
              <Plus className="size-4" /> Novo site
            </Button>
          </>
        }
      />

      {limitReached && (
        <p className="mt-4 rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-[13.5px] text-amber-600 dark:text-amber-300">
          Você já criou os {usage?.sites_limit} sites de hoje. Amanhã libera de novo — dá para continuar alterando os que já existem.
        </p>
      )}

      <div className="mt-8">
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="aspect-[16/13] rounded-[22px]" />
            ))}
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={() => void load()} />
        ) : sites.length === 0 ? (
          <div className="relative overflow-hidden rounded-[26px] border border-[var(--border-default)] bg-[var(--bg-card)] px-6 py-14 text-center sm:py-20">
            <div aria-hidden className="pointer-events-none absolute left-1/2 top-0 h-60 w-[520px] -translate-x-1/2 rounded-full bg-[#7c3aed]/15 blur-[90px]" />
            <div className="relative mx-auto flex max-w-md flex-col items-center">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#8b5cf6,#6d28d9)] text-white shadow-[0_12px_30px_-12px_rgba(124,58,237,0.9)]">
                <Sparkles className="size-6" />
              </span>
              <h2 className="mt-5 font-display text-[22px] font-bold tracking-tight text-[var(--text-primary)]">Seu primeiro site em minutos</h2>
              <p className="mt-2 text-[14.5px] text-[var(--text-muted)]">
                Nome, nicho e cidade já bastam. Você vê a IA escrevendo o código ao vivo, pede mudanças no chat e publica em
                <span className="font-medium text-[var(--text-secondary)]"> {window.location.host}/s/nome-do-negocio</span>.
              </p>
              <Button className="mt-6" onClick={openNew} disabled={limitReached}>
                <Plus className="size-4" /> Criar site
              </Button>
              {left !== null && <p className="mt-3 text-[12.5px] text-[var(--text-muted)]">Até {usage?.sites_limit} sites por dia.</p>}
            </div>
          </div>
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
                  <div className="min-w-0">
                    <p className="truncate font-display text-[15px] font-semibold tracking-tight text-[var(--text-primary)]">{site.name}</p>
                    <p className="mt-0.5 truncate text-[12.5px] text-[var(--text-muted)]">/s/{site.slug}</p>
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
      </div>

      <NewSiteModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        prefill={prefill}
        onCreated={(id) => {
          setModalOpen(false)
          navigate(`/code-maker/${id}?gerar=1`)
        }}
      />
    </PageWrapper>
  )
}
