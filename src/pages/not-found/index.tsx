import { Link } from 'react-router-dom'
import { ArrowLeft, Compass } from 'lucide-react'

// Endereço que não existe: nunca deixar a tela em branco.
export default function NotFoundPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[var(--bg-primary)] px-6 text-center">
      <div className="max-w-sm">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[var(--accent-tint)] text-[var(--accent-text)]">
          <Compass className="size-6" />
        </div>
        <h1 className="mt-5 font-display text-[24px] font-semibold tracking-tight text-[var(--text-primary)]">Página não encontrada</h1>
        <p className="mt-2 text-[14.5px] text-[var(--text-muted)]">O endereço pode estar errado ou a página não existe mais.</p>
        <Link
          to="/"
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-[linear-gradient(135deg,#8b5cf6,#6d28d9)] px-6 text-sm font-semibold text-white transition hover:brightness-110"
        >
          <ArrowLeft className="size-4" />
          Voltar para o início
        </Link>
      </div>
    </div>
  )
}
