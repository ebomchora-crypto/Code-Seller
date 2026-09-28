// Code Maker — o "motor" dos sites, sem Deno nem banco (testado em
// src/utils/codeMaker.test.mjs). A IA planeja o site e escreve cada parte;
// a base (cores, fontes, menu, animações) é montada aqui, sempre igual e
// sempre funcionando.

export type SiteStyle = 'auto' | 'dark' | 'minimal' | 'elegant' | 'vibrant'

export interface SiteBrief {
  businessName: string
  niche?: string | null
  city?: string | null
  phone?: string | null
  style?: SiteStyle | null
  details?: string | null
  rating?: number | null
  reviews?: number | null
}

export type SectionBackground = 'paper' | 'surface' | 'ink' | 'brand'

export interface PlanSection {
  id: string
  label: string
  brief: string
  bg: SectionBackground
}

export interface SitePlan {
  title: string
  description: string
  direction: string
  theme: 'dark' | 'light'
  palette: {
    brand: string
    brandDark: string
    accent: string
    ink: string
    paper: string
    surface: string
    muted: string
  }
  fonts: { display: string; body: string }
  sections: PlanSection[]
}

export type SiteParts = Record<string, string>

export const STYLE_LABELS: Record<SiteStyle, string> = {
  auto: 'A IA escolhe',
  dark: 'Moderno escuro',
  minimal: 'Minimalista claro',
  elegant: 'Elegante',
  vibrant: 'Vibrante',
}

const STYLE_DIRECTIONS: Record<SiteStyle, string> = {
  auto: 'Escolha a direção de arte que mais combina com o nicho e o público (evite roxo/violeta, a não ser que faça muito sentido para o negócio).',
  dark: 'Moderno escuro: fundo quase preto, superfícies um pouco mais claras, UM acento vibrante que combine com o nicho, títulos em fonte geométrica marcante.',
  minimal: 'Minimalista claro: fundo branco/off-white, muito respiro, texto quase preto, UM acento discreto, fotos grandes, linhas finas.',
  elegant: 'Elegante/premium: títulos em serifada sofisticada, texto em sans limpa, paleta refinada (creme, carvão, dourado ou verde-escuro), ritmo editorial.',
  vibrant: 'Vibrante: cores fortes e alegres com contraste bem resolvido, formas arredondadas, energia sem virar bagunça.',
}

// Fotos reais e conferidas (links diretos que funcionam), por tipo de negócio.
// A IA só pode usar estas — nada de links inventados que quebram.
interface Photo {
  id: string
  about: string
}

