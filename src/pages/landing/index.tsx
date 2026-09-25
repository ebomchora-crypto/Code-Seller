import { useEffect } from 'react'
import { LandingNavbar } from '@/components/landing/LandingNavbar'
import { LandingHero } from '@/components/landing/LandingHero'
import { LandingStartCards } from '@/components/landing/LandingStartCards'
import { LandingProblem } from '@/components/landing/LandingProblem'
import { LandingCycle } from '@/components/landing/LandingCycle'
import { LandingModules } from '@/components/landing/LandingModules'
import { LandingBuyersHunter } from '@/components/landing/LandingBuyersHunter'
import { LandingEcosystem } from '@/components/landing/LandingEcosystem'
import { LandingComparison } from '@/components/landing/LandingComparison'
import { LandingTimeline } from '@/components/landing/LandingTimeline'
import { LandingBenefits } from '@/components/landing/LandingBenefits'
import { LandingFAQ } from '@/components/landing/LandingFAQ'
import { LandingCta } from '@/components/landing/LandingCta'
import { LandingFooter } from '@/components/landing/LandingFooter'

const TITLE = 'Code Sellers — Crie com IA. Encontre clientes. Venda.'
const DESCRIPTION =
  'Aprenda a criar sites e sistemas com IA, encontrar empresas qualificadas com Buyers Hunter e transformar projetos em vendas.'

export default function LandingPage() {
  useEffect(() => {
    const previousTitle = document.title
    document.title = TITLE

    const setMeta = (name: string, content: string, attr: 'name' | 'property' = 'name') => {
      let tag = document.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`)
      const created = !tag
      if (!tag) {
        tag = document.createElement('meta')
        tag.setAttribute(attr, name)
        document.head.appendChild(tag)
      }
      const previous = tag.content
      tag.content = content
      return () => {
        if (created) tag?.remove()
        else if (tag) tag.content = previous
      }
    }

    const restores = [
      setMeta('description', DESCRIPTION),
      setMeta('og:title', TITLE, 'property'),
      setMeta('og:description', DESCRIPTION, 'property'),
      setMeta('og:type', 'website', 'property'),
      setMeta('twitter:card', 'summary_large_image'),
      setMeta('twitter:title', TITLE),
      setMeta('twitter:description', DESCRIPTION),
    ]

    return () => {
      document.title = previousTitle
      restores.forEach((restore) => restore())
    }
  }, [])

  return (
    <div className="min-h-screen bg-landing-bg">
      <LandingNavbar />
      <main>
        <LandingHero />
        <LandingStartCards />
        <LandingProblem />
        <LandingCycle />
        <LandingModules />
        <LandingBuyersHunter />
        <LandingEcosystem />
        <LandingComparison />
        <LandingTimeline />
        <LandingBenefits />
        <LandingFAQ />
        <LandingCta />
      </main>
      <LandingFooter />
    </div>
  )
}
