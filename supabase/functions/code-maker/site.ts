// Code Maker — o "motor" dos sites, sem Deno nem banco (testado em
// src/utils/codeMaker.test.mjs). A IA planeja o site e escreve cada parte;
// a base (cores, fontes, menu, animações) é montada aqui, sempre igual e
// sempre funcionando.

import { normalizeSpecification, type CodeMakerSpecification, type RecentEditContext } from './spec.ts'

export type SiteStyle = 'auto' | 'dark' | 'minimal' | 'elegant' | 'vibrant'

export interface SiteBrief {
  businessName: string
  mode?: 'lead_prototype'
  contactRoutes?: {
    goal: 'whatsapp' | 'quote' | 'booking' | 'call' | 'institutional' | 'lead_capture'
    actionLabel: string
    primary: string | null
    confirmedWhatsapp: string | null
    contacts: string[]
    openingHours: string[]
  }
  niche?: string | null
  city?: string | null
  phone?: string | null
  style?: SiteStyle | null
  details?: string | null
  rating?: number | null
  reviews?: number | null
  // Logo e fotos enviadas pelo usuário (URLs públicas).
  assets?: SiteAsset[] | null
  specification?: CodeMakerSpecification
}

export interface SiteAsset {
  url: string
  kind: 'logo' | 'photo'
}

export type SectionBackground = 'paper' | 'surface' | 'ink' | 'brand'

