import { CreditCard } from 'lucide-react'
import { SettingsNote, SettingsSection } from '@/components/settings/SettingsSection'
import { useAuthContext } from '@/stores/AuthContext'
import { useBilling } from '@/stores/BillingContext'
import { PLAN_PRICE_LABEL, checkoutUrl, daysLeft, type BillingState } from '@/services/supabase/billing'
import { openExternal } from '@/utils/openExternal'

function formatDate(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : ''
}

const LABELS: Record<BillingState, { label: string; tone: string }> = {
  exempt: { label: 'Acesso liberado', tone: 'bg-emerald-500/12 text-emerald-500' },
  active: { label: 'Assinatura ativa', tone: 'bg-emerald-500/12 text-emerald-500' },
  late: { label: 'Pagamento pendente', tone: 'bg-amber-500/12 text-amber-500' },
  canceled_active: { label: 'Cancelada', tone: 'bg-amber-500/12 text-amber-500' },
  trial: { label: 'Teste grátis', tone: 'bg-[var(--accent-tint)] text-[var(--accent-text)]' },
  expired: { label: 'Sem assinatura', tone: 'bg-red-500/12 text-red-500' },
  signed_out: { label: '—', tone: 'bg-[var(--bg-muted)] text-[var(--text-muted)]' },
}

// Situação da assinatura e onde pagar ou gerenciar.
export function PlanSection() {
  const { user } = useAuthContext()
  const { status } = useBilling()
  if (!status) return null

  const { label, tone } = LABELS[status.state]
  const detail =
    status.state === 'exempt'
      ? 'Sua conta tem acesso completo, sem cobrança.'
      : status.state === 'active'
        ? status.next_charge_at
          ? `Próxima cobrança em ${formatDate(status.next_charge_at)}.`
          : 'Tudo em dia.'
        : status.state === 'late'
          ? 'A última cobrança não passou. Atualize o pagamento para não perder o acesso.'
          : status.state === 'canceled_active'
            ? `Você continua usando até ${formatDate(status.next_charge_at)}.`
            : status.state === 'trial'
              ? `Seu teste termina em ${formatDate(status.trial_ends_at)} (faltam ${daysLeft(status.trial_ends_at)} dias).`
              : 'Assine para continuar usando.'
  const canSubscribe = ['trial', 'late', 'canceled_active', 'expired'].includes(status.state)

  return (
    <SettingsSection id="plano" icon={CreditCard} title="Meu plano" description={`Code Sellers · ${PLAN_PRICE_LABEL} por mês.`}>
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[20px] border border-[var(--border-subtle)] p-4">
        <div>
          <span className={`inline-block rounded-full px-2.5 py-1 text-[12px] font-semibold ${tone}`}>{label}</span>
          <p className="mt-2 text-[13.5px] text-[var(--text-secondary)]">{detail}</p>
        </div>
        {canSubscribe && (
          <button
            type="button"
            onClick={() => openExternal(checkoutUrl(user?.email))}
            className="h-10 rounded-full bg-[linear-gradient(135deg,#8b5cf6,#6d28d9)] px-5 text-[13.5px] font-semibold text-white transition hover:brightness-110"
          >
            {status.state === 'late' ? 'Pagar agora' : 'Assinar agora'}
          </button>
        )}
      </div>
      {status.state !== 'exempt' && (
        <div className="mt-4">
        <SettingsNote>
          Pague com o mesmo e-mail da sua conta ({user?.email}). Para trocar o cartão ou cancelar, use o link do e-mail de
          compra ou fale com o suporte.
        </SettingsNote>
        </div>
      )}
    </SettingsSection>
  )
}
