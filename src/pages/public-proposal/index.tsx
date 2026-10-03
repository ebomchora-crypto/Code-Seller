import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { CalendarClock, Check, CheckCircle2, CircleSlash, Loader2, MessageCircle, ShieldCheck, Star } from 'lucide-react'
import { getPublicProposal, registerProposalView, respondToProposal } from '@/services/supabase/onlineProposals'
import { whatsappUrl } from '@/utils/contactLinks'
import { formatCurrency } from '@/utils/deals'
import { RESPONSE_ERROR_MESSAGES } from '@/utils/onlineProposal'
import type { PublicProposal } from '@/types'

type LoadState = { kind: 'loading' } | { kind: 'missing' } | { kind: 'ready'; proposal: PublicProposal }

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

function formatDay(value: string): string {
  return new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-[#f6f4fb] font-sans text-[#171325]" style={{ colorScheme: 'light' }}>
      <div className="mx-auto w-full max-w-3xl px-4 pb-16 pt-6 sm:px-6 sm:pt-10">{children}</div>
    </div>
  )
}

function Notice({ icon, title, text, action }: { icon: React.ReactNode; title: string; text: string; action?: React.ReactNode }) {
  return (
    <div className="mt-10 rounded-[28px] border border-[#e7e3f1] bg-[#fff] p-8 text-center shadow-[0_30px_80px_-50px_rgba(76,29,149,0.45)] sm:p-12">
      <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#f3efff] text-[#6d28d9]">{icon}</div>
      <h1 className="mt-5 font-display text-[24px] font-semibold tracking-tight">{title}</h1>
      <p className="mx-auto mt-2 max-w-md text-[15px] leading-7 text-[#5b5670]">{text}</p>
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  )
}

