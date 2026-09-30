import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, Bot, ChevronLeft, Copy, Heart, Search, Sparkles, UserRound } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { PageHeader, PageWrapper } from '@/components/ui/PageWrapper'
import { useAcademyProgress } from '@/hooks/useAcademyProgress'
import { getContactById, getContacts } from '@/services/supabase/contacts'
import { buildAutoPilotContext } from '@/services/supabase/autopilotContext'
import { personalizeCommercialMaterial, type CommercialPersonalizationInput } from '@/integrations/ai'
import { COMMERCIAL_MATERIALS, commercialFavoriteKey, searchCommercialMaterials, type CommercialCategory, type CommercialMaterial, type CommercialStage } from '@/data/commercial-library'
import type { Contact } from '@/types'

type CategoryFilter = CommercialCategory | 'all' | 'favorites'
type StageFilter = 'all' | 'reuniao' | 'fechamento'

const CATEGORIES: { id: CategoryFilter; label: string }[] = [
  { id: 'all', label: 'Todos' }, { id: 'scripts', label: 'Scripts de vendas' },
  { id: 'objections', label: 'Quebra de objeções' }, { id: 'followups', label: 'Follow-ups' },
  { id: 'copies', label: 'Copys prontas' }, { id: 'prompts', label: 'Prompts' },
  { id: 'universal', label: 'Scripts universais' }, { id: 'favorites', label: 'Favoritos' },
]
const CATEGORY_LABELS: Record<CommercialCategory, string> = {
  scripts: 'Script de vendas', objections: 'Objeção', followups: 'Follow-up',
  copies: 'Copy pronta', prompts: 'Prompt', universal: 'Script universal',
}
const STAGE_LABELS: Record<CommercialStage, string> = {
  interesse: 'Interesse', previa: 'Prévia', reuniao: 'Reunião', diagnostico: 'Diagnóstico',
  valor: 'Valor', preco: 'Preço', follow_up: 'Follow-up', fechamento: 'Fechamento', recuperacao: 'Recuperação',
}

function validCategory(value: string | null): CategoryFilter {
  return CATEGORIES.some((item) => item.id === value) ? value as CategoryFilter : 'all'
}

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value)
    toast.success('Copiado para a área de transferência')
  } catch {
    toast.error('Não foi possível copiar. Selecione o texto e copie manualmente.')
  }
}

function ActionBar({ item, favorite, onFavorite, onPersonalize, onCopilot }: {
  item: CommercialMaterial
  favorite: boolean
  onFavorite: (item: CommercialMaterial) => void
  onPersonalize: (item: CommercialMaterial) => void
  onCopilot: (item: CommercialMaterial) => void
}) {
  return <div className="flex flex-wrap gap-2">
    <Button type="button" size="sm" variant="secondary" onClick={() => void copyText(item.body)}><Copy className="size-4" />Copiar</Button>
    <Button type="button" size="sm" variant="secondary" onClick={() => onPersonalize(item)}><Sparkles className="size-4" />Personalizar com IA</Button>
    <Button type="button" size="sm" variant="secondary" onClick={() => onCopilot(item)}><Bot className="size-4" />Usar no CS Copilot</Button>
    <Button type="button" size="sm" variant="ghost" aria-label={favorite ? `Remover ${item.title} dos favoritos` : `Favoritar ${item.title}`} title={favorite ? 'Remover dos favoritos' : 'Favoritar'} onClick={() => onFavorite(item)}>
      <Heart className={`size-4 ${favorite ? 'fill-rose-500 text-rose-500' : ''}`} />{favorite ? 'Favoritado' : 'Favoritar'}
    </Button>
  </div>
}