export interface PlanSection {
  id: string
  label: string
  brief: string
  bg: SectionBackground
  requirementIds?: string[]
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
  globalRequirementIds?: string[]
  specification?: CodeMakerSpecification
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

// Só aceita imagens da pasta do próprio usuário no depósito do Code Maker e
// remonta o endereço oficial (nada de links de fora nem de outra pessoa).
export function cleanAssets(input: unknown, userId: string, baseUrl: string): SiteAsset[] {
  const marker = `/storage/v1/object/public/site-assets/${userId}/`
  const assets: SiteAsset[] = []
  for (const item of Array.isArray(input) ? input.slice(0, 12) : []) {
    const raw = typeof item?.url === 'string' ? item.url : ''
    const index = raw.indexOf(marker)
    const file = index >= 0 ? raw.slice(index + marker.length) : ''
    if (!/^[\w-]+\.(?:png|jpe?g|webp)$/i.test(file)) continue
    const url = `${baseUrl.replace(/\/+$/, '')}${marker}${file}`
    const kind = item?.kind === 'logo' && !assets.some((asset) => asset.kind === 'logo') ? 'logo' : 'photo'
    if (!assets.some((asset) => asset.url === url)) assets.push({ url, kind })
  }
  return assets
}

export function logoOf(brief: SiteBrief): string | null {
  return brief.assets?.find((asset) => asset.kind === 'logo')?.url ?? null
}

// Imagens que a IA pode usar: as do próprio negócio primeiro, depois as de banco.
export function imagesMessage(brief: SiteBrief, fresh: SiteAsset[] = []): string {
  const logo = logoOf(brief)
  const photos = (brief.assets ?? []).filter((asset) => asset.kind === 'photo')
  const freshUrls = new Set(fresh.map((asset) => asset.url))
  const mark = (url: string) => (freshUrls.has(url) ? ' (anexada agora)' : '')
  return [
    logo
      ? `LOGO DO NEGÓCIO (enviada pelo usuário): ${logo}${mark(logo)}\nUse SOMENTE no cabeçalho e no rodapé (não repita na seção do topo, que já fica logo abaixo do cabeçalho), no lugar do nome em texto: <img src="..." alt="Logo ${brief.businessName}" class="h-9 w-auto md:h-10 object-contain">. Não recorte, não distorça e não coloque dentro de círculo. Combine as cores do site com ela.`
      : null,
    photos.length > 0
      ? `FOTOS DO PRÓPRIO NEGÓCIO (enviadas pelo usuário — use estas PRIMEIRO, principalmente no topo, na galeria e no "sobre"; não sabemos o que cada uma mostra, então use legendas genéricas e alt descritivo neutro):\n${photos.map((photo) => `- ${photo.url}${mark(photo.url)}`).join('\n')}`
      : null,
    `${photos.length > 0 ? 'Fotos de banco (só como complemento, se faltar foto)' : 'Fotos disponíveis (use somente estas)'}:\n${photoCatalog(brief.niche)}`,
  ]
    .filter(Boolean)
    .join('\n\n')
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
- Escreva como o dono falaria com o cliente: serviços reais do nicho com preço "a partir de" plausível (ou os preços informados), diferenciais concretos, dúvidas reais do nicho.
- NUNCA invente fatos sobre o negócio: nada de nota, número de avaliações, depoimentos de clientes, ano de fundação, anos de experiência, quantidade de clientes/atendimentos, prêmios ou endereço que não estejam no pedido. Use só o que foi informado; se a reputação real foi informada, use exatamente esses números. Sem dados, valorize o que é verdade para qualquer negócio do nicho (serviços, como funciona, horário, facilidade de agendar, localização na cidade).
- Botões de contato abrem o WhatsApp com mensagem pronta coerente (target="_blank" rel="noopener"). Sem WhatsApp informado, leve para #contato.
- Imagens: use SOMENTE as URLs da lista de fotos do pedido (pode mudar só o w=). Nunca invente URL de imagem. Sem foto adequada, resolva com design. Sempre alt descritivo e object-cover; loading="lazy" fora do topo. Avatares de depoimentos: iniciais em círculo, nunca foto.`

// ---------------------------------------------------------------------------
// 1) Plano do site
// ---------------------------------------------------------------------------

export const PLAN_SYSTEM = `Você é o diretor de arte do Code Maker. Você planeja sites de alto nível para pequenos negócios brasileiros. Nesta etapa você NÃO escreve HTML: define a direção de arte e a estrutura.

Responda exatamente neste formato, sem nada antes ou depois:
<acoes>
- (3 a 5 itens curtos, 1ª pessoa, em linguagem simples para o dono do negócio, contando as decisões: clima do visual, cores, fontes, o que o site vai mostrar. Sem termos técnicos nem nomes internos como paper, ink, surface, brand, hero ou bg)
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
  "globalRequirementIds": ["IDs dos requisitos transversais da especificação"],
  "sections": [ { "id": "kebab-case", "label": "nome curto no menu", "brief": "o que a seção mostra, com conteúdo específico e a ideia de layout", "requirementIds": ["IDs dos requisitos desta seção"], "bg": "paper" | "surface" | "ink" | "brand" } ],
  "business": { "name": "nome do negócio", "niche": "nicho em poucas palavras", "city": "cidade ou null", "phone": "WhatsApp só com dígitos ou null" }
}
"business": copie do pedido. Se o pedido não disser o nome, crie um nome curto e plausível; cidade e WhatsApp só se estiverem escritos no pedido (senão null).

Regras do plano:
- A especificação é obrigatória quando fornecida. Copie seus IDs: globalRequirementIds para requisitos transversais e requirementIds em cada seção. Todo requisito aplicável deve ser atribuído. Requisitos backend limitados permanecem limitações explícitas. Não declare que estão implementados. Respeite constraints, forbiddenChanges, relevantFiles, dependencies e validation.
- sections: de 6 a 9 itens, na ordem da página. O primeiro é sempre { "id": "hero", ... }. Não inclua cabeçalho nem rodapé (já existem). Use ids como hero, servicos, diferenciais, galeria, sobre, planos, como-funciona, localizacao, faq, contato — escolha o que faz sentido para o nicho. Só inclua "depoimentos" ou "numeros" se o pedido trouxer reputação real ou números reais (nunca invente). Inclua "contato" (localização, horário e WhatsApp) perto do fim.
- Alterne "bg" entre as seções para dar ritmo (nunca 3 seguidas iguais); use "ink" ou "brand" em 1 ou 2 seções de destaque.
- Paleta com contraste AA entre ink/paper e entre o texto do botão e brand. Fontes que combinem e existam no Google Fonts.
- Cada "brief" deve ser específico do negócio (serviços, preços "a partir de", diferenciais, dúvidas reais), não genérico.`

export function buildPlanMessage(brief: SiteBrief, includeLiteral = true): string {
  const phone = phoneDigits(brief.phone)
  return [
    brief.businessName ? `Negócio: ${brief.businessName}` : 'Negócio: (tire o nome e os dados do pedido abaixo)',
    brief.niche ? `Nicho: ${brief.niche}` : null,
    brief.city ? `Cidade: ${brief.city}` : null,
    phone ? `WhatsApp: ${phone}` : 'WhatsApp: não informado',
    brief.reviews && brief.rating ? `Reputação real: nota ${brief.rating.toLocaleString('pt-BR')} com ${brief.reviews} avaliações` : null,
    `Estilo pedido: ${STYLE_DIRECTIONS[brief.style ?? 'auto']}`,
    brief.assets?.length
      ? `O usuário enviou ${logoOf(brief) ? 'a logo' : 'nenhuma logo'} e ${brief.assets.filter((asset) => asset.kind === 'photo').length} foto(s) do próprio negócio: o site vai usá-las. ${logoOf(brief) ? 'Escolha cores que combinem com uma logo de verdade (sóbrias, sem brigar com ela).' : ''}`
      : null,
    brief.specification ? `Especificação completa com IDs obrigatórios:\n${JSON.stringify(brief.specification)}` : null,
    includeLiteral && brief.details?.trim() ? `Pedido do usuário (siga o que ele pedir de estilo, cores e conteúdo):\n${brief.details.trim()}` : null,
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

// ---------------------------------------------------------------------------
// Contraste: qual cor de texto usar em cada fundo, calculado das cores reais
// (no tema escuro "ink" é claro — sem isto a IA punha texto claro em fundo claro).
// ---------------------------------------------------------------------------

function luminance(hex: string): number {
  const channel = (index: number) => {
    const value = parseInt(hex.slice(1 + index * 2, 3 + index * 2), 16) / 255
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(0) + 0.7152 * channel(1) + 0.0722 * channel(2)
}

export function contrastRatio(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (light + 0.05) / (dark + 0.05)
}

type TextToken = 'ink' | 'paper' | 'white' | 'black'
const BG_COLOR: Record<SectionBackground | 'accent', keyof SitePlan['palette']> = {
  paper: 'paper',
  surface: 'surface',
  ink: 'ink',
  brand: 'brand',
  accent: 'accent',
}

// Cor de texto com mais contraste sobre o fundo (prefere as cores do tema).
export function textOn(plan: SitePlan, bg: SectionBackground | 'accent'): TextToken {
  const background = plan.palette[BG_COLOR[bg]]
  const options: [TextToken, string][] = [
    ['ink', plan.palette.ink],
    ['paper', plan.palette.paper],
    ['white', '#ffffff'],
    ['black', '#000000'],
  ]
  const themed = options.slice(0, 2).map(([token, color]) => [token, contrastRatio(background, color)] as const)
  const best = [...themed].sort((a, b) => b[1] - a[1])[0]
  if (best[1] >= 4.5) return best[0]
  return contrastRatio(background, '#ffffff') >= contrastRatio(background, '#000000') ? 'white' : 'black'
}

export function contrastGuide(plan: SitePlan): string {
  const line = (bg: SectionBackground | 'accent') => {
    const text = textOn(plan, bg)
    return `- bg-${bg}: texto text-${text} (secundário text-${text}/70), bordas border-${text}/10, cartões bg-${text}/5`
  }
  return [
    'CONTRASTE (obrigatório — calculado das cores do tema): em cada fundo use SOMENTE a cor de texto indicada.',
    line('paper'),
    line('surface'),
    line('ink'),
    line('brand'),
    line('accent'),
    `- Botão principal bg-brand: texto text-${textOn(plan, 'brand')}.`,
    '- Cartão por cima de foto: fundo sólido do tema (ex.: bg-paper/95 ou bg-ink/90) e o texto indicado para esse fundo acima. Sobre foto sem cartão: gradiente escuro por cima e texto text-white.',
  ].join('\n')
}

function partInstructions(partId: string, plan: SitePlan, brief: SiteBrief): string {
  const phone = phoneDigits(brief.phone)
  const whatsapp = phone ? `https://wa.me/55${phone}` : '#contato'
  const nav = plan.sections
    .filter((section) => section.id !== 'hero')
    .slice(0, 6)
    .map((section) => `${section.label} (#${section.id})`)
    .join(', ')
  const prototype = brief.mode === 'lead_prototype'
  const routes = prototype ? brief.contactRoutes : null
  const target = routes?.primary ?? (routes?.goal === 'institutional' ? `#${plan.sections.find(section=>section.id === 'servicos')?.id ?? plan.sections.find(section=>section.id !== 'hero')?.id ?? 'hero'}` : '#contato')
  const leadAction = routes?.primary || routes?.goal === 'institutional'
    ? `botao de acao "${routes?.actionLabel ?? 'Conhecer a empresa'}" com link ${target}`
    : 'link interno para #contato com texto de contato pendente; nao prometer envio nem rotular esta ancora como WhatsApp'
  const leadRules = prototype ? ` Regras especificas deste prototipo: Nao inventar horarios, precos, contatos, agendamento confirmado ou outros fatos. Telefone nao confirma WhatsApp. ${routes?.openingHours.length ? `Horarios reais fornecidos: ${JSON.stringify(routes.openingHours)}.` : 'Nenhum horario real foi fornecido: omitir horarios ou indicar que estao pendentes.'}` : ''
  const headerAction = prototype ? leadAction : `botão de ação para o WhatsApp (${whatsapp})`

