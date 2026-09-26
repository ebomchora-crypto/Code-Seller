import { useEffect, useState } from 'react'
import { Check, CreditCard } from 'lucide-react'
import { toast } from 'sonner'
import { SettingsSection } from '@/components/settings/SettingsSection'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { getUsageStats, type UsageStats } from '@/services/supabase/usage'
import type { PlanInfo } from '@/types'

// Sem billing real neste MVP.
// TODO: integrar Stripe/Paddle para billing real (checkout, upgrade/downgrade, faturas).
const PLANS: PlanInfo[] = [
  {
    name: 'free',
    label: 'Grátis',
    price: 'R$ 0/mês',
    features: [
      'Até 50 contatos',
      'Até 10 deals ativos',
      '1 GB de armazenamento',
      'CS Copilot limitado (10 mensagens/mês)',
    ],
    limits: { contacts: 50, deals: 10, storage_gb: 1 },
  },
  {
    name: 'pro',
    label: 'Pro',
    price: 'R$ 49/mês',
    features: [
      'Contatos ilimitados',
      'Deals ilimitados',
      '10 GB de armazenamento',
      'CS Copilot ilimitado',
      'Exportação de relatórios',
      'Integrações avançadas',
    ],
    limits: { contacts: 'unlimited', deals: 'unlimited', storage_gb: 10 },
  },
  {
    name: 'agency',
    label: 'Agência',
    price: 'R$ 99/mês',
    features: [
      'Tudo do Pro',
      'Múltiplos usuários (até 5)',
      '50 GB de armazenamento',
      'Suporte prioritário',
      'White-label (em breve)',
    ],
    limits: { contacts: 'unlimited', deals: 'unlimited', storage_gb: 50 },
  },
]

const CURRENT_PLAN: PlanInfo['name'] = 'free'

function UsageBar({ label, used, limit }: { label: string; used: number; limit: number }) {
  const percentage = Math.min(100, (used / limit) * 100)
  return (
    <div>
      <div className="flex justify-between text-[12.5px] text-[var(--text-secondary)]">
        <span>{label}</span>
        <span className="tabular-nums text-[var(--text-muted)]">
          {used} de {limit}
        </span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--bg-muted)]">
        <div
          className={`h-full rounded-full transition-all duration-500 ${percentage >= 90 ? 'bg-red-500' : 'bg-[linear-gradient(90deg,#8b5cf6,#6d28d9)]'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

export function PlanSection() {
  const [usage, setUsage] = useState<UsageStats | null>(null)
  const [loadingUsage, setLoadingUsage] = useState(true)
  const [upgradeModalPlan, setUpgradeModalPlan] = useState<PlanInfo | null>(null)
  const [waitlistEmail, setWaitlistEmail] = useState('')
  const [submittingWaitlist, setSubmittingWaitlist] = useState(false)

  useEffect(() => {
    getUsageStats()
      .then(setUsage)
      .catch(() => setUsage(null))
      .finally(() => setLoadingUsage(false))
  }, [])

  function handleJoinWaitlist() {
    if (!waitlistEmail.trim()) return
    setSubmittingWaitlist(true)
    // Sem backend de waitlist neste MVP — apenas confirma visualmente ao usuário.
    setTimeout(() => {
      toast.success('Você entrou na lista de espera. Avisaremos por e-mail.')
      setSubmittingWaitlist(false)
      setUpgradeModalPlan(null)
      setWaitlistEmail('')
    }, 400)
  }

  const currentPlan = PLANS.find((plan) => plan.name === CURRENT_PLAN)!
  const storageGb = usage ? usage.storage_bytes / 1024 ** 3 : 0

  return (
    <>
      <SettingsSection id="plano" icon={CreditCard} title="Plano e uso" description="Seu plano atual e quanto você já usou dele.">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {PLANS.map((plan) => {
            const isCurrent = plan.name === CURRENT_PLAN
            return (
              <div
                key={plan.name}
                className={`relative flex flex-col overflow-hidden rounded-[20px] border p-5 ${
                  isCurrent ? 'border-[var(--accent-ring)] bg-[var(--accent-tint)]' : 'border-[var(--border-default)]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">{plan.label}</h3>
                  {isCurrent && (
                    <Badge variant="purple" size="sm">
                      Seu plano
                    </Badge>
                  )}
                </div>
                <p className="mt-2 font-display text-[24px] font-bold tracking-tight text-[var(--text-primary)]">
                  {plan.price.replace('/mês', '')}
                  <span className="ml-1 font-sans text-[13px] font-medium text-[var(--text-muted)]">/mês</span>
                </p>

                <ul className="mt-4 flex flex-1 flex-col gap-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-[13px] text-[var(--text-secondary)]">
                      <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {!isCurrent && (
                  <Button
                    variant={plan.name === 'pro' ? 'primary' : 'secondary'}
                    size="sm"
                    className="mt-5 h-10 rounded-full"
                    onClick={() => setUpgradeModalPlan(plan)}
                  >
                    Quero o {plan.label}
                  </Button>
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-6 border-t border-[var(--border-subtle)] pt-6">
          <p className="mb-4 text-[14px] font-semibold text-[var(--text-primary)]">Uso atual</p>
          {loadingUsage ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-3">
              <UsageBar
                label="Contatos"
                used={usage?.contacts ?? 0}
                limit={typeof currentPlan.limits.contacts === 'number' ? currentPlan.limits.contacts : 1}
              />
              <UsageBar
                label="Negócios ativos"
                used={usage?.active_deals ?? 0}
                limit={typeof currentPlan.limits.deals === 'number' ? currentPlan.limits.deals : 1}
              />
              <UsageBar
                label="Armazenamento (GB)"
                used={Math.round(storageGb * 100) / 100}
                limit={currentPlan.limits.storage_gb}
              />
            </div>
          )}
        </div>
      </SettingsSection>

      <Modal
        open={upgradeModalPlan !== null}
        onClose={() => setUpgradeModalPlan(null)}
        title={`Upgrade para ${upgradeModalPlan?.label ?? ''}`}
        size="sm"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-[var(--text-secondary)]">
            O checkout de planos pagos ainda não está disponível. Deixe seu e-mail para ser avisado assim que
            abrirmos.
          </p>
          <Input
            label="Seu e-mail"
            type="email"
            value={waitlistEmail}
            onChange={(event) => setWaitlistEmail(event.target.value)}
          />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setUpgradeModalPlan(null)}>
              Cancelar
            </Button>
            <Button onClick={handleJoinWaitlist} loading={submittingWaitlist}>
              Entrar na lista de espera
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
