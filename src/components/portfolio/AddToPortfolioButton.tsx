import { Link } from 'react-router-dom'
import { GalleryHorizontalEnd } from 'lucide-react'
import type { Deal, PortfolioCategory } from '@/types'

function guessCategory(service: string | null): PortfolioCategory {
  const value = (service ?? '').toLowerCase()
  if (value.includes('landing')) return 'landing'
  if (value.includes('loja') || value.includes('e-commerce') || value.includes('ecommerce')) return 'loja'
  if (value.includes('automa')) return 'automacao'
  if (value.includes('sistema') || value.includes('app')) return 'sistema'
  return 'site'
}

// Negócio ganho → abre o Sellers Portfolio com o projeto já preenchido.
export function AddToPortfolioButton({ deal, className }: { deal: Deal; className?: string }) {
  const params = new URLSearchParams({
    novo: '1',
    titulo: deal.service ? `${deal.service}` : deal.title,
    cliente: deal.contact?.name ?? '',
    tipo: guessCategory(deal.service),
    negocio: deal.id,
  })
  return (
    <Link to={`/portfolio?${params.toString()}`} className={className}>
      <GalleryHorizontalEnd className="size-4 text-[var(--accent-text)]" />
      Adicionar ao portfólio
    </Link>
  )
}
