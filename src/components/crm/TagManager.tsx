import { useEffect, useRef, useState } from 'react'
import { TagBadge } from '@/components/crm/TagBadge'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import type { Tag } from '@/types'

interface TagManagerProps {
  contactTags: Tag[]
  availableTags: Tag[]
  onAdd: (tag: Tag) => void
  onRemove: (tagId: string) => void
  onCreate: (name: string, color: string) => Promise<Tag | null>
}

const SWATCHES = ['#b35cff', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#64748b']

export function TagManager({ contactTags, availableTags, onAdd, onRemove, onCreate }: TagManagerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const [newColor, setNewColor] = useState(SWATCHES[0])
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
        setCreating(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const contactTagIds = new Set(contactTags.map((tag) => tag.id))
  const filteredTags = availableTags.filter(
    (tag) => !contactTagIds.has(tag.id) && tag.name.toLowerCase().includes(search.toLowerCase()),
  )

  async function handleCreate() {
    if (!search.trim()) return
    const tag = await onCreate(search.trim(), newColor)
    if (tag) {
      onAdd(tag)
      setSearch('')
      setCreating(false)
      setOpen(false)
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="flex flex-wrap items-center gap-1.5">
        {contactTags.map((tag) => (
          <TagBadge key={tag.id} tag={tag} onRemove={() => onRemove(tag.id)} />
        ))}
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="inline-flex items-center gap-1 rounded-full border border-dashed border-neutral-300 px-2 py-0.5 text-[11px] font-medium text-neutral-500 transition-colors hover:border-purple-300 hover:text-purple-600"
        >
          + Adicionar tag
        </button>
      </div>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-2 w-64 animate-fade-in rounded-xl border border-neutral-200 bg-white p-3 shadow-lg">
          <Input
            placeholder="Buscar ou criar tag"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            autoFocus
          />

          <div className="mt-2 max-h-40 overflow-y-auto">
            {filteredTags.length > 0 ? (
              filteredTags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => {
                    onAdd(tag)
                    setSearch('')
                    setOpen(false)
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-neutral-50"
                >
                  <TagBadge tag={tag} />
                </button>
              ))
            ) : (
              <p className="px-2 py-1.5 text-xs text-neutral-400">Nenhuma tag encontrada.</p>
            )}
          </div>

          {search.trim() && filteredTags.every((tag) => tag.name.toLowerCase() !== search.trim().toLowerCase()) && (
            <div className="mt-2 border-t border-neutral-100 pt-2">
              {creating ? (
                <div className="flex flex-col gap-2">
                  <div className="flex gap-1.5">
                    {SWATCHES.map((color) => (
                      <button
                        key={color}
                        type="button"
                        aria-label={`Cor ${color}`}
                        onClick={() => setNewColor(color)}
                        className={`h-5 w-5 rounded-full ${newColor === color ? 'ring-2 ring-offset-1' : ''}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <Button size="sm" onClick={handleCreate}>
                    Criar "{search.trim()}"
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setCreating(true)}
                  className="text-xs font-medium text-purple-600 hover:text-purple-700"
                >
                  + Criar nova tag "{search.trim()}"
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
