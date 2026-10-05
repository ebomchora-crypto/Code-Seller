import { useEffect, useRef, useState } from 'react'
import { Check, CloudOff, Loader2, PencilLine } from 'lucide-react'
import { getAcademyAnswer, saveAcademyAnswer } from '@/services/supabase/academy'

type SaveState = 'loading' | 'loadError' | 'idle' | 'dirty' | 'saving' | 'saved' | 'error'

const SAVE_DELAY_MS = 900

// Exercício escrito da lição: salva sozinho enquanto o aluno digita e mostra
// se ficou salvo — ao voltar, a resposta está lá.
export function LessonExercise({ lessonId, prompt, placeholder }: { lessonId: string; prompt: string; placeholder: string }) {
  const [value, setValue] = useState('')
  const [state, setState] = useState<SaveState>('loading')
  const timer = useRef<number | null>(null)
  const latest = useRef('')
  const saved = useRef('')

  useEffect(() => {
    let alive = true
    setState('loading')
    getAcademyAnswer(lessonId)
      .then((answer) => {
        if (!alive) return
        setValue(answer)
        latest.current = answer
        saved.current = answer
        setState(answer ? 'saved' : 'idle')
      })
      .catch(() => alive && setState('loadError'))
    return () => {
      alive = false
    }
  }, [lessonId])

  async function persist() {
    if (timer.current !== null) window.clearTimeout(timer.current)
    timer.current = null
    const text = latest.current
    if (text === saved.current) return
    setState('saving')
    try {
      await saveAcademyAnswer(lessonId, text)
      saved.current = text
      setState(latest.current === text ? 'saved' : 'dirty')
    } catch {
      setState('error')
    }
  }

  // Sai da lição com algo por salvar: salva antes.
  useEffect(
    () => () => {
      if (latest.current !== saved.current) void saveAcademyAnswer(lessonId, latest.current).catch(() => undefined)
      if (timer.current !== null) window.clearTimeout(timer.current)
    },
    [lessonId],
  )

  function change(next: string) {
    setValue(next)
    latest.current = next
    setState('dirty')
    if (timer.current !== null) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => void persist(), SAVE_DELAY_MS)
  }

  return (
    <div className="mt-8 rounded-2xl border border-[var(--accent-ring)] bg-[var(--accent-tint)] p-5">
      <div className="flex items-start gap-3">
        <PencilLine className="mt-0.5 size-5 shrink-0 text-[var(--accent-text)]" />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--accent-text)]">Exercício</p>
          <p className="mt-1 text-[14.5px] leading-7 text-[var(--text-primary)]">{prompt}</p>
        </div>
      </div>
      <textarea
        value={value}
        onChange={(event) => change(event.target.value.slice(0, 4000))}
        onBlur={() => void persist()}
        disabled={state === 'loading' || state === 'loadError'}
        rows={5}
        placeholder={placeholder}
        aria-label={prompt}
        className="mt-4 w-full resize-y rounded-xl border border-[var(--border-default)] bg-[var(--field-bg)] px-3.5 py-3 text-[14px] leading-6 text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent-ring)] focus:ring-4 focus:ring-[var(--accent-tint)] disabled:opacity-60"
      />
      <p className="mt-2 flex items-center gap-1.5 text-[12px] text-[var(--text-muted)]" aria-live="polite">
        {state === 'loading' && (
          <>
            <Loader2 className="size-3.5 animate-spin" /> Carregando sua resposta…
          </>
        )}
        {state === 'saving' && (
          <>
            <Loader2 className="size-3.5 animate-spin" /> Salvando…
          </>
        )}
        {state === 'saved' && (
          <>
            <Check className="size-3.5 text-emerald-500" /> Salvo
          </>
        )}
        {state === 'dirty' && 'Digitando… salva sozinho'}
        {state === 'loadError' && <span className="text-red-500">Não foi possível carregar sua resposta. Recarregue a página.</span>}
        {state === 'idle' && 'Sua resposta fica salva para você voltar depois.'}
        {state === 'error' && (
          <span className="flex items-center gap-1.5 text-red-500">
            <CloudOff className="size-3.5" /> Não foi possível salvar.
            <button type="button" className="underline" onClick={() => void persist()}>
              Tentar de novo
            </button>
          </span>
        )}
      </p>
    </div>
  )
}
