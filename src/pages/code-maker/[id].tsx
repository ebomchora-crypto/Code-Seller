import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  ArrowUp,
  Check,
  ChevronLeft,
  Copy,
  Download,
  Eraser,
  ExternalLink,
  Link2,
  Monitor,
  RotateCw,
  Smartphone,
  Square,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { assembleSite, parsePart, partOrder } from '../../../supabase/functions/code-maker/site'
import { useSiteBuilder } from '@/hooks/useSiteBuilder'
import { AttachButton, AttachmentTray, useAttachments } from '@/components/code-maker/Attachments'
import { BuildTimeline, partLabel } from '@/components/code-maker/BuildTimeline'
import { CodeView } from '@/components/code-maker/CodeView'
import { SitePreview } from '@/components/code-maker/SitePreview'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Switch } from '@/components/ui/Switch'
import { Spinner } from '@/components/ui/Spinner'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { deleteSite, restoreSiteVersion, updateSite, type SiteVersion } from '@/services/supabase/codeMaker'
import { downloadName, publicSiteUrl, SLUG_PATTERN, slugify } from '@/utils/codeMakerStream'

type LeftTab = 'acoes' | 'codigo'
type MobileView = 'acoes' | 'codigo' | 'previa'
type Device = 'desktop' | 'mobile'

const SUGGESTIONS = [
  'Deixe o topo mais impactante',
  'Adicione uma seção de preços',
  'Troque a cor principal por azul-marinho',
  'Adicione mais depoimentos',
  'Deixe os textos mais curtos e diretos',
]

const iconButton =
  'flex size-9 items-center justify-center rounded-xl text-[var(--text-muted)] transition hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)] disabled:pointer-events-none disabled:opacity-40'

