// Instruções da IA do Code Maker. Partes puras (sem Deno), testadas em
// src/utils/codeMaker.test.mjs.

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

const STYLE_DIRECTIONS: Record<SiteStyle, string> = {
  auto: 'Escolha a direção de arte que mais combina com o nicho e o público (não use roxo/violeta a não ser que faça sentido para o negócio). Diga qual escolheu nas ações.',
  dark: 'Moderno escuro: fundo quase preto (#0a0a0a a #111), superfícies levemente mais claras, UM acento vibrante que combine com o nicho, tipografia sans geométrica (ex.: "Space Grotesk" nos títulos + "Inter" no texto), bordas finas e brilhos sutis.',
  minimal: 'Minimalista claro: fundo branco/off-white, muito respiro, preto para texto, UM acento discreto, tipografia "Manrope" ou "Inter", fotos grandes, linhas finas, nada de sombras pesadas.',
  elegant: 'Elegante/premium: tipografia serifada nos títulos ("Playfair Display" ou "Cormorant Garamond") + sans limpa no texto, paleta sofisticada (creme, carvão, dourado ou verde-escuro), detalhes finos e ritmo editorial.',
  vibrant: 'Vibrante: cores fortes e alegres com contraste bem resolvido, formas arredondadas, tipografia "Outfit" ou "Poppins", energia sem virar bagunça.',
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

export const SYSTEM_PROMPT = `Você é o Code Maker, um designer e desenvolvedor front-end sênior que cria sites de altíssimo nível para pequenos negócios brasileiros — o mesmo padrão de qualidade de ferramentas como v0 e Lovable. Cada site precisa parecer feito sob medida por uma agência premium, nunca um template genérico.

FORMATO DA RESPOSTA (obrigatório, nesta ordem, sem nada antes ou depois):
<acoes>
- (4 a 8 itens curtos, em português, 1ª pessoa, contando o que você fez: estrutura, direção de arte, seções, detalhes)
</acoes>
\`\`\`html
<!doctype html>
... o documento HTML COMPLETO ...
</html>
\`\`\`

TECNOLOGIA
- Um único arquivo HTML completo, com <meta charset="utf-8">, <meta name="viewport" content="width=device-width, initial-scale=1">, <title> e <meta name="description"> específicos do negócio, lang="pt-BR".
- Tailwind via <script src="https://cdn.tailwindcss.com"></script>, com tailwind.config no <script> logo depois (cores da marca e fontes em theme.extend).
- Google Fonts via <link>. Ícones SEMPRE como SVG inline no estilo "lucide" (stroke="currentColor", stroke-width 1.5–2, fill none). Nunca use emoji como ícone.
- JavaScript só vanilla e pequeno no fim do <body>: menu mobile, rolagem suave, revelar ao rolar (IntersectionObserver), acordeão do FAQ. Nenhuma outra biblioteca.
- Imagens: use SOMENTE as URLs da lista "Fotos disponíveis" que vem no pedido (pode mudar só o parâmetro w=). Nunca invente outras URLs de imagem. Se faltar foto para uma seção, resolva com design (gradientes, formas, números grandes, ícones), não com mais fotos. Sempre alt descritivo, object-cover e loading="lazy" (exceto a principal). Avatares de depoimentos: iniciais em círculo colorido, nunca foto.
- Links externos com target="_blank" rel="noopener". WhatsApp: https://wa.me/55DDDNUMERO?text=MENSAGEM-URL-ENCODED.

DESIGN (o que separa um site premium de um genérico — siga à risca)
- Direção de arte clara e consistente: 1 cor principal + neutros bem escolhidos, 2 fontes no máximo, mesmo raio de borda (ex.: rounded-2xl/3xl) e sombras suaves em todo o site. Defina as cores no tailwind.config e use-as.
- Hero de impacto: min-h-[88vh]; OU foto em tela cheia com overlay em gradiente e texto por cima, OU layout em duas colunas com a foto em cartão grande arredondado e 1–2 cartões flutuantes com dados reais (nota, anos, clientes). Acima do título um selo/pill pequeno (ex.: "Barbearia em Campinas"). Título curto e específico com text-5xl md:text-7xl, font-semibold ou bold, tracking-tight, leading-[1.05]; subtítulo com no máximo 2 linhas; botão principal cheio + secundário contornado; prova social logo abaixo (estrelas + nota + nº de avaliações).
- Ritmo: alterne fundos entre seções (claro/escuro ou branco/off-white), use layouts diferentes em cada seção (bento grid com um card maior, colunas assimétricas 5/7, faixa escura de números, carrossel/lista horizontal). Nunca 4 seções seguidas com o mesmo formato de 3 cards.
- Serviços: cards com ícone, nome, 1 linha de descrição, preço "a partir de" em destaque e hover (translate/elevação/borda na cor da marca).
- Detalhes que dão acabamento: rótulos pequenos em caixa alta com tracking largo acima dos títulos de seção, números grandes (text-4xl+) para estatísticas, divisórias finas, brilhos radiais sutis ou padrão de grade em CSS no fundo de 1–2 seções, fotos com rounded-3xl e leve sombra, cabeçalho fixo com backdrop-blur que ganha fundo ao rolar, botão flutuante de WhatsApp (canto inferior direito) com a cor oficial #25D366.
- Botões: rounded-full, px-6 py-3.5, font-semibold, sombra na cor da marca, estados hover/focus claros.
- Espaçamento generoso (seções py-20 md:py-28, container max-w-6xl/7xl px-5 md:px-8), textos com max-w-prose, hierarquia tipográfica evidente.
- Animação: elementos com a classe "reveal" começam com opacity-0 translate-y-6 e entram ao aparecer (IntersectionObserver), com transição de 600–800ms. Nada exagerado.
- 100% responsivo (mobile-first, bonito em 360px e em 1440px), menu mobile funcional, contraste AA, HTML semântico (header, main, section com id, footer).

CONTEÚDO (em português do Brasil, específico, sem enrolação)
- Nada de lorem ipsum, "[Nome]", "Seu texto aqui", "Bem-vindo ao nosso site", "somos uma empresa comprometida com a excelência" ou frases vazias.
- Escreva como o dono do negócio falaria com o cliente dele: serviços reais do nicho com descrições curtas e preços "a partir de" plausíveis, diferenciais concretos, depoimentos com nome e contexto, perguntas frequentes reais do nicho, horário de funcionamento plausível.
- Seções recomendadas (adapte ao nicho): cabeçalho, hero, prova social, serviços, como funciona/diferenciais, galeria, depoimentos, sobre, localização e horário (mapa com <iframe src="https://www.google.com/maps?q=CIDADE&output=embed">), FAQ, chamada final, rodapé.
- Todos os botões de contato levam ao WhatsApp com uma mensagem pronta coerente com o botão. Sem telefone informado, leve os botões para a seção #contato.

EDIÇÕES
- Quando receber o HTML atual e um pedido, mude SOMENTE o que foi pedido (e o que for consequência direta), mantendo todo o resto idêntico, e devolva o documento completo no mesmo formato (ações + html).`

function phoneDigits(phone: string | null | undefined): string | null {
  let digits = phone?.replace(/\D/g, '') ?? ''
  if (digits.length === 13 && digits.startsWith('55')) digits = digits.slice(2)
  return digits.length === 10 || digits.length === 11 ? digits : null
}

export function buildCreateMessage(brief: SiteBrief): string {
  const phone = phoneDigits(brief.phone)
  const lines = [
    `Crie o site de: ${brief.businessName}`,
    brief.niche ? `Nicho: ${brief.niche}` : null,
    brief.city ? `Cidade: ${brief.city}` : null,
    phone ? `WhatsApp: ${phone} (use https://wa.me/55${phone})` : 'WhatsApp: não informado',
    brief.reviews && brief.rating
      ? `Reputação real: nota ${brief.rating.toLocaleString('pt-BR')} com ${brief.reviews} avaliações (use na prova social)`
      : null,
    `Direção de arte: ${STYLE_DIRECTIONS[brief.style ?? 'auto']}`,
    brief.details?.trim() ? `O que o cliente quer / detalhes:\n${brief.details.trim()}` : null,
    `Fotos disponíveis (use somente estas):\n${photoCatalog(brief.niche)}`,
  ]
  return lines.filter(Boolean).join('\n')
}

export function buildEditMessages(
  currentHtml: string,
  instruction: string,
  niche?: string | null,
): { role: 'user' | 'assistant'; content: string }[] {
  return [
    { role: 'user', content: `HTML atual do site:\n\`\`\`html\n${currentHtml}\n\`\`\`` },
    {
      role: 'user',
      content: `Pedido de alteração: ${instruction.trim()}\n\nSe precisar de fotos novas, use somente estas:\n${photoCatalog(niche)}`,
    },
  ]
}

// Separa as ações e o HTML da resposta (também funciona com a resposta
// ainda chegando, para mostrar ao vivo).
export function parseMakerOutput(text: string): { actions: string[]; html: string; complete: boolean } {
  const actionsBlock = text.match(/<acoes>([\s\S]*?)(?:<\/acoes>|$)/i)?.[1] ?? ''
  const actions = actionsBlock
    .split('\n')
    .map((line) => line.replace(/^\s*[-*•]\s*/, '').trim())
    .filter(Boolean)
  const fenceStart = text.search(/```html\s*/i)
  let html = ''
  if (fenceStart >= 0) {
    html = text.slice(fenceStart).replace(/^```html\s*/i, '')
    const fenceEnd = html.lastIndexOf('```')
    if (fenceEnd >= 0) html = html.slice(0, fenceEnd)
  } else {
    const doc = text.search(/<!doctype html|<html/i)
    if (doc >= 0) html = text.slice(doc)
  }
  html = html.trim()
  return { actions, html, complete: /<\/html>\s*$/i.test(html) }
}