const PHOTOS: Record<string, Photo[]> = {
  barbearia: [
    { id: '1503951914875-452162b0f3f1', about: 'cliente na cadeira de barbeiro, luz dramática (hero)' },
    { id: '1585747860715-2ba37e788b70', about: 'interior de barbearia com tijolinho e cadeiras clássicas' },
    { id: '1621605815971-fbc98d665033', about: 'máquina, tesoura e produtos sobre a bancada' },
    { id: '1599351431202-1e0f0137899a', about: 'barbeiro fazendo degradê com navalha (detalhe)' },
    { id: '1622286342621-4bd786c2447c', about: 'corte masculino sendo finalizado' },
  ],
  salao: [
    { id: '1560066984-138dadb4c035', about: 'salão claro e moderno (hero)' },
    { id: '1522337360788-8b13dee7a37e', about: 'mulher com cabelo longo e bonito' },
    { id: '1521590832167-7bcbfaa6381f', about: 'salão com cadeiras rosadas' },
    { id: '1570172619644-dfd03ed5d881', about: 'tratamento facial / máscara' },
    { id: '1512290923902-8a9f81dc236c', about: 'procedimento estético no rosto' },
  ],
  comida: [
    { id: '1517248135467-4c7edcad34c4', about: 'salão de restaurante aconchegante (hero)' },
    { id: '1414235077428-338989a2e8c0', about: 'prato sendo servido, taças' },
    { id: '1559339352-11d035aa65de', about: 'área externa de restaurante com vista' },
    { id: '1504674900247-0877df9cc836', about: 'pratos vistos de cima' },
    { id: '1540189549336-e6e99c3679fe', about: 'salada colorida' },
    { id: '1509440159596-0249088772ff', about: 'pães artesanais' },
    { id: '1555507036-ab1f4038808a', about: 'croissant com açúcar caindo' },
  ],
  saude: [
    { id: '1629909613654-28e377c37b09', about: 'consultório odontológico claro e moderno (hero)' },
    { id: '1588776814546-1ffcf47267a5', about: 'dentista analisando raio-x' },
    { id: '1606811971618-4486d14f3f99', about: 'atendimento odontológico (detalhe)' },
    { id: '1519494026892-80bbd2d6fd0d', about: 'recepção de clínica' },
    { id: '1576091160399-112ba8d25d1d', about: 'médico de jaleco e estetoscópio' },
  ],
  auto: [
    { id: '1487754180451-c456f719a1fc', about: 'mecânico trocando óleo do motor (hero)' },
    { id: '1619642751034-765dfdf7c58e', about: 'mãos com ferramenta no motor' },
    { id: '1486262715619-67b85e0b08d3', about: 'motor de carro em detalhe' },
    { id: '1530046339160-ce3e530c7d2f', about: 'oficina organizada com ferramentas' },
  ],
  fitness: [
    { id: '1534438327276-14e5300c3a48', about: 'academia com halteres (hero)' },
    { id: '1571902943202-507ec2618e8f', about: 'academia ampla e iluminada' },
    { id: '1517836357463-d25dfeac3438', about: 'levantamento de peso (detalhe)' },
  ],
  juridico: [
    { id: '1589829545856-d10d557cf95f', about: 'estátua da justiça (hero)' },
    { id: '1505664194779-8beaceb93744', about: 'biblioteca com livros antigos' },
    { id: '1450101499163-c8848c66ca85', about: 'assinatura de documento' },
    { id: '1554224155-6726b3ff858f', about: 'documentos e calculadora (contabilidade)' },
  ],
  pet: [
    { id: '1548199973-03cce0bbc87b', about: 'dois cachorros correndo felizes (hero)' },
    { id: '1587300003388-59208cc962cb', about: 'cachorro sorrindo' },
    { id: '1516734212186-a967f81ad0d7', about: 'golden retriever sendo cuidado' },
  ],
  casa: [
    { id: '1600596542815-ffad4c1539a9', about: 'casa moderna com piscina (hero)' },
    { id: '1560448204-e02f11c3d0e2', about: 'sala de estar clara' },
    { id: '1503387762-592deb58ef4e', about: 'projeto/planta sobre a mesa' },
    { id: '1541888946425-d81bb19240f5', about: 'obra vista de cima com equipe' },
  ],
  escola: [{ id: '1509062522246-3755977927d7', about: 'sala de aula com alunos (hero)' }],
  loja: [
    { id: '1441986300917-64674bd600d8', about: 'loja de roupas organizada (hero)' },
    { id: '1483985988355-763728e1935b', about: 'cliente com sacolas de compras' },
  ],
  geral: [
    { id: '1497366216548-37526070297c', about: 'escritório moderno' },
    { id: '1522071820081-009f0129c71c', about: 'equipe trabalhando junta' },
    { id: '1556761175-5973dc0f32e7', about: 'apresentação para clientes' },
  ],
}

const PHOTO_GROUPS: { group: string; match: string[] }[] = [
  { group: 'barbearia', match: ['barbear', 'barber'] },
  { group: 'salao', match: ['salao', 'cabel', 'estetic', 'manicure', 'unha', 'sobrancelha', 'beleza', 'spa', 'maquiag', 'depila'] },
  { group: 'saude', match: ['clinic', 'dentist', 'odonto', 'fisio', 'psicolog', 'nutri', 'medic', 'saude', 'consultorio', 'fono', 'laborat'] },
  { group: 'auto', match: ['oficina', 'mecanic', 'auto', 'funilar', 'borrachar', 'pneu', 'lava', 'moto', 'guincho'] },
  { group: 'comida', match: ['restaurante', 'lanchonete', 'padaria', 'pizzar', 'hamburg', 'cafe', 'bar', 'acai', 'doceria', 'confeitar', 'marmit', 'aliment'] },
  { group: 'juridico', match: ['advoca', 'advogad', 'juridic', 'contab', 'contador'] },
  { group: 'fitness', match: ['academia', 'crossfit', 'pilates', 'personal', 'fitness', 'luta', 'danca', 'yoga'] },
  { group: 'pet', match: ['pet', 'veterin', 'tosa', 'canil'] },
  { group: 'casa', match: ['imobil', 'imove', 'corretor', 'constru', 'reforma', 'arquitet', 'engenh', 'marcenar'] },
  { group: 'escola', match: ['escola', 'curso', 'idioma', 'educa', 'colegio', 'creche'] },
  { group: 'loja', match: ['loja', 'roupa', 'moda', 'calcad', 'boutique', 'otica', 'joalher'] },
]

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export function photosFor(niche: string | null | undefined): Photo[] {
  const key = normalize(niche ?? '')
  const group = PHOTO_GROUPS.find((item) => item.match.some((word) => key.includes(word)))?.group
  return [...(group ? PHOTOS[group] : []), ...PHOTOS.geral]
}

