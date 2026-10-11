import { useEffect, useState } from 'react'
import type { SystemStatus } from '../types/support.ts'

// Status dos sistemas de verdade: cada serviço é consultado agora, do navegador de quem está olhando.
// Respondeu rápido = operacional; respondeu devagar = lento; erro do servidor ou sem resposta = instável.
const URL_BASE = import.meta.env?.VITE_SUPABASE_URL as string | undefined
const KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY as string | undefined
const SLOW_MS = 2500
const TIMEOUT_MS = 8000

type Level = SystemStatus['status']

export function levelFor(result: { ok: boolean; ms: number }): Level {
  if (!result.ok) return 'outage'
  return result.ms > SLOW_MS ? 'degraded' : 'operational'
}

export function overallLevel(list: { status: Level }[]): Level {
  if (list.some((item) => item.status === 'outage')) return 'outage'
  return list.some((item) => item.status === 'degraded') ? 'degraded' : 'operational'
}

async function probe(path: string, init: RequestInit = {}): Promise<Level> {
  const started = performance.now()
  try {
    const response = await fetch(`${URL_BASE}${path}`, { ...init, headers: { apikey: KEY ?? '', ...(init.headers ?? {}) }, signal: AbortSignal.timeout(TIMEOUT_MS) })
    // Qualquer resposta abaixo de 500 prova que o serviço está de pé (404 e 401 também).
    return levelFor({ ok: response.status < 500, ms: performance.now() - started })
  } catch {
    return 'outage'
  }
}

export async function checkSystemHealth(): Promise<SystemStatus[]> {
  if (!URL_BASE) return []
  const [database, auth, storage, copilot] = await Promise.all([
    probe('/rest/v1/', { headers: { Authorization: `Bearer ${KEY ?? ''}` } }),
    probe('/auth/v1/health'),
    probe('/storage/v1/object/public/site-assets/_status'),
    probe('/functions/v1/ai-chat', { method: 'OPTIONS' }),
  ])
  return [
    { service: 'Aplicação Web', status: 'operational' },
    { service: 'Banco de Dados', status: database },
    { service: 'Autenticação', status: auth },
    { service: 'Storage (Arquivos)', status: storage },
    { service: 'CS Copilot (IA)', status: copilot },
  ]
}

/** `null` enquanto verifica; depois a lista real. Atualiza a cada 2 minutos com a tela aberta. */
export function useSystemStatus(): SystemStatus[] | null {
  const [list, setList] = useState<SystemStatus[] | null>(null)
  useEffect(() => {
    let cancelled = false
    const run = () => void checkSystemHealth().then((value) => !cancelled && setList(value))
    run()
    const timer = window.setInterval(run, 120_000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [])
  return list
}
