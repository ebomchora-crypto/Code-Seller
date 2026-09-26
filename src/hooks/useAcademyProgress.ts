import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { getAcademyProgress, setAcademyItem } from '@/services/supabase/academy'
import { ACADEMY_LESSONS, lessonKey } from '@/data/academy'

export function useAcademyProgress() {
  const [done, setDone] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAcademyProgress()
      .then(setDone)
      .catch(() => setDone(new Set()))
      .finally(() => setLoading(false))
  }, [])

  const toggle = useCallback(async (itemId: string, value?: boolean) => {
    let next = false
    setDone((current) => {
      const copy = new Set(current)
      next = value ?? !copy.has(itemId)
      if (next) copy.add(itemId)
      else copy.delete(itemId)
      return copy
    })
    try {
      await setAcademyItem(itemId, next)
    } catch {
      toast.error('Não foi possível salvar seu progresso.')
      setDone((current) => {
        const copy = new Set(current)
        if (next) copy.delete(itemId)
        else copy.add(itemId)
        return copy
      })
    }
  }, [])

  const completedLessons = useMemo(() => ACADEMY_LESSONS.filter((lesson) => done.has(lessonKey(lesson.id))).length, [done])
  const nextLesson = useMemo(() => ACADEMY_LESSONS.find((lesson) => !done.has(lessonKey(lesson.id))) ?? null, [done])

  return { done, loading, toggle, completedLessons, totalLessons: ACADEMY_LESSONS.length, nextLesson }
}
