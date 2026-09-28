import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { SilkRibbons } from '@/components/auth/SilkRibbons'
import { getPublicLeadForm, submitLeadForm, type PublicLeadForm } from '@/services/supabase/leadForm'
import { NICHE_SUGGESTIONS } from '@/types'

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

// (11) 98888-7777 enquanto digita.
function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

const inputClass =
  'h-12 w-full rounded-2xl border border-white/12 bg-white/[0.06] px-4 text-[15px] text-white outline-none transition placeholder:text-white/35 focus:border-[#a78bfa] focus:bg-white/[0.09] focus:ring-4 focus:ring-[#8b5cf6]/20'

function Field({ label, optional, children }: { label: string; optional?: boolean; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium text-white/75">
        {label}
        {optional && <span className="font-normal text-white/40"> (opcional)</span>}
      </span>
      {children}
    </label>
  )
}

// Formulário de captação público: /f/:apelido. Com ?embed=1 fica sem fundo
// decorado, para colocar dentro de um site.
export default function PublicLeadFormPage() {
  const { slug = '' } = useParams()
  const [searchParams] = useSearchParams()
  const embed = searchParams.get('embed') === '1'
  const [form, setForm] = useState<PublicLeadForm | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading')
  const [values, setValues] = useState({ name: '', phone: '', email: '', niche: '', city: '', message: '', website: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getPublicLeadForm(slug)
      .then((data) => {
        if (cancelled) return
        setForm(data)
        setStatus(data ? 'ready' : 'missing')
        if (data) document.title = `${data.title} · ${data.owner_name}`
      })
      .catch(() => !cancelled && setStatus('error'))
    return () => {
      cancelled = true
      document.title = 'Code Sellers'
    }
  }, [slug])

  function update(key: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!form) return
    // Campo escondido preenchido = robô. Finge que deu certo.
    if (values.website) {
      setSent(true)
      return
    }
    if (!values.name.trim()) return setError('Diga seu nome.')
    if (values.phone.replace(/\D/g, '').length < 10) return setError('Informe um WhatsApp com DDD.')
    setError(null)
    setSending(true)
    try {
      await submitLeadForm(form.slug, values)
      setSent(true)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível enviar.')
    } finally {
      setSending(false)
    }
  }

  const shell = (children: ReactNode) => (
    <div className={`relative min-h-screen overflow-hidden text-white [color-scheme:dark] ${embed ? 'bg-[#0d0918]' : 'bg-[#07050d]'}`}>
      {!embed && (
        <>
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[380px] overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(180deg,#2a1452_0%,#170b30_55%,#07050d_100%)]" />
            <div
              className="absolute inset-0 opacity-60"
              style={{ maskImage: 'linear-gradient(180deg, #000 30%, transparent)', WebkitMaskImage: 'linear-gradient(180deg, #000 30%, transparent)' }}
            >
              <SilkRibbons className="h-full w-full animate-silk-drift" />
            </div>
          </div>
          <div aria-hidden className="pointer-events-none absolute left-1/2 top-[260px] size-[520px] -translate-x-1/2 rounded-full bg-[#7c3aed]/20 blur-[140px]" />
        </>
      )}
      <div className={`relative mx-auto flex w-full max-w-[520px] flex-col px-4 ${embed ? 'py-6' : 'min-h-screen justify-center py-12'}`}>{children}</div>
    </div>
  )

  if (status === 'loading') {
    return shell(<Loader2 className="mx-auto size-6 animate-spin text-white/60" />)
  }

  if (status !== 'ready' || !form) {
    return shell(
      <div className="text-center">
        <p className="font-display text-[24px] font-semibold">
          {status === 'error' ? 'Não foi possível abrir o formulário' : 'Formulário não encontrado'}
        </p>
        <p className="mt-2 text-[14px] text-white/55">Confira o link ou tente de novo em instantes.</p>
      </div>,
    )
  }

  return shell(
    <div className="rounded-[28px] border border-white/10 bg-[#120c22]/85 p-6 shadow-[0_40px_120px_-40px_rgba(124,58,237,0.6)] backdrop-blur-xl sm:p-8">
      <div className="flex items-center gap-3">
        {form.owner_avatar ? (
          <img src={form.owner_avatar} alt="" className="size-12 rounded-full object-cover ring-2 ring-white/10" />
        ) : (
          <span className="flex size-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,#8b5cf6,#5b21b6)] font-display text-[16px] font-bold ring-2 ring-white/10">
            {initials(form.owner_name)}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-[14.5px] font-semibold">{form.owner_name}</p>
          {form.owner_company && <p className="truncate text-[12.5px] text-white/50">{form.owner_company}</p>}
        </div>
      </div>

      {sent ? (
        <div className="py-10 text-center">
          <CheckCircle2 className="mx-auto size-12 text-emerald-400" />
          <h1 className="mt-4 font-display text-[26px] font-bold tracking-tight">Recebido!</h1>
          <p className="mx-auto mt-2 max-w-sm text-[14.5px] leading-relaxed text-white/65">
            {form.owner_name.split(' ')[0]} vai falar com você em breve pelo WhatsApp.
          </p>
        </div>
      ) : (
        <>
          <h1 className="mt-6 font-display text-[28px] font-bold leading-tight tracking-tight sm:text-[32px]">{form.title}</h1>
          {form.subtitle && <p className="mt-2 text-[14.5px] leading-relaxed text-white/60">{form.subtitle}</p>}

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4" noValidate>
            <Field label="Seu nome ou da sua empresa">
              <input
                className={inputClass}
                autoComplete="name"
                value={values.name}
                maxLength={120}
                onChange={(event) => update('name', event.target.value)}
              />
            </Field>
            <Field label="WhatsApp">
              <input
                className={inputClass}
                inputMode="tel"
                autoComplete="tel"
                placeholder="(11) 99999-9999"
                value={values.phone}
                onChange={(event) => update('phone', formatPhone(event.target.value))}
              />
            </Field>
            {form.ask_email && (
              <Field label="E-mail" optional>
                <input
                  className={inputClass}
                  type="email"
                  autoComplete="email"
                  value={values.email}
                  maxLength={160}
                  onChange={(event) => update('email', event.target.value)}
                />
              </Field>
            )}
            {form.ask_niche && (
              <Field label="Qual é o seu ramo?" optional>
                <input
                  className={inputClass}
                  list="lead-form-niches"
                  placeholder="Ex.: barbearia, clínica, oficina"
                  value={values.niche}
                  maxLength={80}
                  onChange={(event) => update('niche', event.target.value)}
                />
                <datalist id="lead-form-niches">
                  {NICHE_SUGGESTIONS.map((niche) => (
                    <option key={niche} value={niche} />
                  ))}
                </datalist>
              </Field>
            )}
            {form.ask_city && (
              <Field label="Cidade" optional>
                <input
                  className={inputClass}
                  autoComplete="address-level2"
                  value={values.city}
                  maxLength={80}
                  onChange={(event) => update('city', event.target.value)}
                />
              </Field>
            )}
            {form.ask_message && (
              <Field label="Como posso ajudar?" optional>
                <textarea
                  rows={3}
                  maxLength={1000}
                  value={values.message}
                  onChange={(event) => update('message', event.target.value)}
                  className={`${inputClass} h-auto resize-none py-3 leading-relaxed`}
                />
              </Field>
            )}

            {/* Armadilha para robôs: invisível para pessoas. */}
            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              value={values.website}
              onChange={(event) => update('website', event.target.value)}
              className="absolute left-[-9999px] h-0 w-0 opacity-0"
              name="website"
            />

            {error && (
              <p role="alert" className="rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-2.5 text-[13.5px] text-red-200">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={sending}
              className="mt-1 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#8b5cf6,#6d28d9)] text-[15px] font-semibold text-white shadow-[0_12px_32px_-12px_rgba(124,58,237,0.9)] transition hover:brightness-110 disabled:opacity-60"
            >
              {sending && <Loader2 className="size-4 animate-spin" />}
              Quero conversar
            </button>
            <p className="text-center text-[12px] text-white/40">Seus dados vão só para {form.owner_name.split(' ')[0]}. Nada de spam.</p>
          </form>
        </>
      )}
    </div>,
  )
}
