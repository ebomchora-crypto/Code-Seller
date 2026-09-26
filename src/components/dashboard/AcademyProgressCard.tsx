import { Link } from 'react-router-dom'
import { ArrowRight, GraduationCap } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { useAcademyProgress } from '@/hooks/useAcademyProgress'
import { ACADEMY_MODULES } from '@/data/academy'

// Progresso na Área do aluno. Some quando todas as lições estão concluídas.
export function AcademyProgressCard() {
  const { loading, completedLessons, totalLessons, nextLesson } = useAcademyProgress()

  if (loading || !nextLesson) return null

  const module = ACADEMY_MODULES.find((item) => item.id === nextLesson.module)
  const percent = (completedLessons / totalLessons) * 100

  return (
    <Card className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-tint)] text-[var(--accent-text)]">
        <GraduationCap className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-[13px] font-medium text-[var(--text-muted)]">
            {completedLessons === 0 ? 'Área do aluno' : 'Continue de onde parou'}
          </p>
          <span className="text-[12.5px] font-semibold tabular-nums text-[var(--text-secondary)]">
            {completedLessons}/{totalLessons} lições
          </span>
        </div>
        <p className="mt-0.5 truncate text-[15.5px] font-semibold text-[var(--text-primary)]">
          {module ? `${module.title}: ` : ''}
          {nextLesson.title}
        </p>
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-[var(--bg-muted)]">
          <div className="h-full rounded-full bg-[linear-gradient(90deg,#a78bfa,#7c3aed)]" style={{ width: `${percent}%` }} />
        </div>
      </div>
      <Link
        to={`/aluno/licao/${nextLesson.id}`}
        className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#8b5cf6,#6d28d9)] px-5 text-sm font-semibold text-white transition hover:brightness-110"
      >
        {completedLessons === 0 ? 'Começar' : 'Continuar'}
        <ArrowRight className="size-4" />
      </Link>
    </Card>
  )
}
