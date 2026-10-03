import { Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { LandingFadeIn } from '@/components/landing/LandingFadeIn'
import { LandingKicker } from '@/components/landing/LandingKicker'
import { PLAN_PRICE_LABEL, checkoutUrl } from '@/services/supabase/billing'

const TRIAL = [
  '7 dias para usar tudo, sem cartão',
  '1 busca de empresas por dia no Buyers Hunter',
  '5 mensagens por dia no CS Copilot',
  '2 sites por dia no Code Maker',
  'CRM, negócios, propostas e financeiro',
]

const PRO = [
  '50 buscas de empresas por mês no Buyers Hunter',
  '50 mensagens por dia no CS Copilot',
  '10 sites por dia no Code Maker',
  'CRM, negócios, propostas online e financeiro',
  'Área do aluno com o método completo',
  'App para Windows com avisos de tarefas',
]

// Preço: teste grátis de 7 dias e o plano mensal. Os números são os mesmos
// limites aplicados no servidor (usage_for no banco).
export function LandingPricing() {
  const navigate = useNavigate()

  return (
    <section id="precos" className="relative scroll-mt-24 overflow-hidden bg-landing-bg px-5 pt-20 text-white lg:px-8 lg:pt-28">
      <LandingFadeIn className="relative mx-auto w-full max-w-[1100px]">
        <div className="text-center">
          <LandingKicker tone="dark" align="center">
            Preço
          </LandingKicker>
          <h2 className="mx-auto max-w-2xl font-display text-[32px] font-semibold leading-[1.08] tracking-[-0.03em] sm:text-[44px]">
            Comece grátis. Assine quando vender.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-7 text-white/60">
            Cancele quando quiser.
          </p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          <div className="flex flex-col rounded-[28px] border border-white/10 bg-white/[0.03] p-7 sm:p-9">
            <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-white/55">Teste grátis</p>
            <p className="mt-3 flex items-baseline gap-2">
              <span className="font-display text-[44px] font-semibold tracking-tight">R$ 0</span>
              <span className="text-[14px] text-white/50">por 7 dias</span>
            </p>
            <ul className="mt-7 flex flex-1 flex-col gap-3">
              {TRIAL.map((item) => (
                <li key={item} className="flex gap-3 text-[14.5px] leading-snug text-white/75">
                  <Check className="mt-0.5 size-4 shrink-0 text-white/50" strokeWidth={2.4} />
                  {item}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="mt-9 inline-flex h-[52px] items-center justify-center rounded-full border border-white/20 px-7 text-[15px] font-semibold text-white transition-colors hover:border-white/40 hover:bg-white/[0.04]"
            >
              Começar grátis
            </button>
          </div>

          <div className="relative flex flex-col overflow-hidden rounded-[28px] border border-[#a78bfa]/35 bg-[radial-gradient(130%_150%_at_15%_0%,#3b1d6e_0%,#1a0f2e_50%,#0b0812_100%)] p-7 shadow-[0_40px_100px_-40px_rgba(124,58,237,0.65)] sm:p-9">
            <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 size-[300px] rounded-full bg-[#8b5cf6]/25 blur-[90px]" />
            <div className="relative flex items-center justify-between gap-3">
              <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[#c4b5fd]">Code Sellers</p>
              <span className="rounded-full bg-[#a78bfa]/20 px-3 py-1 text-[11.5px] font-semibold text-[#ddd6fe]">Plano completo</span>
            </div>
            <p className="relative mt-3 flex items-baseline gap-2">
              <span className="font-display text-[44px] font-semibold tracking-tight">{PLAN_PRICE_LABEL}</span>
              <span className="text-[14px] text-white/55">por mês</span>
            </p>
            <ul className="relative mt-7 flex flex-1 flex-col gap-3">
              {PRO.map((item) => (
                <li key={item} className="flex gap-3 text-[14.5px] leading-snug text-white/85">
                  <Check className="mt-0.5 size-4 shrink-0 text-emerald-400" strokeWidth={2.4} />
                  {item}
                </li>
              ))}
            </ul>
            <a
              href={checkoutUrl(null)}
              target="_blank"
              rel="noopener noreferrer"
              className="relative mt-9 inline-flex h-[52px] items-center justify-center rounded-full bg-[linear-gradient(135deg,#a78bfa,#7c3aed)] px-7 text-[15px] font-semibold text-white shadow-[0_16px_40px_-14px_rgba(167,139,250,0.9),inset_0_1px_0_rgba(255,255,255,0.25)] transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
            >
              Assinar agora
            </a>
            <p className="relative mt-3 text-center text-[12.5px] leading-5 text-white/50">
              Use o mesmo e-mail na compra e na conta.
            </p>
          </div>
        </div>
      </LandingFadeIn>
    </section>
  )
}
