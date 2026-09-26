import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, Check, Clock, FileText, MessageSquareText, Sparkles } from 'lucide-react'
import { PageHeader, PageWrapper } from '@/components/ui/PageWrapper'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAcademyProgress } from '@/hooks/useAcademyProgress'
import { ACADEMY_LESSONS, ACADEMY_MODULES, KIT_PROMPTS, KIT_PROPOSALS, KIT_SCRIPTS, lessonKey } from '@/data/academy'

const KIT_CARDS = [
  { tab: 'prompts', title: 'Prompts', description: 'Para criar sites e sistemas com IA', count: KIT_PROMPTS.length, icon: Sparkles },
  { tab: 'scripts', title: 'Scripts de mensagem', description: 'Abordagem, follow-up, proposta e cobrança', count: KIT_SCRIPTS.length, icon: MessageSquareText },
  { tab: 'propostas', title: 'Modelos de proposta', description: 'Site, landing page e sistema', count: KIT_PROPOSALS.length, icon: FileText },
]

// Área do aluno: o método em lições curtas (Criar, Encontrar, Vender) e o Kit.
export default function AcademyPage() {
  const { done, loading, completedLessons, totalLessons, nextLesson } = useAcademyProgress()
  const percent = (completedLessons / totalLessons) * 100

  return (
    <PageWrapper>
      <PageHeader
        title="Área do aluno"
        subtitle="O método Code Sellers em lições curtas, e o Kit com prompts, scripts e propostas prontos para usar."
      />

      <section className="relative mt-8 overflow-hidden rounded-[28px] border border-[#a78bfa]/25 bg-[radial-gradient(120%_140%_at_100%_0%,#3b1d6e_0%,#1a0f2e_42%,#0b0812_100%)] p-6 text-white sm:p-8">
        <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-[#8b5cf6]/25 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c4b5fd]">Seu progresso</p>
            {loading ? (
              <div className="mt-3 h-9 w-64 animate-pulse rounded-lg bg-white/10" />
            ) : (
              <h2 className="mt-2 font-display text-[26px] font-semibold leading-tight tracking-tight sm:text-[30px]">
                {completedLessons === totalLessons
                  ? 'Você concluiu todas as lições!'
                  : completedLessons === 0
                    ? 'Comece pela primeira lição.'
                    : `${completedLessons} de ${totalLessons} lições concluídas.`}
              </h2>
            )}
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-[linear-gradient(90deg,#c4b5fd,#7c3aed)] transition-[width] duration-700" style={{ width: `${percent}%` }} />
            </div>
          </div>
          {nextLesson && (
            <Link
              to={`/aluno/licao/${nextLesson.id}`}
              className="group flex items-center gap-4 rounded-2xl border border-white/15 bg-white/[0.07] p-4 backdrop-blur transition hover:bg-white/[0.12] lg:w-[360px]"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#fff] text-[#120c24]">
                <BookOpen className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[12px] text-white/60">{completedLessons === 0 ? 'Primeira lição' : 'Continuar'}</span>
                <span className="block truncate text-[15px] font-semibold">{nextLesson.title}</span>
              </span>
              <ArrowRight className="size-5 shrink-0 text-white/70 transition group-hover:translate-x-0.5" />
            </Link>
          )}
        </div>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {ACADEMY_MODULES.map((module, moduleIndex) => {
          const lessons = ACADEMY_LESSONS.filter((lesson) => lesson.module === module.id)
          const moduleDone = lessons.filter((lesson) => done.has(lessonKey(lesson.id))).length
          return (
            <Card key={module.id} className="flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: module.color }}>
                    Módulo 0{moduleIndex + 1}
                  </p>
                  <h3 className="mt-1 font-display text-[22px] font-semibold tracking-tight text-[var(--text-primary)]">{module.title}</h3>
                  <p className="text-[13px] text-[var(--text-muted)]">{module.subtitle}</p>
                </div>
                <span className="rounded-full bg-[var(--bg-muted)] px-2.5 py-1 text-[12px] font-semibold tabular-nums text-[var(--text-secondary)]">
                  {moduleDone}/{lessons.length}
                </span>
              </div>
              <ol className="mt-5 flex flex-col gap-1">
                {lessons.map((lesson) => {
                  const completed = done.has(lessonKey(lesson.id))
                  return (
                    <li key={lesson.id}>
                      <Link
                        to={`/aluno/licao/${lesson.id}`}
                        className="group flex items-center gap-3 rounded-xl px-2.5 py-2.5 transition-colors hover:bg-[var(--bg-muted)]"
                      >
                        {loading ? (
                          <Skeleton className="size-6 rounded-full" />
                        ) : (
                          <span
                            className={`flex size-6 shrink-0 items-center justify-center rounded-full border ${
                              completed ? 'border-transparent bg-emerald-500 text-white' : 'border-[var(--border-strong)]'
                            }`}
                          >
                            {completed && <Check className="size-3.5" strokeWidth={3} />}
                          </span>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className={`block text-[14px] font-medium leading-snug ${completed ? 'text-[var(--text-muted)]' : 'text-[var(--text-primary)]'}`}>
                            {lesson.title}
                          </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-1 text-[11.5px] text-[var(--text-muted)]">
                          <Clock className="size-3" />
                          {lesson.minutes} min
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ol>
            </Card>
          )
        })}
      </div>

      <div className="mt-8">
        <h2 className="font-display text-[20px] font-semibold tracking-tight text-[var(--text-primary)]">Kit de execução</h2>
        <p className="text-[13.5px] text-[var(--text-muted)]">Copie, adapte e use no mesmo dia.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {KIT_CARDS.map((card) => (
            <Link key={card.tab} to={`/aluno/kit?aba=${card.tab}`} className="group">
              <Card className="h-full transition-colors group-hover:border-[var(--accent-ring)]">
                <div className="flex items-center justify-between">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-[var(--accent-tint)] text-[var(--accent-text)]">
                    <card.icon className="size-5" />
                  </span>
                  <span className="text-[12.5px] font-semibold tabular-nums text-[var(--text-muted)]">{card.count}</span>
                </div>
                <p className="mt-4 text-[15px] font-semibold text-[var(--text-primary)]">{card.title}</p>
                <p className="mt-0.5 text-[13px] text-[var(--text-muted)]">{card.description}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </PageWrapper>
  )
}
