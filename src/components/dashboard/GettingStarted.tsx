import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check, Rocket, X } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { useAuthContext } from '@/stores/AuthContext'
import { getOnboardingCounts, type OnboardingCounts } from '@/services/supabase/onboarding'

const DISMISS_KEY = 'code-sellers-onboarding-dismissed'

interface Step {
  key: string
  title: string
  description: string
  to: string
  cta: string
  done: boolean
}

function readLocalDismiss(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1'
  } catch {
    return false
  }
}

// Primeiros passos de uma conta nova. Cada item se marca sozinho a partir dos
// dados reais; some quando tudo estiver feito ou quando a pessoa dispensar.
export function GettingStarted({ refreshKey = 0 }: { refreshKey?: number }) {
  const { profile, updateProfile } = useAuthContext()
  const [counts, setCounts] = useState<OnboardingCounts | null>(null)
  const [dismissedLocally, setDismissedLocally] = useState(readLocalDismiss)

  useEffect(() => {
    getOnboardingCounts()
      .then(setCounts)
      .catch(() => setCounts(null))
  }, [refreshKey])

  if (!profile || !counts || profile.onboarding_dismissed_at || dismissedLocally) return null

  const steps: Step[] = [
    {
      key: 'profile',
      title: 'Complete seu perfil',
      description: 'Nome, telefone e empresa aparecem nas propostas e mensagens.',
      to: '/settings',
      cta: 'Abrir perfil',
      done: Boolean(profile.full_name && (profile.phone || profile.company_name)),
    },
    {
      key: 'contact',
      title: 'Cadastre seu primeiro contato',
      description: 'Quem você já conhece e pode comprar de você.',
      to: '/crm?novo=1',
      cta: 'Novo contato',
      done: counts.contacts > 0,
    },
    {
      key: 'deal',
      title: 'Crie seu primeiro negócio',
      description: 'Uma proposta em andamento, com valor e etapa.',
      to: '/deals?novo=1',
      cta: 'Novo negócio',
      done: counts.deals > 0,
    },
    {
      key: 'hunter',
      title: 'Busque empresas no Buyers Hunter',
      description: 'Encontre quem precisa do que você vende na sua cidade.',
      to: '/prospection',
      cta: 'Buscar',
      done: counts.hunter > 0,
    },
    {
      key: 'goal',
      title: 'Defina sua meta do mês',
      description: 'O Início mostra quanto falta por dia para chegar lá.',
      to: '#meta-do-mes',
      cta: 'Definir',
      done: Boolean(profile.monthly_goal),
    },
    {
      key: 'push',
      title: 'Ative as notificações',
      description: 'Lembretes de tarefas e o resumo do dia no celular.',
      to: '/settings#notificações',
      cta: 'Ativar',
      done: counts.devices > 0,
    },
    {
      key: 'copilot',
      title: 'Converse com o CS Copilot',
      description: 'Peça uma abordagem, uma proposta ou um plano da semana.',
      to: '/copilot',
      cta: 'Abrir',
      done: counts.conversations > 0,
    },
  ]

  const doneCount = steps.filter((step) => step.done).length
  if (doneCount === steps.length) return null
  const percent = (doneCount / steps.length) * 100

  function dismiss() {
    setDismissedLocally(true)
    try {
      localStorage.setItem(DISMISS_KEY, '1')
    } catch {
      // Sem armazenamento: vale só nesta visita (o banco guarda abaixo).
    }
    void updateProfile({ onboarding_dismissed_at: new Date().toISOString() })
  }

  function scrollToGoal(event: React.MouseEvent) {
    event.preventDefault()
    document.getElementById('meta-do-mes')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-tint)] text-[var(--accent-text)]">
            <Rocket className="size-[18px]" />
          </span>
          <div>
            <h2 className="font-display text-[17px] font-semibold tracking-tight text-[var(--text-primary)]">Primeiros passos</h2>
            <p className="mt-0.5 text-[13px] text-[var(--text-muted)]">
              {doneCount} de {steps.length} concluídos · deixe o Code Sellers pronto para vender
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dispensar primeiros passos"
          title="Dispensar"
          className="flex size-8 shrink-0 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[var(--bg-muted)]">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,#a78bfa,#6d28d9)] transition-[width] duration-700"
          style={{ width: `${percent}%` }}
        />
      </div>

      <ol className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {steps.map((step) => (
          <li
            key={step.key}
            className={`flex items-start gap-3 rounded-2xl border p-3.5 transition-colors ${
              step.done ? 'border-[var(--border-subtle)] opacity-60' : 'border-[var(--border-default)] hover:border-[var(--accent-ring)]'
            }`}
          >
            <span
              className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full ${
                step.done ? 'bg-emerald-500 text-white' : 'border border-[var(--border-strong)]'
              }`}
            >
              {step.done && <Check className="size-3" strokeWidth={3} />}
            </span>
            <div className="min-w-0 flex-1">
              <p className={`text-[13.5px] font-medium text-[var(--text-primary)] ${step.done ? 'line-through' : ''}`}>{step.title}</p>
              <p className="mt-0.5 text-[12px] leading-snug text-[var(--text-muted)]">{step.description}</p>
              {!step.done && (
                <Link
                  to={step.to}
                  onClick={step.to.startsWith('#') ? scrollToGoal : undefined}
                  className="mt-2 inline-flex items-center gap-1 text-[12.5px] font-medium text-[var(--accent-text)] hover:underline"
                >
                  {step.cta}
                  <ArrowRight className="size-3.5" />
                </Link>
              )}
            </div>
          </li>
        ))}
      </ol>
    </Card>
  )
}