  if (partId === 'header') {
    return `Escreva o CABEÇALHO: <header data-header class="fixed inset-x-0 top-0 z-50 ..."> com ${logoOf(brief) ? 'a LOGO do negócio (imagem enviada — veja abaixo)' : 'logotipo tipográfico do negócio (nome com um detalhe na cor brand, e um pequeno ícone SVG coerente com o nicho)'}, menu com os links: ${nav}, e ${headerAction}. No mobile, botão data-menu-toggle (ícone de menu) e um painel data-menu com class "hidden" contendo os mesmos links e o botão. O cabeçalho começa transparente sobre o topo (o topo é "${plan.sections[0]?.bg ?? 'paper'}") — no topo o texto do cabeçalho é text-${textOn(plan, plan.sections[0]?.bg ?? 'paper')}; ao rolar ele ganha fundo bg-paper/85 com backdrop-blur (o script marca [data-scrolled]) e o texto passa a text-${textOn(plan, 'paper')}. Escreva as classes do estado rolado com o prefixo "data-[scrolled]:" (ex.: data-[scrolled]:bg-paper/85 data-[scrolled]:text-${textOn(plan, 'paper')} data-[scrolled]:backdrop-blur data-[scrolled]:shadow-sm). O painel do menu mobile tem fundo bg-paper e texto text-${textOn(plan, 'paper')}.${leadRules}`
  }
  if (partId === 'footer') {
    if (prototype) return `Escreva o RODAPE: <footer> com nome do negocio, frase curta, links do menu (${nav}), cidade ${brief.city ?? 'nao informada'} e "© <span data-year></span> ${brief.businessName}". ${routes?.contacts.length ? `Exibir somente estes canais reais: ${JSON.stringify(routes.contacts)}.` : 'Contato pendente: nao criar canal ficticio.'} ${routes?.confirmedWhatsapp ? `Pode adicionar botao flutuante de WhatsApp somente para o destino confirmado ${routes.confirmedWhatsapp}, com aria-label.` : 'Nao adicionar botao flutuante de WhatsApp nem usar #contato como se fosse WhatsApp.'}${leadRules}`
    return `Escreva o RODAPÉ: <footer> com o nome do negócio, frase curta, links do menu (${nav}), contato (WhatsApp ${phone ?? 'não informado'}, cidade ${brief.city ?? ''}), horário de funcionamento plausível e "© <span data-year></span> ${brief.businessName}". Depois do </footer>, um botão flutuante de WhatsApp: <a href="${whatsapp}" ... class="fixed bottom-5 right-5 z-50 ... bg-[#25D366] ..."> com o ícone do WhatsApp em SVG e aria-label.`
  }
  const section = plan.sections.find((item) => item.id === partId)
  const bgClass = { paper: 'bg-paper', surface: 'bg-surface', ink: 'bg-ink', brand: 'bg-brand' }[section?.bg ?? 'paper']
  const sectionText = textOn(plan, section?.bg ?? 'paper')
  const hero =
    partId === 'hero'
      ? prototype
        ? ` Esta e a primeira secao: min-h-[88vh], pt-28 para o cabecalho fixo, titulo curto e especifico em text-5xl md:text-7xl, subtitulo e ${leadAction}. Usar destaques somente de fatos fornecidos e visual coerente com o negocio; nao criar numeros, horarios ou precos para preencher o layout.`
        : ' Esta é a primeira seção (o cabeçalho fixo fica por cima): min-h-[88vh], com pt-28 para não ficar atrás do cabeçalho, título curto e específico em text-5xl md:text-7xl, subtítulo de até 2 linhas, botão principal para o WhatsApp + secundário, uma faixa curta de destaques verdadeiros logo abaixo (a reputação real, se informada; senão, facilidades como agendamento, horário ou localização) e um visual marcante (foto grande em cartão arredondado com 1–2 cartões flutuantes com informações verdadeiras como horário, preço a partir de ou bairro, ou foto de fundo com gradiente por cima).'
      : ''
  return `Escreva SOMENTE a seção <section id="${partId}" class="${bgClass} ..."> — "${section?.label ?? partId}". Briefing: ${section?.brief ?? ''}${hero}${
    ` Fundo desta seção: ${bgClass} — texto principal text-${sectionText}, secundário text-${sectionText}/70.`
  } ${prototype ? `Acao de contato: ${leadAction}.${leadRules}` : `Link do WhatsApp: ${whatsapp}.`}`
}

