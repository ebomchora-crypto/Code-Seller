import type { SystemStatus } from '@/types'

// Em produção isso viria de uma API externa (ex: statuspage.io)
// Por ora é estático — atualize manualmente quando houver incidente
export const SYSTEM_STATUS: SystemStatus[] = [
  { service: 'Aplicação Web', status: 'operational' },
  { service: 'Banco de Dados', status: 'operational' },
  { service: 'Autenticação', status: 'operational' },
  { service: 'Storage (Arquivos)', status: 'operational' },
  { service: 'AutoPilot (IA)', status: 'operational' },
]

// TODO: integrar com Statuspage, BetterUptime ou similar em produção
export const OVERALL_STATUS: 'operational' | 'degraded' | 'outage' = 'operational'
