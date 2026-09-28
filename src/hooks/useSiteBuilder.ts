import { useCallback, useEffect, useRef, useState } from 'react'
import { parseActions, parsePart, partOrder, type SiteParts } from '../../supabase/functions/code-maker/site'
import {
  getSite,
  listSiteVersions,
  streamCodeMaker,
  type Site,
  type SiteVersion,
} from '@/services/supabase/codeMaker'
import { runWithLimit } from '@/utils/codeMakerStream'

export type BuildPhase = 'idle' | 'planning' | 'building' | 'editing'
export type PartStatus = 'queued' | 'writing' | 'done' | 'error'

export interface PartProgress {
  status: PartStatus
  text: string
}

// Quantas partes a IA escreve ao mesmo tempo.
const PARALLEL_PARTS = 4

// Junta várias atualizações de texto num quadro só (os textos chegam em
// pedacinhos, várias vezes por segundo, de até 4 partes ao mesmo tempo).
function useFrameBatch<T>(initial: T): [T, (update: (current: T) => T) => void, (value: T) => void] {
  const [state, setState] = useState(initial)
  const pending = useRef<((current: T) => T)[]>([])
  const frame = useRef<number | null>(null)

  const queue = useCallback((update: (current: T) => T) => {
    pending.current.push(update)
    if (frame.current !== null) return
    frame.current = requestAnimationFrame(() => {
      frame.current = null
      const updates = pending.current
      pending.current = []
      setState((current) => updates.reduce((value, fn) => fn(value), current))
    })
  }, [])

  const reset = useCallback((value: T) => {
    pending.current = []
    if (frame.current !== null) cancelAnimationFrame(frame.current)
    frame.current = null
    setState(value)
  }, [])

  useEffect(
    () => () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current)
    },
    [],
  )

  return [state, queue, reset]
}

export function useSiteBuilder(siteId: string) {
  const [site, setSite] = useState<Site | null>(null)
  const [versions, setVersions] = useState<SiteVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [phase, setPhase] = useState<BuildPhase>('idle')
  const [error, setError] = useState<string | null>(null)
  const [planText, queuePlanText, resetPlanText] = useFrameBatch('')
  const [editText, queueEditText, resetEditText] = useFrameBatch('')
  const [pendingInstruction, setPendingInstruction] = useState<string | null>(null)
  const [progress, queueProgress, resetProgress] = useFrameBatch<Record<string, PartProgress>>({})
  // Partes que já terminaram nesta geração (a prévia mostra antes de recarregar o site).
  const [builtParts, setBuiltParts] = useState<SiteParts>({})
  const abortRef = useRef<AbortController | null>(null)
  const busyRef = useRef(false)

  const refresh = useCallback(async () => {
    const [fresh, history] = await Promise.all([getSite(siteId), listSiteVersions(siteId)])
    setSite(fresh)
    setVersions(history)
    setNotFound(!fresh)
    return fresh
  }, [siteId])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([getSite(siteId), listSiteVersions(siteId)])
      .then(([fresh, history]) => {
        if (cancelled) return
        setSite(fresh)
        setVersions(history)
        setNotFound(!fresh)
      })
      .catch((err: Error) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [siteId])

  useEffect(() => () => abortRef.current?.abort(), [])

  const buildParts = useCallback(
    async (current: Site, signal: AbortSignal): Promise<boolean> => {
      if (!current.plan) return false
      const missing = partOrder(current.plan).filter((id) => !current.parts[id])
      if (missing.length === 0) return true
      setPhase('building')
      resetProgress(Object.fromEntries(missing.map((id) => [id, { status: 'queued', text: '' } as PartProgress])))
      let failed = 0

      await runWithLimit(missing, PARALLEL_PARTS, async (partId) => {
        for (let attempt = 0; attempt < 2; attempt++) {
          if (signal.aborted) return
          queueProgress((state) => ({ ...state, [partId]: { status: 'writing', text: '' } }))
          try {
            const full = await streamCodeMaker(
              { action: 'part', site_id: current.id, part_id: partId },
              (text) => queueProgress((state) => ({ ...state, [partId]: { status: 'writing', text } })),
              signal,
            )
            const { html } = parsePart(full)
            queueProgress((state) => ({ ...state, [partId]: { status: 'done', text: full } }))
            setBuiltParts((parts) => ({ ...parts, [partId]: html }))
            return
          } catch (err) {
            if ((err as Error)?.name === 'AbortError') return
            // Limite do dia ou sessão: não adianta tentar de novo.
            if (/limite|sess[aã]o/i.test((err as Error).message)) {
              setError((err as Error).message)
              break
            }
          }
        }
        failed += 1
        queueProgress((state) => ({ ...state, [partId]: { status: 'error', text: state[partId]?.text ?? '' } }))
      })
      return failed === 0
    },
    [queueProgress, resetProgress],
  )

  // Gera o site do zero ou continua de onde parou (plano pronto, partes faltando).
  const generate = useCallback(async () => {
    if (busyRef.current || !site) return
    busyRef.current = true
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setError(null)
    setBuiltParts({})
    try {
      let current: Site | null = site
      if (!current.plan || current.status === 'planning' || (current.status === 'error' && !current.plan)) {
        setPhase('planning')
        resetPlanText('')
        await streamCodeMaker({ action: 'plan', site_id: current.id }, (text) => queuePlanText(() => text), controller.signal)
        current = await refresh()
      }
      if (current?.plan) {
        const ok = await buildParts(current, controller.signal)
        current = await refresh()
        if (!ok && !controller.signal.aborted) {
          setError((message) => message ?? 'Algumas partes não ficaram prontas. Clique em "Continuar" para terminar.')
        }
      }
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') {
        setError((err as Error).message)
        await refresh().catch(() => undefined)
      }
    } finally {
      busyRef.current = false
      if (!controller.signal.aborted) setPhase('idle')
    }
  }, [buildParts, queuePlanText, refresh, resetPlanText, site])

  const edit = useCallback(
    async (instruction: string) => {
      if (busyRef.current || !site) return false
      busyRef.current = true
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      setError(null)
      setPhase('editing')
      setPendingInstruction(instruction)
      resetEditText('')
      try {
        await streamCodeMaker({ action: 'edit', site_id: site.id, instruction }, (text) => queueEditText(() => text), controller.signal)
        await refresh()
        return true
      } catch (err) {
        if ((err as Error)?.name !== 'AbortError') setError((err as Error).message)
        return false
      } finally {
        busyRef.current = false
        setPendingInstruction(null)
        if (!controller.signal.aborted) setPhase('idle')
      }
    },
    [queueEditText, refresh, resetEditText, site],
  )

  const stop = useCallback(() => {
    abortRef.current?.abort()
    busyRef.current = false
    setPhase('idle')
    void refresh()
  }, [refresh])

  return {
    site,
    setSite,
    versions,
    loading,
    notFound,
    phase,
    error,
    setError,
    planText,
    planActions: parseActions(planText),
    editText,
    editActions: parseActions(editText),
    pendingInstruction,
    progress,
    builtParts,
    generate,
    edit,
    stop,
    refresh,
  }
}
