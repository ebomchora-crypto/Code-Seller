import { useEffect, useState } from 'react'
import { PageWrapper } from '@/components/ui/PageWrapper'
import { SectionLabel } from '@/components/ui/section-label'
import { SystemStatusSection } from '@/components/support/SystemStatusSection'
import { HelpCenter } from '@/components/support/HelpCenter'
import { FAQSection } from '@/components/support/FAQSection'
import { ChangelogSection } from '@/components/support/ChangelogSection'
import { ContactSection } from '@/components/support/ContactSection'

const NAV_LINKS = [
  { id: 'ajuda', label: 'Ajuda' },
  { id: 'faq', label: 'FAQ' },
  { id: 'novidades', label: 'Novidades' },
  { id: 'contato', label: 'Contato' },
]

export default function SupportPage() {
  const [search, setSearch] = useState('')
  const [activeSection, setActiveSection] = useState('ajuda')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting)
        if (visible) setActiveSection(visible.target.id)
      },
      { rootMargin: '-40% 0px -50% 0px' },
    )

    NAV_LINKS.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  function scrollToSection(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  function handleSelectTopic(category: string) {
    setSearch(category)
    scrollToSection('faq')
  }

  return (
    <PageWrapper>
        <SectionLabel>Suporte</SectionLabel>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-[var(--text-primary)]">Suporte & Ajuda</h1>

        <div className="mt-6 flex items-center gap-1 overflow-x-auto border-b border-[var(--border-subtle)]">
          {NAV_LINKS.map((link) => (
            <button
              key={link.id}
              type="button"
              onClick={() => scrollToSection(link.id)}
              className={`shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition-all ${
                activeSection === link.id
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {link.label}
            </button>
          ))}
        </div>

        <SystemStatusSection />

        <HelpCenter search={search} onSearchChange={setSearch} onSelectTopic={handleSelectTopic} />

        <FAQSection search={search} />

        <ChangelogSection />

        <ContactSection />
    </PageWrapper>
  )
}
