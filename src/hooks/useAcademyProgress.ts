import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { getAcademyProgress, setAcademyItems } from '@/services/supabase/academy'
import { ACADEMY_LESSONS, lessonKey } from '@/data/academy'

export function useAcademyProgress() {
  const [done, setDone] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  // Estado atual fora do ciclo de render: o valor novo precisa ser decidido
  // na hora do clique, não dentro do setState (que o React executa depois).
  const doneRef = useRef(done)

  const apply = useCallback((next: Set<string>) => {
    doneRef.current = next
    setDone(next)
  }, [])

  useEffect(() => {
    getAcademyProgress()
      .then(apply)
      .catch(() => toast.error('Não foi possível carregar seu progresso.'))
      .finally(() => setLoading(false))
  }, [apply])

  // Marca/desmarca vários itens de uma vez (otimista, desfaz se falhar).
  const setItems = useCallback(
    async (itemIds: string[], value: boolean) => {
      const previous = doneRef.current
      const next = new Set(previous)
      for (const id of itemIds) {
        if (value) next.add(id)
        else next.delete(id)
      }
      apply(next)
      try {
        await setAcademyItems(itemIds, value)
        return true
      } catch {
        toast.error('Não foi possível salvar seu progresso. Tente novamente.')
        apply(previous)
        return false
      }
    },
    [apply],
  )

  const toggle = useCallback((itemId: string) => setItems([itemId], !doneRef.current.has(itemId)), [setItems])

  const completedLessons = useMemo(() => ACADEMY_LESSONS.filter((lesson) => done.has(lessonKey(lesson.id))).length, [done])
  const nextLesson = useMemo(() => ACADEMY_LESSONS.find((lesson) => !done.has(lessonKey(lesson.id))) ?? null, [done])

  return { done, loading, toggle, setItems, completedLessons, totalLessons: ACADEMY_LESSONS.length, nextLesson }
}
