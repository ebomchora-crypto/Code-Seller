import { useEffect, useMemo, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import NotFoundPage from '@/pages/not-found'
import { getPublicSite } from '@/services/supabase/codeMaker'
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
  const [site, setSite] = useState<{ name: string; html: string } | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading')

  useEffect(() => {
    let cancelled = false
    getPublicSite(slug)
      .then((data) => {
        if (cancelled) return
        setSite(data)
        setStatus(data ? 'ready' : 'missing')
        if (data) document.title = titleOf(data.html, data.name)
      })
      .catch(() => !cancelled && setStatus('error'))
    return () => {
      cancelled = true
    }
  }, [slug])

  const doc = useMemo(() => (site ? frameDocument(site.html) : null), [site])

  if (status === 'ready' && doc) {
    return (
      <iframe
        title={site?.name ?? 'Site'}
        sandbox={SITE_SANDBOX}
        srcDoc={doc}
        className="fixed inset-0 h-dvh w-full border-0 bg-white"
      />
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
          <p className="text-[22px] font-semibold tracking-tight">{status === 'missing' ? 'Site não encontrado' : 'Não foi possível abrir o site'}</p>
          <p className="max-w-sm text-[14.5px] text-[#18181b]/60">
            {status === 'missing' ? 'Confira o endereço. O site pode ter sido tirado do ar.' : 'Confira sua internet e tente de novo.'}
          </p>
        </>
      )}
    </div>
  )
}