export function buildPartMessage(partId: string, plan: SitePlan, brief: SiteBrief): string {
  const specification = brief.specification ?? plan.specification
  const ids = new Set([...(plan.globalRequirementIds ?? []), ...(plan.sections.find(section=>section.id === partId)?.requirementIds ?? [])])
  const scoped = specification ? {
    constraints: specification.constraints, forbiddenChanges: specification.forbiddenChanges,
    requirements: specification.requirements.filter(requirement=>ids.has(requirement.id) && requirement.status !== 'limited'),
    limitations: specification.limitations,
  } : null
  const {specification: _specification, ...visualPlan} = plan
  return [
    `Negócio: ${brief.businessName}${brief.niche ? ` · ${brief.niche}` : ''}${brief.city ? ` · ${brief.city}` : ''}`,
    brief.reviews && brief.rating ? `Reputação real: nota ${brief.rating.toLocaleString('pt-BR')} com ${brief.reviews} avaliações` : null,
    scoped ? `Requisitos desta parte:\n${JSON.stringify(scoped)}` : brief.details?.trim() ? `Pedido do cliente: ${brief.details.trim()}` : null,
    realFacts(brief),
    `Plano do site (siga à risca):\n${JSON.stringify(visualPlan)}`,
    imagesMessage(brief),
    contrastGuide(plan),
    partInstructions(partId, plan, brief),
  ]
    .filter(Boolean)
    .join('\n\n')
}

