import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType, type SVGProps } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { Briefcase, CheckSquare, CornerDownLeft, Crosshair, MonitorPlay, Plus, Search, UserPlus, UserRound } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { navGroups } from '@/components/layout/navConfig'
import { OPEN_COMMAND_PALETTE } from '@/components/layout/commandPaletteEvents'


type IconType = ComponentType<SVGProps<SVGSVGElement> & { className?: string }>

interface PaletteItem {
  id: string
  group: string
  label: string
  hint?: string
  icon: IconType
  to: string
}

const ACTIONS: PaletteItem[] = [
  { id: 'new-contact', group: 'Ações', label: 'Novo contato', icon: UserPlus, to: '/crm?novo=1' },
  { id: 'new-deal', group: 'Ações', label: 'Novo negócio', icon: Plus, to: '/deals?novo=1' },
  { id: 'new-task', group: 'Ações', label: 'Nova tarefa', icon: CheckSquare, to: '/tasks?novo=1' },
  { id: 'hunter', group: 'Ações', label: 'Buscar empresas no Buyers Hunter', icon: Crosshair, to: '/prospection' },
  { id: 'room', group: 'Ações', label: 'Abrir Sala de receita', icon: MonitorPlay, to: '/sala-de-receita' },
]

const PAGES: PaletteItem[] = navGroups.flatMap((group) =>
  group.items.map((item) => ({ id: `page-${item.path}`, group: 'Páginas', label: item.label, icon: item.icon, to: item.path })),
)

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

// Escapa curingas do ilike (% e _) e vírgulas/parênteses do filtro or().
function escapeTerm(value: string): string {
  return value.replace(/[%_]/g, (char) => `\\${char}`).replace(/[,()]/g, ' ')
}

async function searchRecords(term: string): Promise<PaletteItem[]> {
  const pattern = `%${escapeTerm(term)}%`
  const [contacts, deals, tasks] = await Promise.all([
    supabase.from('contacts').select('id, name, niche, email').or(`name.ilike.${pattern},email.ilike.${pattern},niche.ilike.${pattern}`).limit(5),
    supabase.from('deals').select('id, title, stage').ilike('title', pattern).limit(5),
    supabase.from('tasks').select('id, title, status').is('parent_task_id', null).ilike('title', pattern).limit(5),
  ])

  const items: PaletteItem[] = []
  for (const row of (contacts.data ?? []) as { id: string; name: string; niche: string | null; email: string | null }[]) {
    items.push({ id: `contact-${row.id}`, group: 'Contatos', label: row.name, hint: row.niche ?? row.email ?? undefined, icon: UserRound, to: `/crm/${row.id}` })
  }
  for (const row of (deals.data ?? []) as { id: string; title: string }[]) {
    items.push({ id: `deal-${row.id}`, group: 'Negócios', label: row.title, icon: Briefcase, to: `/deals/${row.id}` })
  }
  for (const row of (tasks.data ?? []) as { id: string; title: string; status: string }[]) {
    items.push({
      id: `task-${row.id}`,
      group: 'Tarefas',
      label: row.title,
      hint: row.status === 'done' ? 'Concluída' : undefined,
      icon: CheckSquare,
      to: '/tasks',
    })
  }
  return items
}