function WhatsappButton({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex h-11 items-center gap-2 rounded-full border border-[#e2ddef] bg-[#fff] px-5 text-[14px] font-semibold text-[#171325] transition hover:border-[#c9bff0] hover:bg-[#faf8ff]"
    >
      <MessageCircle className="size-4 text-emerald-600" />
      {label}
    </a>
  )
}

// Página pública da proposta: o cliente lê, escolhe uma opção e aprova (sem login).
export default function PublicProposalPage() {
  const { token = '' } = useParams<{ token: string }>()
  const [params] = useSearchParams()
  const preview = params.get('preview') === '1'
  const [state, setState] = useState<LoadState>({ kind: 'loading' })
  const [selected, setSelected] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [note, setNote] = useState('')
  const [declining, setDeclining] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<'approved' | 'declined' | null>(null)

  useEffect(() => {
    let active = true
    getPublicProposal(token)
      .then((data) => {
        if (!active) return
        if (!data || data.status === 'cancelled' || !('title' in data)) {
          setState({ kind: 'missing' })
          return
        }
        setState({ kind: 'ready', proposal: data })
        const recommended = data.options.find((option) => option.recommended) ?? (data.options.length === 1 ? data.options[0] : null)
        setSelected(data.chosen_option_id ?? recommended?.id ?? null)
        document.title = `${data.title} · Proposta`
        if (!preview) void registerProposalView(token)
      })
      .catch(() => active && setState({ kind: 'missing' }))
    return () => {
      active = false
    }
  }, [token, preview])

  const proposal = state.kind === 'ready' ? state.proposal : null
  const chosen = useMemo(() => proposal?.options.find((option) => option.id === selected) ?? null, [proposal, selected])
  const sellerName = proposal?.seller.name || proposal?.seller.company || 'Quem enviou a proposta'
  const sellerWhatsapp = whatsappUrl(proposal?.seller.whatsapp)
  const questionHref = sellerWhatsapp
    ? `${sellerWhatsapp}?text=${encodeURIComponent(`Oi! Estou vendo a proposta "${proposal?.title ?? ''}" e fiquei com uma dúvida.`)}`
    : null

  async function submit(event: FormEvent, approve: boolean) {
    event.preventDefault()
    if (!proposal || preview) return
    setError(null)
    if (approve && !chosen) {
      setError(RESPONSE_ERROR_MESSAGES.invalid_option)
      return
    }
    if (approve && name.trim().length < 2) {
      setError(RESPONSE_ERROR_MESSAGES.name_required)
      return
    }
    setSubmitting(true)
    try {
      const response = await respondToProposal({ token, approve, optionId: approve ? (chosen?.id ?? null) : null, name, note })
      if ('error' in response) setError(RESPONSE_ERROR_MESSAGES[response.error])
      else setResult(response.status)
    } catch {
      setError('Não foi possível enviar agora. Verifique sua conexão e tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  if (state.kind === 'loading') {
    return (
      <Shell>
        <div className="flex min-h-[60dvh] items-center justify-center">
          <Loader2 className="size-7 animate-spin text-[#7c3aed]" />
        </div>
      </Shell>
    )
  }

  if (state.kind === 'missing' || !proposal) {
    return (
      <Shell>
        <Notice
          icon={<CircleSlash className="size-6" />}
          title="Proposta indisponível"
          text="Este link não existe mais ou foi cancelado por quem enviou. Se precisar, peça um novo link."
        />
      </Shell>
    )
  }

  const answered = result ?? (proposal.status === 'approved' || proposal.status === 'declined' ? proposal.status : null)

  if (answered === 'approved') {
    const approvedOption = proposal.options.find((option) => option.id === (result ? selected : proposal.chosen_option_id))
    return (
      <Shell>
        <Notice
          icon={<CheckCircle2 className="size-6" />}
          title="Proposta aprovada!"
          text={`${approvedOption ? `Você escolheu ${approvedOption.name}${approvedOption.price ? ` (${formatCurrency(approvedOption.price, proposal.currency)})` : ''}. ` : ''}${sellerName} já recebeu sua confirmação e vai entrar em contato para os próximos passos.`}
          action={questionHref && <WhatsappButton href={questionHref} label={`Falar com ${sellerName.split(' ')[0]}`} />}
        />
      </Shell>
    )
  }

  if (answered === 'declined') {
    return (
      <Shell>
        <Notice
          icon={<Check className="size-6" />}
          title="Resposta enviada"
          text={`Obrigado por avisar. ${sellerName} recebeu sua resposta.`}
          action={questionHref && <WhatsappButton href={questionHref} label="Enviar uma mensagem" />}
        />
      </Shell>
    )
  }

  const closed = proposal.expired
  const gridCols = proposal.options.length === 1 ? '' : proposal.options.length === 2 ? 'sm:grid-cols-2' : 'md:grid-cols-3'

  return (
    <Shell>
      {preview && (
        <div className="mb-5 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-[13.5px] text-amber-900">
          <strong>Pré-visualização.</strong> É assim que o cliente vê a proposta. Aqui a aprovação fica desativada e a visita não é contada.
        </div>
      )}

      <header className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          {proposal.seller.logo_url || proposal.seller.avatar_url ? (
            <img
              src={proposal.seller.logo_url ?? proposal.seller.avatar_url ?? ''}
              alt=""
              className="size-11 shrink-0 rounded-2xl border border-[#e7e3f1] bg-[#fff] object-cover"
            />
          ) : (
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#8b5cf6,#6d28d9)] text-[14px] font-semibold text-white">
              {initials(sellerName)}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold">{sellerName}</p>
            {proposal.seller.company && proposal.seller.name && <p className="truncate text-[13px] text-[#6b6680]">{proposal.seller.company}</p>}
          </div>
        </div>
        {proposal.seller.portfolio_slug && (
          <a href={`/p/${proposal.seller.portfolio_slug}`} target="_blank" rel="noreferrer" className="shrink-0 text-[13px] font-medium text-[#6d28d9] hover:underline">
            Ver portfólio
          </a>
        )}
      </header>

      <section className="mt-6 overflow-hidden rounded-[28px] border border-[#e7e3f1] bg-[#fff] shadow-[0_30px_80px_-50px_rgba(76,29,149,0.45)]">
        <div className="relative overflow-hidden bg-[radial-gradient(120%_140%_at_100%_0%,#3b1d6e_0%,#1a0f2e_45%,#0e0a18_100%)] px-6 py-8 text-white sm:px-10 sm:py-10">
          <div aria-hidden className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-[#8b5cf6]/30 blur-3xl" />
          <p className="relative text-[11.5px] font-semibold uppercase tracking-[0.18em] text-[#c4b5fd]">
            Proposta{proposal.client_name ? ` para ${proposal.client_name}` : ''}
          </p>
          <h1 className="relative mt-2 font-display text-[28px] font-semibold leading-tight tracking-tight sm:text-[36px]">{proposal.title}</h1>
          {proposal.valid_until && (
            <p className={`relative mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12.5px] ${closed ? 'bg-rose-500/20 text-rose-100' : 'bg-white/10 text-white/80'}`}>
              <CalendarClock className="size-3.5" />
              {closed ? `Prazo encerrado em ${formatDay(proposal.valid_until)}` : `Válida até ${formatDay(proposal.valid_until)}`}
            </p>
          )}
        </div>

        {proposal.body && (
          <div className="public-proposal-markdown px-6 py-8 sm:px-10">
            <ReactMarkdown>{proposal.body}</ReactMarkdown>
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="font-display text-[20px] font-semibold tracking-tight">{proposal.options.length > 1 ? 'Escolha uma opção' : 'Investimento'}</h2>
        <div role="radiogroup" aria-label="Opções da proposta" className={`mt-4 grid gap-3 ${gridCols}`}>
          {proposal.options.map((option) => {
            const active = option.id === selected
            const lines = option.description.split('\n').map((line) => line.replace(/^[-•*]\s*/, '').trim()).filter(Boolean)
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={closed}
                onClick={() => setSelected(option.id)}
                className={`relative flex flex-col rounded-3xl border-2 bg-[#fff] p-5 text-left transition disabled:cursor-not-allowed ${
                  active ? 'border-[#7c3aed] shadow-[0_18px_40px_-24px_rgba(124,58,237,0.7)]' : 'border-[#ebe7f4] hover:border-[#cfc4f3]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[15.5px] font-semibold">{option.name}</span>
                  <span
                    className={`flex size-5 shrink-0 items-center justify-center rounded-full border-2 ${active ? 'border-[#7c3aed] bg-[#7c3aed] text-white' : 'border-[#d6d0e6]'}`}
                  >
                    {active && <Check className="size-3" strokeWidth={3.5} />}
                  </span>
                </div>
                {option.recommended && (
                  <span className="mt-2 inline-flex w-fit items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11.5px] font-semibold text-amber-800">
                    <Star className="size-3 fill-current" />
                    Recomendada
                  </span>
                )}
                <p className="mt-3 font-display text-[26px] font-semibold tracking-tight">{option.price ? formatCurrency(option.price, proposal.currency) : 'A combinar'}</p>
                {lines.length > 0 && (
                  <ul className="mt-3 flex flex-col gap-1.5">
                    {lines.map((line, index) => (
                      <li key={index} className="flex gap-2 text-[13.5px] leading-6 text-[#4a4560]">
                        <Check className="mt-1 size-3.5 shrink-0 text-[#7c3aed]" />
                        {line}
                      </li>
                    ))}
                  </ul>
                )}
              </button>
            )
          })}
        </div>
        {proposal.payment_terms && (
          <p className="mt-4 text-[14px] text-[#5b5670]">
            <span className="font-semibold text-[#171325]">Pagamento:</span> {proposal.payment_terms}
          </p>
        )}
      </section>

      {closed ? (
        <Notice
          icon={<CalendarClock className="size-6" />}
          title="O prazo desta proposta terminou"
          text={`Fale com ${sellerName} para receber uma proposta atualizada.`}
          action={questionHref && <WhatsappButton href={questionHref} label="Pedir nova proposta" />}
        />
      ) : declining ? (
        <form onSubmit={(event) => void submit(event, false)} className="mt-8 rounded-3xl border border-[#e7e3f1] bg-[#fff] p-6 sm:p-8">
          <h2 className="font-display text-[19px] font-semibold tracking-tight">Não é o momento?</h2>
          <p className="mt-1 text-[14px] text-[#5b5670]">Se puder, conte o motivo. Isso ajuda {sellerName} a entender o que você precisa.</p>
          <div className="mt-5 grid gap-3">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={120}
              placeholder="Seu nome (opcional)"
              className="h-12 rounded-2xl border border-[#e2ddef] bg-[#fff] px-4 text-[#171325] placeholder:text-[#9a95ad] text-[15px] outline-none transition focus:border-[#8b5cf6] focus:ring-4 focus:ring-[#8b5cf6]/15"
            />
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={1000}
              rows={3}
              placeholder="Motivo (opcional)"
              className="rounded-2xl border border-[#e2ddef] bg-[#fff] px-4 py-3 text-[#171325] placeholder:text-[#9a95ad] text-[15px] outline-none transition focus:border-[#8b5cf6] focus:ring-4 focus:ring-[#8b5cf6]/15"
            />
          </div>
          {error && <p className="mt-3 text-[13.5px] font-medium text-rose-600">{error}</p>}
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setDeclining(false)} className="h-11 rounded-full px-5 text-[14px] font-medium text-[#5b5670] hover:bg-[#f3f0fa]">
              Voltar
            </button>
            <button
              type="submit"
              disabled={submitting || preview}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#171325] px-6 text-[14px] font-semibold text-white transition hover:bg-[#2a2440] disabled:opacity-50"
            >
              {submitting && <Loader2 className="size-4 animate-spin" />}
              Enviar resposta
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={(event) => void submit(event, true)} className="mt-8 rounded-3xl border border-[#e7e3f1] bg-[#fff] p-6 shadow-[0_30px_80px_-60px_rgba(76,29,149,0.5)] sm:p-8">
          <h2 className="font-display text-[19px] font-semibold tracking-tight">Aprovar a proposta</h2>
          <p className="mt-1 text-[14px] text-[#5b5670]">
            {chosen ? (
              <>
                Opção escolhida: <strong className="text-[#171325]">{chosen.name}</strong>
                {chosen.price ? ` · ${formatCurrency(chosen.price, proposal.currency)}` : ''}
              </>
            ) : (
              'Escolha uma das opções acima.'
            )}
          </p>
          <div className="mt-5 grid gap-3">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={120}
              autoComplete="name"
              placeholder="Seu nome completo"
              aria-label="Seu nome completo"
              className="h-12 rounded-2xl border border-[#e2ddef] bg-[#fff] px-4 text-[#171325] placeholder:text-[#9a95ad] text-[15px] outline-none transition focus:border-[#8b5cf6] focus:ring-4 focus:ring-[#8b5cf6]/15"
            />
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={1000}
              rows={2}
              placeholder="Observação (opcional)"
              aria-label="Observação"
              className="rounded-2xl border border-[#e2ddef] bg-[#fff] px-4 py-3 text-[#171325] placeholder:text-[#9a95ad] text-[15px] outline-none transition focus:border-[#8b5cf6] focus:ring-4 focus:ring-[#8b5cf6]/15"
            />
          </div>
          {error && <p className="mt-3 text-[13.5px] font-medium text-rose-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting || !chosen || preview}
            className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#8b5cf6,#6d28d9)] px-6 text-[15px] font-semibold text-white shadow-[0_18px_40px_-18px_rgba(124,58,237,0.9)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
            {chosen ? `Aprovar ${chosen.name}` : 'Aprovar proposta'}
          </button>
          <p className="mt-3 flex items-start gap-2 text-[12.5px] leading-5 text-[#6b6680]">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#7c3aed]" />
            Ao aprovar, {sellerName} recebe sua confirmação e entra em contato para os próximos passos, como contrato e pagamento. Nenhum valor é cobrado aqui.
          </p>
          <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-[#f0edf7] pt-5 sm:flex-row">
            {questionHref ? <WhatsappButton href={questionHref} label="Tenho uma dúvida" /> : <span />}
            <button type="button" onClick={() => setDeclining(true)} className="text-[13.5px] font-medium text-[#6b6680] underline-offset-4 hover:text-[#171325] hover:underline">
              Não tenho interesse agora
            </button>
          </div>
        </form>
      )}

      <p className="mt-10 text-center text-[12px] text-[#9a95ad]">Proposta enviada pelo Code Sellers</p>
    </Shell>
  )
}
