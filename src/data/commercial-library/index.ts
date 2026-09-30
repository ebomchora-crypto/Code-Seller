import { OBJECTIONS } from './objections.ts'
import { SCRIPTS, FOLLOWUPS, COPIES, PROMPTS, UNIVERSAL } from './materials.ts'
import type { CommercialCategory, CommercialMaterial, CommercialStage } from './types.ts'

export type { CommercialCategory, CommercialMaterial, CommercialStage } from './types.ts'

export const COMMERCIAL_MATERIALS: CommercialMaterial[] = [...SCRIPTS, ...OBJECTIONS, ...FOLLOWUPS, ...COPIES, ...PROMPTS, ...UNIVERSAL]
const byId = new Map(COMMERCIAL_MATERIALS.map((item) => [item.id, item]))

export function getCommercialMaterial(id: string | null | undefined): CommercialMaterial | undefined {
  return id ? byId.get(id) : undefined
}

export function commercialFavoriteKey(id: string): string {
  return `favorite:commercial:${id}`
}

function normalize(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR')
}

export function searchCommercialMaterials(query = '', category: CommercialCategory | 'all' = 'all', stage: CommercialStage | 'all' = 'all'): CommercialMaterial[] {
  const terms = normalize(query.trim()).split(/\s+/).filter(Boolean)
  const matches = COMMERCIAL_MATERIALS.filter((item) => {
    if (category !== 'all' && item.category !== category) return false
    if (stage !== 'all' && item.stage !== stage && !item.tags.some((tag) => normalize(tag) === stage)) return false
    const haystack = normalize([item.title, item.strategy, item.body, ...item.tags, item.meaning, item.avoid, item.goal, item.short, item.consultative, item.next].filter(Boolean).join(' '))
    return terms.every((term) => haystack.includes(term))
  })
  if (terms.length === 0) return matches
  return matches.sort((a, b) => {
    const score = (item: CommercialMaterial) => {
      const title = normalize(item.title)
      const tags = normalize(item.tags.join(' '))
      return terms.reduce((total, term) => total + (title.includes(term) ? 4 : 0) + (tags.includes(term) ? 2 : 0), 0)
    }
    return score(b) - score(a)
  })
}

export function commercialMaterialPrompt(item: CommercialMaterial): string {
  return `Use a tecnica selecionada da Biblioteca Comercial como referencia, adaptando-a ao contexto real da conversa${item.category === 'prompts' ? ' e execute o prompt quando houver informacoes suficientes' : ' e escreva uma mensagem pronta para o cliente quando couber'}.

Material: ${item.title}
Intencao estrategica: ${item.strategy}
${item.meaning ? `Possivel significado: ${item.meaning}\n` : ''}${item.avoid ? `Evitar: ${item.avoid}\n` : ''}${item.goal ? `Objetivo: ${item.goal}\n` : ''}Referencia: ${item.body}
${item.short ? `Versao curta: ${item.short}\n` : ''}${item.consultative ? `Versao consultiva: ${item.consultative}\n` : ''}${item.next ? `Proxima acao: ${item.next}\n` : ''}
Nao copie cegamente. Nao invente preco em R$, fatos, interesse, urgencia ou escassez. Se faltar um dado decisivo, pergunte ou mantenha o placeholder. Sugira reuniao apenas se ajudar; se o lead nao quiser, siga por mensagem. Se insistir no preco e houver valor confirmado, responda diretamente. Nao envie nada ao cliente automaticamente.`
}
