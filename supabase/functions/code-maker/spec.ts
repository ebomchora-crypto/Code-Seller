export type RequirementScope = 'frontend' | 'backend' | 'visual' | 'business'
export interface CodeMakerRequirement {
  id: string
  text: string
  scope: RequirementScope
  validation: string
  status: 'pending' | 'limited'
}
export interface CodeMakerSpecification {
  objective: string
  requirements: CodeMakerRequirement[]
  constraints: string[]
  forbiddenChanges: string[]
  relevantFiles: string[]
  dependencies: string[]
  validation: string[]
  limitations: string[]
}
export interface RecentEditContext { instruction: string; actions: string[] }

const strings = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && Boolean(item.trim())).map(item => item.trim()) : []
const unique = (values: string[]) => [...new Set(values)]

export function splitPromptByBoundary(text: string, maxChars: number): string[] {
  if (!Number.isInteger(maxChars) || maxChars < 2) throw new Error('Invalid context budget')
  const chunks: string[] = []
  let start = 0
  while (start < text.length) {
    let end = Math.min(text.length, start + maxChars)
    if (end < text.length) {
      const boundary = text.lastIndexOf('\n', end - 1)
      if (boundary >= start + Math.floor(maxChars / 2)) end = boundary + 1
      if (/[\uD800-\uDBFF]/.test(text[end - 1]) && /[\uDC00-\uDFFF]/.test(text[end])) end--
    }
    chunks.push(text.slice(start, end))
    start = end
  }
  return chunks
}

export function normalizeSpecification(raw: unknown, originalPrompt: string): CodeMakerSpecification {
  const input = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {}
  const requirements: CodeMakerRequirement[] = []
  const seen = new Set<string>()
  const limitations = strings(input.limitations)
  for (const value of Array.isArray(input.requirements) ? input.requirements : []) {
    const item = typeof value === 'string' ? {text:value} : value as Record<string, unknown>
    if (!item || typeof item.text !== 'string' || !item.text.trim()) continue
    const text = item.text.trim()
    const scope: RequirementScope = ['backend','visual','business'].includes(String(item.scope)) ? item.scope as RequirementScope : 'frontend'
    const key = JSON.stringify([text,scope,item.validation ?? ''])
    if (seen.has(key)) continue
    seen.add(key)
    const limited = scope === 'backend'
    if (limited) limitations.push(`${text}: exige um backend que o publicador de sites estáticos não executa.`)
    requirements.push({
      id:`req-${String(requirements.length+1).padStart(3,'0')}`,
      text, scope, validation:typeof item.validation === 'string' ? item.validation : text,
      status: limited ? 'limited' : 'pending',
    })
  }
  const prohibitions = originalPrompt.split('\n').filter(line => /n[aã]o\s+(?:alterar|mudar|remover|reescrever)|do not (?:change|remove|rewrite)/i.test(line))
  return {
    objective: typeof input.objective === 'string' ? input.objective : '',
    requirements,
    constraints: unique(strings(input.constraints)),
    forbiddenChanges: unique([...strings(input.forbiddenChanges), ...prohibitions]),
    relevantFiles: unique(strings(input.relevantFiles)),
    dependencies: unique(strings(input.dependencies)),
    validation: unique(strings(input.validation)),
    limitations: unique(limitations),
  }
}

export function validateRequirementCoverage(
  spec: CodeMakerSpecification,
  plan: {globalRequirementIds?: string[]; sections: {requirementIds?: string[]}[]},
) {
  const covered = new Set([...(plan.globalRequirementIds ?? []), ...plan.sections.flatMap(section=>section.requirementIds ?? [])])
  const missing = spec.requirements.filter(requirement=>requirement.status !== 'limited' && !covered.has(requirement.id)).map(requirement=>requirement.id)
  return {valid: missing.length === 0, missing}
}

export async function prepareSpecificationContext(
  details: string,
  complete: (chunk: string) => Promise<unknown>,
  maxChars = 12000,
): Promise<CodeMakerSpecification> {
  const specs: CodeMakerSpecification[] = []
  for (const chunk of splitPromptByBoundary(details, maxChars)) {
    const raw = await complete(chunk)
    if (!raw || typeof raw !== 'object' || !Array.isArray((raw as Record<string,unknown>).requirements)) {
      throw new Error('A leitura dos requisitos ficou incompleta. Tente novamente.')
    }
    const spec = normalizeSpecification(raw,chunk)
    specs.push(spec)
  }
  const merged = {
    objective: specs.map(spec=>spec.objective).join('\n'),
    requirements: specs.flatMap(spec=>spec.requirements),
    constraints: specs.flatMap(spec=>spec.constraints),
    forbiddenChanges: specs.flatMap(spec=>spec.forbiddenChanges),
    relevantFiles: specs.flatMap(spec=>spec.relevantFiles),
    dependencies: specs.flatMap(spec=>spec.dependencies),
    validation: specs.flatMap(spec=>spec.validation),
    limitations: specs.flatMap(spec=>spec.limitations),
  }
  const specification = normalizeSpecification(merged,details)
  if (!specification.objective || !specification.requirements.length) throw new Error('A leitura dos requisitos ficou incompleta. Tente novamente.')
  return specification
}

export const SPEC_SYSTEM = `Leia a especificação completa recebida, preservando todas as funcionalidades, regras, arquivos, dependências e critérios de conclusão. Responda apenas JSON:
{"objective":"objetivo","requirements":[{"text":"requisito completo","scope":"frontend|backend|visual|business","validation":"como conferir"}],"constraints":[],"forbiddenChanges":[],"relevantFiles":[],"dependencies":[],"validation":[],"limitations":[]}
Cada requisito funcional ou visual distinto deve ter um item. Não omita os últimos itens. Regras de processo (não alterar áreas externas, preservar o projeto, não truncar o pedido, seguir todos os itens) ficam em constraints ou forbiddenChanges, não viram requisitos de conteúdo HTML. Preserve literalmente instruções de NÃO ALTERAR. Não crie novos requisitos a partir de contexto repetido ou lembretes de seguir a especificação. HTML estático suporta links, menu, FAQ e contato externo; banco, autenticação própria, persistência remota, execução de servidor e testes de backend exigem backend e devem ter scope backend. Não transforme uma interface decorativa em implementação de backend. Imagens e logos anexados pelo usuário já estão hospedados: colocá-los, trocá-los ou mostrá-los no site é scope frontend. Não inclua raciocínio privado.`