function MaterialDetail({ item, favorite, onClose, onFavorite, onPersonalize, onCopilot }: {
  item: CommercialMaterial | null
  favorite: boolean
  onClose: () => void
  onFavorite: (item: CommercialMaterial) => void
  onPersonalize: (item: CommercialMaterial) => void
  onCopilot: (item: CommercialMaterial) => void
}) {
  return <Modal open={Boolean(item)} onClose={onClose} title={item?.title ?? ''} size="lg">
    {item && <div className="max-h-[min(74vh,700px)] space-y-5 overflow-y-auto pr-1" data-lenis-prevent>
      <div className="flex flex-wrap gap-2 text-xs text-[var(--text-muted)]"><span>{CATEGORY_LABELS[item.category]}</span><span>·</span><span>{STAGE_LABELS[item.stage]}</span></div>
      {item.meaning && <section><h3 className="text-sm font-semibold text-[var(--text-primary)]">O que pode estar acontecendo</h3><p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">{item.meaning}</p></section>}
      {item.avoid && <section><h3 className="text-sm font-semibold text-[var(--text-primary)]">O que não fazer</h3><p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">{item.avoid}</p></section>}
      <section><h3 className="text-sm font-semibold text-[var(--text-primary)]">Objetivo</h3><p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">{item.goal ?? item.strategy}</p></section>
      <section><h3 className="text-sm font-semibold text-[var(--text-primary)]">{item.category === 'prompts' ? 'Prompt' : 'Resposta recomendada'}</h3><div className="mt-2 whitespace-pre-wrap rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-muted)] p-4 text-sm leading-6 text-[var(--text-primary)]">{item.body}</div></section>
      {item.short && <section><div className="flex items-center justify-between gap-2"><h3 className="text-sm font-semibold text-[var(--text-primary)]">Versão curta</h3><button type="button" className="rounded p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]" aria-label="Copiar versão curta" title="Copiar versão curta" onClick={() => void copyText(item.short!)}><Copy className="size-4" /></button></div><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[var(--text-secondary)]">{item.short}</p></section>}
      {item.consultative && <section><div className="flex items-center justify-between gap-2"><h3 className="text-sm font-semibold text-[var(--text-primary)]">Versão consultiva</h3><button type="button" className="rounded p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]" aria-label="Copiar versão consultiva" title="Copiar versão consultiva" onClick={() => void copyText(item.consultative!)}><Copy className="size-4" /></button></div><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[var(--text-secondary)]">{item.consultative}</p></section>}
      {item.next && <section><h3 className="text-sm font-semibold text-[var(--text-primary)]">Próximo passo</h3><p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">{item.next}</p></section>}
      <div className="sticky bottom-0 border-t border-[var(--border-subtle)] bg-[var(--panel-bg)] py-3"><ActionBar item={item} favorite={favorite} onFavorite={onFavorite} onPersonalize={onPersonalize} onCopilot={onCopilot} /></div>
    </div>}
  </Modal>
}

function LeadPicker({ open, onClose, onSelect }: { open: boolean; onClose: () => void; onSelect: (contact: Contact | null) => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Contact[]>([])
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoading(true)
    getContacts({ pageSize: 20 }).then(({ data }) => { if (!cancelled) setResults(data) })
      .catch(() => { if (!cancelled) toast.error('Não foi possível carregar os leads.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [open])
  async function search(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    try { setResults((await getContacts({ filters: { search: query.trim() }, pageSize: 20 })).data) }
    catch { toast.error('Não foi possível buscar os leads.') }
    finally { setLoading(false) }
  }
  return <Modal open={open} onClose={onClose} title="Escolher lead do CRM">
    <div className="space-y-3">
      <form onSubmit={(event) => void search(event)} className="flex gap-2">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nome, e-mail ou telefone" aria-label="Buscar lead" className="min-w-0 flex-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)]" />
        <Button type="submit" size="sm" loading={loading}><Search className="size-4" />Buscar</Button>
      </form>
      <div className="max-h-72 overflow-y-auto" data-lenis-prevent>
        {results.length === 0 && !loading && <p className="py-6 text-center text-sm text-[var(--text-muted)]">Nenhum lead encontrado.</p>}
        {results.map((contact) => <button key={contact.id} type="button" onClick={() => onSelect(contact)} className="flex w-full items-center justify-between gap-3 border-b border-[var(--border-subtle)] px-2 py-3 text-left text-sm hover:bg-[var(--bg-muted)]"><span className="min-w-0 truncate font-medium text-[var(--text-primary)]">{contact.name}</span><span className="truncate text-xs text-[var(--text-muted)]">{contact.niche ?? contact.email ?? ''}</span></button>)}
      </div>
      <Button type="button" size="sm" variant="ghost" onClick={() => onSelect(null)}>Usar sem lead</Button>
    </div>
  </Modal>
}

function PersonalizeModal({ item, contactId, onClose }: { item: CommercialMaterial | null; contactId: string | null; onClose: () => void }) {
  const [tone, setTone] = useState<CommercialPersonalizationInput['tone']>('natural')
  const [length, setLength] = useState<CommercialPersonalizationInput['length']>('short')
  const [language, setLanguage] = useState<CommercialPersonalizationInput['language']>('pt-BR')
  const [notes, setNotes] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  async function generate() {
    if (!item) return
    setLoading(true); setResult('')
    try {
      const leadContext = contactId ? (await buildAutoPilotContext(contactId)).selected_lead : undefined
      if (contactId && !leadContext) throw new Error('Lead não encontrado no CRM.')
      setResult(await personalizeCommercialMaterial({ material: item, tone, length, language, notes, leadContext }))
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Falha ao personalizar. Tente novamente.') }
    finally { setLoading(false) }
  }
  const selectClass = 'w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)]'
  return <Modal open={Boolean(item)} onClose={onClose} title={`Personalizar: ${item?.title ?? ''}`} size="lg">
    <div className="max-h-[min(74vh,700px)] space-y-4 overflow-y-auto pr-1" data-lenis-prevent>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="space-y-1 text-xs font-medium text-[var(--text-secondary)]">Tom<select value={tone} onChange={(event) => setTone(event.target.value as typeof tone)} className={selectClass}><option value="natural">Natural</option><option value="professional">Profissional</option><option value="casual">Casual</option><option value="direct">Direto</option><option value="consultative">Consultivo</option></select></label>
        <label className="space-y-1 text-xs font-medium text-[var(--text-secondary)]">Tamanho<select value={length} onChange={(event) => setLength(event.target.value as typeof length)} className={selectClass}><option value="short">Curto</option><option value="balanced">Equilibrado</option><option value="detailed">Detalhado</option></select></label>
        <label className="space-y-1 text-xs font-medium text-[var(--text-secondary)]">Idioma<select value={language} onChange={(event) => setLanguage(event.target.value as typeof language)} className={selectClass}><option value="pt-BR">Português BR</option><option value="pt-PT">Português PT</option><option value="en">Inglês</option><option value="es">Espanhol</option></select></label>
      </div>
      <label className="block space-y-1 text-xs font-medium text-[var(--text-secondary)]">Contexto do projeto<textarea value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={4000} rows={4} placeholder="Nome, serviço, valor confirmado, ponto importante da conversa..." className={`${selectClass} resize-y`} /></label>
      <div className="flex flex-wrap items-center gap-3"><Button type="button" onClick={() => void generate()} loading={loading}><Sparkles className="size-4" />Gerar versão</Button><span className="text-xs text-[var(--text-muted)]">{contactId ? 'Dados do lead serão usados automaticamente.' : 'Sem lead selecionado; preencha o contexto necessário.'}</span></div>
      {result && <section aria-live="polite" className="space-y-3 border-t border-[var(--border-subtle)] pt-4"><h3 className="text-sm font-semibold text-[var(--text-primary)]">Versão personalizada</h3><p className="whitespace-pre-wrap rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-muted)] p-4 text-sm leading-6 text-[var(--text-primary)]">{result}</p><Button type="button" size="sm" variant="secondary" onClick={() => void copyText(result)}><Copy className="size-4" />Copiar resultado</Button></section>}
    </div>
  </Modal>
}

export default function CommercialLibraryPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const category = validCategory(params.get('categoria'))
  const stage: StageFilter = params.get('etapa') === 'reuniao' || params.get('etapa') === 'fechamento' ? params.get('etapa') as StageFilter : 'all'
  const query = params.get('q') ?? ''
  const contactId = params.get('contact')
  const [lead, setLead] = useState<Contact | null>(null)
  const [leadPickerOpen, setLeadPickerOpen] = useState(false)
  const [detail, setDetail] = useState<CommercialMaterial | null>(null)
  const [personalize, setPersonalize] = useState<CommercialMaterial | null>(null)
  const [visible, setVisible] = useState(12)
  const { done, loading: favoritesLoading, toggle } = useAcademyProgress()

  useEffect(() => {
    if (!contactId) { setLead(null); return }
    let cancelled = false
    getContactById(contactId).then((contact) => {
      if (cancelled) return
      if (contact) setLead(contact)
      else { setLead(null); toast.error('Lead não encontrado no CRM.') }
    }).catch(() => { if (!cancelled) toast.error('Não foi possível carregar o lead.') })
    return () => { cancelled = true }
  }, [contactId])

  const results = useMemo(() => searchCommercialMaterials(query, category === 'favorites' ? 'all' : category, stage)
    .filter((item) => category !== 'favorites' || done.has(commercialFavoriteKey(item.id))), [query, category, stage, done])
  const displayed = results.slice(0, visible)
  function updateParam(key: string, value: string | null) {
    setVisible(12)
    setParams((current) => { const next = new URLSearchParams(current); if (value) next.set(key, value); else next.delete(key); return next }, { replace: true })
  }
  function selectLead(contact: Contact | null) {
    setLead(contact); setLeadPickerOpen(false); updateParam('contact', contact?.id ?? null)
  }
  function openInCopilot(item: CommercialMaterial) {
    const next = new URLSearchParams({ view: 'chat', material: item.id })
    if (contactId) next.set('contact', contactId)
    navigate(`/copilot?${next.toString()}`)
  }
  function openPersonalization(item: CommercialMaterial) { setDetail(null); setPersonalize(item) }
  const actions = { onFavorite: (item: CommercialMaterial) => void toggle(commercialFavoriteKey(item.id)), onPersonalize: openPersonalization, onCopilot: openInCopilot }

  return <PageWrapper>
    <Link to="/aluno" className="mb-4 inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"><ChevronLeft className="size-4" />Área do aluno</Link>
    <PageHeader title="Biblioteca Comercial" subtitle="Encontre a próxima resposta para cada situação da venda." />
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-5">
      <div className="relative min-w-0 flex-1 sm:max-w-xl"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--text-muted)]" /><input type="search" value={query} onChange={(event) => updateParam('q', event.target.value)} placeholder="Buscar script, objeção ou situação..." aria-label="Pesquisar na biblioteca" className="h-10 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] pl-10 pr-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]" /></div>
      <Button type="button" size="sm" variant="secondary" onClick={() => setLeadPickerOpen(true)}><UserRound className="size-4" /><span className="max-w-40 truncate">{lead?.name ?? 'Escolher lead'}</span></Button>
    </div>
    <div className="mt-5 flex gap-2 overflow-x-auto pb-2" role="group" aria-label="Categorias da biblioteca" data-lenis-prevent>
      {CATEGORIES.map((option) => {
        const count = option.id === 'all' ? COMMERCIAL_MATERIALS.length : option.id === 'favorites' ? COMMERCIAL_MATERIALS.filter((item) => done.has(commercialFavoriteKey(item.id))).length : COMMERCIAL_MATERIALS.filter((item) => item.category === option.id).length
        return <button key={option.id} type="button" aria-pressed={category === option.id} onClick={() => updateParam('categoria', option.id === 'all' ? null : option.id)} className={`shrink-0 rounded-lg border px-3 py-2 text-sm transition-colors ${category === option.id ? 'border-[var(--accent-ring)] bg-[var(--accent-tint)] font-semibold text-[var(--accent-text)]' : 'border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]'}`}>{option.label} <span className="ml-1 text-xs opacity-65">{count}</span></button>
      })}
    </div>
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2 text-sm text-[var(--text-muted)]"><span>{results.length} {results.length === 1 ? 'material' : 'materiais'}</span>{lead && <span className="hidden sm:inline">· Para {lead.name}</span>}</div><div className="flex items-center gap-1" role="group" aria-label="Filtrar por etapa">{([{ id: 'all', label: 'Todas' }, { id: 'reuniao', label: 'Reunião' }, { id: 'fechamento', label: 'Fechamento' }] as { id: StageFilter; label: string }[]).map((option) => <button key={option.id} type="button" aria-pressed={stage === option.id} onClick={() => updateParam('etapa', option.id === 'all' ? null : option.id)} className={`rounded-lg px-3 py-1.5 text-xs ${stage === option.id ? 'bg-[var(--bg-muted)] font-semibold text-[var(--text-primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}>{option.label}</button>)}</div></div>
    {category === 'favorites' && favoritesLoading ? <p className="mt-10 text-center text-sm text-[var(--text-muted)]">Carregando favoritos...</p> : results.length === 0 ? <div className="mt-10 border-t border-[var(--border-subtle)] py-10 text-center"><p className="text-sm font-medium text-[var(--text-primary)]">{category === 'favorites' ? 'Nenhum favorito por aqui ainda.' : 'Nenhum material encontrado.'}</p><p className="mt-1 text-sm text-[var(--text-muted)]">{category === 'favorites' ? 'Favorite os materiais que usa com frequência.' : 'Tente outro termo ou limpe os filtros.'}</p>{category !== 'all' && <Button type="button" size="sm" variant="ghost" className="mt-3" onClick={() => { setVisible(12); setParams(contactId ? { contact: contactId } : {}) }}>Limpar filtros</Button>}</div> : <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {displayed.map((item) => <Card key={item.id} className="flex min-w-0 flex-col gap-3">
        <div className="flex items-start justify-between gap-2"><span className="text-xs font-semibold text-[var(--accent-text)]">{CATEGORY_LABELS[item.category]} · {STAGE_LABELS[item.stage]}</span><button type="button" aria-label={done.has(commercialFavoriteKey(item.id)) ? `Remover ${item.title} dos favoritos` : `Favoritar ${item.title}`} title={done.has(commercialFavoriteKey(item.id)) ? 'Remover dos favoritos' : 'Favoritar'} onClick={() => void toggle(commercialFavoriteKey(item.id))} className="shrink-0 rounded p-1 text-[var(--text-muted)] hover:text-rose-500"><Heart className={`size-4 ${done.has(commercialFavoriteKey(item.id)) ? 'fill-rose-500 text-rose-500' : ''}`} /></button></div>
        <div className="flex-1"><h2 className="text-base font-semibold text-[var(--text-primary)]">{item.title}</h2><p className="mt-1 line-clamp-2 text-sm leading-6 text-[var(--text-muted)]">{item.meaning ?? item.strategy}</p><p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-[var(--text-secondary)]">{item.body}</p></div>
        <div className="flex flex-wrap items-center gap-2 border-t border-[var(--border-subtle)] pt-3"><Button type="button" size="sm" variant="secondary" onClick={() => setDetail(item)}>Ver material <ArrowRight className="size-3.5" /></Button><button type="button" className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-[var(--bg-muted)]" title="Copiar resposta" aria-label={`Copiar ${item.title}`} onClick={() => void copyText(item.body)}><Copy className="size-4" /></button><button type="button" className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-[var(--bg-muted)]" title="Personalizar com IA" aria-label={`Personalizar ${item.title}`} onClick={() => openPersonalization(item)}><Sparkles className="size-4" /></button><button type="button" className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-[var(--bg-muted)]" title="Usar no CS Copilot" aria-label={`Usar ${item.title} no CS Copilot`} onClick={() => openInCopilot(item)}><Bot className="size-4" /></button></div>
      </Card>)}
    </div>}
    {visible < results.length && <div className="mt-6 flex justify-center"><Button type="button" variant="secondary" onClick={() => setVisible((current) => current + 12)}>Mostrar mais</Button></div>}
    <MaterialDetail item={detail} favorite={Boolean(detail && done.has(commercialFavoriteKey(detail.id)))} onClose={() => setDetail(null)} {...actions} />
    <LeadPicker open={leadPickerOpen} onClose={() => setLeadPickerOpen(false)} onSelect={selectLead} />
    <PersonalizeModal key={personalize?.id ?? 'none'} item={personalize} contactId={contactId} onClose={() => setPersonalize(null)} />
  </PageWrapper>
}
