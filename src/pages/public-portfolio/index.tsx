import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ArrowUpRight, Flag, MapPin, MessageCircle, Quote, X } from 'lucide-react'
import { SilkRibbons } from '@/components/auth/SilkRibbons'
import { getPublicPortfolio, registerPortfolioView, reportPortfolio } from '@/services/supabase/portfolio'
import { whatsappUrl } from '@/utils/contactLinks'
import { PORTFOLIO_CATEGORY_LABELS } from '@/utils/portfolio'
import type { PublicPortfolio, PublicPortfolioProject } from '@/types'

const STEPS = [
  { title: 'Conversa', text: 'Entendo o seu negócio, seus clientes e o que você precisa.' },
  { title: 'Proposta', text: 'Você recebe escopo, prazo e valor claros antes de começar.' },
  { title: 'Entrega', text: 'Seu projeto no ar, pronto para trazer clientes.' },
]

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function ReportDialog({ slug, onClose }: { slug: string; onClose: () => void }) {
  const [reason, setReason] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (reason.trim().length < 3) return
    setStatus('sending')
    try {
      await reportPortfolio(slug, reason.trim().slice(0, 1000))
      setStatus('sent')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label="Denunciar página" className="w-full max-w-md rounded-3xl border border-white/10 bg-[#130d22] p-6 text-white shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-display text-[18px] font-semibold">Denunciar esta página</h2>
          <button type="button" onClick={onClose} aria-label="Fechar" className="flex size-8 items-center justify-center rounded-full text-white/60 hover:bg-white/10 hover:text-white">
            <X className="size-4" />
          </button>
        </div>
        {status === 'sent' ? (
          <p className="mt-4 text-[14px] text-white/70">Obrigado. A equipe do Code Sellers vai analisar esta página.</p>
        ) : (
          <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
            <p className="text-[13.5px] text-white/60">Conte o que tem de errado (conteúdo impróprio, golpe, uso indevido de marca…).</p>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={4}
              maxLength={1000}
              className="w-full resize-none rounded-2xl border border-white/15 bg-white/[0.05] p-3 text-[14px] text-white outline-none focus:border-[#a78bfa]"
            />
            {status === 'error' && <p className="text-[12.5px] text-red-300">Não foi possível enviar agora. Tente de novo.</p>}
            <button
              type="submit"
              disabled={reason.trim().length < 3 || status === 'sending'}
              className="h-10 rounded-full bg-[#fff] text-[14px] font-semibold text-[#120c24] transition hover:bg-[#ede9fe] disabled:opacity-50"
            >
              {status === 'sending' ? 'Enviando…' : 'Enviar denúncia'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

// Página pública do Sellers Portfolio (/p/:slug): o que o cliente vê ao abrir o
// link. Sempre escura e com a identidade roxa do Code Sellers.
export default function PublicPortfolioPage() {
  const { slug = '' } = useParams<{ slug: string }>()
  const [searchParams] = useSearchParams()
  const preview = searchParams.get('preview') === '1'
  const [data, setData] = useState<{ portfolio: PublicPortfolio; projects: PublicPortfolioProject[] } | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading')
  const [reportOpen, setReportOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    getPublicPortfolio(slug.toLowerCase())
      .then((result) => {
        if (cancelled) return
        setData(result)
        setStatus(result ? 'ready' : 'missing')
      })
      .catch(() => !cancelled && setStatus('error'))
    return () => {
      cancelled = true
    }
  }, [slug])

  // Uma visita por sessão; a pré-visualização do dono não conta.
  useEffect(() => {
    if (status !== 'ready' || preview) return
    const key = `portfolio-view-${slug}`
    try {
      if (sessionStorage.getItem(key)) return
      sessionStorage.setItem(key, '1')
    } catch {
      // Sem armazenamento: conta mesmo assim.
    }
    void registerPortfolioView(slug.toLowerCase())
  }, [status, preview, slug])

  useEffect(() => {
    if (data) document.title = `${data.portfolio.display_name} · Portfólio`
    return () => {
      document.title = 'Code Sellers'
    }
  }, [data])

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#07050d]">
        <span className="size-10 animate-spin rounded-full border-2 border-[#a78bfa] border-t-transparent" aria-label="Carregando" />
      </div>
    )
  }

  if (status !== 'ready' || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#07050d] px-6 text-center text-white">
        <p className="font-display text-[26px] font-semibold">{status === 'error' ? 'Não foi possível abrir a página' : 'Página não encontrada'}</p>
        <p className="max-w-sm text-[14.5px] text-white/60">
          {status === 'error' ? 'Tente de novo em instantes.' : 'Este portfólio não existe ou ainda não foi publicado.'}
        </p>
        <Link to="/" className="mt-3 text-[13.5px] text-[#c4b5fd] hover:underline">
          Conhecer o Code Sellers
        </Link>
      </div>
    )
  }

  const { portfolio, projects } = data
  const whatsapp = whatsappUrl(portfolio.whatsapp)
  const whatsappLink = whatsapp ? `${whatsapp}?text=${encodeURIComponent('Oi! Vi seu portfólio e quero conversar sobre um projeto.')}` : null
  const testimonials = projects.filter((project) => project.testimonial)

  return (
    <div className="min-h-screen bg-[#07050d] text-white [color-scheme:dark]">
      {preview && (
        <div className="sticky top-0 z-40 bg-[#7c3aed] px-4 py-2 text-center text-[12.5px] font-medium">
          Pré-visualização: suas visitas não contam no contador.
        </div>
      )}

      {/* Hero */}
      <header className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10 opacity-80" style={{ maskImage: 'linear-gradient(180deg, #000 45%, transparent)', WebkitMaskImage: 'linear-gradient(180deg, #000 45%, transparent)' }} aria-hidden>
          <SilkRibbons className="h-full w-full animate-silk-drift" />
        </div>
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(90%_70%_at_50%_0%,rgba(124,58,237,0.35),transparent_70%),linear-gradient(180deg,rgba(7,5,13,0.55),#07050d_92%)]" aria-hidden />

        <div className="mx-auto flex max-w-5xl flex-col items-center px-5 pb-20 pt-16 text-center sm:pt-24">
          {portfolio.avatar_url ? (
            <img src={portfolio.avatar_url} alt="" className="size-24 rounded-full object-cover ring-4 ring-white/10 sm:size-28" />
          ) : (
            <span className="flex size-24 items-center justify-center rounded-full bg-[linear-gradient(135deg,#8b5cf6,#5b21b6)] font-display text-[30px] font-bold ring-4 ring-white/10 sm:size-28">
              {initials(portfolio.display_name)}
            </span>
          )}
          <h1 className="mt-6 max-w-3xl font-display text-[36px] font-bold leading-[1.05] tracking-tight sm:text-[52px]">{portfolio.display_name}</h1>
          {portfolio.headline && <p className="mt-4 max-w-2xl text-[17px] leading-relaxed text-white/70 sm:text-[19px]">{portfolio.headline}</p>}
          {portfolio.city && (
            <p className="mt-3 flex items-center gap-1.5 text-[13.5px] text-white/50">
              <MapPin className="size-3.5" />
              {portfolio.city}
            </p>
          )}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {whatsappLink && (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-12 items-center gap-2 rounded-full bg-[#fff] px-6 text-[15px] font-semibold text-[#120c24] shadow-[0_12px_40px_-12px_rgba(255,255,255,0.5)] transition hover:bg-[#ede9fe]"
              >
                <MessageCircle className="size-[18px]" />
                Falar no WhatsApp
              </a>
            )}
            {projects.length > 0 && (
              <a href="#trabalhos" className="inline-flex h-12 items-center rounded-full border border-white/20 bg-white/[0.06] px-6 text-[15px] font-medium backdrop-blur transition hover:bg-white/10">
                Ver trabalhos
              </a>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 pb-16">
        {portfolio.bio && (
          <section className="mx-auto max-w-2xl text-center">
            <p className="whitespace-pre-line text-[16px] leading-8 text-white/70">{portfolio.bio}</p>
          </section>
        )}

        {projects.length > 0 && (
          <section id="trabalhos" className="scroll-mt-10 pt-16">
            <p className="text-center font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-[#c4b5fd]">Trabalhos</p>
            <h2 className="mt-2 text-center font-display text-[28px] font-semibold tracking-tight sm:text-[34px]">O que eu já entreguei</h2>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {projects.map((project) => (
                <article key={project.id} className="group overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.03] transition hover:border-[#a78bfa]/40">
                  <div className="aspect-[16/10] overflow-hidden bg-[linear-gradient(135deg,#1c1233,#0d0918)]">
                    {project.image_url ? (
                      <img src={project.image_url} alt={project.title} loading="lazy" className="size-full object-cover transition duration-700 group-hover:scale-[1.04]" />
                    ) : (
                      <div className="flex size-full items-center justify-center font-display text-[22px] font-semibold text-white/30">{project.title}</div>
                    )}
                  </div>
                  <div className="p-6">
                    <span className="rounded-full bg-[#8b5cf6]/20 px-2.5 py-1 text-[11.5px] font-medium text-[#c4b5fd]">
                      {PORTFOLIO_CATEGORY_LABELS[project.category]}
                    </span>
                    <h3 className="mt-3 font-display text-[20px] font-semibold tracking-tight">{project.title}</h3>
                    {project.client_label && <p className="mt-0.5 text-[13.5px] text-white/50">{project.client_label}</p>}
                    {project.description && <p className="mt-3 text-[14.5px] leading-7 text-white/70">{project.description}</p>}
                    {project.url && (
                      <a href={project.url} target="_blank" rel="noreferrer noopener" className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-medium text-[#c4b5fd] hover:text-white">
                        Ver no ar · {hostOf(project.url)}
                        <ArrowUpRight className="size-4" />
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {testimonials.length > 0 && (
          <section className="pt-20">
            <h2 className="text-center font-display text-[26px] font-semibold tracking-tight sm:text-[30px]">O que os clientes dizem</h2>
            <div className="mt-8 grid gap-5 md:grid-cols-2">
              {testimonials.map((project) => (
                <figure key={project.id} className="rounded-[24px] border border-white/10 bg-[linear-gradient(160deg,rgba(139,92,246,0.14),rgba(255,255,255,0.02))] p-6">
                  <Quote className="size-6 text-[#a78bfa]" />
                  <blockquote className="mt-3 text-[15.5px] leading-7 text-white/80">“{project.testimonial}”</blockquote>
                  <figcaption className="mt-4 text-[13px] text-white/50">
                    {[project.testimonial_author, project.client_label].filter(Boolean).join(' · ')}
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        )}

        <section className="pt-20">
          <h2 className="text-center font-display text-[26px] font-semibold tracking-tight sm:text-[30px]">Como eu trabalho</h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className="rounded-[22px] border border-white/10 bg-white/[0.03] p-6">
                <span className="font-mono text-[12px] font-semibold text-[#c4b5fd]">0{index + 1}</span>
                <p className="mt-2 font-display text-[18px] font-semibold">{step.title}</p>
                <p className="mt-1.5 text-[14px] leading-6 text-white/60">{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        {whatsappLink && (
          <section className="relative mt-20 overflow-hidden rounded-[30px] border border-[#a78bfa]/25 bg-[radial-gradient(120%_140%_at_100%_0%,#3b1d6e_0%,#1a0f2e_45%,#0b0812_100%)] px-6 py-12 text-center">
            <h2 className="font-display text-[26px] font-semibold tracking-tight sm:text-[32px]">Vamos conversar sobre o seu projeto?</h2>
            <p className="mx-auto mt-2 max-w-md text-[15px] text-white/65">Me chama no WhatsApp e eu te respondo com uma ideia para o seu negócio.</p>
            <a
              href={whatsappLink}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-[#fff] px-6 text-[15px] font-semibold text-[#120c24] transition hover:bg-[#ede9fe]"
            >
              <MessageCircle className="size-[18px]" />
              Falar no WhatsApp
            </a>
          </section>
        )}
      </main>

      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-5 py-6 text-[12.5px] text-white/40 sm:flex-row">
          <Link to="/" className="inline-flex items-center gap-2 hover:text-white/70">
            <img src="/logo.png" alt="" className="size-4 object-contain" />
            Página criada com Sellers Portfolio · Code Sellers
          </Link>
          <button type="button" onClick={() => setReportOpen(true)} className="inline-flex items-center gap-1.5 hover:text-white/70">
            <Flag className="size-3.5" />
            Denunciar página
          </button>
        </div>
      </footer>

      {reportOpen && <ReportDialog slug={portfolio.slug} onClose={() => setReportOpen(false)} />}
    </div>
  )
}