export default function CodeMakerEditorPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const builder = useSiteBuilder(id)
  const { site, phase } = builder
  const busy = phase !== 'idle'

  const [leftTab, setLeftTab] = useState<LeftTab>('acoes')
  const [mobileView, setMobileView] = useState<MobileView>('acoes')
  const [device, setDevice] = useState<Device>('desktop')
  const [pickedFile, setPickedFile] = useState<string | null>(null)
  const [instruction, setInstruction] = useState('')
  const [slugOpen, setSlugOpen] = useState(false)
  const [slugDraft, setSlugDraft] = useState('')
  const [savingSlug, setSavingSlug] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const autoStarted = useRef(false)
  const attachments = useAttachments()

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

  useEffect(() => {
    if (site) document.title = `${site.name} · Code Maker`
    return () => {
      document.title = 'Code Sellers'
    }
  }, [site])

  const previewHtml = useMemo(() => {
    if (!site) return null
    if (site.plan && (phase === 'building' || site.status === 'building')) {
      return assembleSite(site.plan, { ...site.parts, ...builder.builtParts }, { pending: true })
    }
    if (site.html) return site.html
    return site.plan ? assembleSite(site.plan, site.parts, { pending: true }) : null
  }, [builder.builtParts, phase, site])

  // Arquivo mostrado no painel de código: o que a IA está escrevendo agora,
  // ou o que a pessoa escolheu.
  const sitePlan = site?.plan ?? null
  const files = useMemo(() => (sitePlan ? ['index.html', ...partOrder(sitePlan)] : ['index.html']), [sitePlan])
  const writingPart = useMemo(() => {
    const writing = Object.entries(builder.progress).filter(([, value]) => value.status === 'writing')
    return writing[writing.length - 1]?.[0] ?? null
  }, [builder.progress])
  const autoFile = phase === 'planning' ? 'plano' : phase === 'editing' ? 'alteracao' : phase === 'building' && writingPart ? writingPart : 'index.html'
  const currentFile = pickedFile && (files.includes(pickedFile) || pickedFile === autoFile) ? pickedFile : autoFile

  const code = useMemo(() => {
    if (!site) return ''
    if (currentFile === 'plano') return builder.planText
    if (currentFile === 'alteracao') return builder.editText
    if (currentFile === 'index.html') return previewHtml ?? ''
    const live = builder.progress[currentFile]
    if (live && live.status === 'writing') return parsePart(live.text).html
    return builder.builtParts[currentFile] ?? site.parts[currentFile] ?? parsePart(live?.text ?? '').html
  }, [builder.builtParts, builder.editText, builder.planText, builder.progress, currentFile, previewHtml, site])
  const codeIsLive =
    (currentFile === 'plano' && phase === 'planning') ||
    (currentFile === 'alteracao' && phase === 'editing') ||
    builder.progress[currentFile]?.status === 'writing'

  if (builder.loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="lg" className="text-purple-600" />
      </div>
    )
  }

  if (!site) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
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

  async function submitEdit(event?: FormEvent) {
    event?.preventDefault()
    const assets = attachments.assets
    const text = instruction.trim() || (assets.length > 0 ? 'Use as imagens anexadas no site.' : '')
    if (!text || busy || !ready || attachments.uploading) return
    setInstruction('')
    setLeftTab('acoes')
    setMobileView('acoes')
    const ok = await builder.edit(text, assets)
    if (ok) attachments.clear()
    else setInstruction(text)
  }

  function handleComposerKey(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void submitEdit()
      return
    }
    if (event.key === 'Escape' && instruction) {
      event.preventDefault()
      setInstruction('')
    }
  }

  async function togglePublished(value: boolean) {
    try {
      builder.setSite(await updateSite(site!.id, { published: value }))
      toast.success(value ? 'Site no ar.' : 'Site tirado do ar.')
    } catch (error) {
      toast.error((error as Error).message)
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Link copiado.')
    } catch {
      toast.error('Não foi possível copiar. Copie da barra da prévia.')
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
      await restoreSiteVersion(site!, version, assembleSite(version.plan, version.parts))
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
    setPickedFile(partId)
    setLeftTab('codigo')
    setMobileView('codigo')
  }

  const fileLabel = (file: string) =>
    file === 'index.html' ? 'index.html' : file === 'plano' ? 'plano.json' : file === 'alteracao' ? 'alteração' : partLabel(site.plan, file)
  const fileTabs = [...(autoFile === 'plano' || autoFile === 'alteracao' ? [autoFile] : []), ...files]

  const showLeft = mobileView !== 'previa'
  const activeLeft: LeftTab = mobileView === 'codigo' ? 'codigo' : mobileView === 'acoes' ? leftTab : leftTab

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Barra do editor */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border-subtle)] px-3 py-2.5 sm:px-4">
        <Link to="/code-maker" className={iconButton} aria-label="Voltar para os sites">
          <ChevronLeft className="size-4.5" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-[15px] font-semibold tracking-tight text-[var(--text-primary)]">{site.name}</p>
          <button
            type="button"
            onClick={() => {
              setSlugDraft(site.slug)
              setSlugOpen(true)
            }}
            className="flex max-w-full items-center gap-1 truncate text-[12px] text-[var(--text-muted)] transition hover:text-[var(--accent-text)]"
            title="Mudar o link"
          >
            <Link2 className="size-3 shrink-0" />
            <span className="truncate">/s/{site.slug}</span>
          </button>
        </div>

        <div className="hidden items-center rounded-xl border border-[var(--border-default)] p-0.5 lg:flex" role="group" aria-label="Tamanho da prévia">
          {(
            [
              ['desktop', Monitor, 'Computador'],
              ['mobile', Smartphone, 'Celular'],
            ] as const
          ).map(([value, Icon, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={device === value}
              aria-label={label}
              title={label}
              onClick={() => setDevice(value)}
              className={`flex size-8 items-center justify-center rounded-[10px] transition ${
                device === value ? 'bg-[var(--bg-muted)] text-[var(--text-primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Icon className="size-4" />
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <button type="button" className={iconButton} onClick={download} disabled={!site.html || busy} aria-label="Baixar HTML" title="Baixar HTML">
            <Download className="size-4" />
          </button>
          <button type="button" className={iconButton} onClick={() => setConfirmDelete(true)} disabled={busy} aria-label="Apagar site" title="Apagar site">
            <Trash2 className="size-4" />
          </button>
        </div>

        <label className="flex items-center gap-2 rounded-xl border border-[var(--border-default)] px-2.5 py-1.5 text-[12.5px] font-medium text-[var(--text-secondary)]">
          <Switch checked={site.published} onChange={(value) => void togglePublished(value)} disabled={!ready} ariaLabel="Site no ar" />
          <span className="hidden sm:inline">{!ready ? 'Publicar' : site.published ? 'No ar' : 'Fora do ar'}</span>
        </label>
        <Button size="sm" onClick={() => void copyLink()} disabled={!ready || !site.published}>
          <Copy className="size-3.5" /> <span className="hidden sm:inline">Copiar link</span>
        </Button>
      </div>

      {/* Abas no celular */}
      <div className="flex gap-1 border-b border-[var(--border-subtle)] px-3 py-2 lg:hidden" role="tablist">
        {(
          [
            ['acoes', 'Ações'],
            ['codigo', 'Código'],
            ['previa', 'Prévia'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={mobileView === value}
            onClick={() => {
              setMobileView(value)
              if (value !== 'previa') setLeftTab(value)
            }}
            className={`flex-1 rounded-xl py-2 text-[13px] font-semibold transition ${
              mobileView === value ? 'bg-[var(--bg-muted)] text-[var(--text-primary)]' : 'text-[var(--text-muted)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Esquerda: ações da IA, código e chat */}
        <section
          className={`${showLeft ? 'flex' : 'hidden'} min-h-0 w-full flex-col border-[var(--border-subtle)] lg:flex lg:w-[420px] lg:shrink-0 lg:border-r xl:w-[460px]`}
        >
          <div className="hidden gap-1 border-b border-[var(--border-subtle)] px-3 py-2 lg:flex" role="tablist">
            {(
              [
                ['acoes', 'Ações da IA'],
                ['codigo', 'Código'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={leftTab === value}
                onClick={() => setLeftTab(value)}
                className={`rounded-xl px-3 py-1.5 text-[13px] font-semibold transition ${
                  leftTab === value ? 'bg-[var(--bg-muted)] text-[var(--text-primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                {label}
                {value === 'codigo' && busy && <span className="ml-1.5 inline-block size-1.5 animate-pulse rounded-full bg-[#a78bfa] align-middle" />}
              </button>
            ))}
          </div>

          {activeLeft === 'acoes' ? (
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
              />
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col bg-[#0d0c12]">
              <div className="flex gap-1 overflow-x-auto border-b border-white/5 px-2 py-2 [scrollbar-width:none]">
                {fileTabs.map((file) => {
                  const status = builder.progress[file]?.status
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

          {/* Chat de alterações */}
          <form onSubmit={submitEdit} className="border-t border-[var(--border-subtle)] p-3">
            {ready && !busy && builder.versions.length <= 1 && (
              <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setInstruction(suggestion)}
                    className="shrink-0 rounded-full border border-[var(--border-default)] px-2.5 py-1 text-[11.5px] text-[var(--text-secondary)] transition hover:border-[var(--accent-ring)] hover:text-[var(--accent-text)]"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
            <div
              onDragOver={(event) => {
                if (event.dataTransfer.types.includes('Files')) event.preventDefault()
              }}
              onDrop={(event) => {
                if (!event.dataTransfer.files.length || !ready || busy) return
                event.preventDefault()
                attachments.add(event.dataTransfer.files)
              }}
              className="rounded-2xl border border-[var(--border-default)] bg-[var(--field-bg)] p-1.5 transition focus-within:border-[var(--accent-ring)] focus-within:ring-4 focus-within:ring-[var(--accent-tint)]"
            >
              <div className="pt-1.5">
                <AttachmentTray state={attachments} />
              </div>
              <div className="flex items-end gap-2">
                <AttachButton onFiles={attachments.add} disabled={!ready || busy} compact />
                <textarea
                  value={instruction}
                  onChange={(event) => setInstruction(event.target.value)}
                  onKeyDown={handleComposerKey}
                  onPaste={(event) => {
                    if (event.clipboardData.files.length && ready && !busy) {
                      event.preventDefault()
                      attachments.add(event.clipboardData.files)
                    }
                  }}
                  rows={2}
                  disabled={!ready || busy}
                  placeholder={
                    busy ? 'A IA está trabalhando…' : ready ? 'Peça uma mudança… ex.: troque o título do topo' : 'Espere o site ficar pronto'
                  }
                  className="max-h-80 min-h-[44px] flex-1 resize-none bg-transparent px-2 py-1.5 text-[13.5px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] disabled:cursor-not-allowed overflow-y-auto"
                />
                {instruction.trim().length > 0 && !busy && (
                  <button
                    type="button"
                    onClick={() => setInstruction('')}
                    className="flex size-9 shrink-0 items-center justify-center rounded-xl text-[var(--text-muted)] transition hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]"
                    title="Limpar (Esc)"
                    aria-label="Limpar texto"
                  >
                    <Eraser className="size-3.5" />
                  </button>
                )}
                {busy ? (
                  <button
                    type="button"
                    onClick={builder.stop}
                    className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--bg-muted)] text-[var(--text-primary)] transition hover:bg-[var(--bg-card-hover)]"
                    aria-label="Parar"
                    title="Parar"
                  >
                    <Square className="size-3.5 fill-current" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={(!instruction.trim() && attachments.assets.length === 0) || !ready || attachments.uploading}
                    className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#8b5cf6,#6d28d9)] text-white transition hover:brightness-110 disabled:opacity-40"
                    aria-label="Enviar"
                  >
                    <ArrowUp className="size-4" />
                  </button>
                )}
              </div>
            </div>
          </form>
        </section>

        {/* Direita: prévia do site */}
        <section className={`${mobileView === 'previa' ? 'flex' : 'hidden'} min-h-0 min-w-0 flex-1 flex-col bg-[var(--shell-bg)] p-2 sm:p-3 lg:flex`}>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] shadow-[var(--shadow-card)]">
            <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] px-3 py-2">
              <span className="hidden gap-1.5 sm:flex" aria-hidden>
                <span className="size-2.5 rounded-full bg-[#ff5f57]" />
                <span className="size-2.5 rounded-full bg-[#febc2e]" />
                <span className="size-2.5 rounded-full bg-[#28c840]" />
              </span>
              <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-lg bg-[var(--bg-muted)] px-2.5 py-1 text-[12px] text-[var(--text-muted)]">
                {ready && site.published ? <Check className="size-3 shrink-0 text-emerald-500" /> : <span className="size-1.5 shrink-0 rounded-full bg-[var(--text-muted)]" />}
                <span className="truncate">{url.replace(/^https?:\/\//, '')}</span>
              </div>
              <button type="button" className={iconButton} onClick={() => setReloadKey((key) => key + 1)} aria-label="Recarregar prévia" title="Recarregar">
                <RotateCw className="size-3.5" />
              </button>
              <a
                href={url}
                target="_blank"
                rel="noopener"
                className={`${iconButton} ${!ready || !site.published ? 'pointer-events-none opacity-40' : ''}`}
                aria-label="Abrir site em outra aba"
                title="Abrir site"
              >
                <ExternalLink className="size-3.5" />
              </a>
            </div>
            <div className="relative flex min-h-0 flex-1 justify-center overflow-hidden bg-[var(--bg-muted)]/40">
              {previewHtml ? (
                <div
                  className={`relative h-full transition-[width] duration-300 ${
                    device === 'mobile' ? 'my-3 w-[390px] max-w-full overflow-hidden rounded-[28px] border-[6px] border-[#1d1b24] shadow-2xl' : 'w-full'
                  }`}
                >
                  <SitePreview key={reloadKey} html={previewHtml} title={`Prévia de ${site.name}`} className="h-full w-full" />
                </div>
              ) : (
                <PlanningPlaceholder busy={phase === 'planning'} actions={builder.planActions} />
              )}
            </div>
          </div>
        </section>
      </div>

      <Modal open={slugOpen} onClose={() => setSlugOpen(false)} title="Link do site" size="sm">
        <form onSubmit={saveSlug} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-[var(--text-secondary)]">Endereço</span>
            <div className="flex items-center overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--field-bg)] focus-within:border-[var(--accent-ring)] focus-within:ring-4 focus-within:ring-[var(--accent-tint)]">
              <span className="shrink-0 pl-3 text-[13px] text-[var(--text-muted)]">{window.location.host}/s/</span>
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
        message={`O site ${site.name} e o link /s/${site.slug} deixam de existir. Não dá para desfazer.`}
        confirmLabel="Apagar"
        danger
        loading={deleting}
        onConfirm={() => void remove()}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  )
}

function PlanningPlaceholder({ busy, actions }: { busy: boolean; actions: string[] }) {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden p-8 text-center">
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#7c3aed]/20 blur-[90px]" />
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
        <p className="mt-6 font-display text-[17px] font-semibold text-[var(--text-primary)]">
          {busy ? 'Planejando o design…' : 'O site aparece aqui'}
        </p>
        <p className="mx-auto mt-1.5 max-w-xs text-[13px] text-[var(--text-muted)]">
          {busy
            ? actions[actions.length - 1] ?? 'Escolhendo cores, fontes e as seções certas para o negócio.'
            : 'Clique em "Gerar site" para começar.'}
        </p>
      </div>
    </div>
  )
}
