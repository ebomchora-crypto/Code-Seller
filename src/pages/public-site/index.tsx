import { useEffect, useMemo, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import NotFoundPage from '@/pages/not-found'
import { getPublicSite, type PublicSite } from '@/services/supabase/codeMaker'
import { SITE_SANDBOX } from '@/components/code-maker/SitePreview'
import { frameDocument } from '@/utils/codeMakerStream'

function titleOf(html: string, fallback: string): string {
  const raw = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim()
  if (!raw) return fallback
  const decoder = document.createElement('textarea')
  decoder.innerHTML = raw
  return decoder.value || fallback
}

// Site criado no Code Maker: /:apelido (e o link antigo /s/:apelido). O site roda num quadro isolado,
// sem acesso ao Code Sellers.
export default function PublicSitePage() {
  const { slug = '' } = useParams()
  const shortLink = !useLocation().pathname.startsWith('/s/')
  const [site, setSite] = useState<PublicSite | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing' | 'offline' | 'error'>('loading')

  useEffect(() => {
    let cancelled = false
    getPublicSite(slug)
      .then((data) => {
        if (cancelled) return
        setSite(data)
        setStatus(!data ? 'missing' : data.offline || !data.html ? 'offline' : 'ready')
        if (data) document.title = data.html ? titleOf(data.html, data.name) : data.name
      })
      .catch(() => !cancelled && setStatus('error'))
    return () => {
      cancelled = true
    }
  }, [slug])

  const doc = useMemo(() => (site?.html ? frameDocument(site.html) : null), [site])

  if (status === 'ready' && doc) {
    return (
      <>
        <iframe
          title={site?.name ?? 'Site'}
          sandbox={SITE_SANDBOX}
          srcDoc={doc}
          className="fixed inset-0 h-dvh w-full border-0 bg-white"
        />
        {/* Selo do teste grátis: fica fora do quadro do site, então não some editando o site. */}
        {site?.badge && (
          <a
            href="/"
            target="_blank"
            rel="noopener"
            className="fixed bottom-4 left-4 z-10 inline-flex items-center gap-2 rounded-full border border-black/10 bg-[#0b0b0f] py-2 pl-2 pr-3.5 text-[12.5px] font-medium text-white shadow-[0_10px_30px_-8px_rgba(0,0,0,0.45)] transition-transform hover:-translate-y-0.5"
          >
            <img src="/logo.png" alt="" className="size-5 rounded-md object-contain" />
            Feito com Code Sellers
          </a>
        )}
      </>
    )
  }

  // No link curto, endereço que não é site cai na página de "não encontrado" do sistema.
  if (status === 'missing' && shortLink) return <NotFoundPage />

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-2 bg-[#faf9f7] px-6 text-center text-[#18181b]">
      {status === 'loading' ? (
        <span className="size-8 animate-spin rounded-full border-2 border-[#18181b]/15 border-t-[#18181b]/60" aria-label="Carregando" />
      ) : (
        <>
          <p className="text-[22px] font-semibold tracking-tight">
            {status === 'missing' ? 'Site não encontrado' : status === 'offline' ? 'Site fora do ar' : 'Não foi possível abrir o site'}
          </p>
          <p className="max-w-sm text-[14.5px] text-[#18181b]/60">
            {status === 'missing'
              ? 'Confira o endereço. O site pode ter sido tirado do ar.'
              : status === 'offline'
                ? 'Este site está temporariamente indisponível. Volte mais tarde.'
                : 'Confira sua internet e tente de novo.'}
          </p>
        </>
      )}
    </div>
  )
}