// Lembrete explícito em cada pedido: a IA respeita melhor assim.
function realFacts(brief: SiteBrief): string {
  const reputation =
    brief.rating && brief.reviews
      ? `nota ${brief.rating.toLocaleString('pt-BR')} com ${brief.reviews} avaliações (reais, pode usar)`
      : 'nenhuma nota nem avaliação informada — NÃO mostre nota, estrelas, avaliações nem depoimentos'
  if (brief.mode === 'lead_prototype') return `FATOS REAIS DO NEGOCIO: ${reputation}. Use somente fatos fornecidos e confirmados; inferencias continuam hipoteses. Nao invente ano de fundacao, experiencia, quantidade de clientes, precos, descontos ou horarios. Precos e horarios reais informados podem ser usados; sem eles, omitir ou indicar que estao pendentes, nunca criar valores plausiveis nem "a partir de" ficticio.`
  return `FATOS REAIS DO NEGÓCIO: ${reputation}. Não existe nenhum outro número sobre o negócio: não escreva ano de fundação, anos de experiência nem quantidade de clientes/atendimentos que não estejam no pedido do cliente. Preços e horários informados podem ser usados; sem eles, use "a partir de" plausível.`
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
- (2 a 6 itens curtos, 1ª pessoa, em linguagem simples, sem termos técnicos, contando exatamente o que você mudou)
</acoes>
Depois, só o que muda:
- Ajuste localizado em parte existente (preferido para texto, imagem, link ou classe): <substituir id="id">{"antes":"trecho EXATO do código atual, único nesta parte","depois":"novo trecho"}</substituir>. Use JSON válido; preserve todos os outros caracteres. Pode repetir para trechos diferentes.
- Parte redesenhada por pedido explícito: <parte id="id">HTML completo da parte</parte>
- Nova seção: <parte id="novo-id" depois="id-da-parte-anterior" rotulo="Nome no menu">HTML da seção</parte>
- Remover uma seção: <remover id="id"/>
- Mudar cores ou fontes do site inteiro: <tema>{"palette": {...só as cores que mudam...}, "fonts": {...}}</tema>
Mantenha tudo o que não foi pedido exatamente igual. Se o pedido afetar o menu (seção nova/removida), devolva também o cabeçalho e o rodapé atualizados.`

export function buildEditMessage(plan: SitePlan, parts: SiteParts, instruction: string, brief: SiteBrief, fresh: SiteAsset[] = [], recent: RecentEditContext[] = []): string {
  const current = partOrder(plan)
    .filter((id) => parts[id])
    .map((id) => `<parte id="${id}">\n${parts[id]}\n</parte>`)
    .join('\n')
  return [
    `Negócio: ${brief.businessName}${brief.niche ? ` · ${brief.niche}` : ''}${brief.city ? ` · ${brief.city}` : ''}`,
    `Tema atual: ${JSON.stringify({ palette: plan.palette, fonts: plan.fonts, theme: plan.theme })}`,
    `Estrutura existente: ${JSON.stringify(plan.sections.map(({id,label})=>({id,label})))}`,
    brief.specification ? `Requisitos e restrições existentes:\n${JSON.stringify(brief.specification)}` : brief.details ? `Pedido original:\n${brief.details}` : null,
    recent.length ? `Alterações anteriores, da mais recente para a mais antiga:\n${JSON.stringify(recent)}` : null,
    contrastGuide(plan),
    `Partes atuais do site:\n${current}`,
    imagesMessage(brief, fresh),
    fresh.length > 0
      ? `O usuário anexou ${fresh.length} imagem(ns) junto com este pedido (marcadas como "anexada agora" acima): use-as onde ele pedir; se ele não disser onde, a logo vai no cabeçalho/rodapé e as fotos no topo ou na galeria.`
      : null,
    `Pedido atual do usuário (prioridade máxima):\n${instruction.trim()}`,
  ]
    .filter(Boolean)
    .join('\n\n')
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

// Fatos que a IA costuma inventar (nota, avaliações, anos de mercado,
// quantidade de clientes). Só ficam se estiverem no que a pessoa informou.
const CLAIM_PATTERNS = [
  /\d+(?:[.,]\d+)?\s*(?:★|estrelas?)/i,
  /\bnota\s+(?:m[eé]dia\s+)?(?:de\s+)?\d/i,
  /\d[\d.]*\+?\s*(?:avalia[çc][õo]es|reviews|depoimentos)/i,
  /\bdesde\s+(?:19|20)\d{2}\b/i,
  /\b(?:\d+|dez|quinze|vinte|trinta)\+?\s+anos\s+(?:de|no|na|em|atendendo|cuidando)/i,
  /\d[\d.]*\+?\s*(?:mil\s+)?(?:clientes|carros|ve[ií]culos|atendimentos|cortes|pacientes|alunos|pets|projetos|obras|im[oó]veis|casamentos|pedidos)\b/i,
]

// Sem reputação informada, estas seções só teriam números inventados.
const INVENTED_SECTIONS = /^(?:numeros|depoimentos|avaliacoes|resultados|estatisticas|prova-social)$/

// Tira as frases com fatos que ninguém informou.
export function stripInventedClaims(text: string, brief: SiteBrief): string {
  const rating = brief.rating ? `${brief.rating} ${String(brief.rating).replace('.', ',')}` : ''
  const facts = normalize(`${brief.details ?? ''} ${rating} ${brief.reviews ?? ''}`)
  return text
    .split(/(?<=[.!?;])\s+/)
    .filter((sentence) => {
      const claim = CLAIM_PATTERNS.map((pattern) => sentence.match(pattern)?.[0]).find(Boolean)
      if (!claim) return true
      const number = claim.match(/\d[\d.,]*/)?.[0]
      return Boolean(number && facts.includes(number))
    })
    .join(' ')
    .trim()
}

// Confere e completa o plano: nunca deixa o site sem cores/fontes válidas.
export function normalizePlan(raw: unknown, brief: SiteBrief): SitePlan | null {
  if (!raw || typeof raw !== 'object') return null
  const input = raw as Record<string, any>
  const specification = brief.specification ?? (input.specification ? normalizeSpecification(input.specification, brief.details ?? '') : undefined)
  const validIds = new Set(specification?.requirements.map(requirement=>requirement.id) ?? [])
  const requirementIds = (value: unknown): string[] => Array.isArray(value) ? [...new Set(value.filter((id): id is string => typeof id === 'string' && validIds.has(id)))] : []
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
    if (INVENTED_SECTIONS.test(id) && !(brief.rating && brief.reviews)) continue
    seen.add(id)
    const bg = ['paper', 'surface', 'ink', 'brand'].includes(item?.bg) ? item.bg : 'paper'
    sections.push({
      id,
      label: String(item?.label ?? id).slice(0, 30),
      brief: stripInventedClaims(String(item?.brief ?? ''), brief).slice(0, 800),
      bg,
      requirementIds: requirementIds(item.requirementIds),
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
    description: stripInventedClaims(String(input.description ?? ''), brief).slice(0, 200),
    direction: stripInventedClaims(String(input.direction ?? ''), brief).slice(0, 400),
    theme: input.theme === 'dark' ? 'dark' : 'light',
    palette,
    fonts: {
      display: cleanFont(input.fonts?.display, 'Inter'),
      body: cleanFont(input.fonts?.body, 'Inter'),
    },
    sections,
    ...(specification ? {specification, globalRequirementIds:requirementIds(input.globalRequirementIds)} : {}),
  }
}

export interface BusinessInfo {
  name: string | null
  niche: string | null
  city: string | null
  phone: string | null
}

function cleanText(value: unknown, max: number): string | null {
  const text = typeof value === 'string' ? value.trim().slice(0, max) : ''
  return text && text.toLowerCase() !== 'null' ? text : null
}

export function parsePlan(text: string, brief: SiteBrief): { actions: string[]; plan: SitePlan | null; business: BusinessInfo | null } {
  const raw = text.match(/<plano>([\s\S]*?)<\/plano>/i)?.[1]
  let plan: SitePlan | null = null
  let business: BusinessInfo | null = null
  if (raw) {
    try {
      const json = JSON.parse(raw.trim().replace(/^```(?:json)?|```$/g, ''))
      plan = normalizePlan(json, brief)
      const info = json?.business
      if (info && typeof info === 'object') {
        business = {
          name: cleanText(info.name, 120),
          niche: cleanText(info.niche, 80),
          city: cleanText(info.city, 80),
          phone: phoneDigits(cleanText(info.phone, 30)),
        }
      }
    } catch {
      plan = null
    }
  }
  return { actions: parseActions(text), plan, business }
}

// Pedido escrito livremente: completa o briefing com o que a IA tirou dele
// (sem trocar o que a pessoa já tinha informado).
export function fillBrief(brief: SiteBrief, business: BusinessInfo | null): SiteBrief {
  if (!business) return brief
  return {
    ...brief,
    businessName: brief.businessName || business.name || 'Meu negócio',
    niche: brief.niche || business.niche,
    city: brief.city || business.city,
    phone: brief.phone || business.phone,
  }
}

// Limpa um pedaço de HTML escrito pela IA: sem scripts, estilos ou documento.
export function cleanFragment(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<script[^>]*>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<\/?(?:html|head|body)\b[^>]*>/gi, '')
    .replace(/<!doctype[^>]*>/gi, '')
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*')/gi, '')
    .trim()
}

// ---------------------------------------------------------------------------
// Estrutura de cada parte: às vezes a IA escreve mais do que a parte pedida
// (até o site inteiro dentro do rodapé) ou deixa uma tag aberta — um <svg>
// sem fechar engole o resto da página. Aqui cada parte fica só com o seu
// bloco e com todas as tags fechadas.
// ---------------------------------------------------------------------------

const TAG = /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][\w:-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g
const VOID_TAGS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr'])

// Fecha o que ficou aberto e descarta fechamentos sem abertura.
export function balanceHtml(html: string): string {
  const stack: string[] = []
  let out = ''
  let last = 0
  for (const match of html.matchAll(TAG)) {
    const [raw, slash, rawName, attrs] = match
    out += html.slice(last, match.index)
    last = match.index! + raw.length
    if (!rawName) {
      out += raw
      continue
    }
    const name = rawName.toLowerCase()
    if (!slash) {
      out += raw
      if (!VOID_TAGS.has(name) && !/\/\s*$/.test(attrs)) stack.push(name)
      continue
    }
    const index = stack.lastIndexOf(name)
    if (index < 0) continue
    while (stack.length > index + 1) out += `</${stack.pop()}>`
    stack.pop()
    out += raw
  }
  out += html.slice(last).replace(/<[^>]*$/, '')
  while (stack.length) out += `</${stack.pop()}>`
  return out
}

// Início e fim do primeiro elemento `tag` (que passe no filtro), com o que tem dentro.
function findElement(html: string, tag: string, accept: (attrs: string) => boolean = () => true): { start: number; end: number } | null {
  let depth = 0
  let start = -1
  for (const match of html.matchAll(TAG)) {
    const [raw, slash, rawName, attrs] = match
    if (rawName?.toLowerCase() !== tag) continue
    if (!slash) {
      if (/\/\s*$/.test(attrs)) continue
      if (start < 0) {
        if (!accept(attrs)) continue
        start = match.index!
      }
      depth++
    } else if (start >= 0 && --depth === 0) {
      return { start, end: match.index! + raw.length }
    }
  }
  return start >= 0 ? { start, end: html.length } : null
}

const hasId = (id: string) => (attrs: string) => new RegExp(`\\bid\\s*=\\s*["']${id}["']`, 'i').test(attrs)

export function normalizePart(partId: string, html: string): string {
  if (!html.trim()) return ''
  if (partId === 'header') {
    const found = findElement(html, 'header')
    if (!found) return `<header data-header class="fixed inset-x-0 top-0 z-50 transition">\n${balanceHtml(html)}\n</header>`
    const header = balanceHtml(html.slice(found.start, found.end))
    return /^<header\b[^>]*\bdata-header\b/i.test(header) ? header : header.replace(/^<header\b/i, '<header data-header')
  }
  if (partId === 'footer') {
    const found = findElement(html, 'footer')
    if (!found) {
      // Sem <footer>: se parece o site inteiro (cabeçalho/várias seções), descarta
      // (quem chama usa o rodapé simples); senão, embrulha como rodapé.
      const sections = (html.match(/<section\b/gi) ?? []).length
      if (/<(header|main)\b/i.test(html) || sections > 1) return ''
      return `<footer>\n${balanceHtml(html)}\n</footer>`
    }
    const footer = balanceHtml(html.slice(found.start, found.end))
    // O botão flutuante de WhatsApp vem logo depois do rodapé.
    const rest = html.slice(found.end)
    const floating = findElement(rest, 'a', (attrs) => /\bfixed\b/.test(attrs))
    return floating ? `${footer}\n${balanceHtml(rest.slice(floating.start, floating.end))}` : footer
  }
  const found = findElement(html, 'section', hasId(partId)) ?? findElement(html, 'section')
  if (!found) return `<section id="${partId}">\n${balanceHtml(html)}\n</section>`
  const section = balanceHtml(html.slice(found.start, found.end))
  // Os links do menu usam o id da seção: mantém o que veio, só completa se faltar.
  return /^<section\b[^>]*\sid\s*=/i.test(section) ? section : section.replace(/^<section\b/i, `<section id="${partId}"`)
}

// Rodapé de reserva, montado aqui: usado quando a IA não entrega um rodapé
// aproveitável — o site nunca fica travado por causa dele.
export function simpleFooter(plan: SitePlan, brief: SiteBrief): string {
  const phone = phoneDigits(brief.phone)
  const whatsappUrl = brief.mode === 'lead_prototype' ? brief.contactRoutes?.confirmedWhatsapp : phone ? `https://wa.me/55${phone}` : null
  const name = escapeHtml(brief.businessName || plan.title)
  const text = textOn(plan, 'ink')
  const links = plan.sections
    .filter((section) => section.id !== 'hero')
    .slice(0, 6)
    .map((section) => `<a href="#${section.id}" class="hover:text-${text}">${escapeHtml(section.label)}</a>`)
    .join('')
  const whatsapp = whatsappUrl
    ? `\n<a href="${escapeHtml(whatsappUrl)}" target="_blank" rel="noopener" aria-label="Conversar pelo WhatsApp" class="fixed bottom-5 right-5 z-50 flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-105"><svg viewBox="0 0 24 24" class="size-7" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.6 14.2c-.2.7-1.4 1.3-2 1.4-.5.1-1.2.1-1.9-.1a17 17 0 0 1-1.7-.6 13.4 13.4 0 0 1-5.2-4.6c-.4-.5-1-1.4-1-2.7 0-1.2.7-1.9.9-2.2.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.6-.4.4c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.1.1.7-.1 1.3Z"/></svg></a>`
    : ''
  return `<footer class="bg-ink py-12 text-${text}">
<div class="mx-auto flex max-w-6xl flex-col gap-6 px-5 md:flex-row md:items-center md:justify-between md:px-8">
<div><p class="font-display text-xl font-semibold">${name}</p>${brief.city ? `<p class="mt-1 text-sm text-${text}/70">${escapeHtml(brief.city)}</p>` : ''}</div>
<nav class="flex flex-wrap gap-x-6 gap-y-2 text-sm text-${text}/70">${links}</nav>
</div>
<p class="mx-auto mt-8 max-w-6xl px-5 text-xs text-${text}/60 md:px-8">© <span data-year></span> ${name}</p>
</footer>${whatsapp}`
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
  replacements?: { id: string; before: string; after: string }[]
  removals: string[]
  theme: { palette?: Partial<SitePlan['palette']>; fonts?: Partial<SitePlan['fonts']> } | null
}

export function parseEdit(text: string): EditResult {
  const parts: EditResult['parts'] = []
  const replacements: NonNullable<EditResult['replacements']> = []
  for (const match of text.matchAll(/<substituir\s+id="([^"]+)">([\s\S]*?)<\/substituir>/gi)) {
    try {
      const patch = JSON.parse(match[2])
      const id = cleanId(match[1])
      if (!id || typeof patch.antes !== 'string' || !patch.antes || typeof patch.depois !== 'string') throw new Error()
      replacements.push({ id, before: patch.antes, after: patch.depois })
    } catch {
      throw new Error('A edição veio incompleta. Tente novamente.')
    }
  }
  if ((text.match(/<substituir\b/gi) ?? []).length !== replacements.length ||
      (text.match(/<parte\b/gi) ?? []).length !== (text.match(/<\/parte>/gi) ?? []).length) {
    throw new Error('A edição veio incompleta. Tente novamente.')
  }
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
  return { actions: parseActions(text), parts, replacements, removals, theme }
}

// Aplica uma alteração ao plano e às partes (sem mexer no original).
export function applyEdit(plan: SitePlan, parts: SiteParts, edit: EditResult): { plan: SitePlan; parts: SiteParts } {
  const nextPlan: SitePlan = { ...plan, palette: { ...plan.palette }, fonts: { ...plan.fonts }, sections: [...plan.sections] }
  const nextParts: SiteParts = { ...parts }

  for (const patch of edit.replacements ?? []) {
    const source = nextParts[patch.id]
    if (!source || source.indexOf(patch.before) < 0 || source.indexOf(patch.before) !== source.lastIndexOf(patch.before) ||
        edit.parts.some(part => part.id === patch.id) || edit.removals.includes(patch.id)) {
      throw new Error('O trecho da edição não corresponde a uma única parte atual. Tente novamente.')
    }
    const updated = source.replace(patch.before, () => patch.after)
    if (!updated.trim() || /<(?:script|style)\b/i.test(updated)) throw new Error('O trecho da edição é inválido. Tente novamente.')
    nextParts[patch.id] = updated
  }

  for (const id of edit.removals) {
    if (id === 'header' || id === 'footer' || id === 'hero') continue
    nextPlan.sections = nextPlan.sections.filter((section) => section.id !== id)
    delete nextParts[id]
  }
  for (const part of edit.parts) {
    const html = normalizePart(part.id, part.html)
    if (!html) throw new Error('A IA devolveu uma parte vazia. Tente novamente.')
    const known = part.id === 'header' || part.id === 'footer' || nextPlan.sections.some((section) => section.id === part.id)
    if (!known) {
      const index = part.after ? nextPlan.sections.findIndex((section) => section.id === part.after) : -1
      const section: PlanSection = { id: part.id, label: part.label ?? part.id, brief: '', bg: 'paper' }
      if (index >= 0) nextPlan.sections.splice(index + 1, 0, section)
      else nextPlan.sections.push(section)
    }
    nextParts[part.id] = html
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
      if (parts[id]) return normalizePart(id, parts[id])
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

// O site abre direto em /apelido. Estes nomes são telas do próprio Code Sellers
// e não podem virar apelido (a mesma lista está no banco, em 0034).
export const RESERVED_SLUGS = [
  'login', 'register', 'forgot-password', 'proposta', 'sala-de-receita', 'aluno', 'prospection', 'crm',
  'portfolio', 'deals', 'financial', 'tasks', 'relatorios', 'copilot', 'autopilot', 'code-maker', 'settings',
  'support', 'agenda', 'assets', 'downloads', 'api', 'admin', 'app', 'auth', 'dashboard', 'entrar', 'cadastro',
  'termos', 'privacidade', 'ajuda', 'suporte', 'precos', 'planos', 'blog', 'reset-password', 'signup', 'logout',
] as const

export function isReservedSlug(slug: string): boolean {
  return (RESERVED_SLUGS as readonly string[]).includes(slug)
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