export function photoCatalog(niche: string | null | undefined): string {
  return photosFor(niche)
    .map((photo) => `- https://images.unsplash.com/photo-${photo.id}?auto=format&fit=crop&w=1600&q=80 — ${photo.about}`)
    .join('\n')
}


// ---------------------------------------------------------------------------
// Regras de design e conteúdo (valem para todas as partes)
// ---------------------------------------------------------------------------

const DESIGN_RULES = `PADRÃO DE QUALIDADE: o mesmo de ferramentas como v0 e Lovable — o site precisa parecer feito sob medida por uma agência premium, nunca um template genérico.

DESIGN
- Use SOMENTE estas cores do tema (Tailwind): brand, brand-dark, accent, ink, paper, surface, muted — com variações de opacidade (ex.: bg-brand/10, text-ink/70, border-ink/10) e também white/black. Nunca invente outros nomes de cor nem use cores fixas (#hex) nas classes.
- Fontes: font-display (títulos) e font-body (texto). Títulos grandes com tracking-tight e leading-[1.05]; rótulos pequenos em caixa alta com tracking-[0.2em] acima dos títulos de seção.
- Raio de borda consistente (rounded-2xl/rounded-3xl), sombras suaves, bordas finas (border-ink/10 no claro, border-white/10 no escuro).
- Espaçamento generoso: seções com py-20 md:py-28, container "mx-auto max-w-6xl px-5 md:px-8", textos com max-w-prose.
- Layouts variados (bento grid com um card maior, colunas assimétricas, faixas de números, cards com hierarquia). Nunca repita o mesmo formato de 3 cards iguais em seções seguidas.
- Microinterações: hover em botões e cards (transition, -translate-y-1, sombra, borda na cor da marca), foco visível.
- Coloque a classe "reveal" nos blocos que devem aparecer ao rolar (títulos, cards, imagens) — a animação já existe.
- Botões: rounded-full px-6 py-3.5 font-semibold; principal com bg-brand e texto em contraste; secundário contornado.
- Ícones: SVG inline estilo lucide (fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round", viewBox 0 0 24 24). Nunca emoji como ícone.
- 100% responsivo (mobile-first, bonito de 360px a 1440px), contraste AA, HTML semântico.

CONTEÚDO (português do Brasil, específico, sem enrolação)
- Nada de lorem ipsum, "[Nome]", "Seu texto aqui", "Bem-vindo ao nosso site" ou frases vazias de empresa.
- Escreva como o dono falaria com o cliente: serviços reais do nicho com preço "a partir de" plausível, diferenciais concretos, depoimentos com nome e contexto, dúvidas reais do nicho.
- Botões de contato abrem o WhatsApp com mensagem pronta coerente (target="_blank" rel="noopener"). Sem WhatsApp informado, leve para #contato.
- Imagens: use SOMENTE as URLs da lista de fotos do pedido (pode mudar só o w=). Nunca invente URL de imagem. Sem foto adequada, resolva com design. Sempre alt descritivo e object-cover; loading="lazy" fora do topo. Avatares de depoimentos: iniciais em círculo, nunca foto.`

// ---------------------------------------------------------------------------
// 1) Plano do site
// ---------------------------------------------------------------------------

export const PLAN_SYSTEM = `Você é o diretor de arte do Code Maker. Você planeja sites de alto nível para pequenos negócios brasileiros. Nesta etapa você NÃO escreve HTML: define a direção de arte e a estrutura.

Responda exatamente neste formato, sem nada antes ou depois:
<acoes>
- (3 a 5 itens curtos, 1ª pessoa, contando as decisões: direção de arte, paleta, fontes, estrutura)
</acoes>
<plano>
{ JSON válido, sem comentários }
</plano>

Formato do JSON:
{
  "title": "título da aba (nome + benefício, até 60 caracteres)",
  "description": "meta description (até 155 caracteres)",
  "direction": "direção de arte em 2 frases, concreta (clima, contraste, tipo de composição)",
  "theme": "dark" ou "light",
  "palette": { "brand": "#hex cor principal", "brandDark": "#hex mais escura da principal", "accent": "#hex acento", "ink": "#hex texto principal (no dark é claro, no light é quase preto)", "paper": "#hex fundo principal", "surface": "#hex fundo alternativo/cartões", "muted": "#hex texto secundário" },
  "fonts": { "display": "nome exato de uma fonte do Google Fonts para títulos", "body": "nome exato de uma fonte do Google Fonts para texto" },
  "sections": [ { "id": "kebab-case", "label": "nome curto no menu", "brief": "o que a seção mostra, com conteúdo específico e a ideia de layout", "bg": "paper" | "surface" | "ink" | "brand" } ]
}

Regras do plano:
- sections: de 6 a 9 itens, na ordem da página. O primeiro é sempre { "id": "hero", ... }. Não inclua cabeçalho nem rodapé (já existem). Use ids como hero, numeros, servicos, diferenciais, galeria, depoimentos, sobre, planos, como-funciona, localizacao, faq, contato — escolha o que faz sentido para o nicho. Inclua "contato" (localização, horário e WhatsApp) perto do fim.
- Alterne "bg" entre as seções para dar ritmo (nunca 3 seguidas iguais); use "ink" ou "brand" em 1 ou 2 seções de destaque.
- Paleta com contraste AA entre ink/paper e entre o texto do botão e brand. Fontes que combinem e existam no Google Fonts.
- Cada "brief" deve ser específico do negócio (serviços, preços "a partir de", diferenciais, dúvidas reais), não genérico.`

