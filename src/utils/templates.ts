import type { TemplateCategory, TemplateContext } from '@/types'

export const TEMPLATE_CATEGORY_LABELS: Record<TemplateCategory, string> = {
  abordagem: 'Primeira abordagem',
  follow_up: 'Follow-up',
  proposta: 'Proposta',
  cobranca: 'Cobrança',
  outro: 'Outro',
}

export const TEMPLATE_VARIABLES: { key: string; description: string }[] = [
  { key: 'nome', description: 'Nome do contato ou da empresa' },
  { key: 'cidade', description: 'Cidade do contato' },
  { key: 'nicho', description: 'Nicho do contato' },
  { key: 'negocio', description: 'Título do negócio' },
  { key: 'valor', description: 'Valor do negócio' },
  { key: 'meu_nome', description: 'Seu primeiro nome' },
  { key: 'minha_empresa', description: 'Nome da sua empresa' },
  { key: 'assinatura', description: '"Seu nome, da sua empresa" (ou só o nome)' },
  { key: 'portfolio', description: 'Link do seu Sellers Portfolio (se estiver publicado)' },
]

export const DEFAULT_TEMPLATES: { name: string; category: TemplateCategory; body: string }[] = [
  {
    name: 'Primeira abordagem',
    category: 'abordagem',
    body: 'Oi, tudo bem? Aqui é {assinatura}. Vi a {nome} aqui em {cidade} e tive uma ideia de como um site pode trazer mais clientes para vocês. Posso te mandar um exemplo rápido?',
  },
  {
    name: 'Follow-up 1',
    category: 'follow_up',
    body: 'Oi! Passando para saber se você conseguiu ver minha mensagem sobre a {nome}. Faz sentido conversarmos 10 minutinhos essa semana?',
  },
  {
    name: 'Follow-up 2',
    category: 'follow_up',
    body: 'Oi! Separei um exemplo de site parecido com o que eu imagino para a {nome}. Quer que eu te mande para você dar uma olhada?',
  },
  {
    name: 'Último follow-up',
    category: 'follow_up',
    body: 'Oi! Não quero ser insistente, então vou deixar por aqui. Se em algum momento quiser tirar essa ideia do papel para a {nome}, é só me chamar. Abraço!',
  },
  {
    name: 'Envio de proposta',
    category: 'proposta',
    body: 'Oi! Segue a proposta de {negocio}, no valor de {valor}. Qualquer dúvida me chama que eu explico cada item. Podemos seguir?',
  },
  {
    name: 'Lembrete de pagamento',
    category: 'cobranca',
    body: 'Oi, tudo certo? Passando para lembrar do pagamento referente a {negocio} ({valor}). Se já pagou, pode desconsiderar. Obrigado!',
  },
]

function formatValue(value: number | null | undefined): string {
  if (value === null || value === undefined) return ''
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: value % 1 === 0 ? 0 : 2 })
}

// Troca {variavel} pelo valor do contexto. Variável sem valor vira texto vazio
// e os espaços/pontuações que sobram são arrumados.
export function fillTemplate(body: string, context: TemplateContext): string {
  const firstName = context.meu_nome?.trim().split(/\s+/)[0] ?? ''
  const company = context.minha_empresa?.trim() ?? ''
  const values: Record<string, string> = {
    nome: context.nome?.trim() ?? '',
    cidade: context.cidade?.trim() ?? '',
    nicho: context.nicho?.trim() ?? '',
    negocio: context.negocio?.trim() ?? '',
    valor: formatValue(context.valor),
    meu_nome: firstName,
    minha_empresa: company,
    assinatura: firstName && company ? `${firstName}, da ${company}` : firstName || company,
    portfolio: context.portfolio?.trim() ?? '',
  }

  return body
    .replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? values[key] : match))
    .replace(/\(\s*\)/g, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/ +([,.!?])/g, '$1')
    .replace(/\bem\s*([.,!?])/g, '$1')
    .trim()
}
