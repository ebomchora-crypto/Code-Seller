import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { toast } from 'sonner'
import { Card } from '@/components/ui/Card'
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
      'AutoPilot limitado (10 mensagens/mês)',
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
      'AutoPilot ilimitado',
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
      <div className="flex justify-between text-xs text-neutral-500">
        <span>{label}</span>
        <span>
          {used} de {limit}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
        <div
          className={`h-full rounded-full transition-all duration-500 ${percentage >= 90 ? 'bg-red-500' : 'bg-purple-500'}`}
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
    <section id="plano" className="scroll-mt-6">
      <Card>
        <span className="label-caps">Conta</span>
        <h2 className="mt-1 text-2xl font-medium tracking-tightest text-neutral-900">Plano e assinatura</h2>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {PLANS.map((plan) => {
            const isCurrent = plan.name === CURRENT_PLAN
            return (
              <div
                key={plan.name}
                className={`flex flex-col rounded-xl border p-5 ${isCurrent ? 'border-purple-400 bg-purple-50/40' : 'border-neutral-200'}`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-medium text-neutral-900">{plan.label}</h3>
                  {isCurrent && <Badge variant="purple">Plano atual</Badge>}
                </div>
                <p className="mt-1 text-xl font-medium text-neutral-900">{plan.price}</p>

                <ul className="mt-4 flex flex-1 flex-col gap-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-neutral-600">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {!isCurrent && (
                  <Button variant="secondary" size="sm" className="mt-4" onClick={() => setUpgradeModalPlan(plan)}>
                    Fazer upgrade
                  </Button>
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-8 border-t border-neutral-100 pt-6">
          <p className="mb-3 text-sm font-medium text-neutral-800">Uso atual</p>
          {loadingUsage ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <UsageBar
                label="Contatos utilizados"
                used={usage?.contacts ?? 0}
                limit={typeof currentPlan.limits.contacts === 'number' ? currentPlan.limits.contacts : 1}
              />
              <UsageBar
                label="Deals ativos"
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
      </Card>

      <Modal
        open={upgradeModalPlan !== null}
        onClose={() => setUpgradeModalPlan(null)}
        title={`Upgrade para ${upgradeModalPlan?.label ?? ''}`}
        size="sm"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-neutral-600">
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
    </section>
  )
}