export function buildPlanMessage(brief: SiteBrief): string {
  const phone = phoneDigits(brief.phone)
  return [
    `Negócio: ${brief.businessName}`,
    brief.niche ? `Nicho: ${brief.niche}` : null,
    brief.city ? `Cidade: ${brief.city}` : null,
    phone ? `WhatsApp: ${phone}` : 'WhatsApp: não informado',
    brief.reviews && brief.rating ? `Reputação real: nota ${brief.rating.toLocaleString('pt-BR')} com ${brief.reviews} avaliações` : null,
    `Estilo pedido: ${STYLE_DIRECTIONS[brief.style ?? 'auto']}`,
    brief.details?.trim() ? `Pedido do cliente / detalhes:\n${brief.details.trim()}` : null,
  ]
    .filter(Boolean)
    .join('\n')
}

// ---------------------------------------------------------------------------
// 2) Cada parte do site (cabeçalho, seções, rodapé)
// ---------------------------------------------------------------------------

export const PART_SYSTEM = `Você é o Code Maker, designer e desenvolvedor front-end sênior. Você escreve UMA parte de um site por vez, seguindo o plano do diretor de arte. As outras partes são escritas em paralelo por colegas com o mesmo plano, então siga o plano à risca para o site ficar coeso.

TECNOLOGIA
- HTML com classes Tailwind (o Tailwind e as cores/fontes do tema já estão carregados). Pode usar valores arbitrários do Tailwind.
- Não escreva <html>, <head>, <body>, <style> nem <script>. O comportamento já existe: cabeçalho com data-header (ganha fundo ao rolar), botão com data-menu-toggle e painel com data-menu (menu mobile, começa com a classe "hidden"), classe "reveal" (aparece ao rolar), <details>/<summary> para FAQ, <span data-year></span> para o ano atual.
- Links internos: href="#id-da-secao".

${DESIGN_RULES}

FORMATO DA RESPOSTA: somente um bloco \`\`\`html com a parte pedida, sem nada antes ou depois.`

function partInstructions(partId: string, plan: SitePlan, brief: SiteBrief): string {
  const phone = phoneDigits(brief.phone)
  const whatsapp = phone ? `https://wa.me/55${phone}` : '#contato'
  const nav = plan.sections
    .filter((section) => section.id !== 'hero')
    .slice(0, 6)
    .map((section) => `${section.label} (#${section.id})`)
    .join(', ')

  if (partId === 'header') {
    return `Escreva o CABEÇALHO: <header data-header class="fixed inset-x-0 top-0 z-50 ..."> com logotipo tipográfico do negócio (nome com um detalhe na cor brand, e um pequeno ícone SVG coerente com o nicho), menu com os links: ${nav}, e botão de ação para o WhatsApp (${whatsapp}). No mobile, botão data-menu-toggle (ícone de menu) e um painel data-menu com class "hidden" contendo os mesmos links e o botão. O cabeçalho começa transparente sobre o topo (o topo é "${plan.sections[0]?.bg ?? 'paper'}") — use cores de texto que funcionem sobre o hero e também sobre o fundo que ele ganha ao rolar (bg-paper/80 com backdrop-blur, aplicado pelo script via [data-scrolled]); escreva as classes do estado rolado com o prefixo "data-[scrolled]:" (ex.: data-[scrolled]:bg-paper/85 data-[scrolled]:backdrop-blur data-[scrolled]:shadow-sm).`
  }
  if (partId === 'footer') {
    return `Escreva o RODAPÉ: <footer> com o nome do negócio, frase curta, links do menu (${nav}), contato (WhatsApp ${phone ?? 'não informado'}, cidade ${brief.city ?? ''}), horário de funcionamento plausível e "© <span data-year></span> ${brief.businessName}". Depois do </footer>, um botão flutuante de WhatsApp: <a href="${whatsapp}" ... class="fixed bottom-5 right-5 z-50 ... bg-[#25D366] ..."> com o ícone do WhatsApp em SVG e aria-label.`
  }
  const section = plan.sections.find((item) => item.id === partId)
  const bgClass = { paper: 'bg-paper', surface: 'bg-surface', ink: 'bg-ink', brand: 'bg-brand' }[section?.bg ?? 'paper']
  const onDark = section?.bg === 'ink' || section?.bg === 'brand'
  const hero =
    partId === 'hero'
      ? ' Esta é a primeira seção (o cabeçalho fixo fica por cima): min-h-[88vh], com pt-28 para não ficar atrás do cabeçalho, título curto e específico em text-5xl md:text-7xl, subtítulo de até 2 linhas, botão principal para o WhatsApp + secundário, prova social logo abaixo e um visual marcante (foto grande em cartão arredondado com 1–2 cartões flutuantes de dados, ou foto de fundo com gradiente por cima).'
      : ''
  return `Escreva SOMENTE a seção <section id="${partId}" class="${bgClass} ..."> — "${section?.label ?? partId}". Briefing: ${section?.brief ?? ''}${hero}${
    onDark ? ` O fundo desta seção é escuro/colorido (${bgClass}): use texto claro (text-paper, text-white, text-paper/70) e cartões em white/10.` : ''
  } Link do WhatsApp: ${whatsapp}.`
}

