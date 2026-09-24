import { useMemo, useState } from 'react'
import { SectionLabel } from '@/components/ui/section-label'
import { PurpleDivider } from '@/components/ui/purple-divider'
import { FAQItem } from '@/components/support/FAQItem'
import { FAQ_CATEGORIES, FAQ_ITEMS } from '@/data/faq'

interface FAQSectionProps {
  search: string
}

export function FAQSection({ search }: FAQSectionProps) {
  const [activeCategory, setActiveCategory] = useState('Todos')
  const [openId, setOpenId] = useState<string | null>(null)

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase()
    return FAQ_ITEMS.filter((item) => {
      const matchesCategory = activeCategory === 'Todos' || item.category === activeCategory
      const matchesSearch =
        query === '' || item.question.toLowerCase().includes(query) || item.answer.toLowerCase().includes(query)
      return matchesCategory && matchesSearch
    })
  }, [activeCategory, search])

  return (
    <section id="faq" className="scroll-mt-24 py-12">
      <SectionLabel>Perguntas frequentes</SectionLabel>
      <h2 className="mt-2 text-2xl font-bold tracking-tight text-[var(--text-primary)]">Dúvidas comuns</h2>
      <PurpleDivider className="mt-3" />

      <div className="mt-6 flex flex-wrap gap-2">
        {FAQ_CATEGORIES.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setActiveCategory(category)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-200 ${
              activeCategory === category
                ? 'bg-purple-500 text-white'
                : 'bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:bg-[var(--purple-soft)] hover:text-purple-500'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {filteredItems.length === 0 ? (
          <p className="py-8 text-center text-sm text-[var(--text-muted)]">Nenhuma pergunta encontrada para essa busca.</p>
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
    </section>
  )
}
