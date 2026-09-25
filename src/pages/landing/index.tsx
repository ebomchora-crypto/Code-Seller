import { useEffect } from 'react'
import { LandingNavbar } from '@/components/landing/LandingNavbar'
import { LandingHero } from '@/components/landing/LandingHero'
import { LandingStartCards } from '@/components/landing/LandingStartCards'
import { LandingCycle } from '@/components/landing/LandingCycle'
import { LandingModules } from '@/components/landing/LandingModules'
import { LandingCta } from '@/components/landing/LandingCta'
import { LandingFooter } from '@/components/landing/LandingFooter'

const TITLE = 'Code Sellers — CRM para vendedores digitais'

export default function LandingPage() {
  useEffect(() => {
    const previousTitle = document.title
    document.title = TITLE
    return () => {
      document.title = previousTitle
    }
  }, [])

  return (
    <div className="min-h-screen bg-landing-bg">
      <LandingNavbar />
      <main>
        <LandingHero />
        <LandingStartCards />
        <LandingCycle />
        <LandingModules />
        <LandingCta />
      </main>
      <LandingFooter />
    </div>
  )
}
