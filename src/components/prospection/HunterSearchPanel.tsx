import { useState, type FormEvent } from 'react'
import { History, MapPin, Search, Store } from 'lucide-react'
import { Spinner } from '@/components/ui/Spinner'
import { OFFER_OPTIONS } from '@/utils/prospection'
import type { ProspectOffer, ProspectSearchParams, ProspectUsage, RecentProspectSearch } from '@/types'

interface HunterSearchPanelProps {
  initial: ProspectSearchParams | null
  usage: ProspectUsage | null
  usageLoading: boolean
  recent: RecentProspectSearch[]
  searching: boolean
  resultCount: number
  onSearch: (params: ProspectSearchParams) => void
}

// Posições fixas dos alvos no radar — aparecem conforme há resultados.
const TARGETS = [
  'left-[63%] top-[27%]',
  'left-[24%] top-[62%]',
  'left-[70%] top-[64%]',
  'left-[38%] top-[20%]',
  'left-[50%] top-[78%]',
]

const fieldClass =
  'h-12 w-full rounded-2xl border border-white/[0.12] bg-white/[0.06] pl-11 pr-4 text-[14.5px] text-white placeholder:text-white/40 outline-none transition-all duration-200 hover:border-white/20 focus:border-[#a78bfa]/70 focus:bg-white/[0.08] focus:ring-4 focus:ring-[#8b5cf6]/20 disabled:opacity-60'

export function HunterSearchPanel({
  initial,
  usage,
  usageLoading,
  recent,
  searching,
  resultCount,
  onSearch,
}: HunterSearchPanelProps) {
  const [niche, setNiche] = useState(initial?.niche ?? '')
  const [city, setCity] = useState(initial?.city ?? '')
  const [offer, setOffer] = useState<ProspectOffer>(initial?.offer ?? 'site')

  const notConfigured = usage !== null && !usage.configured
  const limitReached = usage !== null && usage.configured && usage.limit > 0 && usage.used >= usage.limit
  const canSearch = niche.trim().length >= 2 && city.trim().length >= 2 && !searching && !notConfigured && !limitReached
  const usagePercent = usage && usage.limit > 0 ? Math.min(100, (usage.used / usage.limit) * 100) : 0

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!canSearch) return
    onSearch({ niche: niche.trim(), city: city.trim(), offer })
  }

  function runRecent(entry: RecentProspectSearch) {
    const nextOffer = entry.offer ?? offer
    setNiche(entry.niche)
    setCity(entry.city)
    setOffer(nextOffer)
    if (!notConfigured && !limitReached && !searching) onSearch({ niche: entry.niche, city: entry.city, offer: nextOffer })
  }

  return (
    <section
      aria-label="Buscar empresas"
      className="relative overflow-hidden rounded-[28px] border border-[#a78bfa]/25 bg-[radial-gradient(120%_140%_at_100%_0%,#3b1d6e_0%,#1a0f2e_42%,#0b0812_100%)] p-6 text-white shadow-[0_30px_80px_-40px_rgba(124,58,237,0.7)] sm:p-8"
    >
      <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-[#8b5cf6]/25 blur-3xl" />

      <div className="relative grid gap-8 lg:grid-cols-[1fr_220px] lg:items-center">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c4b5fd]">
            <span className="size-2 animate-pulse rounded-full bg-[#a78bfa] shadow-[0_0_10px_#a78bfa]" />
            Buyers Hunter
          </span>
          <h2 className="mt-3 max-w-xl font-display text-[26px] font-semibold leading-[1.1] tracking-[-0.03em] sm:text-[30px]">
            Encontre empresas que precisam do que você vende.
          </h2>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
              <label className="relative block">
                <span className="sr-only">Nicho</span>
                <Store className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-white/45" />
                <input
                  value={niche}
                  onChange={(event) => setNiche(event.target.value)}
                  placeholder="Nicho (ex.: clínica odontológica)"
                  maxLength={80}
                  className={fieldClass}
                />
              </label>
              <label className="relative block">
                <span className="sr-only">Cidade</span>
                <MapPin className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-white/45" />
                <input
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  placeholder="Cidade (ex.: Ribeirão Preto, SP)"
                  maxLength={80}
                  className={fieldClass}
                />
              </label>
              <button
                type="submit"
                disabled={!canSearch}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#a78bfa,#7c3aed)] px-6 text-[14.5px] font-semibold text-white shadow-[0_12px_30px_-12px_rgba(167,139,250,0.9),inset_0_1px_0_rgba(255,255,255,0.25)] transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {searching ? <Spinner size="sm" className="text-white" /> : <Search className="size-[18px]" strokeWidth={2.4} />}
                {searching ? 'Buscando…' : 'Buscar empresas'}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-[12.5px] text-white/55">Você vende</span>
              {OFFER_OPTIONS.map((option) => {
                const active = offer === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setOffer(option.value)}
                    className={`h-8 rounded-full border px-3 text-[12.5px] font-medium transition-all duration-200 ${
                      active
                        ? 'border-[#c4b5fd]/60 bg-[#8b5cf6]/30 text-white'
                        : 'border-white/[0.12] text-white/60 hover:border-white/25 hover:text-white'
                    }`}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </form>

          {notConfigured && (
            <p className="mt-5 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-[13px] leading-5 text-white/70">
              A busca do Buyers Hunter está sendo ativada. Assim que for liberada, é só pesquisar por aqui.
            </p>
          )}
          {limitReached && (
            <p className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-300/[0.08] px-4 py-3 text-[13px] leading-5 text-amber-100">
              Você usou as {usage?.limit} buscas deste mês. O limite renova no dia 1º.
            </p>
          )}

          {recent.length > 0 && (
            <div className="mt-5 flex items-center gap-2 overflow-x-auto scrollbar-none">
              <History className="size-4 shrink-0 text-white/40" aria-hidden />
              <span className="sr-only">Buscas recentes</span>
              {recent.map((entry) => (
                <button
                  key={`${entry.niche}-${entry.city}`}
                  type="button"
                  onClick={() => runRecent(entry)}
                  className="h-7 shrink-0 rounded-full bg-white/[0.06] px-3 text-[12px] text-white/65 transition-colors hover:bg-white/[0.12] hover:text-white"
                >
                  {entry.niche} · {entry.city}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="hidden flex-col items-center gap-4 lg:flex">
          <div aria-hidden className="bh-radar w-[180px]" data-scanning={searching}>
            <span className="bh-radar-sweep" />
            {TARGETS.slice(0, searching ? 2 : Math.min(TARGETS.length, Math.ceil(resultCount / 4))).map((position) => (
              <span key={position} className={`bh-radar-target ${position}`} />
            ))}
          </div>
          {usage?.configured && usage.limit > 0 && (
            <div className="w-full">
              <div className="flex items-baseline justify-between text-[12px] text-white/55">
                <span>Buscas no mês</span>
                <span className="tabular-nums text-white/80">
                  {usage.used} de {usage.limit}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#a78bfa,#7c3aed)] transition-[width] duration-500"
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
            </div>
          )}
          {usageLoading && <div className="h-8 w-full animate-pulse rounded-lg bg-white/[0.06]" />}
        </div>
      </div>

      {usage?.configured && usage.limit > 0 && (
        <p className="relative mt-5 text-[12px] tabular-nums text-white/50 lg:hidden">
          {usage.used} de {usage.limit} buscas usadas este mês
        </p>
      )}
    </section>
  )
}
