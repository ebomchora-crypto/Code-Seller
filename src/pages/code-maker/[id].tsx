import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  Check,
  CheckCircle2,
  CloudOff,
  Code2,
  Copy,
  Download,
  Ellipsis,
  ExternalLink,
  Eye,
  Globe,
  Link2,
  Monitor,
  PanelLeft,
  RotateCw,
  Smartphone,
  SquareTerminal,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useBilling } from '@/stores/BillingContext'
import { assembleSite, pageSlugs, pageTitle, parsePart, partOrder } from '../../../supabase/functions/code-maker/site'
import { projectTree } from '../../../supabase/functions/code-maker/project'
import { useSiteBuilder } from '@/hooks/useSiteBuilder'
import { useAttachments } from '@/components/code-maker/Attachments'
import { BuildTimeline } from '@/components/code-maker/BuildTimeline'
import { CodeView } from '@/components/code-maker/CodeView'
import { SitePreview } from '@/components/code-maker/SitePreview'
import { AiLoader } from '@/components/ui/ai-loader'
import { SiteFavicon } from '@/components/code-maker/SiteFavicon'
import { PromptInputBox } from '@/components/ui/ai-prompt-box'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { deleteSite, getCodeMakerUsage, restoreSiteVersion, updateSite, type CodeMakerUsage, type SiteVersion } from '@/services/supabase/codeMaker'
import { downloadName, publicSiteUrl, SLUG_PATTERN, slugify } from '@/utils/codeMakerStream'
import { isReservedSlug } from '../../../supabase/functions/code-maker/site'
import { useCodeMakerShell } from './layout'

type View = 'previa' | 'codigo'
type MobileTab = 'chat' | 'site'
type Device = 'desktop' | 'mobile'

const SUGGESTIONS = ['Deixe o topo mais impactante', 'Adicione uma seção de preços', 'Deixe os textos mais curtos']

const iconButton =
  'flex size-9 items-center justify-center rounded-xl text-[var(--text-muted)] transition hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)] disabled:pointer-events-none disabled:opacity-40'

