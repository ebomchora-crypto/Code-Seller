import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowDown, ArrowUp, Check, Copy, Eye, EyeOff, ExternalLink, Globe, ImageOff, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader, PageWrapper } from '@/components/ui/PageWrapper'
import { Card } from '@/components/ui/Card'
import { PanelHeader } from '@/components/ui/PanelHeader'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ImageUploader } from '@/components/portfolio/ImageUploader'
import { ProjectFormModal } from '@/components/portfolio/ProjectFormModal'
import { useAuthContext } from '@/stores/AuthContext'
import {
  createProject,
  deleteProject,
  getMyPortfolio,
  getMyProjects,
  removeImage,
  savePortfolio,
  setPublished,
  updateProject,
} from '@/services/supabase/portfolio'
import { PORTFOLIO_CATEGORY_LABELS, portfolioUrl, slugify, validateSlug } from '@/utils/portfolio'
import type { Portfolio, PortfolioCategory, PortfolioInput, PortfolioProject, PortfolioProjectInput } from '@/types'

const fieldClass =
  'w-full rounded-xl border border-[var(--border-default)] bg-[var(--field-bg)] px-3.5 text-[14px] text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent-ring)] focus:ring-4 focus:ring-[var(--accent-tint)]'

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string | null; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-[13px] font-medium text-[var(--text-secondary)]">
      {label}
      {children}
      {error ? (
        <span className="text-[11.5px] font-normal text-red-500">{error}</span>
      ) : (
        hint && <span className="text-[11.5px] font-normal text-[var(--text-muted)]">{hint}</span>
      )}
    </label>
  )
}

const iconButton =
  'flex size-8 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)] disabled:opacity-30'