export function buildPartMessage(partId: string, plan: SitePlan, brief: SiteBrief): string {
  return [
    `Negócio: ${brief.businessName}${brief.niche ? ` · ${brief.niche}` : ''}${brief.city ? ` · ${brief.city}` : ''}`,
    brief.reviews && brief.rating ? `Reputação real: nota ${brief.rating.toLocaleString('pt-BR')} com ${brief.reviews} avaliações` : null,
    brief.details?.trim() ? `Pedido do cliente: ${brief.details.trim()}` : null,
    `Plano do site (siga à risca):\n${JSON.stringify(plan)}`,
    `Fotos disponíveis (use somente estas):\n${photoCatalog(brief.niche)}`,
    partInstructions(partId, plan, brief),
  ]
    .filter(Boolean)
    .join('\n\n')
}

// Ordem das partes na página.
export function partOrder(plan: SitePlan): string[] {
  return ['header', ...plan.sections.map((section) => section.id), 'footer']
}

// ---------------------------------------------------------------------------
// 3) Alterações pedidas no chat
// ---------------------------------------------------------------------------

export const EDIT_SYSTEM = `Você é o Code Maker e está alterando um site que já existe, a pedido do usuário. O site é dividido em partes (<parte id="...">); você devolve SOMENTE as partes que mudam.

TECNOLOGIA
- Mesmas regras: HTML com Tailwind, cores do tema brand, brand-dark, accent, ink, paper, surface, muted; fontes font-display e font-body; sem <script>/<style>; comportamentos prontos (data-header, data-menu-toggle, data-menu, reveal, details/summary, data-year).

${DESIGN_RULES}

FORMATO DA RESPOSTA (sem nada antes ou depois):
<acoes>
- (2 a 6 itens curtos, 1ª pessoa, contando exatamente o que você mudou)
</acoes>
Depois, só o que muda:
- Parte alterada: <parte id="id">HTML completo da parte</parte>
- Nova seção: <parte id="novo-id" depois="id-da-parte-anterior" rotulo="Nome no menu">HTML da seção</parte>
- Remover uma seção: <remover id="id"/>
- Mudar cores ou fontes do site inteiro: <tema>{"palette": {...só as cores que mudam...}, "fonts": {...}}</tema>
Mantenha tudo o que não foi pedido exatamente igual. Se o pedido afetar o menu (seção nova/removida), devolva também o cabeçalho e o rodapé atualizados.`

export function buildEditMessage(plan: SitePlan, parts: SiteParts, instruction: string, brief: SiteBrief): string {
  const current = partOrder(plan)
    .filter((id) => parts[id])
    .map((id) => `<parte id="${id}">\n${parts[id]}\n</parte>`)
    .join('\n')
  return [
    `Negócio: ${brief.businessName}${brief.niche ? ` · ${brief.niche}` : ''}${brief.city ? ` · ${brief.city}` : ''}`,
    `Tema atual: ${JSON.stringify({ palette: plan.palette, fonts: plan.fonts, theme: plan.theme })}`,
    `Partes atuais do site:\n${current}`,
    `Fotos disponíveis (se precisar de novas, use somente estas):\n${photoCatalog(brief.niche)}`,
    `Pedido do usuário: ${instruction.trim()}`,
  ].join('\n\n')
}

