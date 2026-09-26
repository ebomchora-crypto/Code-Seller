import { useMemo, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { PanelHeader } from '@/components/ui/PanelHeader'
import { FilterChips } from '@/components/ui/FilterChips'
import { FAQItem } from '@/components/support/FAQItem'
import { FAQ_CATEGORIES, FAQ_ITEMS } from '@/data/faq'

interface FAQSectionProps {
  search: string
  category: string
  onCategoryChange: (category: string) => void
}

export function FAQSection({ search, category, onCategoryChange }: FAQSectionProps) {
  const [openId, setOpenId] = useState<string | null>(null)

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase()
    return FAQ_ITEMS.filter((item) => {
      const matchesCategory = category === 'Todos' || item.category === category
      const matchesSearch =
        query === '' || item.question.toLowerCase().includes(query) || item.answer.toLowerCase().includes(query)
      return matchesCategory && matchesSearch
    })
  }, [category, search])

  return (
    <Card id="faq" className="scroll-mt-6">
      <PanelHeader
        title="Perguntas frequentes"
        subtitle={search.trim() ? `${filteredItems.length} resultado(s) para "${search.trim()}"` : 'As dúvidas mais comuns, por assunto'}
      />

      <FilterChips
        label="Filtrar por assunto"
        options={FAQ_CATEGORIES.map((value) => ({ value, label: value }))}
        value={category}
        onChange={onCategoryChange}
      />

      <div className="-mx-2 mt-4 flex flex-col gap-1">
        {filteredItems.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[var(--border-default)] px-4 py-10 text-center text-[13.5px] text-[var(--text-muted)]">
            Nenhuma pergunta encontrada. Tente outra palavra ou fale com a gente pelo WhatsApp.
          </p>
        ) : (
          filteredItems.map((item) => (
            <FAQItem
              key={item.id}
              item={item}
              open={openId === item.id}
              onToggle={() => setOpenId((current) => (current === item.id ? null : item.id))}
            />
          ))
        )}
      </div>
    </Card>
  )
}
