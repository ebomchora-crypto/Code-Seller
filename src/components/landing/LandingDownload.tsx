import { Download, Laptop, RefreshCw, SquareTerminal, Wifi } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { LandingFadeIn } from '@/components/landing/LandingFadeIn'
import { rememberDownloadIntent, type DownloadKind } from '@/utils/downloadIntent'

const FEATURES = [
  { icon: RefreshCw, label: 'Sempre atualizado' },
  { icon: Wifi, label: 'Mesmos dados da web' },
  { icon: Laptop, label: 'Direto na área de trabalho' },
]

// Seção dedicada pro app de Windows — vive na landing (deslogado) como um
// segundo caminho de entrada além de "Login". Painel de vidro roxo no
// mesmo estilo do card do Buyers Hunter (radial + blur), pra não parecer um
// elemento novo/desconectado do resto da página.
export function LandingDownload() {
  const navigate = useNavigate()
  // Baixar só depois de criar a conta: o download começa ao entrar no sistema.
  const signUpToDownload = (kind: DownloadKind) => {
    rememberDownloadIntent(kind)
    navigate('/register')
  }

  return (
    <section className="relative overflow-hidden bg-landing-bg px-5 py-20 text-white lg:px-8 lg:py-28">
      <LandingFadeIn className="relative mx-auto w-full max-w-[1100px]">
        <div className="relative overflow-hidden rounded-[32px] border border-[#a78bfa]/25 bg-[radial-gradient(130%_150%_at_15%_0%,#3b1d6e_0%,#1a0f2e_45%,#0b0812_100%)] px-6 py-14 shadow-[0_40px_100px_-40px_rgba(124,58,237,0.6)] sm:px-12 sm:py-16 lg:px-16">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-32 -top-32 size-[420px] rounded-full bg-[#8b5cf6]/20 blur-[100px]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-24 -left-24 size-[320px] rounded-full bg-[#5b21b6]/25 blur-[100px]"
          />

          <div className="relative grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c4b5fd]">
                <span className="size-2 rounded-full bg-[#a78bfa] shadow-[0_0_10px_#a78bfa]" />
                Novidade
              </span>
              <h2 className="mt-4 max-w-lg font-display text-[32px] font-semibold leading-[1.08] tracking-[-0.03em] sm:text-[42px]">
                App para Windows.
              </h2>
              <p className="mt-4 max-w-md text-[15px] leading-7 text-white/65">
                O Code Sellers a um clique, com avisos das suas tarefas.
              </p>

              <ul className="mt-7 flex flex-wrap gap-2.5">
                {FEATURES.map(({ icon: Icon, label }) => (
                  <li
                    key={label}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3.5 py-2 text-[12.5px] font-medium text-white/75"
                  >
                    <Icon className="size-[14px] text-[#c4b5fd]" strokeWidth={2.2} />
                    {label}
                  </li>
                ))}
              </ul>

              <div className="mt-9 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => signUpToDownload('setup')}
                  className="inline-flex h-[52px] items-center justify-center gap-2.5 rounded-full bg-[linear-gradient(135deg,#a78bfa,#7c3aed)] px-7 text-[15px] font-semibold text-white shadow-[0_16px_40px_-14px_rgba(167,139,250,0.9),inset_0_1px_0_rgba(255,255,255,0.25)] transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
                >
                  <Download className="size-[18px]" strokeWidth={2.4} />
                  Baixar para Windows
                </button>
                <button
                  type="button"
                  onClick={() => signUpToDownload('portable')}
                  className="inline-flex h-[52px] items-center justify-center rounded-full border border-white/15 px-6 text-[14px] font-medium text-white/70 transition-colors hover:border-white/30 hover:text-white"
                >
                  Versão portátil
                </button>
                <button
                  type="button"
                  onClick={() => signUpToDownload('ide')}
                  className="inline-flex h-[52px] items-center justify-center gap-2 rounded-full border border-white/15 px-6 text-[14px] font-medium text-white/70 transition-colors hover:border-white/30 hover:text-white"
                >
                  <SquareTerminal className="size-[16px]" strokeWidth={2.2} />
                  Baixar a IDE
                </button>
              </div>
              <p className="mt-4 text-[12.5px] text-white/40">Crie sua conta grátis para baixar · Windows 10 ou 11 · A IDE é o editor de código completo, com terminal e Git</p>
            </div>

            <div className="relative hidden lg:block" aria-hidden>
              <div className="relative mx-auto w-full max-w-[360px] rounded-2xl border border-white/10 bg-[#0d0815] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)]">
                <div className="flex items-center gap-1.5 rounded-t-2xl border-b border-white/[0.06] bg-white/[0.03] px-4 py-3">
                  <span className="size-2.5 rounded-full bg-[#ff5f56]" />
                  <span className="size-2.5 rounded-full bg-[#ffbd2e]" />
                  <span className="size-2.5 rounded-full bg-[#27c93f]" />
                </div>
                <div className="flex flex-col items-center gap-3 px-8 py-16">
                  <img src="/logo.png" alt="" className="size-14 rounded-2xl object-contain" />
                  <span className="font-display text-[17px] font-semibold text-white">Code Sellers</span>
                  <div className="mt-2 h-1.5 w-full max-w-[140px] overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-2/3 rounded-full bg-[linear-gradient(90deg,#a78bfa,#7c3aed)]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </LandingFadeIn>
    </section>
  )
}