// ---------------------------------------------------------------------------
// Leitura das respostas da IA (também com a resposta ainda chegando)
// ---------------------------------------------------------------------------

export function parseActions(text: string): string[] {
  const block = text.match(/<acoes>([\s\S]*?)(?:<\/acoes>|$)/i)?.[1] ?? ''
  return block
    .split('\n')
    .map((line) => line.replace(/^\s*[-*•]\s*/, '').trim())
    .filter(Boolean)
}

const HEX = /^#[0-9a-f]{6}$/i
const DEFAULT_PALETTE: SitePlan['palette'] = {
  brand: '#c2410c',
  brandDark: '#9a3412',
  accent: '#f59e0b',
  ink: '#111827',
  paper: '#fafaf9',
  surface: '#f1efe9',
  muted: '#6b7280',
}

function cleanFont(name: unknown, fallback: string): string {
  const value = typeof name === 'string' ? name.replace(/[^A-Za-z0-9 ]/g, '').trim() : ''
  return value.length >= 2 && value.length <= 40 ? value : fallback
}

function cleanId(value: unknown): string {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30)
}

// Confere e completa o plano: nunca deixa o site sem cores/fontes válidas.
export function normalizePlan(raw: unknown, brief: SiteBrief): SitePlan | null {
  if (!raw || typeof raw !== 'object') return null
  const input = raw as Record<string, any>
  const palette = { ...DEFAULT_PALETTE }
  for (const key of Object.keys(palette) as (keyof SitePlan['palette'])[]) {
    const value = input.palette?.[key]
    if (typeof value === 'string' && HEX.test(value.trim())) palette[key] = value.trim()
  }
  const seen = new Set<string>(['header', 'footer'])
  const sections: PlanSection[] = []
  for (const item of Array.isArray(input.sections) ? input.sections : []) {
    const id = cleanId(item?.id)
    if (!id || seen.has(id)) continue
    seen.add(id)
    const bg = ['paper', 'surface', 'ink', 'brand'].includes(item?.bg) ? item.bg : 'paper'
    sections.push({
      id,
      label: String(item?.label ?? id).slice(0, 30),
      brief: String(item?.brief ?? '').slice(0, 800),
      bg,
    })
  }
  if (sections.length === 0) return null
  if (sections[0].id !== 'hero') {
    const heroIndex = sections.findIndex((section) => section.id === 'hero')
    if (heroIndex > 0) sections.unshift(...sections.splice(heroIndex, 1))
    else sections.unshift({ id: 'hero', label: 'Início', brief: 'Topo de impacto do site.', bg: 'paper' })
  }
  return {
    title: String(input.title ?? brief.businessName).slice(0, 80),
    description: String(input.description ?? '').slice(0, 200),
    direction: String(input.direction ?? '').slice(0, 400),
    theme: input.theme === 'dark' ? 'dark' : 'light',
    palette,
    fonts: {
      display: cleanFont(input.fonts?.display, 'Inter'),
      body: cleanFont(input.fonts?.body, 'Inter'),
    },
    sections: sections.slice(0, 10),
  }
}

export function parsePlan(text: string, brief: SiteBrief): { actions: string[]; plan: SitePlan | null } {
  const raw = text.match(/<plano>([\s\S]*?)<\/plano>/i)?.[1]
  let plan: SitePlan | null = null
  if (raw) {
    try {
      plan = normalizePlan(JSON.parse(raw.trim().replace(/^```(?:json)?|```$/g, '')), brief)
    } catch {
      plan = null
    }
  }
  return { actions: parseActions(text), plan }
}

// Limpa um pedaço de HTML escrito pela IA: sem scripts, estilos ou documento.
export function cleanFragment(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<script[^>]*>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<\/?(?:html|head|body)[^>]*>/gi, '')
    .replace(/<!doctype[^>]*>/gi, '')
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*')/gi, '')
    .trim()
}

export function parsePart(text: string): { html: string; complete: boolean } {
  const start = text.search(/```html\s*/i)
  let body = start >= 0 ? text.slice(start).replace(/^```html\s*/i, '') : text
  const end = body.indexOf('```')
  const fenced = end >= 0
  if (fenced) body = body.slice(0, end)
  const html = cleanFragment(body)
  return { html, complete: fenced || /<\/(section|header|footer|a)>\s*$/i.test(html) }
}

