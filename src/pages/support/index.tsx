import { useState } from 'react'
import { PageWrapper } from '@/components/ui/PageWrapper'
import { SystemStatusSection } from '@/components/support/SystemStatusSection'
import { HelpCenter } from '@/components/support/HelpCenter'
import { FAQSection } from '@/components/support/FAQSection'
import { ChangelogSection } from '@/components/support/ChangelogSection'
import { ContactSection } from '@/components/support/ContactSection'

export default function SupportPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Todos')

  // Tópico do topo: abre o FAQ já filtrado naquele assunto.
  function handleSelectTopic(nextCategory: string) {
    setSearch('')
    setCategory(nextCategory)
    document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <PageWrapper>
      <HelpCenter search={search} onSearchChange={setSearch} onSelectTopic={handleSelectTopic} />

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <FAQSection search={search} category={category} onCategoryChange={setCategory} />
          <ChangelogSection />
        </div>
        <div className="flex flex-col gap-6">
          <ContactSection />
          <SystemStatusSection />
        </div>
      </div>
    </PageWrapper>
  )
}