// Sellers Portfolio: cada usuário monta a própria vitrine de trabalhos e manda
// o link /p/apelido para os clientes.
export default function PortfolioPage() {
  const { user, profile } = useAuthContext()
  const [searchParams, setSearchParams] = useSearchParams()
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null)
  const [projects, setProjects] = useState<PortfolioProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<PortfolioInput | null>(null)
  const [savingPage, setSavingPage] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [projectModal, setProjectModal] = useState<{ project: PortfolioProject | null; initial: PortfolioProjectInput | null } | null>(null)
  const [savingProject, setSavingProject] = useState(false)
  const [deleting, setDeleting] = useState<PortfolioProject | null>(null)

  const defaultName = profile?.company_name || profile?.full_name || user?.name || ''

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [mine, myProjects] = await Promise.all([getMyPortfolio(), getMyProjects()])
      setPortfolio(mine)
      setProjects(myProjects)
      setError(null)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível carregar o portfólio.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  // Formulário da página: dados salvos ou sugestão a partir do perfil.
  useEffect(() => {
    if (loading) return
    setForm(
      portfolio
        ? {
            slug: portfolio.slug,
            display_name: portfolio.display_name,
            headline: portfolio.headline,
            bio: portfolio.bio,
            avatar_url: portfolio.avatar_url,
            whatsapp: portfolio.whatsapp,
            city: portfolio.city,
          }
        : {
            slug: slugify(defaultName),
            display_name: defaultName,
            headline: 'Sites e sistemas que trazem clientes para pequenos negócios.',
            bio: profile?.bio ?? '',
            avatar_url: profile?.avatar_url ?? null,
            whatsapp: profile?.phone ?? '',
            city: '',
          },
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, portfolio?.updated_at])

  // "Adicionar ao portfólio" vindo de um negócio ganho.
  useEffect(() => {
    if (loading || searchParams.get('novo') !== '1') return
    setProjectModal({
      project: null,
      initial: {
        title: searchParams.get('titulo') ?? '',
        client_label: searchParams.get('cliente') ?? '',
        category: (searchParams.get('tipo') as PortfolioCategory) || 'site',
        description: '',
        url: '',
        image_url: null,
        testimonial: '',
        testimonial_author: '',
        deal_id: searchParams.get('negocio'),
        visible: true,
      },
    })
    setSearchParams(new URLSearchParams(), { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading])

  const slugError = form ? validateSlug(form.slug) : null
  const link = portfolio ? portfolioUrl(portfolio.slug) : null
  const visibleCount = useMemo(() => projects.filter((project) => project.visible).length, [projects])
  const dirty =
    !!form &&
    (!portfolio ||
      (['slug', 'display_name', 'headline', 'bio', 'avatar_url', 'whatsapp', 'city'] as const).some(
        (key) => (form[key] ?? '') !== (portfolio[key] ?? ''),
      ))

  async function handleSavePage() {
    if (!form || slugError || !form.display_name.trim()) return
    setSavingPage(true)
    try {
      const saved = await savePortfolio({
        ...form,
        display_name: form.display_name.trim(),
        headline: form.headline?.trim() || null,
        bio: form.bio?.trim() || null,
        whatsapp: form.whatsapp?.trim() || null,
        city: form.city?.trim() || null,
      })
      if (portfolio?.avatar_url && portfolio.avatar_url !== saved.avatar_url && !portfolio.avatar_url.includes('/avatars/')) {
        void removeImage(portfolio.avatar_url)
      }
      setPortfolio(saved)
      toast.success(portfolio ? 'Página atualizada.' : 'Sua página foi criada. Adicione projetos e publique.')
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : 'Não foi possível salvar.')
    } finally {
      setSavingPage(false)
    }
  }

  async function handlePublish(next: boolean) {
    if (next && visibleCount === 0) {
      toast.error('Adicione pelo menos um projeto visível antes de publicar.')
      return
    }
    setPublishing(true)
    try {
      setPortfolio(await setPublished(next))
      toast.success(next ? 'Página publicada! Já pode mandar o link.' : 'Página despublicada. Ninguém mais consegue abrir.')
    } catch {
      toast.error('Não foi possível mudar a publicação.')
    } finally {
      setPublishing(false)
    }
  }

  async function copyLink() {
    if (!link) return
    try {
      await navigator.clipboard.writeText(link)
      toast.success('Link copiado.')
    } catch {
      toast.error('Não foi possível copiar.')
    }
  }

  async function handleSaveProject(input: PortfolioProjectInput) {
    if (!projectModal) return
    setSavingProject(true)
    try {
      const editing = projectModal.project
      if (editing) {
        const updated = await updateProject(editing.id, input)
        if (editing.image_url && editing.image_url !== updated.image_url) void removeImage(editing.image_url)
        setProjects((current) => current.map((project) => (project.id === updated.id ? updated : project)))
      } else {
        const created = await createProject(input, projects.length)
        setProjects((current) => [...current, created])
      }
      setProjectModal(null)
    } catch {
      toast.error('Não foi possível salvar o projeto.')
    } finally {
      setSavingProject(false)
    }
  }

  async function toggleVisible(project: PortfolioProject) {
    try {
      const updated = await updateProject(project.id, { visible: !project.visible })
      setProjects((current) => current.map((item) => (item.id === updated.id ? updated : item)))
    } catch {
      toast.error('Não foi possível atualizar o projeto.')
    }
  }

  async function move(index: number, delta: number) {
    const target = index + delta
    if (target < 0 || target >= projects.length) return
    const next = [...projects]
    ;[next[index], next[target]] = [next[target], next[index]]
    setProjects(next.map((project, position) => ({ ...project, position })))
    try {
      await Promise.all([updateProject(next[index].id, { position: index }), updateProject(next[target].id, { position: target })])
    } catch {
      toast.error('Não foi possível reordenar.')
      void load()
    }
  }

  async function confirmDelete() {
    if (!deleting) return
    try {
      await deleteProject(deleting)
      setProjects((current) => current.filter((project) => project.id !== deleting.id))
    } catch {
      toast.error('Não foi possível excluir o projeto.')
    }
    setDeleting(null)
  }

  return (
    <PageWrapper>
      <PageHeader
        title="Sellers Portfolio"
        subtitle="Sua vitrine de trabalhos. Mande o link para o cliente ver o que você já entregou antes de fechar."
        actions={
          portfolio && (
            <>
              <span
                className={`inline-flex h-9 items-center gap-2 rounded-full px-3.5 text-[12.5px] font-medium ${
                  portfolio.published
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-[var(--bg-muted)] text-[var(--text-muted)]'
                }`}
              >
                <span className={`size-1.5 rounded-full ${portfolio.published ? 'bg-emerald-500' : 'bg-[var(--text-muted)]'}`} />
                {portfolio.published ? 'Publicada' : 'Rascunho'}
              </span>
              <a
                href={`/p/${portfolio.slug}?preview=1`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 items-center gap-2 rounded-full border border-[var(--border-default)] px-4 text-[13.5px] font-medium text-[var(--text-secondary)] transition hover:border-[var(--accent-ring)] hover:text-[var(--accent-text)]"
              >
                <ExternalLink className="size-4" />
                Ver página
              </a>
              <Button className="h-11 rounded-full px-5" loading={publishing} onClick={() => void handlePublish(!portfolio.published)}>
                {!publishing && (portfolio.published ? <EyeOff className="size-4" /> : <Globe className="size-4" />)}
                {portfolio.published ? 'Despublicar' : 'Publicar'}
              </Button>
            </>
          )
        }
      />

      {error ? (
        <div className="mt-8">
          <ErrorState message={error} onRetry={() => void load()} />
        </div>
      ) : loading || !form ? (
        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <Skeleton className="h-[520px] w-full rounded-[22px] lg:col-span-2" />
          <Skeleton className="h-[520px] w-full rounded-[22px] lg:col-span-3" />
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-5 lg:items-start">
          <Card className="lg:col-span-2">
            <PanelHeader title="Sua página" subtitle={portfolio ? 'Como você aparece para o cliente' : 'Crie sua página em 1 minuto'} />

            {link && (
              <div className="mb-5 flex items-center gap-2 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-muted)] p-1.5 pl-3.5">
                <span className="min-w-0 flex-1 truncate font-mono text-[12.5px] text-[var(--text-secondary)]">{link.replace(/^https?:\/\//, '')}</span>
                <Button size="sm" variant="secondary" className="rounded-xl" onClick={() => void copyLink()}>
                  <Copy className="size-3.5" />
                  Copiar
                </Button>
              </div>
            )}
            {portfolio && (
              <p className="-mt-2 mb-5 flex items-center gap-1.5 text-[12.5px] text-[var(--text-muted)]">
                <Eye className="size-3.5" />
                {portfolio.views} {portfolio.views === 1 ? 'visita' : 'visitas'} na página
              </p>
            )}

            <div className="flex flex-col gap-4">
              <ImageUploader
                variant="avatar"
                value={form.avatar_url}
                onChange={(url) => setForm({ ...form, avatar_url: url })}
                label="Adicionar foto ou logo"
              />
              <Field
                label="Link da sua página"
                error={form.slug ? slugError : null}
                hint="Só letras minúsculas, números e hífen."
              >
                <div className="flex items-center rounded-xl border border-[var(--border-default)] bg-[var(--field-bg)] pl-3.5 focus-within:border-[var(--accent-ring)] focus-within:ring-4 focus-within:ring-[var(--accent-tint)]">
                  <span className="shrink-0 text-[13px] text-[var(--text-muted)]">/p/</span>
                  <input
                    value={form.slug}
                    onChange={(event) => setForm({ ...form, slug: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 32) })}
                    className="h-10 min-w-0 flex-1 bg-transparent pl-0.5 pr-3 text-[14px] text-[var(--text-primary)] outline-none"
                  />
                </div>
              </Field>
              <Field label="Nome na página">
                <input value={form.display_name} onChange={(event) => setForm({ ...form, display_name: event.target.value })} className={`${fieldClass} h-10`} />
              </Field>
              <Field label="Frase de apresentação">
                <input value={form.headline ?? ''} onChange={(event) => setForm({ ...form, headline: event.target.value })} maxLength={120} className={`${fieldClass} h-10`} />
              </Field>
              <Field label="Sobre você" hint="Quem você é e para quem você trabalha.">
                <textarea value={form.bio ?? ''} onChange={(event) => setForm({ ...form, bio: event.target.value })} rows={3} maxLength={600} className={`${fieldClass} resize-none py-2.5`} />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="WhatsApp" hint="O botão da página abre esta conversa.">
                  <input value={form.whatsapp ?? ''} onChange={(event) => setForm({ ...form, whatsapp: event.target.value })} placeholder="(16) 99999-0000" className={`${fieldClass} h-10`} />
                </Field>
                <Field label="Cidade">
                  <input value={form.city ?? ''} onChange={(event) => setForm({ ...form, city: event.target.value })} placeholder="Ribeirão Preto, SP" className={`${fieldClass} h-10`} />
                </Field>
              </div>
              <Button
                className="rounded-full"
                onClick={() => void handleSavePage()}
                loading={savingPage}
                disabled={!!slugError || !form.display_name.trim() || !dirty}
              >
                {!savingPage && <Check className="size-4" />}
                {portfolio ? 'Salvar alterações' : 'Criar minha página'}
              </Button>
            </div>
          </Card>

          <Card className="lg:col-span-3">
            <PanelHeader
              title="Projetos"
              subtitle={`${projects.length} ${projects.length === 1 ? 'projeto' : 'projetos'} · ${visibleCount} ${visibleCount === 1 ? 'visível' : 'visíveis'}`}
              action={
                <Button size="sm" className="rounded-full" onClick={() => setProjectModal({ project: null, initial: null })} disabled={!portfolio}>
                  <Plus className="size-4" />
                  Adicionar projeto
                </Button>
              }
            />
            {!portfolio ? (
              <p className="rounded-2xl border border-dashed border-[var(--border-strong)] px-5 py-10 text-center text-[13.5px] text-[var(--text-muted)]">
                Crie sua página ao lado para começar a adicionar projetos.
              </p>
            ) : projects.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--border-strong)] px-5 py-10 text-center">
                <p className="text-[14px] font-medium text-[var(--text-primary)]">Nenhum projeto ainda</p>
                <p className="mx-auto mt-1 max-w-sm text-[13px] text-[var(--text-muted)]">
                  Adicione os sites e sistemas que você já entregou, com um print e o link no ar. Negócios ganhos também têm o
                  botão "Adicionar ao portfólio".
                </p>
              </div>
            ) : (
              <ul className="flex flex-col gap-3">
                {projects.map((project, index) => (
                  <li
                    key={project.id}
                    className={`flex items-center gap-4 rounded-2xl border border-[var(--border-default)] p-3 ${project.visible ? '' : 'opacity-60'}`}
                  >
                    <div className="flex aspect-[16/10] w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[var(--bg-muted)]">
                      {project.image_url ? (
                        <img src={project.image_url} alt="" className="size-full object-cover" />
                      ) : (
                        <ImageOff className="size-5 text-[var(--text-muted)]" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14.5px] font-semibold text-[var(--text-primary)]">{project.title}</p>
                      <p className="truncate text-[12.5px] text-[var(--text-muted)]">
                        {[PORTFOLIO_CATEGORY_LABELS[project.category], project.client_label].filter(Boolean).join(' · ')}
                      </p>
                      {!project.visible && <p className="mt-0.5 text-[11.5px] font-medium text-amber-600 dark:text-amber-400">Escondido da página</p>}
                    </div>
                    <div className="flex shrink-0 items-center gap-0.5">
                      <button type="button" onClick={() => void move(index, -1)} disabled={index === 0} aria-label="Subir" className={iconButton}>
                        <ArrowUp className="size-4" />
                      </button>
                      <button type="button" onClick={() => void move(index, 1)} disabled={index === projects.length - 1} aria-label="Descer" className={iconButton}>
                        <ArrowDown className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void toggleVisible(project)}
                        aria-label={project.visible ? 'Esconder da página' : 'Mostrar na página'}
                        title={project.visible ? 'Esconder da página' : 'Mostrar na página'}
                        className={iconButton}
                      >
                        {project.visible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setProjectModal({
                            project,
                            initial: {
                              title: project.title,
                              client_label: project.client_label,
                              category: project.category,
                              description: project.description,
                              url: project.url,
                              image_url: project.image_url,
                              testimonial: project.testimonial,
                              testimonial_author: project.testimonial_author,
                              deal_id: project.deal_id,
                              visible: project.visible,
                            },
                          })
                        }
                        aria-label={`Editar ${project.title}`}
                        className={iconButton}
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleting(project)}
                        aria-label={`Excluir ${project.title}`}
                        className={`${iconButton} hover:bg-red-500/10 hover:text-red-500`}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}

      <ProjectFormModal
        open={projectModal !== null}
        initial={projectModal?.initial ?? null}
        editing={Boolean(projectModal?.project)}
        saving={savingProject}
        onClose={() => setProjectModal(null)}
        onSubmit={(input) => void handleSaveProject(input)}
      />

      <ConfirmDialog
        open={deleting !== null}
        title="Excluir projeto"
        message={`Excluir "${deleting?.title}" do portfólio? A imagem também será apagada.`}
        confirmLabel="Excluir"
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleting(null)}
      />
    </PageWrapper>
  )
}