export interface EditResult {
  actions: string[]
  parts: { id: string; html: string; after?: string; label?: string }[]
  removals: string[]
  theme: { palette?: Partial<SitePlan['palette']>; fonts?: Partial<SitePlan['fonts']> } | null
}

export function parseEdit(text: string): EditResult {
  const parts: EditResult['parts'] = []
  for (const match of text.matchAll(/<parte\s+([^>]*)>([\s\S]*?)<\/parte>/gi)) {
    const attrs = match[1]
    const id = cleanId(attrs.match(/id="([^"]+)"/i)?.[1])
    if (!id) continue
    const after = attrs.match(/depois="([^"]+)"/i)?.[1]
    const label = attrs.match(/rotulo="([^"]+)"/i)?.[1]
    parts.push({ id, html: cleanFragment(match[2]), after: after ? cleanId(after) : undefined, label })
  }
  const removals = [...text.matchAll(/<remover\s+id="([^"]+)"\s*\/?>/gi)].map((match) => cleanId(match[1]))
  let theme: EditResult['theme'] = null
  const rawTheme = text.match(/<tema>([\s\S]*?)<\/tema>/i)?.[1]
  if (rawTheme) {
    try {
      theme = JSON.parse(rawTheme.trim())
    } catch {
      theme = null
    }
  }
  return { actions: parseActions(text), parts, removals, theme }
}

// Aplica uma alteração ao plano e às partes (sem mexer no original).
export function applyEdit(plan: SitePlan, parts: SiteParts, edit: EditResult): { plan: SitePlan; parts: SiteParts } {
  const nextPlan: SitePlan = { ...plan, palette: { ...plan.palette }, fonts: { ...plan.fonts }, sections: [...plan.sections] }
  const nextParts: SiteParts = { ...parts }

  for (const id of edit.removals) {
    if (id === 'header' || id === 'footer' || id === 'hero') continue
    nextPlan.sections = nextPlan.sections.filter((section) => section.id !== id)
    delete nextParts[id]
  }
  for (const part of edit.parts) {
    if (!part.html) continue
    const known = part.id === 'header' || part.id === 'footer' || nextPlan.sections.some((section) => section.id === part.id)
    if (!known) {
      const index = part.after ? nextPlan.sections.findIndex((section) => section.id === part.after) : -1
      const section: PlanSection = { id: part.id, label: part.label ?? part.id, brief: '', bg: 'paper' }
      if (index >= 0) nextPlan.sections.splice(index + 1, 0, section)
      else nextPlan.sections.push(section)
    }
    nextParts[part.id] = part.html
  }
  if (edit.theme?.palette) {
    for (const [key, value] of Object.entries(edit.theme.palette)) {
      if (key in nextPlan.palette && typeof value === 'string' && HEX.test(value)) {
        nextPlan.palette[key as keyof SitePlan['palette']] = value
      }
    }
  }
  if (edit.theme?.fonts) {
    nextPlan.fonts = {
      display: cleanFont(edit.theme.fonts.display, nextPlan.fonts.display),
      body: cleanFont(edit.theme.fonts.body, nextPlan.fonts.body),
    }
  }
  return { plan: nextPlan, parts: nextParts }
}

// ---------------------------------------------------------------------------
// Montagem do documento final
// ---------------------------------------------------------------------------

function escapeHtml(value: string): string {
  return value.replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char]!)
}

const BASE_SCRIPT = `<script>
(function(){
  var header=document.querySelector('[data-header]');
  function onScroll(){ if(header){ if(window.scrollY>24){header.setAttribute('data-scrolled','')}else{header.removeAttribute('data-scrolled')} } }
  window.addEventListener('scroll',onScroll,{passive:true}); onScroll();
  var toggle=document.querySelector('[data-menu-toggle]'), menu=document.querySelector('[data-menu]');
  if(toggle&&menu){ toggle.addEventListener('click',function(){ menu.classList.toggle('hidden'); });
    menu.querySelectorAll('a').forEach(function(a){ a.addEventListener('click',function(){ menu.classList.add('hidden'); }); }); }
  var items=document.querySelectorAll('.reveal');
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(entries){ entries.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('is-visible'); io.unobserve(e.target);} }); },{rootMargin:'0px 0px -8% 0px'});
    items.forEach(function(el){ io.observe(el); });
  } else { items.forEach(function(el){ el.classList.add('is-visible'); }); }
  setTimeout(function(){ items.forEach(function(el){ el.classList.add('is-visible'); }); }, 2500);
  document.querySelectorAll('[data-year]').forEach(function(el){ el.textContent=new Date().getFullYear(); });
})();
</script>`