export default function CodeMakerEditorPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const builder = useSiteBuilder(id)
  const shell = useCodeMakerShell()
  const billing = useBilling()
  const { site, phase } = builder
  const busy = phase !== 'idle'

  const [view, setView] = useState<View>('previa')
  const [mobileTab, setMobileTab] = useState<MobileTab>('chat')
  const [device, setDevice] = useState<Device>('desktop')
  const [pickedFile, setPickedFile] = useState<string | null>(null)
  const [instruction, setInstruction] = useState('')
  const [slugOpen, setSlugOpen] = useState(false)
  const [slugDraft, setSlugDraft] = useState('')
  const [savingSlug, setSavingSlug] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  // Página aberta na prévia ('' = inicial) e o #trecho para rolar.
  const [previewPage, setPreviewPage] = useState('')
  const [previewHash, setPreviewHash] = useState('')
  const autoStarted = useRef(false)
  const attachments = useAttachments()
  // Alterações de hoje (o limite vale para todos os sites e landing pages).
  const [usage, setUsage] = useState<CodeMakerUsage | null>(null)
  useEffect(() => {
    if (busy) return
    let alive = true
    getCodeMakerUsage()
      .then((value) => alive && setUsage(value))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [busy, builder.versions.length])
  const editsLeft = usage?.edits_limit != null ? Math.max(0, usage.edits_limit - usage.edits_today) : null

  // Chegou do "Criar site": começa a gerar sozinho.
  useEffect(() => {
    if (!site || autoStarted.current || searchParams.get('gerar') !== '1') return
    autoStarted.current = true
    setSearchParams(new URLSearchParams(), { replace: true })
    if (site.status !== 'ready') void builder.generate()
  }, [builder, searchParams, setSearchParams, site])

  // Avisa antes de fechar a aba no meio da geração.
  useEffect(() => {
    if (!busy) return
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault()
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [busy])

  // Site terminou: avisa com destaque (aviso na tela, selo na prévia e,
  // se a aba estiver escondida, no título da aba e numa notificação).
  const [unseenReady, setUnseenReady] = useState(false)
  const [readyPill, setReadyPill] = useState(false)
  const finishedAt = builder.finishedAt
  const siteName = site?.name ?? ''
  // Nome, situação e "no ar" aparecem na lista de sites à esquerda.
  const { refreshSites } = shell
  useEffect(() => {
    if (siteName) refreshSites()
  }, [refreshSites, siteName, site?.status, site?.published])
  useEffect(() => {
    if (!finishedAt) return
    toast.success('Seu site está pronto!', {
      description: 'Confira a prévia e coloque no ar quando quiser.',
      duration: 6000,
    })
    setReadyPill(true)
    const timer = window.setTimeout(() => setReadyPill(false), 7000)
    if (document.hidden) {
      setUnseenReady(true)
      try {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Seu site está pronto', {
            body: siteName,
            icon: '/favicon.svg',
          })
        }
      } catch {
        // Sem notificação: o título da aba já avisa.
      }
    }
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finishedAt])

  useEffect(() => {
    if (!unseenReady) return
    const seen = () => {
      if (!document.hidden) setUnseenReady(false)
    }
    document.addEventListener('visibilitychange', seen)
    window.addEventListener('focus', seen)
    return () => {
      document.removeEventListener('visibilitychange', seen)
      window.removeEventListener('focus', seen)
    }
  }, [unseenReady])

  useEffect(() => {
    if (siteName) document.title = unseenReady ? `✅ Site pronto · ${siteName}` : `${siteName} · Code Maker`
    return () => {
      document.title = 'Code Sellers'
    }
  }, [siteName, unseenReady])

  const pages = useMemo(() => pageSlugs(site?.files), [site?.files])
  // Página que sumiu (apagada numa alteração): volta para a inicial.
  const shownPage = previewPage && pages.includes(previewPage) ? previewPage : ''
  const previewHtml = useMemo(() => {
    if (!site) return null
    if (site.plan && (phase === 'building' || site.status === 'building')) {
      return assembleSite(site.plan, { ...site.parts, ...builder.builtParts }, { pending: true })
    }
    if (shownPage && site.plan) {
      return site.pages_html?.[shownPage] ?? assembleSite(site.plan, site.parts, { files: site.files, page: shownPage })
    }
    if (site.html) return site.html
    return site.plan ? assembleSite(site.plan, site.parts, { pending: true, files: site.files }) : null
  }, [builder.builtParts, phase, shownPage, site])

  // Arquivos do projeto (os mesmos que a IA lê e altera) + o index.html montado.
  const sitePlan = site?.plan ?? null
  const tree = useMemo(() => (site && sitePlan ? projectTree(sitePlan, site.parts, site.files ?? {}) : {}), [site, sitePlan])
  const files = useMemo(() => {
    if (!sitePlan) return ['index.html']
    const paths = Object.keys(tree)
    // Durante a criação, as seções ainda sem código também aparecem.
    for (const id of ['header', ...partOrder(sitePlan)]) if (!paths.includes(`secoes/${id}.html`)) paths.push(`secoes/${id}.html`)
    return ['index.html', ...paths]
  }, [sitePlan, tree])
  const writingPart = useMemo(() => {
    const writing = Object.entries(builder.progress).filter(([, value]) => value.status === 'writing')
    return writing[writing.length - 1]?.[0] ?? null
  }, [builder.progress])
  const autoFile = phase === 'planning' ? 'plano' : phase === 'editing' ? 'alteracao' : phase === 'building' && writingPart ? `secoes/${writingPart}.html` : 'index.html'
  const currentFile = pickedFile && (files.includes(pickedFile) || pickedFile === autoFile) ? pickedFile : autoFile

  const code = useMemo(() => {
    if (!site) return ''
    if (currentFile === 'plano') return builder.planText
    if (currentFile === 'alteracao') return builder.editText
    if (currentFile === 'index.html') return previewHtml ?? ''
    const sectionId = currentFile.match(/^secoes\/(.+)\.html$/)?.[1]
    if (!sectionId) return tree[currentFile] ?? ''
    const live = builder.progress[sectionId]
    if (live && live.status === 'writing') return parsePart(live.text).html
    return builder.builtParts[sectionId] ?? site.parts[sectionId] ?? parsePart(live?.text ?? '').html
  }, [builder.builtParts, builder.editText, builder.planText, builder.progress, currentFile, previewHtml, site, tree])
  const codeIsLive =
    (currentFile === 'plano' && phase === 'planning') ||
    (currentFile === 'alteracao' && phase === 'editing') ||
    builder.progress[currentFile.replace(/^secoes\/|\.html$/g, '')]?.status === 'writing'

  if (builder.loading) {
    return (
      <div className="relative flex-1">
        <AiLoader text="Carregando" />
      </div>
    )
  }

  if (!site) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="font-display text-lg font-semibold text-[var(--text-primary)]">
          {builder.notFound ? 'Site não encontrado' : 'Não foi possível abrir o site'}
        </p>
        {builder.error && <p className="text-sm text-[var(--text-muted)]">{builder.error}</p>}
        <Link to="/code-maker" className="text-sm font-medium text-[var(--accent-text)] hover:underline">
          Voltar para os sites
        </Link>
      </div>
    )
  }

  const url = publicSiteUrl(site.slug)
  const ready = site.status === 'ready'
  // O que a IA está fazendo agora (aparece embaixo do carregamento da prévia).
  const partsDone = Object.values(builder.progress).filter((part) => part.status === 'done').length
  const partsTotal = Object.keys(builder.progress).length
  const loaderCaption =
    phase === 'planning'
      ? (builder.planActions[builder.planActions.length - 1] ?? 'Escolhendo cores, fontes e as seções certas para o negócio.')
      : phase === 'building'
        ? `Escrevendo o site${partsTotal ? ` · ${partsDone} de ${partsTotal} partes` : '…'}`
        : (builder.editActions[builder.editActions.length - 1] ?? 'Aplicando a sua alteração…')

  async function submitEdit(event?: FormEvent) {
    event?.preventDefault()
    const assets = attachments.assets
    const text = instruction.trim() || (assets.length > 0 ? 'Use as imagens anexadas no site.' : '')
    if (!text || busy || !ready || attachments.uploading) return
    setInstruction('')
    setMobileTab('chat')
    const ok = await builder.edit(text, assets)
    if (ok) attachments.clear()
    else setInstruction(text)
  }

  async function togglePublished(value: boolean) {
    try {
      builder.setSite(await updateSite(site!.id, { published: value }))
      if (value && billing.status?.state === 'trial') {
        // No teste grátis o site publicado mostra o selo e sai do ar se o teste acabar sem assinatura.
        toast.success('Site no ar.', {
          description: 'No teste grátis ele mostra o selo "Feito com Code Sellers" e sai do ar se o teste acabar sem assinatura.',
          duration: 8000,
        })
      } else {
        toast.success(value ? 'Site no ar.' : 'Site tirado do ar.')
      }
    } catch (error) {
      toast.error((error as Error).message)
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Link copiado.')
    } catch {
      toast.error(`Não foi possível copiar. O link é ${url}`)
    }
  }

  function download() {
    if (!site?.html) return
    const blob = new Blob([site.html], { type: 'text/html;charset=utf-8' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = downloadName(site.slug)
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(link.href), 1000)
  }

  async function saveSlug(event: FormEvent) {
    event.preventDefault()
    const next = slugify(slugDraft)
    if (!SLUG_PATTERN.test(next)) {
      toast.error('Use de 3 a 48 caracteres: letras, números e hífen.')
      return
    }
    if (isReservedSlug(next)) {
      toast.error('Esse nome é usado pelo próprio sistema. Escolha outro.')
      return
    }
    setSavingSlug(true)
    try {
      builder.setSite(await updateSite(site!.id, { slug: next }))
      setSlugOpen(false)
      toast.success('Link alterado.')
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setSavingSlug(false)
    }
  }

  async function restore(version: SiteVersion) {
    if (!version.plan || !version.parts || busy) return
    try {
      await restoreSiteVersion(site!, version)
      await builder.refresh()
      toast.success('Versão restaurada.')
    } catch (error) {
      toast.error((error as Error).message)
    }
  }

  async function remove() {
    setDeleting(true)
    try {
      await deleteSite(site!.id)
      toast.success('Site apagado.')
      navigate('/code-maker')
    } catch (error) {
      toast.error((error as Error).message)
      setDeleting(false)
    }
  }

  function openPart(partId: string) {
    setPickedFile(`secoes/${partId}.html`)
    setView('codigo')
    setMobileTab('site')
  }

  const fileLabel = (file: string) =>
    file === 'plano' ? 'plano.json' : file === 'alteracao' ? 'alteração' : file
  const fileTabs = [...(autoFile === 'plano' || autoFile === 'alteracao' ? [autoFile] : []), ...files]
  const live = ready && site.published
  const mobileSelected: MobileTab | View = mobileTab === 'chat' ? 'chat' : view

  const menuItems: MenuItem[] = [
    ...(live ? [{ icon: ExternalLink, label: 'Abrir site', href: url }] : []),
    ...(ready ? [{ icon: SquareTerminal, label: 'Editar na IDE', href: `/ide/project/${site.id}` }] : []),
    {
      icon: Link2,
      label: 'Mudar o link',
      onClick: () => {
        setSlugDraft(site.slug)
        setSlugOpen(true)
      },
    },
    {
      icon: Download,
      label: 'Baixar HTML',
      onClick: download,
      disabled: !site.html || busy,
    },
    {
      icon: RotateCw,
      label: 'Recarregar prévia',
      onClick: () => setReloadKey((key) => key + 1),
    },
    ...(live
      ? [
          {
            icon: CloudOff,
            label: 'Tirar do ar',
            onClick: () => void togglePublished(false),
          },
        ]
      : []),
    {
      icon: Trash2,
      label: 'Apagar site',
      onClick: () => setConfirmDelete(true),
      disabled: busy,
      danger: true,
    },
  ]

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* Barra do editor: nome, Prévia/Código, menu e publicar */}
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-[var(--border-subtle)] px-3 sm:px-4">
        <button type="button" onClick={shell.openSites} className={`${iconButton} lg:hidden`} aria-label="Ver seus sites" title="Seus sites">
          <PanelLeft className="size-4.5" />
        </button>
        <div className="flex min-w-0 flex-1 items-center gap-3 lg:w-[402px] lg:flex-none xl:w-[442px]">
          <span className="hidden sm:block">
            <SiteFavicon site={{ name: site.name, favicon: site.plan?.favicon, brand: site.plan?.palette?.brand, brand_dark: site.plan?.palette?.brandDark, accent: site.plan?.palette?.accent }} size={36} />
          </span>
          <div className="min-w-0">
            <p className="truncate font-display text-[14.5px] font-semibold tracking-tight text-[var(--text-primary)]">{site.name}</p>
            <p className="flex items-center gap-1.5 truncate text-[11.5px] text-[var(--text-muted)]">
              <span
                className={`inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-px text-[10.5px] font-semibold ${
                  busy ? 'bg-[var(--accent-tint)] text-[var(--accent-text)]' : live ? 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400' : 'bg-[var(--bg-muted)] text-[var(--text-muted)]'
                }`}
              >
                <span className={`size-1.5 rounded-full ${busy ? 'animate-pulse bg-[#a78bfa]' : live ? 'bg-emerald-500' : 'bg-[var(--border-strong)]'}`} />
                {busy ? 'IA trabalhando' : !ready ? 'Em criação' : live ? 'No ar' : 'Fora do ar'}
              </span>
              <span className="truncate">/{site.slug}</span>
            </p>
          </div>
        </div>

        <div className="hidden flex-1 items-center gap-2 lg:flex">
          <Segmented
            value={view}
            onChange={(value) => setView(value as View)}
            options={[
              { value: 'previa', label: 'Prévia', icon: Eye },
              { value: 'codigo', label: 'Código', icon: Code2, dot: busy },
            ]}
          />
          {view === 'previa' && (
            <Segmented
              value={device}
              onChange={(value) => setDevice(value as Device)}
              iconOnly
              options={[
                { value: 'desktop', label: 'Computador', icon: Monitor },
                { value: 'mobile', label: 'Celular', icon: Smartphone },
              ]}
            />
          )}
        </div>

        <MoreMenu items={menuItems} />
        {live ? (
          <button
            type="button"
            onClick={() => void copyLink()}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 text-[12.5px] font-semibold text-emerald-700 transition hover:bg-emerald-500/15 dark:text-emerald-300"
            title="Copiar o link do site"
          >
            <Copy className="size-3.5" /> <span className="hidden sm:inline">Copiar link</span>
          </button>
        ) : (
          <Button size="sm" onClick={() => void togglePublished(true)} disabled={!ready || busy}>
            <Globe className="size-3.5" /> Publicar
          </Button>
        )}
      </header>

      {/* Abas no celular */}
      <div className="flex shrink-0 gap-1 border-b border-[var(--border-subtle)] px-3 py-1.5 lg:hidden" role="tablist">
        {(
          [
            ['chat', 'Chat'],
            ['previa', 'Prévia'],
            ['codigo', 'Código'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={mobileSelected === value}
            onClick={() => {
              if (value === 'chat') {
                setMobileTab('chat')
              } else {
                setMobileTab('site')
                setView(value)
              }
            }}
            className={`flex-1 rounded-lg py-1.5 text-[13px] font-semibold transition ${
              mobileSelected === value ? 'bg-[var(--bg-muted)] text-[var(--text-primary)]' : 'text-[var(--text-muted)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Esquerda: conversa com a IA */}
        <section
          className={`${mobileTab === 'chat' ? 'flex' : 'hidden'} min-h-0 w-full flex-col border-[var(--border-subtle)] lg:flex lg:w-[420px] lg:shrink-0 lg:border-r xl:w-[460px]`}
        >
          <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin]">
            <BuildTimeline
              site={site}
              versions={builder.versions}
              phase={phase}
              planText={builder.planText}
              planActions={builder.planActions}
              progress={builder.progress}
              editText={builder.editText}
              editActions={builder.editActions}
              pendingInstruction={builder.pendingInstruction}
              error={builder.error}
              onContinue={() => void builder.generate()}
              onOpenPart={openPart}
              onRestore={(version) => void restore(version)}
              readyCard={
                <ReadyCard
                  fresh={Boolean(finishedAt)}
                  published={site.published}
                  onPublish={() => void togglePublished(true)}
                  onCopy={() => void copyLink()}
                  url={url}
                />
              }
            />
          </div>

          {/* Chat de alterações */}
          <form onSubmit={submitEdit} className="px-3 pb-3 pt-2">
            {ready && !busy && !instruction && builder.versions.length <= 1 && (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setInstruction(suggestion)}
                    className="rounded-full border border-[var(--border-subtle)] px-2.5 py-1 text-[11.5px] text-[var(--text-muted)] transition hover:border-[var(--accent-ring)] hover:text-[var(--accent-text)]"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
            {ready && (
              <a
                href={busy ? undefined : `/ide/project/${site.id}`}
                aria-disabled={busy}
                title="Abre o código do site na IDE. Ao salvar lá (Ctrl+S), o site é publicado automaticamente."
                className={`mb-2 inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] px-3 py-1.5 text-[12px] font-medium text-[var(--text-secondary)] transition hover:border-[var(--accent-ring)] hover:text-[var(--accent-text)] ${busy ? 'pointer-events-none opacity-50' : ''}`}
              >
                <SquareTerminal className="size-3.5" /> Importar para a IDE
              </a>
            )}
            <PromptInputBox
              value={instruction}
              onValueChange={setInstruction}
              onSend={() => void submitEdit()}
              onStop={builder.stop}
              isLoading={busy}
              disabled={!ready}
              canSend={(instruction.trim().length > 0 || attachments.assets.length > 0) && ready && !attachments.uploading}
              rows={2}
              maxHeight={260}
              attachments={attachments}
              ariaLabel="Peça uma mudança no site"
              placeholder={busy ? 'A IA está trabalhando…' : ready ? 'Peça uma mudança no site…' : 'Espere o site ficar pronto'}
            />
            {usage?.edits_limit != null && (
              <p className={`mt-1.5 px-1 text-[11.5px] ${editsLeft === 0 ? 'text-amber-500' : 'text-[var(--text-muted)]'}`}>
                {usage.edits_today} de {usage.edits_limit} alterações hoje
                {editsLeft === 0 ? ' · o limite libera amanhã' : ''}
              </p>
            )}
          </form>
        </section>

        {/* Direita: prévia ou código do site */}
        <section className={`${mobileTab === 'site' ? 'flex' : 'hidden'} min-h-0 min-w-0 flex-1 flex-col lg:flex`}>
          {view === 'previa' ? (
            <div className="relative flex min-h-0 flex-1 justify-center overflow-hidden bg-[radial-gradient(120%_80%_at_50%_0%,rgba(124,58,237,0.10),transparent_60%)] bg-[var(--bg-muted)]/40 p-2.5 sm:p-4">
              <div
                className={`relative flex min-h-0 flex-col overflow-hidden transition-[width] duration-300 ${
                  device === 'mobile'
                    ? 'my-auto h-full max-h-[820px] w-[390px] max-w-full rounded-[34px] border-[7px] border-[#1d1b24] bg-[#fff] shadow-[0_40px_90px_-30px_rgba(0,0,0,0.65)]'
                    : 'h-full w-full rounded-2xl border border-[var(--border-default)] bg-[#fff] shadow-[0_40px_90px_-40px_rgba(0,0,0,0.6)]'
                }`}
              >
                {device === 'desktop' && (
                  <div className="flex h-10 shrink-0 items-center gap-3 border-b border-black/[0.07] bg-[#f4f4f6] px-3.5">
                    <span className="flex gap-1.5" aria-hidden>
                      <span className="size-2.5 rounded-full bg-[#ff5f57]" />
                      <span className="size-2.5 rounded-full bg-[#febc2e]" />
                      <span className="size-2.5 rounded-full bg-[#28c840]" />
                    </span>
                    <div className="mx-auto flex h-7 min-w-0 max-w-md flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#fff] px-3 text-[12px] text-[#52525b] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)]">
                      <Globe className="size-3 shrink-0 text-[#a1a1aa]" />
                      <span className="truncate">{live ? url.replace(/^https?:\/\//, '') : `prévia · /${site.slug}${shownPage ? `/${shownPage}` : ''}`}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReloadKey((key) => key + 1)}
                      className="flex size-7 items-center justify-center rounded-lg text-[#71717a] transition hover:bg-black/5 hover:text-[#18181b]"
                      aria-label="Recarregar prévia"
                      title="Recarregar prévia"
                    >
                      <RotateCw className="size-3.5" />
                    </button>
                  </div>
                )}
                <div className="relative min-h-0 flex-1">
                  {previewHtml ? (
                    <SitePreview
                      key={reloadKey}
                      html={previewHtml}
                      loader
                      title={`Prévia de ${site.name}`}
                      className="h-full w-full"
                      page={shownPage}
                      hash={previewHash}
                      onNavigate={(page, hash) => {
                        if (page && !pages.includes(page)) {
                          toast.error(`A página ${page}.html não existe neste site.`)
                          return
                        }
                        setPreviewPage(page)
                        setPreviewHash(hash)
                      }}
                    />
                  ) : (
                    <PlanningPlaceholder busy={phase === 'planning'} actions={builder.planActions} />
                  )}
                  {previewHtml && pages.length > 0 && (
                    <label className="absolute bottom-3 left-3 z-20 flex items-center gap-1.5 rounded-full border border-black/10 bg-white/95 py-1 pl-3 pr-1 text-[12px] font-medium text-[#18181b] shadow-lg backdrop-blur">
                      Página
                      <select
                        value={shownPage}
                        onChange={(event) => {
                          setPreviewPage(event.target.value)
                          setPreviewHash('')
                        }}
                        className="rounded-full bg-transparent py-0.5 pr-1 text-[12px] font-semibold outline-none"
                      >
                        <option value="">Início</option>
                        {pages.map((page) => (
                          <option key={page} value={page}>
                            {site.files?.[`paginas/${page}.html`] ? pageTitle(site.files[`paginas/${page}.html`], page) : page}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  {readyPill && (
                    <div className="cm-ready-pop pointer-events-none absolute left-1/2 top-4 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-[13px] font-semibold text-white shadow-[0_12px_30px_-10px_rgba(16,185,129,0.8)]">
                      <CheckCircle2 className="size-4" /> Site pronto
                    </div>
                  )}
                  {busy && <AiLoader text={phase === 'editing' ? 'Alterando' : 'Gerando'} translucent={phase === 'editing'} caption={loaderCaption} />}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col bg-[#0d0c12]">
              <div className="flex gap-1 overflow-x-auto border-b border-white/5 px-2 py-2 [scrollbar-width:none]">
                {fileTabs.map((file) => {
                  const status = builder.progress[file.replace(/^secoes\/|\.html$/g, '')]?.status
                  return (
                    <button
                      key={file}
                      type="button"
                      onClick={() => setPickedFile(file === autoFile ? null : file)}
                      className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 font-mono text-[11.5px] transition ${
                        currentFile === file ? 'bg-white/10 text-white' : 'text-white/45 hover:text-white/80'
                      }`}
                    >
                      {(status === 'writing' || (file === autoFile && file !== 'index.html' && busy)) && (
                        <span className="size-1.5 animate-pulse rounded-full bg-[#a78bfa]" />
                      )}
                      {fileLabel(file)}
                    </button>
                  )
                })}
              </div>
              <div className="relative min-h-0 flex-1">
                <CodeView code={code} follow={codeIsLive} className="absolute inset-0" />
                {code && (
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard.writeText(code).then(() => toast.success('Código copiado.'))
                    }}
                    className="absolute right-3 top-3 flex items-center gap-1 rounded-lg border border-white/10 bg-[#17151f] px-2 py-1 text-[11px] font-medium text-white/60 transition hover:text-white"
                  >
                    <Copy className="size-3" /> Copiar
                  </button>
                )}
              </div>
            </div>
          )}
        </section>
      </div>

      <Modal open={slugOpen} onClose={() => setSlugOpen(false)} title="Link do site" size="sm">
        <form onSubmit={saveSlug} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-[var(--text-secondary)]">Endereço</span>
            <div className="flex items-center overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--field-bg)] focus-within:border-[var(--accent-ring)] focus-within:ring-4 focus-within:ring-[var(--accent-tint)]">
              <span className="shrink-0 pl-3 text-[13px] text-[var(--text-muted)]">{window.location.host}/</span>
              <input
                value={slugDraft}
                onChange={(event) => setSlugDraft(event.target.value.toLowerCase())}
                className="h-11 min-w-0 flex-1 bg-transparent pr-3 text-sm text-[var(--text-primary)] outline-none"
                maxLength={48}
                autoFocus
              />
            </div>
            <span className="text-[11.5px] text-[var(--text-muted)]">Letras minúsculas, números e hífen. O link antigo para de funcionar.</span>
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setSlugOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={savingSlug}>
              Salvar
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmDelete}
        title="Apagar site?"
        message={`O site ${site.name} e o link /${site.slug} deixam de existir. Não dá para desfazer.`}
        confirmLabel="Apagar"
        danger
        loading={deleting}
        onConfirm={() => void remove()}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  )
}

