import { Link, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { ArrowLeft, ArrowRight, Check, CheckCircle2, ChevronLeft, Clock, Lightbulb } from 'lucide-react'
import { PageWrapper } from '@/components/ui/PageWrapper'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ErrorState } from '@/components/ui/ErrorState'
import { useAcademyProgress } from '@/hooks/useAcademyProgress'
import { ACADEMY_LESSONS, ACADEMY_MODULES, checkKey, lessonKey } from '@/data/academy'

function youtubeEmbed(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|v=|embed\/)([\w-]{11})/)
  return match ? `https://www.youtube-nocookie.com/embed/${match[1]}` : null
}

export default function AcademyLessonPage() {
  const { id } = useParams<{ id: string }>()
  const { done, toggle } = useAcademyProgress()
  const index = ACADEMY_LESSONS.findIndex((lesson) => lesson.id === id)
  const lesson = ACADEMY_LESSONS[index]

  if (!lesson) {
    return (
      <PageWrapper>
        <ErrorState title="Lição não encontrada" message="Volte para a Área do aluno e escolha uma lição." />
      </PageWrapper>
    )
  }

  const module = ACADEMY_MODULES.find((item) => item.id === lesson.module)!
  const previous = ACADEMY_LESSONS[index - 1]
  const next = ACADEMY_LESSONS[index + 1]
  const completed = done.has(lessonKey(lesson.id))
  const checksDone = lesson.checklist.filter((_, itemIndex) => done.has(checkKey(lesson.id, itemIndex))).length
  const video = lesson.videoUrl ? youtubeEmbed(lesson.videoUrl) : null

  return (
    <PageWrapper>
      <div className="mx-auto max-w-3xl">
        <Link
          to="/aluno"
          className="mb-5 inline-flex items-center gap-1.5 rounded-full py-1 pr-3 text-[13.5px] font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
        >
          <ChevronLeft className="size-4" />
          Área do aluno
        </Link>

        <div className="flex flex-wrap items-center gap-2 text-[12.5px] text-[var(--text-muted)]">
          <span className="rounded-full px-2.5 py-1 font-semibold" style={{ color: module.color, backgroundColor: `${module.color}1f` }}>
            {module.title}
          </span>
          <span>
            Lição {index + 1} de {ACADEMY_LESSONS.length}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="size-3.5" />
            {lesson.minutes} min de leitura
          </span>
          {completed && (
            <span className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-3.5" />
              Concluída
            </span>
          )}
        </div>
        <h1 className="mt-3 font-display text-[30px] font-bold leading-tight tracking-tight text-[var(--text-primary)] sm:text-[36px]">{lesson.title}</h1>
        <p className="mt-2 text-[16px] text-[var(--text-muted)]">{lesson.summary}</p>

        {video && (
          <div className="mt-6 aspect-video overflow-hidden rounded-2xl border border-[var(--border-default)]">
            <iframe src={video} title={lesson.title} className="size-full" allowFullScreen loading="lazy" />
          </div>
        )}

        <article className="academy-markdown mt-8">
          <ReactMarkdown>{lesson.body}</ReactMarkdown>
        </article>

        {lesson.example && (
          <div className="mt-8 flex gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/[0.07] p-5">
            <Lightbulb className="mt-0.5 size-5 shrink-0 text-amber-500" />
            <div>
              <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-amber-700 dark:text-amber-300">{lesson.example.title}</p>
              <p className="mt-1 text-[14.5px] leading-7 text-[var(--text-secondary)]">{lesson.example.text}</p>
            </div>
          </div>
        )}

        <Card className="mt-8">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-display text-[18px] font-semibold tracking-tight text-[var(--text-primary)]">O que fazer agora</h2>
            <span className="text-[12.5px] tabular-nums text-[var(--text-muted)]">
              {checksDone}/{lesson.checklist.length}
            </span>
          </div>
          <ul className="mt-4 flex flex-col gap-2">
            {lesson.checklist.map((item, itemIndex) => {
              const key = checkKey(lesson.id, itemIndex)
              const checked = done.has(key)
              return (
                <li key={key}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={checked}
                    onClick={() => void toggle(key)}
                    className="flex w-full items-start gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-[var(--bg-muted)]"
                  >
                    <span
                      className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                        checked ? 'border-transparent bg-[linear-gradient(135deg,#8b5cf6,#6d28d9)] text-white' : 'border-[var(--border-strong)]'
                      }`}
                    >
                      {checked && <Check className="size-3.5" strokeWidth={3} />}
                    </span>
                    <span className={`text-[14.5px] ${checked ? 'text-[var(--text-muted)] line-through' : 'text-[var(--text-primary)]'}`}>{item}</span>
                  </button>
                </li>
              )
            })}
          </ul>
          <div className="mt-5 border-t border-[var(--border-subtle)] pt-5">
            <Button
              className="w-full rounded-full sm:w-auto"
              variant={completed ? 'secondary' : 'primary'}
              onClick={() => void toggle(lessonKey(lesson.id))}
            >
              {completed ? <CheckCircle2 className="size-4 text-emerald-500" /> : <Check className="size-4" />}
              {completed ? 'Lição concluída' : 'Marcar lição como concluída'}
            </Button>
          </div>
        </Card>

        <nav className="mt-8 grid gap-3 sm:grid-cols-2" aria-label="Navegação entre lições">
          {previous ? (
            <Link
              to={`/aluno/licao/${previous.id}`}
              className="group flex items-center gap-3 rounded-2xl border border-[var(--border-default)] p-4 transition hover:border-[var(--accent-ring)]"
            >
              <ArrowLeft className="size-4 shrink-0 text-[var(--text-muted)]" />
              <span className="min-w-0">
                <span className="block text-[12px] text-[var(--text-muted)]">Anterior</span>
                <span className="block truncate text-[14px] font-medium text-[var(--text-primary)]">{previous.title}</span>
              </span>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              to={`/aluno/licao/${next.id}`}
              className="group flex items-center justify-end gap-3 rounded-2xl border border-[var(--border-default)] p-4 text-right transition hover:border-[var(--accent-ring)]"
            >
              <span className="min-w-0">
                <span className="block text-[12px] text-[var(--text-muted)]">Próxima</span>
                <span className="block truncate text-[14px] font-medium text-[var(--text-primary)]">{next.title}</span>
              </span>
              <ArrowRight className="size-4 shrink-0 text-[var(--text-muted)]" />
            </Link>
          ) : (
            <Link
              to="/aluno/kit"
              className="flex items-center justify-end gap-3 rounded-2xl border border-[var(--border-default)] p-4 text-right transition hover:border-[var(--accent-ring)]"
            >
              <span>
                <span className="block text-[12px] text-[var(--text-muted)]">Fim do método</span>
                <span className="block text-[14px] font-medium text-[var(--text-primary)]">Abrir o Kit de execução</span>
              </span>
              <ArrowRight className="size-4 text-[var(--text-muted)]" />
            </Link>
          )}
        </nav>
      </div>
    </PageWrapper>
  )
}