// Busca rápida (Ctrl+K / ⌘K): páginas, ações e registros do CRM.
export function CommandPalette() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [records, setRecords] = useState<PaletteItem[]>([])
  const [searching, setSearching] = useState(false)
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const close = useCallback(() => {
    setOpen(false)
    setQuery('')
    setRecords([])
    setActive(0)
  }, [])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen((current) => !current)
      }
    }
    const onOpen = () => setOpen(true)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener(OPEN_COMMAND_PALETTE, onOpen)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener(OPEN_COMMAND_PALETTE, onOpen)
    }
  }, [])

  useEffect(() => {
    if (open) window.setTimeout(() => inputRef.current?.focus(), 30)
  }, [open])

  const term = query.trim()
  useEffect(() => {
    if (term.length < 2) {
      setRecords([])
      setSearching(false)
      return
    }
    setSearching(true)
    let cancelled = false
    const timer = window.setTimeout(() => {
      searchRecords(term)
        .then((items) => !cancelled && setRecords(items))
        .catch(() => !cancelled && setRecords([]))
        .finally(() => !cancelled && setSearching(false))
    }, 220)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [term])

  const items = useMemo(() => {
    const needle = normalize(term)
    const matches = (item: PaletteItem) => !needle || normalize(item.label).includes(needle)
    return [...ACTIONS.filter(matches), ...PAGES.filter(matches), ...records]
  }, [term, records])

  useEffect(() => setActive(0), [term, records.length])

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [active])

  function run(item: PaletteItem) {
    close()
    navigate(item.to)
  }

  function onInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive((current) => Math.min(current + 1, items.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((current) => Math.max(current - 1, 0))
    } else if (event.key === 'Enter' && items[active]) {
      event.preventDefault()
      run(items[active])
    } else if (event.key === 'Escape') {
      close()
    }
  }

  let lastGroup = ''

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-start justify-center bg-[#08060d]/55 px-4 pt-[12vh] backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => event.target === event.currentTarget && close()}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Busca rápida"
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="w-full max-w-[560px] overflow-hidden rounded-[22px] border border-[var(--panel-border)] bg-[var(--panel-bg)] shadow-[var(--shadow-modal)]"
          >
            <div className="flex items-center gap-3 border-b border-[var(--border-subtle)] px-4">
              <Search className="size-[18px] shrink-0 text-[var(--text-muted)]" />
              <input
                ref={inputRef}
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={onInputKeyDown}
                placeholder="Buscar contato, negócio, tarefa ou ação…"
                aria-label="Buscar"
                aria-activedescendant={items[active] ? `palette-${items[active].id}` : undefined}
                className="h-14 flex-1 bg-transparent text-[15px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
              />
              <kbd className="rounded-md border border-[var(--border-default)] px-1.5 py-0.5 text-[11px] text-[var(--text-muted)]">Esc</kbd>
            </div>

            <div ref={listRef} role="listbox" data-lenis-prevent className="max-h-[52vh] overflow-y-auto p-2">
              {items.length === 0 ? (
                <p className="px-3 py-8 text-center text-[13.5px] text-[var(--text-muted)]">
                  {searching ? 'Buscando…' : `Nada encontrado para "${term}".`}
                </p>
              ) : (
                items.map((item, index) => {
                  const header = item.group !== lastGroup ? item.group : null
                  lastGroup = item.group
                  const selected = index === active
                  return (
                    <div key={item.id}>
                      {header && (
                        <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)] first:pt-1">
                          {header}
                        </p>
                      )}
                      <button
                        type="button"
                        id={`palette-${item.id}`}
                        role="option"
                        aria-selected={selected}
                        data-index={index}
                        onMouseMove={() => setActive(index)}
                        onClick={() => run(item)}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                          selected ? 'bg-[var(--accent-tint)]' : ''
                        }`}
                      >
                        <item.icon className={`size-4 shrink-0 ${selected ? 'text-[var(--accent-text)]' : 'text-[var(--text-muted)]'}`} />
                        <span className="min-w-0 flex-1 truncate text-[14px] text-[var(--text-primary)]">{item.label}</span>
                        {item.hint && <span className="shrink-0 truncate text-[12px] text-[var(--text-muted)]">{item.hint}</span>}
                        {selected && <CornerDownLeft className="size-3.5 shrink-0 text-[var(--text-muted)]" />}
                      </button>
                    </div>
                  )
                })
              )}
              {searching && items.length > 0 && <p className="px-3 py-2 text-[12px] text-[var(--text-muted)]">Buscando registros…</p>}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