export function buildHead(plan: SitePlan): string {
  const fonts = [...new Set([plan.fonts.display, plan.fonts.body])]
    .map((font) => `family=${encodeURIComponent(font).replace(/%20/g, '+')}:wght@400;500;600;700;800`)
    .join('&')
  const config = {
    theme: {
      extend: {
        colors: {
          brand: { DEFAULT: plan.palette.brand, dark: plan.palette.brandDark },
          accent: plan.palette.accent,
          ink: plan.palette.ink,
          paper: plan.palette.paper,
          surface: plan.palette.surface,
          muted: plan.palette.muted,
        },
        fontFamily: {
          display: [plan.fonts.display, 'ui-sans-serif', 'system-ui', 'sans-serif'],
          body: [plan.fonts.body, 'ui-sans-serif', 'system-ui', 'sans-serif'],
        },
      },
    },
  }
  const initial = escapeHtml((plan.title.trim()[0] ?? 'S').toUpperCase())
  const favicon = `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' rx='16' fill='${plan.palette.brand}'/><text x='50%' y='54%' text-anchor='middle' dominant-baseline='middle' font-family='Arial' font-weight='700' font-size='34' fill='#fff'>${initial}</text></svg>`,
  )}`
  return [
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<title>${escapeHtml(plan.title)}</title>`,
    `<meta name="description" content="${escapeHtml(plan.description)}">`,
    `<link rel="icon" href="${favicon}">`,
    '<link rel="preconnect" href="https://fonts.googleapis.com">',
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
    `<link href="https://fonts.googleapis.com/css2?${fonts}&display=swap" rel="stylesheet">`,
    '<script src="https://cdn.tailwindcss.com"></script>',
    `<script>tailwind.config=${JSON.stringify(config)}</script>`,
    `<style>html{scroll-behavior:smooth}body{font-family:'${plan.fonts.body}',ui-sans-serif,system-ui,sans-serif}.reveal{opacity:0;transform:translateY(24px);transition:opacity .7s ease,transform .7s ease}.reveal.is-visible{opacity:1;transform:none}@media (prefers-reduced-motion:reduce){.reveal{opacity:1;transform:none;transition:none}}details>summary{list-style:none;cursor:pointer}details>summary::-webkit-details-marker{display:none}</style>`,
  ].join('\n')
}

// `pending` = partes ainda sendo escritas: aparecem como um bloco "carregando".
export function assembleSite(plan: SitePlan, parts: SiteParts, options: { pending?: boolean } = {}): string {
  const body = partOrder(plan)
    .map((id) => {
      if (parts[id]) return parts[id]
      if (!options.pending) return ''
      return id === 'header' || id === 'footer'
        ? ''
        : `<section id="${id}" class="bg-surface py-24"><div class="mx-auto max-w-6xl px-5 md:px-8 animate-pulse"><div class="h-4 w-32 rounded-full bg-ink/10"></div><div class="mt-5 h-10 w-2/3 rounded-2xl bg-ink/10"></div><div class="mt-8 grid gap-4 md:grid-cols-3"><div class="h-40 rounded-3xl bg-ink/5"></div><div class="h-40 rounded-3xl bg-ink/5"></div><div class="h-40 rounded-3xl bg-ink/5"></div></div></div></section>`
    })
    .filter(Boolean)
    .join('\n\n')
  return `<!doctype html>
<html lang="pt-BR">
<head>
${buildHead(plan)}
</head>
<body class="bg-paper text-ink font-body antialiased">
${body}
${BASE_SCRIPT}
</body>
</html>`
}

export function phoneDigits(phone: string | null | undefined): string | null {
  let digits = phone?.replace(/\D/g, '') ?? ''
  if (digits.length === 13 && digits.startsWith('55')) digits = digits.slice(2)
  return digits.length === 10 || digits.length === 11 ? digits : null
}

// ---------------------------------------------------------------------------
// Continuação: cada chamada tem tempo máximo; se a IA não terminou, a próxima
// chamada continua de onde parou. Junta os dois textos sem repetir o trecho
// que a IA eventualmente reescreve no começo.
// ---------------------------------------------------------------------------

export const CONTINUE_PROMPT =
  'Continue exatamente de onde o texto acima parou, sem repetir nada do que já foi escrito, sem explicações e sem reabrir blocos de código. Termine a resposta no mesmo formato.'

export function joinContinuation(previous: string, next: string): string {
  let addition = next.replace(/^\s*```html[^\S\n]*\n?/i, '')
  const maxOverlap = Math.min(600, previous.length, addition.length)
  for (let size = maxOverlap; size >= 12; size--) {
    if (previous.endsWith(addition.slice(0, size))) {
      addition = addition.slice(size)
      break
    }
  }
  return previous + addition
}