function ReadyCard(props: { fresh: boolean; published: boolean; url: string; onPublish: () => void; onCopy: () => void }) {
  const action = 'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold transition'
  return (
    <div className={`${props.fresh ? 'cm-ready-pop' : ''} flex gap-2.5`} role="status">
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-white">
        <Check className="size-4" strokeWidth={3} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-[var(--text-primary)]">Seu site está pronto!</p>
        <p className="mt-0.5 text-[13px] leading-relaxed text-[var(--text-secondary)]">
          {props.published ? 'Ele já está no ar.' : 'Confira a prévia e publique quando quiser.'} Para mudar algo, é só pedir aqui embaixo.
        </p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {props.published ? (
            <>
              <a href={props.url} target="_blank" rel="noopener" className={`${action} bg-emerald-500 text-white hover:brightness-110`}>
                <ExternalLink className="size-3.5" /> Abrir site
              </a>
              <button
                type="button"
                onClick={props.onCopy}
                className={`${action} border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]`}
              >
                <Copy className="size-3.5" /> Copiar link
              </button>
            </>
          ) : (
            <button type="button" onClick={props.onPublish} className={`${action} bg-emerald-500 text-white hover:brightness-110`}>
              <Globe className="size-3.5" /> Publicar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

interface SegmentedOption {
  value: string
  label: string
  icon: LucideIcon
  dot?: boolean
}

function Segmented({
  value,
  options,
  onChange,
  iconOnly = false,
}: {
  value: string
  options: SegmentedOption[]
  onChange: (value: string) => void
  iconOnly?: boolean
}) {
  return (
    <div className="flex items-center rounded-xl bg-[var(--bg-muted)] p-0.5" role="group">
      {options.map((option) => {
        const Icon = option.icon
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            aria-label={option.label}
            title={option.label}
            onClick={() => onChange(option.value)}
            className={`relative flex h-8 items-center justify-center gap-1.5 rounded-[10px] text-[12.5px] font-semibold transition ${iconOnly ? 'w-8' : 'px-3'} ${
              active ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Icon className="size-3.5" />
            {!iconOnly && option.label}
            {option.dot && <span className="size-1.5 animate-pulse rounded-full bg-[#a78bfa]" />}
          </button>
        )
      })}
    </div>
  )
}

interface MenuItem {
  icon: LucideIcon
  label: string
  onClick?: () => void
  href?: string
  disabled?: boolean
  danger?: boolean
}

// Menu "…" da barra: as ações que a pessoa usa pouco ficam guardadas aqui.
function MoreMenu({ items }: { items: MenuItem[] }) {
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (event: MouseEvent) => {
      if (!box.current?.contains(event.target as Node)) setOpen(false)
    }
    const escape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', escape)
    }
  }, [open])

  const itemClass = (item: MenuItem) =>
    `flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] transition disabled:pointer-events-none disabled:opacity-40 ${
      item.danger
        ? 'text-red-600 hover:bg-red-500/10 dark:text-red-400'
        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]'
    }`

  return (
    <div ref={box} className="relative">
      <button type="button" className={iconButton} onClick={() => setOpen((value) => !value)} aria-label="Mais opções" aria-expanded={open} title="Mais opções">
        <Ellipsis className="size-4.5" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-1.5 w-52 rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-1 shadow-[var(--shadow-card)]"
        >
          {items.map((item) => {
            const Icon = item.icon
            const content = (
              <>
                <Icon className="size-4 shrink-0" /> {item.label}
              </>
            )
            return item.href ? (
              <a key={item.label} role="menuitem" href={item.href} target="_blank" rel="noopener" onClick={() => setOpen(false)} className={itemClass(item)}>
                {content}
              </a>
            ) : (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  setOpen(false)
                  item.onClick?.()
                }}
                className={itemClass(item)}
              >
                {content}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function PlanningPlaceholder({ busy, actions }: { busy: boolean; actions: string[] }) {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden p-8 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#7c3aed]/20 blur-[90px]"
      />
      <div className="relative">
        <div className="mx-auto grid w-56 grid-cols-3 gap-2 opacity-80">
          {Array.from({ length: 6 }, (_, index) => (
            <span
              key={index}
              className={`h-10 rounded-xl bg-[var(--accent-tint)] ${busy ? 'animate-pulse' : ''} ${index === 0 ? 'col-span-3 h-16' : ''}`}
              style={{ animationDelay: `${index * 120}ms` }}
            />
          ))}
        </div>
        <p className="mt-6 font-display text-[17px] font-semibold text-[var(--text-primary)]">{busy ? 'Planejando o design…' : 'O site aparece aqui'}</p>
        <p className="mx-auto mt-1.5 max-w-xs text-[13px] text-[var(--text-muted)]">
          {busy ? (actions[actions.length - 1] ?? 'Escolhendo cores, fontes e as seções certas para o negócio.') : 'Clique em "Gerar site" para começar.'}
        </p>
      </div>
    </div>
  )
}
