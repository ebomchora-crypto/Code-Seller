import { useEffect } from 'react'
import { LandingNavbar } from '@/components/landing/LandingNavbar'
import { LandingHero } from '@/components/landing/LandingHero'
import { LandingFeatures } from '@/components/landing/LandingFeatures'
import { LandingHowItWorks } from '@/components/landing/LandingHowItWorks'
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
    <div className="min-h-screen bg-paper">
      <LandingNavbar />
      <main>
        <LandingHero />
        <LandingFeatures />
        <LandingHowItWorks />
        <LandingCta />
      </main>
      <LandingFooter />
    </div>
  )
}
