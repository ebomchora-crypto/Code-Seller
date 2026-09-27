import { useEffect, useState } from 'react'
import { CalendarDays, CalendarPlus, Check, Copy, RefreshCw, Smartphone } from 'lucide-react'
import { toast } from 'sonner'
import { SettingsNote, SettingsSection } from '@/components/settings/SettingsSection'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { calendarFeedUrls, getCalendarFeedToken, regenerateCalendarFeedToken } from '@/services/supabase/calendarFeed'

const STEPS = [
  'Clique em "Adicionar ao Google Agenda" e confirme no Google.',
  'Pronto: suas tarefas com prazo aparecem numa agenda "Code Sellers — Tarefas", no computador e no celular.',
  'Tarefa concluída sai da agenda sozinha.',
]

export function CalendarFeedSection() {
  const [token, setToken] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const [copied, setCopied] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [regenerating, setRegenerating] = useState(false)

  useEffect(() => {
    getCalendarFeedToken()
      .then(setToken)
      .catch(() => setFailed(true))
  }, [])

  const urls = token ? calendarFeedUrls(token) : null

  async function handleCopy() {
    if (!urls) return
    try {
      await navigator.clipboard.writeText(urls.https)
      setCopied(true)
      toast.success('Link da agenda copiado.')
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Não foi possível copiar. Selecione o link e copie manualmente.')
    }
  }

  async function handleRegenerate() {
    setRegenerating(true)
    try {
      setToken(await regenerateCalendarFeedToken())
      setConfirmOpen(false)
      toast.success('Novo link gerado. Adicione a agenda de novo no Google.')
    } catch {
      toast.error('Não foi possível gerar um novo link.')
    } finally {
      setRegenerating(false)
    }
  }

  return (
    <SettingsSection
      id="agenda"
      icon={CalendarDays}
      title="Google Agenda"
      description="Suas tarefas com prazo no Google Agenda e no celular. Também funciona no Outlook e no iPhone."
    >
      {failed ? (
        <SettingsNote>Não foi possível carregar o link da sua agenda agora. Recarregue a página para tentar de novo.</SettingsNote>
      ) : !urls ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-11 w-64" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <>
          <ol className="flex flex-col gap-2">
            {STEPS.map((step, index) => (
              <li key={step} className="flex gap-3 text-[13.5px] leading-6 text-[var(--text-secondary)]">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent-tint)] text-[11px] font-semibold text-[var(--accent-text)]">
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <a
              href={urls.google}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#8b5cf6,#6d28d9)] px-5 text-sm font-medium text-white shadow-[0_8px_22px_-10px_rgba(124,58,237,0.9),inset_0_1px_0_rgba(255,255,255,0.18)] transition-all duration-200 hover:brightness-110"
            >
              <CalendarPlus className="size-4" />
              Adicionar ao Google Agenda
            </a>
            <a
              href={urls.webcal}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--bg-muted)] px-4 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-card-hover)]"
            >
              <Smartphone className="size-4" />
              iPhone, Mac ou Outlook
            </a>
          </div>

          <div className="mt-5">
            <p className="mb-2 text-[12.5px] font-medium text-[var(--text-secondary)]">
              Ou adicione pelo link (no Google Agenda: Outras agendas → + → Do URL):
            </p>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={urls.https}
                onFocus={(event) => event.currentTarget.select()}
                aria-label="Link da agenda"
                className="h-10 min-w-0 flex-1 rounded-xl border border-[var(--border-default)] bg-[var(--field-bg)] px-3 font-mono text-[12px] text-[var(--text-secondary)] outline-none focus:border-[var(--accent-ring)]"
              />
              <Button variant="secondary" size="md" className="shrink-0 rounded-xl" onClick={() => void handleCopy()}>
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copied ? 'Copiado' : 'Copiar'}
              </Button>
            </div>
          </div>

          <div className="mt-5">
            <SettingsNote>
              O Google atualiza agendas adicionadas por link algumas vezes por dia: uma tarefa nova pode levar algumas horas
              para aparecer lá. Os avisos na hora certa continuam vindo do Code Sellers, no celular e no app de Windows.
              Quem tiver este link vê suas tarefas; se ele vazar, gere um novo.
            </SettingsNote>
          </div>

          <div className="mt-3">
            <Button variant="ghost" size="sm" className="rounded-full" onClick={() => setConfirmOpen(true)}>
              <RefreshCw className="size-3.5" />
              Gerar novo link
            </Button>
          </div>
        </>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Gerar um novo link?"
        message="O link atual para de funcionar na hora e a agenda some de onde você adicionou. Depois é só adicionar de novo com o link novo."
        confirmLabel="Gerar novo link"
        loading={regenerating}
        onConfirm={() => void handleRegenerate()}
        onCancel={() => setConfirmOpen(false)}
      />
    </SettingsSection>
  )
}
