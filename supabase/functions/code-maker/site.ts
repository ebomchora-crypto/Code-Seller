// Code Maker — o "motor" dos sites, sem Deno nem banco (testado em
// src/utils/codeMaker.test.mjs). A IA planeja o site e escreve cada parte;
// a base (cores, fontes, menu, animações) é montada aqui, sempre igual e
// sempre funcionando.

import { normalizeSpecification, type CodeMakerSpecification, type RecentEditContext } from './spec.ts'
import { cleanEffects, effectsGuide, effectsMenu, effectsRuntime, MAX_EFFECTS, usedEffects } from './effects.ts'
import {
  BLOCKS,
  blockFor,
  blocksMenu,
  cleanContent,
  ICON_NAMES,
  renderBlock,
  renderFooter,
  renderHeader,
  type Block,
  type BlockContent,
  type BlockTokens,
} from './blocks.ts'

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
  /** Bloco da seção (da biblioteca de blocos). */
  layout?: string
  /** Título exato da seção, decidido no plano para nenhum se repetir. */
  headline?: string
  /** Quantas fotos a seção usa (0 a 4). */
  photos?: number
}

export interface SitePlan {
  title: string
  description: string
  direction: string
  theme: 'dark' | 'light'
  /** Idioma do site (pt-BR por padrão). */
  lang?: string
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
  /** Cantos do site inteiro: arredondado, suave ou reto. */
  radius?: 'round' | 'soft' | 'sharp'
  /** A marca registrada do site: o único elemento ousado, de que o visitante vai lembrar. */
  signature?: string
  /** Seção onde a marca registrada aparece. */
  signatureSection?: string
  /** Efeitos especiais escolhidos para este site (data-fx), no máximo 4. */
  effects?: string[]
  /** Bloco do cabeçalho. */
  header?: string
  /** Texto do botão principal (a mesma ação tem o mesmo nome no site todo). */
  cta?: string
  /** Frase curta do rodapé. */
  tagline?: string
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
  auto: 'Escolha a direção de arte que nasce do mundo deste negócio (os materiais, ferramentas, cores e o jeito de falar do ramo) e do público dele (evite roxo/violeta, a não ser que faça muito sentido para o negócio).',
  dark: 'Moderno escuro: fundo escuro com profundidade e cor própria (grafite, azul-noite, verde-garrafa, vinho, marrom-café — o que combinar com o nicho, não preto chapado), superfícies um pouco mais claras, um acento que venha do próprio negócio, títulos em fonte marcante.',
  minimal: 'Minimalista claro: fundo claro, muito respiro, texto quase preto, UM acento discreto, fotos grandes, precisão no espaçamento e na tipografia.',
  elegant: 'Elegante/premium: títulos em serifada sofisticada, texto em sans limpa, paleta refinada tirada do próprio negócio (ex.: pedra e bronze, verde-escuro e marfim, azul-tinta e areia), ritmo editorial.',
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
    { id: '1605497788044-5a32c7078486', about: 'barbeiro secando o cabelo de cliente sorrindo' },
    { id: '1512690459411-b9245aed614b', about: 'cadeira de barbeiro clássica de couro' },
    { id: '1517832606299-7ae9b720a186', about: 'barba sendo aparada com tesoura (preto e branco)' },
    { id: '1596728325488-58c87691e9af', about: 'barba sendo feita com navalha e escova' },
    { id: '1534297635766-a262cdcb8ee4', about: 'barbeiro cortando cabelo de menino' },
  ],
  salao: [
    { id: '1560066984-138dadb4c035', about: 'salão claro e moderno (hero)' },
    { id: '1522337360788-8b13dee7a37e', about: 'mulher com cabelo longo e bonito' },
    { id: '1521590832167-7bcbfaa6381f', about: 'salão com cadeiras rosadas' },
    { id: '1570172619644-dfd03ed5d881', about: 'tratamento facial / máscara' },
    { id: '1512290923902-8a9f81dc236c', about: 'procedimento estético no rosto' },
    { id: '1562322140-8baeececf3df', about: 'cabeleireira secando o cabelo de cliente' },
    { id: '1595476108010-b4d1f102b1b1', about: 'lavatório: cabeleireira lavando o cabelo da cliente' },
    { id: '1604654894610-df63bc536371', about: 'unhas decoradas (manicure, detalhe)' },
    { id: '1487412947147-5cebf100ffc2', about: 'maquiagem sendo aplicada (rosto em close)' },
    { id: '1516975080664-ed2fc6a32937', about: 'pincéis de maquiagem na bancada' },
  ],
  comida: [
    { id: '1517248135467-4c7edcad34c4', about: 'salão de restaurante aconchegante (hero)' },
    { id: '1414235077428-338989a2e8c0', about: 'prato sendo servido, taças' },
    { id: '1559339352-11d035aa65de', about: 'área externa de restaurante com vista' },
    { id: '1504674900247-0877df9cc836', about: 'pratos vistos de cima' },
    { id: '1540189549336-e6e99c3679fe', about: 'salada colorida' },
    { id: '1509440159596-0249088772ff', about: 'pães artesanais' },
    { id: '1555507036-ab1f4038808a', about: 'croissant com açúcar caindo' },
    { id: '1555396273-367ea4eb4db5', about: 'restaurante/café amplo com mesas de madeira' },
    { id: '1552566626-52f8b828add9', about: 'salão de restaurante com luz quente' },
    { id: '1565299624946-b28f40a0ae38', about: 'pizza artesanal vista de cima' },
    { id: '1568901346375-23c9450c58cd', about: 'hambúrguer artesanal em close' },
    { id: '1546069901-ba9599a7e63c', about: 'bowl saudável colorido' },
    { id: '1495474472287-4d71bcdd2085', about: 'cafés com arte no leite, vistos de cima' },
    { id: '1501339847302-ac426a4a7cbb', about: 'cafeteria com letreiro luminoso "CAFE"' },
  ],
  saude: [
    { id: '1629909613654-28e377c37b09', about: 'consultório odontológico claro e moderno (hero)' },
    { id: '1588776814546-1ffcf47267a5', about: 'dentista analisando raio-x' },
    { id: '1606811971618-4486d14f3f99', about: 'atendimento odontológico (detalhe)' },
    { id: '1519494026892-80bbd2d6fd0d', about: 'recepção de clínica' },
    { id: '1576091160399-112ba8d25d1d', about: 'médico de jaleco e estetoscópio' },
    { id: '1606811841689-23dfddce3e95', about: 'dentista explicando o tratamento à paciente na cadeira' },
    { id: '1631217868264-e5b90bb7e133', about: 'médica conversando com paciente no consultório' },
    { id: '1559839734-2b71ea197ec2', about: 'retrato de médica sorrindo ao ar livre' },
    { id: '1584515933487-779824d29309', about: 'mãos dadas, cuidado e acolhimento' },
  ],
  auto: [
    { id: '1487754180451-c456f719a1fc', about: 'mecânico trocando óleo do motor (hero)' },
    { id: '1619642751034-765dfdf7c58e', about: 'mãos com ferramenta no motor' },
    { id: '1486262715619-67b85e0b08d3', about: 'motor de carro em detalhe' },
    { id: '1530046339160-ce3e530c7d2f', about: 'oficina organizada com ferramentas' },
    { id: '1625047509248-ec889cbff17f', about: 'mecânico com o capô aberto, motor à mostra' },
    { id: '1492144534655-ae79c964c9d7', about: 'carro esportivo branco em garagem escura' },
    { id: '1580273916550-e323be2ae537', about: 'carro esportivo cinza na estrada ao entardecer' },
    { id: '1503376780353-7e6692767b70', about: 'carro preto em movimento na rodovia' },
  ],
  fitness: [
    { id: '1534438327276-14e5300c3a48', about: 'academia com halteres (hero)' },
    { id: '1571902943202-507ec2618e8f', about: 'academia ampla e iluminada' },
    { id: '1517836357463-d25dfeac3438', about: 'levantamento de peso (detalhe)' },
    { id: '1540497077202-7c8a3999166f', about: 'academia clara com aparelhos e bicicletas' },
    { id: '1581009146145-b5ef050c2e1e', about: 'homem treinando bíceps com barra' },
    { id: '1517963879433-6ad2b056d712', about: 'levantamento terra com anilhas (detalhe)' },
    { id: '1518611012118-696072aa579a', about: 'aula em grupo no colchonete (pilates/funcional)' },
  ],
  juridico: [
    { id: '1589829545856-d10d557cf95f', about: 'estátua da justiça (hero)' },
    { id: '1505664194779-8beaceb93744', about: 'biblioteca com livros antigos' },
    { id: '1450101499163-c8848c66ca85', about: 'assinatura de documento' },
    { id: '1554224155-6726b3ff858f', about: 'documentos e calculadora (contabilidade)' },
    { id: '1521791055366-0d553872125f', about: 'mão assinando contrato com caneta' },
    { id: '1497215728101-856f4ea42174', about: 'escritório claro com vista da cidade' },
    { id: '1573497019940-1c28c88b4f3e', about: 'retrato de profissional sorridente' },
  ],
  pet: [
    { id: '1548199973-03cce0bbc87b', about: 'dois cachorros correndo felizes (hero)' },
    { id: '1587300003388-59208cc962cb', about: 'cachorro sorrindo' },
    { id: '1516734212186-a967f81ad0d7', about: 'golden retriever sendo cuidado' },
    { id: '1583337130417-3346a1be7dee', about: 'buldogue francês de moletom amarelo' },
    { id: '1450778869180-41d0601e046e', about: 'cachorro e gato deitados juntos na grama' },
  ],
  casa: [
    { id: '1600596542815-ffad4c1539a9', about: 'casa moderna com piscina (hero)' },
    { id: '1560448204-e02f11c3d0e2', about: 'sala de estar clara' },
    { id: '1503387762-592deb58ef4e', about: 'projeto/planta sobre a mesa' },
    { id: '1541888946425-d81bb19240f5', about: 'obra vista de cima com equipe' },
    { id: '1600585154340-be6161a56a0c', about: 'casa moderna iluminada ao entardecer, com jardim' },
    { id: '1600607687939-ce8a6c25118c', about: 'sala de estar ampla e moderna com sofá branco' },
    { id: '1600566753190-17f0baa2a6c3', about: 'fachada contemporânea de madeira e concreto' },
    { id: '1600210492486-724fe5c67fb0', about: 'sala clara com plantas e poltronas' },
    { id: '1564013799919-ab600027ffc6', about: 'casa branca com piscina e palmeiras' },
    { id: '1512917774080-9991f1c4c750', about: 'casa de alto padrão com piscina e vidro' },
    { id: '1570129477492-45c003edd2be', about: 'casa clássica com varanda e gramado' },
    { id: '1502672260266-1c1ef2d93688', about: 'apartamento aconchegante com estante e plantas' },
    { id: '1493809842364-78817add7ffb', about: 'sala de apartamento com sofá azul' },
    { id: '1484154218962-a197022b5858', about: 'cozinha planejada branca' },
    { id: '1560185007-cde436f6a4d0', about: 'sala de jantar e estar integradas' },
    { id: '1545324418-cc1a3fa10c00', about: 'prédio residencial moderno visto de baixo' },
    { id: '1582407947304-fd86f028f716', about: 'prédios altos de vidro (bairro nobre)' },
    { id: '1560518883-ce09059eeffa', about: 'chave com chaveiro de casinha (compra do imóvel)' },
  ],
  escola: [
    { id: '1509062522246-3755977927d7', about: 'sala de aula com alunos (hero)' },
    { id: '1503676260728-1c00da094a0b', about: 'livros, maçã e blocos de letras' },
    { id: '1427504494785-3a9ca7044f45', about: 'estudante entre estantes de biblioteca' },
    { id: '1524178232363-1fb2b075b655', about: 'aula para adultos com projetor' },
  ],
  loja: [
    { id: '1441986300917-64674bd600d8', about: 'loja de roupas organizada (hero)' },
    { id: '1483985988355-763728e1935b', about: 'cliente com sacolas de compras' },
    { id: '1567401893414-76b7b1e5a7a5', about: 'arara de roupas coloridas e prateleiras' },
    { id: '1441984904996-e0b6ba687e04', about: 'loja de roupas minimalista com luminárias' },
    { id: '1555529669-e69e7aa0ba9a', about: 'cliente escolhendo camisa na arara' },
  ],
  hospedagem: [
    { id: '1499793983690-e29da59ef1c2', about: 'pousada pé na areia com mar azul-turquesa (hero)' },
    { id: '1566073771259-6a8506099945', about: 'deck de madeira com piscina e espreguiçadeiras' },
    { id: '1520250497591-112f2f40a3f4', about: 'piscina de resort cercada de palmeiras e montanhas' },
    { id: '1582719478250-c89cae4dc85b', about: 'quarto com cama de casal e portas abertas para o jardim' },
    { id: '1505693416388-ac5ce068fe85', about: 'quarto de casal aconchegante e iluminado' },
    { id: '1507525428034-b723cf961d3e', about: 'praia ao pôr do sol com mar calmo' },
    { id: '1540541338287-41700207dee6', about: 'piscina com vista para o mar e guarda-sóis' },
    { id: '1519046904884-53103b34b206', about: 'praia com coqueiro e guarda-sol de palha' },
    { id: '1571896349842-33c89424de2d', about: 'hotel iluminado ao entardecer com piscina' },
    { id: '1445019980597-93fa8acb246c', about: 'espreguiçadeiras no terraço com vista para as montanhas' },
  ],
  eventos: [
    { id: '1511795409834-ef04bbd61622', about: 'mesa de festa decorada com flores e taças (hero)' },
    { id: '1464366400600-7168b8af9bc3', about: 'salão de festa com mesas arrumadas e arranjos' },
    { id: '1519741497674-611481863552', about: 'casal de noivos com buquê, luz quente' },
  ],
  fotografia: [
    { id: '1452587925148-ce544e77e70d', about: 'câmera antiga e fotos impressas sobre a mesa (hero)' },
    { id: '1502920917128-1aa500764cbd', about: 'câmera profissional em fundo branco' },
    { id: '1519741497674-611481863552', about: 'ensaio de casamento com buquê, luz quente' },
  ],
  tecnologia: [
    { id: '1498050108023-c5249f4df085', about: 'notebook com código numa mesa clara (hero)' },
    { id: '1460925895917-afdab827c52f', about: 'notebook com painel de gráficos e resultados' },
    { id: '1551434678-e076c223a692', about: 'equipe trabalhando em computadores num escritório claro' },
    { id: '1531297484001-80022131f5a1', about: 'notebook entreaberto com luz colorida no escuro' },
    { id: '1518770660439-4636190af475', about: 'placa de circuito em detalhe' },
  ],
  pessoal: [
    { id: '1507003211169-0a1dd7228f2d', about: 'retrato de homem sorrindo (hero)' },
    { id: '1494790108377-be9c29b29330', about: 'retrato de mulher sorrindo de blusa vermelha' },
    { id: '1500648767791-00dcc994a43e', about: 'retrato de homem em fundo neutro' },
    { id: '1438761681033-6461ffad8d80', about: 'retrato de mulher ao ar livre' },
  ],
  geral: [
    { id: '1497366216548-37526070297c', about: 'escritório moderno' },
    { id: '1522071820081-009f0129c71c', about: 'equipe trabalhando junta' },
    { id: '1556761175-5973dc0f32e7', about: 'apresentação para clientes' },
    { id: '1600880292203-757bb62b4baf', about: 'dois profissionais comemorando um acordo' },
    { id: '1556157382-97eda2d62296', about: 'profissional sorrindo em ambiente de trabalho' },
    { id: '1521737604893-d14cc237f11d', about: 'equipe reunida em volta da mesa' },
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
  { group: 'hospedagem', match: ['pousada', 'hotel', 'hostel', 'resort', 'chale', 'hosped', 'turism', 'viage'] },
  { group: 'eventos', match: ['evento', 'casament', 'buffet', 'festa', 'cerimon', 'decorac'] },
  { group: 'fotografia', match: ['fotograf', 'filmag', 'video'] },
  { group: 'tecnologia', match: ['tecnolog', 'software', 'marketing', 'startup', 'desenvolv', 'programa', 'informatic', 'agencia', 'design', 'sites'] },
  { group: 'pessoal', match: ['consultor', 'coach', 'mentor', 'palestr', 'marca pessoal', 'influenc', 'terapeut'] },
]

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function photoGroup(niche: string | null | undefined): string | undefined {
  const key = normalize(niche ?? '')
  return PHOTO_GROUPS.find((item) => item.match.some((word) => key.includes(word)))?.group
}

export function photosFor(niche: string | null | undefined): Photo[] {
  const group = photoGroup(niche)
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

function logoMessage(brief: SiteBrief, mark: (url: string) => string = () => ''): string | null {
  const logo = logoOf(brief)
  return logo
    ? `LOGO DO NEGÓCIO (enviada pelo usuário): ${logo}${mark(logo)}\nUse SOMENTE no cabeçalho e no rodapé (não repita na seção do topo, que já fica logo abaixo do cabeçalho), no lugar do nome em texto: <img src="..." alt="Logo ${brief.businessName}" class="h-9 w-auto md:h-10 object-contain">. Não recorte, não distorça e não coloque dentro de círculo. Combine as cores do site com ela.`
    : null
}

// Imagens que a IA pode usar nas alterações: as do próprio negócio primeiro,
// depois as de banco. As que já aparecem no site vêm marcadas, para a IA
// preferir outra e o site não repetir a mesma foto.
export function imagesMessage(brief: SiteBrief, fresh: SiteAsset[] = [], used: Set<string> = new Set()): string {
  const photos = (brief.assets ?? []).filter((asset) => asset.kind === 'photo')
  const freshUrls = new Set(fresh.map((asset) => asset.url))
  const mark = (url: string) => (freshUrls.has(url) ? ' (anexada agora)' : used.has(photoKey(url)) ? ' (já está no site)' : '')
  return [
    logoMessage(brief, mark),
    photos.length > 0
      ? `FOTOS DO PRÓPRIO NEGÓCIO (enviadas pelo usuário — use estas PRIMEIRO, principalmente no topo, na galeria e no "sobre"; não sabemos o que cada uma mostra, então use legendas genéricas e alt descritivo neutro):\n${photos.map((photo) => `- ${photo.url}${mark(photo.url)}`).join('\n')}`
      : null,
    `${photos.length > 0 ? 'Fotos de banco (só como complemento, se faltar foto)' : 'Fotos disponíveis (use somente estas)'} — prefira as que ainda não estão no site:\n${photosFor(brief.niche)
      .map((photo) => `- ${stockUrl(photo.id)} — ${photo.about}${mark(stockUrl(photo.id))}`)
      .join('\n')}`,
  ]
    .filter(Boolean)
    .join('\n\n')
}

const stockUrl = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1600&q=80`

// Mesma foto com outro tamanho (w=) conta como a mesma.
function photoKey(url: string): string {
  return url.replace(/[?#].*$/, '')
}

export function usedPhotos(parts: SiteParts): Set<string> {
  const used = new Set<string>()
  for (const html of Object.values(parts)) {
    for (const match of (html ?? '').matchAll(/https:\/\/[^"'\s)]+/g)) used.add(photoKey(match[0]))
  }
  return used
}

interface PhotoChoice {
  url: string
  about: string
}

// Bloco padrão pelo id da seção (plano sem bloco válido ou de versão antiga).
const DEFAULT_BLOCKS: [RegExp, string][] = [
  [/^hero$/, 'hero-dividido'],
  [/preco|cardapio|tabela|menu/, 'lista-precos'],
  [/plano|pacote|mensal/, 'planos'],
  [/funciona|passo|etapa|processo|agend/, 'passos'],
  [/galeria|portfolio|fotos|trabalhos|ambiente/, 'galeria'],
  [/faq|duvida|pergunta/, 'faq'],
  [/contato|fale|localiza|endereco/, 'contato'],
  [/sobre|historia|quem|equipe|porque|por-que/, 'split'],
  [/depoimento|avaliac/, 'depoimentos'],
  [/numero|resultado/, 'numeros'],
  [/servico|tratamento|especialidade|produto|catalogo|imove|prato/, 'bento'],
]

function defaultBlock(id: string): string {
  return DEFAULT_BLOCKS.find(([pattern]) => pattern.test(id))?.[1] ?? 'lista-icones'
}

/** Bloco de uma seção: o do plano ou o padrão pelo id. */
export function sectionBlock(section: PlanSection): string {
  const kind: Block['kind'] = section.id === 'hero' ? 'hero' : 'section'
  return blockFor(section.layout, [kind]) ?? (kind === 'hero' ? 'hero-dividido' : defaultBlock(section.id))
}

function sectionPhotos(section: PlanSection): number {
  return BLOCKS[sectionBlock(section)]?.photos ?? 0
}

// Distribui as fotos entre as seções. As partes são escritas ao mesmo tempo
// e, recebendo a lista inteira, todas escolhiam a mesma "melhor" foto (a
// mesma casa aparecia 4 vezes). Cada seção recebe as suas, sem repetir —
// só repete se o banco de fotos acabar.
export function photoPlan(plan: SitePlan, brief: SiteBrief): Record<string, PhotoChoice[]> {
  const own = (brief.assets ?? [])
    .filter((asset) => asset.kind === 'photo')
    .map((asset) => ({ url: asset.url, about: 'foto do próprio negócio (não sabemos o que mostra: legenda genérica e alt neutro)' }))
  const pool: PhotoChoice[] = [...own, ...photosFor(brief.niche).map((photo) => ({ url: stockUrl(photo.id), about: photo.about }))]
  const result: Record<string, PhotoChoice[]> = {}
  let next = 0
  for (const section of plan.sections) {
    const wanted = Math.max(0, Math.min(4, sectionPhotos(section)))
    result[section.id] = Array.from({ length: Math.min(wanted, pool.length) }, () => pool[next++ % pool.length])
  }
  return result
}

// ---------------------------------------------------------------------------
// Regras de texto (partes e alterações) e de design (alterações em HTML)
// ---------------------------------------------------------------------------

const TEXT_RULES = `TEXTO (o que mais vende — escreva como um bom redator publicitário brasileiro)
- Idioma: português do Brasil por padrão. Só escreva em outro idioma se o pedido do usuário pedir explicitamente (ex.: "site em inglês"); nesse caso TODO o texto do site sai nesse idioma, inclusive menu, botões e rodapé.
- Use o título ("headline") que o plano definiu para a seção. Os outros textos você escreve: curtos, concretos, com o benefício para o cliente (o que ele ganha, quanto tempo leva, o que está incluso). Frase com mais de 20 palavras: corte. Específico vence criativo; voz ativa; escreva do lado de quem visita (o que ele consegue fazer), nunca de como o negócio funciona por dentro. Cada elemento faz um trabalho só.
- Conteúdo de verdade do nicho: nomes reais de serviços/produtos com descrição útil e preço "a partir de" plausível (ou os preços informados), etapas reais do atendimento, dúvidas que clientes desse nicho realmente têm, com respostas completas. Num catálogo (imóveis, pratos, produtos, planos), mostre itens típicos do nicho bem descritos (tipo, tamanho, o que inclui, faixa de preço) — o dono troca depois pelo chat.
- Proibido: lorem ipsum, "[Nome]", "Seu texto aqui", "Bem-vindo ao nosso site", "Encontre seu próximo…", "Soluções completas", "Qualidade e confiança", "conversar sobre os próximos passos" e frases que serviriam para qualquer empresa.
- Botões com verbo + objeto do contexto, dizendo exatamente o que acontece ao clicar ("Agendar meu horário", "Ver apartamentos à venda", "Pedir orçamento no WhatsApp"); não repita o mesmo texto de botão em todas as seções, mas a mesma ação mantém o mesmo nome no site todo.
- NUNCA escreva sobre informação que falta: nada de "não informado", "a definir", "em breve", "sob consulta" como valor, "imagem ilustrativa", "quando essas informações forem fornecidas", "a história da empresa poderá ser apresentada aqui". Se um dado não existe (telefone, endereço, horário, história, equipe), simplesmente NÃO crie aquele campo nem aquele bloco — o layout fica completo sem ele. (Exceção: quando as regras específicas de um protótipo pedirem para indicar uma pendência, siga essas regras.)
- NUNCA invente fatos verificáveis sobre o negócio: nada de nota, número de avaliações, depoimentos de clientes, ano de fundação, anos de experiência, quantidade de clientes/atendimentos/vendas, prêmios, registros profissionais (CRECI, CRM, OAB…) ou endereço que não estejam no pedido. Se a reputação real foi informada, use exatamente esses números e destaque bem.`

const DESIGN_RULES = `PADRÃO DE QUALIDADE: o de um estúdio de design premiado que dá a cada cliente uma identidade impossível de confundir com a de outro — feito sob medida para ESTE negócio, nunca um template genérico.

DIREÇÃO
- O visual nasce do mundo do negócio: os materiais, ferramentas, texturas, cores e o jeito de falar do ramo (a navalha e o couro da barbearia, a planta e o concreto da construtora, a farinha e a madeira da padaria). Use isso em formas, ícones, fotos e textos.
- Uma ousadia só: o plano define a "signature" (a marca registrada do site). Ela aparece com força na seção indicada; todo o resto fica calmo e disciplinado, a serviço dela. Antes de terminar, tire um enfeite que não serve ao negócio.
- Estrutura é informação: rótulos pequenos acima de títulos, numeração (01, 02…), divisórias e selos só quando dizem algo verdadeiro (numeração só em sequência real, como etapas). Nada de rótulo decorativo em toda seção.
- Acabamento de site premium (o nível de 21st.dev, Linear, Vercel, Framer): profundidade em camadas — brilho suave na cor da marca atrás do topo e das chamadas, bordas finas translúcidas, vidro fosco (backdrop-blur) em menu e etiquetas sobre foto, cartões com borda de 1px e sombra macia, fundo com grade ou pontos que somem nas bordas, foto com zoom lento no hover, uma palavra do título em degradê da marca. Os BLOCOS já trazem isso: mantenha essas camadas. Evite só o que barateia: degradê arco-íris ou roxo/azul que não é da marca, sombra preta pesada, o mesmo bloco repetido e seção chapada sem nenhum detalhe.

DESIGN
- Use SOMENTE estas cores do tema (Tailwind): brand, brand-dark, accent, ink, paper, surface, muted — com variações de opacidade (ex.: bg-brand/10, text-ink/70, border-ink/10) e também white/black. Nunca invente outros nomes de cor nem use cores fixas (#hex) nas classes.
- Tipografia é a personalidade do site: font-display (títulos) usada com intenção — escala clara (título do topo bem maior que os de seção), peso e espaçamento escolhidos (ex.: caixa alta com tracking largo numa fonte condensada, ou serifada grande com leading-[1.05] e tracking-tight). Títulos grandes com tamanho fluido para caberem em 320px sem quebrar palavra (ex.: text-[clamp(2.5rem,8vw,5.5rem)]); tracking negativo forte só em título curto. font-body no texto: corpo em text-base ou maior com leading-relaxed; nada abaixo de text-xs. Pesos com disciplina: normal no texto, medium/semibold em rótulos e subtítulos, bold/black só nos títulos. Preços, horários e números em tabular-nums. Títulos em ordem: um h1 (no topo), h2 nas seções, h3 dentro delas — sem pular nível.
- Cantos: siga o "radius" do plano em todo o site (sem radius: round) — round: rounded-2xl/rounded-3xl e botões rounded-full; soft: rounded-lg/rounded-xl e botões rounded-xl; sharp: rounded-none/rounded-sm e botões rounded-sm. Sombras suaves, bordas finas (border-ink/10 no claro, border-white/10 no escuro).
- Espaçamento em escala (múltiplos de 4px: 2, 3, 4, 6, 8, 12, 16…) e com hierarquia: coisas relacionadas ficam perto (rótulo e campo, título e texto), grupos diferentes ficam longe. Seções com py-20 md:py-28 (a de destaque pode ter mais), container "mx-auto max-w-6xl px-5 md:px-8", textos com max-w-prose (65 a 75 caracteres por linha).
- Redesenho ou seção nova: use um BLOCO pronto (veja o formato <bloco>), que já vem com todo esse acabamento. Seções vizinhas nunca usam o mesmo bloco.
- Composição: cards lado a lado têm a mesma quantidade de conteúdo (nada de card alto e quase vazio — use items-start ou dê ao card maior uma foto). Cartão flutuante sobre foto: no máximo 1 por foto, só com texto curto, dentro da área da foto no celular (nada de posição negativa que vaze da tela) e nunca por cima de outro texto. Nada de texto escrito por cima de foto que já tenha cartão.
- Movimento com propósito e moderação: classe "reveal" (a animação já existe) só nos blocos principais — títulos de seção, grupos de cards, fotos grandes —, não em cada elemento. Interações rápidas (duration-200, ease-out): hover com mudança de cor/sombra ou -translate-y-0.5, clique com active:scale-[0.98]. Anime só cor, opacidade e transform — nunca largura/altura. Nada de animação infinita chamativa (animate-bounce, animate-pulse, girar) em conteúdo. Quem prefere menos movimento: use motion-safe: nos efeitos de deslocamento ou motion-reduce:transition-none. Animação demais deixa o site com cara de feito por IA. Efeitos especiais (data-fx): os que já vêm no modelo do bloco e os que o plano escolheu para o site, onde servirem ao conteúdo — nunca invente outros nomes de data-fx.
- Botões: principal com bg-brand e texto em contraste, px-6 py-3.5 font-semibold; secundário contornado. Toda área clicável com pelo menos 44px de altura (min-h-11) e 8px de distância da vizinha.
- Ícones: SVG inline estilo lucide (fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round", viewBox 0 0 24 24), coerentes com o que representam e todos do mesmo estilo; ícone decorativo com aria-hidden="true"; botão só de ícone com aria-label. Nunca emoji como ícone.
- Acessibilidade e qualidade: contraste AA (4.5:1 no texto, 3:1 em título grande e em ícone), foco visível em links e botões (focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2; nunca outline-none sem substituto), HTML semântico (nav, section, footer, ul/li em listas, button para ação e a para navegação — nunca div clicável). Cor nunca é o único sinal: destaque também com texto ou ícone (ex.: selo "Mais escolhido" escrito). Link diz para onde leva ou o que faz ("Pedir orçamento no WhatsApp", não "Clique aqui"). Informação importante nunca só no hover. No menu do celular, o botão data-menu-toggle tem aria-label e aria-controls apontando para o painel.
- Imagens: foto que informa tem alt descritivo; foto só decorativa tem alt="". Espaço reservado com aspect-[…] ou width/height para a página não pular ao carregar. Tamanho certo no w= da URL: w=1600 só em foto de tela cheia, w=1000 em foto de meia tela, w=600 em card. Foto do topo com fetchpriority="high"; as outras com loading="lazy" decoding="async".
- 100% responsivo e mobile-first: pense primeiro em 320px de largura, depois 768, 1024 e 1440 — sem rolagem lateral, sem texto cortado, botões sem quebrar o texto, linhas de texto com largura confortável.

${TEXT_RULES}
- Botões de contato abrem o WhatsApp com mensagem pronta coerente com o botão (target="_blank" rel="noopener"). Sem WhatsApp informado, leve para #contato.
- Imagens: use SOMENTE as URLs de foto indicadas no pedido (pode mudar só o w=), cada foto uma vez no site. Nunca invente URL de imagem. object-cover, alt e carregamento conforme a regra de imagens acima. Avatares de depoimentos: iniciais em círculo, nunca foto.`

// ---------------------------------------------------------------------------
// 1) Plano do site
// ---------------------------------------------------------------------------

// Efeitos que os blocos aplicam sozinhos quando o plano os escolhe.
export const AUTO_EFFECTS = [
  'split-text', 'blur-in', 'gradient-text', 'annotate', 'magnetic', 'grain', 'aurora', 'particles', 'dot-grid', 'parallax',
  'image-reveal', 'tilt', 'pattern', 'shimmer', 'scrub-text', 'stack', 'horizontal', 'count', 'scroll-progress', 'smooth-scroll',
]

export const PLAN_SYSTEM = `Você é o diretor de arte do Code Maker. Você planeja sites de alto nível para pequenos negócios brasileiros. Nesta etapa você NÃO escreve HTML: define a direção de arte e a estrutura.

Responda exatamente neste formato, sem nada antes ou depois:
<acoes>
- (3 a 5 itens curtos, 1ª pessoa, em linguagem simples para o dono do negócio, contando as decisões: clima do visual e de onde ele veio, cores, fontes, a marca registrada do site, o que o site vai mostrar. Sem termos técnicos nem nomes internos como paper, ink, surface, brand, hero, bg ou signature)
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
  "lang": "idioma do site em código curto: pt-BR (padrão), pt-PT, en, es, fr, it, de… — outro só se o pedido pedir",
  "palette": { "brand": "#hex cor principal", "brandDark": "#hex mais escura da principal", "accent": "#hex acento", "ink": "#hex texto principal (no dark é claro, no light é quase preto)", "paper": "#hex fundo principal", "surface": "#hex fundo alternativo/cartões", "muted": "#hex texto secundário" },
  "fonts": { "display": "fonte dos títulos (veja PARES DE FONTES)", "body": "fonte do texto" },
  "radius": "round" | "soft" | "sharp" (cantos do site inteiro, escolhidos pela direção de arte),
  "signature": "a marca registrada do site em 1 ou 2 frases concretas: o único elemento ousado de que o visitante vai lembrar, tirado do mundo do negócio (ex.: título do topo enorme em caixa alta condensada cortado pela foto da navalha; tabela de preços desenhada como a lousa de giz da padaria; faixa com a planta baixa do apartamento em linhas finas)",
  "signatureSection": "id da seção onde a marca registrada aparece (normalmente hero)",
  "header": "id de um bloco de CABEÇALHO",
  "cta": "texto do botão principal do site, verbo + objeto, até 4 palavras (ex.: Agendar meu horário, Pedir orçamento) — vai no menu, no topo e no rodapé",
  "tagline": "frase curta do rodapé dizendo o que o negócio faz de melhor (até 12 palavras)",
  "effects": ["de 0 a ${MAX_EFFECTS} ids da lista EFEITOS que este site realmente pede"],
  "globalRequirementIds": ["IDs dos requisitos transversais da especificação"],
  "sections": [ { "id": "kebab-case", "label": "nome curto no menu", "layout": "id de um BLOCO (o hero usa um bloco de TOPO)", "headline": "título exato da seção (até 8 palavras, específico do negócio)", "brief": "o conteúdo REAL da seção: itens com nome, descrição curta e preço/duração/tamanho quando fizer sentido; etapas; perguntas; o que a foto mostra", "requirementIds": ["IDs dos requisitos desta seção"], "bg": "paper" | "surface" | "ink" | "brand" } ],
  "business": { "name": "nome do negócio", "niche": "nicho em poucas palavras", "city": "cidade ou null", "phone": "WhatsApp só com dígitos ou null" }
}
"business": copie do pedido. Se o pedido não disser o nome, crie um nome curto e plausível; cidade e WhatsApp só se estiverem escritos no pedido (senão null).

Regras do plano:
- A especificação é obrigatória quando fornecida. Copie seus IDs: globalRequirementIds para requisitos transversais e requirementIds em cada seção. Todo requisito aplicável deve ser atribuído. Requisitos backend limitados permanecem limitações explícitas. Não declare que estão implementados. Respeite constraints, forbiddenChanges, relevantFiles, dependencies e validation.
- sections: de 6 a 9 itens, na ordem da página. O primeiro é sempre { "id": "hero", ... }. Não inclua cabeçalho nem rodapé (já existem). Use ids como hero, servicos, diferenciais, galeria, sobre, planos, como-funciona, localizacao, faq, contato — escolha o que faz sentido para o nicho. Só inclua "depoimentos" ou "numeros" se o pedido trouxer reputação real ou números reais (nunca invente). Inclua "contato" perto do fim. Bons sites têm pelo menos uma seção com conteúdo concreto e escaneável (catálogo, preços ou planos), além de serviços.
- Alterne "bg" entre as seções para dar ritmo (nunca 3 seguidas iguais); use "ink" ou "brand" em 1 ou 2 seções de destaque.
- "layout": o bloco de cada seção (lista BLOCOS abaixo). O hero usa um bloco de TOPO; as outras seções, blocos de SEÇÃO. Seções vizinhas sempre com blocos diferentes; "letreiro" e "faixa-destaque" no máximo uma vez cada; "depoimentos" só com depoimentos reais. O conteúdo do brief tem de caber no bloco (ex.: catálogo com fotos → cards-foto; preços sem foto → lista-precos; etapas → passos).
- "headline": cada seção tem um título diferente, que diz um benefício concreto ou o que a seção entrega ("Cortes a partir de R$ 45", "Apartamentos perto do metrô", "Seu carro pronto no mesmo dia"). Proibidos: "Encontre seu próximo…", "Bem-vindo", "Nossos serviços", "Sobre nós", "Soluções completas", e repetir no meio do site o título do topo.
- "brief": escreva o conteúdo que vai na tela, não instruções sobre o que evitar. Ex. ruim: "explica o apoio na compra, sem prometer condições". Ex. bom: "3 cards: Comprar (busca por bairro e orçamento, visitas na mesma semana), Vender (avaliação do preço, fotos profissionais, anúncio nos portais), Alugar (análise de fiador ou seguro-fiança)". Nunca escreva no brief que um dado falta ou que "será informado depois": sem o dado, a seção simplesmente não tem aquele campo.
- Fotos: cada bloco já diz quantas usa e o sistema entrega fotos diferentes para cada seção.
- Paleta com contraste AA entre ink/paper e entre o texto do botão e brand. Respeite a cor pedida pelo usuário (vira "brand", ou o fundo se ele pedir site "preto"/"escuro").
- O pedido do usuário sempre vence: estilo, cores, fontes ou referências que ele pediu são seguidos à risca, mesmo que contrariem as dicas abaixo.

DIREÇÃO DE ARTE (pense nisto antes de escrever o JSON)
- Parta do mundo do negócio: os materiais, ferramentas, objetos, texturas e o vocabulário do ramo. É daí que vêm a paleta (4 a 6 cores com nome e motivo), as fontes, a forma dos cantos e a marca registrada.
- O topo (hero) é a tese do site: abre com o que há de mais característico deste negócio — uma foto forte, um título marcante, um detalhe do ofício. "Número grande + rótulo pequeno + estatísticas + degradê" é a resposta de template: só use se for mesmo a melhor.
- Uma ousadia só ("signature"), bem executada; o resto do site fica calmo e disciplinado.
- Quando o pedido deixar o visual livre, NÃO caia nos 3 visuais que toda IA repete: (1) fundo creme com serifada de alto contraste e acento terracota; (2) fundo quase preto com um único acento neon (verde-ácido, vermelhão); (3) layout de jornal com linhas finas, cantos retos e colunas densas. Eles só valem se o pedido pedir ou se o negócio realmente for assim.
- Autocrítica antes de responder: se este plano serviria igual para outro negócio do mesmo nicho em outra cidade, troque a parte genérica (paleta, fontes, formato do topo ou marca registrada) por uma escolha feita para ESTE negócio.

BLOCOS (desenhos prontos com acabamento premium; escolha os que servem ao conteúdo e ao clima)
CABEÇALHO:
${blocksMenu('header')}
TOPO (só para o hero):
${blocksMenu('hero')}
SEÇÃO:
${blocksMenu('section')}

EFEITOS (biblioteca do Code Maker — escolha com critério, nunca todos)
Escolha de 0 a ${MAX_EFFECTS} efeitos para "effects", pensando no negócio, no público e na marca registrada: um efeito bem escolhido vale mais que vários. Zero é uma boa resposta para sites sóbrios (advocacia, saúde, contabilidade). Prefira o efeito que realiza a marca registrada; combine no máximo um efeito "forte" (horizontal, stack, scrub-text, aurora, particles, dot-grid) com detalhes discretos. Os blocos já trazem alguns efeitos próprios (spotlight no bento, beam nos planos, marquee no letreiro, stagger nas grades): não precisa repeti-los aqui. "smooth-scroll" só junto de efeitos de rolagem. "count" só se houver números reais no pedido. Os blocos aplicam sozinhos os efeitos escolhidos onde eles cabem (títulos, botões, fundos, fotos, cartões).
${effectsMenu(AUTO_EFFECTS)}

PARES DE FONTES (todas do Google Fonts; escolha o que tem a cara do negócio e varie — não use sempre os mesmos):
- moderno/tecnologia: "Space Grotesk"+"IBM Plex Sans", "Sora"+"Figtree", "Unbounded"+"Onest", "Bricolage Grotesque"+"Hanken Grotesk", "Syne"+"Work Sans", "Manrope"+"Public Sans", "Plus Jakarta Sans"+"Inter"
- elegante/premium: "Fraunces"+"Figtree", "Cormorant Garamond"+"Manrope", "Playfair Display"+"Source Sans 3", "DM Serif Display"+"DM Sans", "Instrument Serif"+"Hanken Grotesk", "Gloock"+"Karla", "Young Serif"+"Libre Franklin"
- forte/masculino: "Oswald"+"Source Sans 3", "Bebas Neue"+"Work Sans", "Archivo Black"+"Archivo", "Anton"+"Karla", "Big Shoulders Display"+"Public Sans"
- amigável/família: "Nunito"+"Nunito Sans", "Quicksand"+"Nunito", "Baloo 2"+"Nunito Sans", "Fredoka"+"Figtree", "Poppins"+"Poppins"
- artesanal/comida: "Caprasimo"+"Karla", "Abril Fatface"+"Lato", "Young Serif"+"Figtree"`

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
    !brief.assets?.some((asset) => asset.kind === 'photo') && !photoGroup(brief.niche)
      ? 'Fotos: não há banco de fotos deste ramo, só fotos genéricas de escritório e equipe. Prefira blocos com pouca ou nenhuma foto (hero-brilho, editorial, lista-icones, passos, lista-precos, planos, faq) e resolva o visual com tipografia, cor e os fundos dos blocos.'
      : null,
    brief.specification ? `Especificação completa com IDs obrigatórios:\n${JSON.stringify(brief.specification)}` : null,
    includeLiteral && brief.details?.trim() ? `Pedido do usuário (siga o que ele pedir de estilo, cores e conteúdo):\n${brief.details.trim()}` : null,
  ]
    .filter(Boolean)
    .join('\n')
}

// ---------------------------------------------------------------------------
// 2) Cada parte do site: a IA escreve só o CONTEÚDO (JSON) e o código monta o
// bloco com o design pronto. Cabeçalho e rodapé saem direto do plano.
// ---------------------------------------------------------------------------

const CONTENT_FIELDS = `Campos do conteúdo (use só os que o bloco pede; deixe de fora o que não tiver conteúdo real):
- kicker: rótulo curto acima do título (2 a 4 palavras)
- title: o título, sem ponto final
- highlight: trecho EXATO do title (1 a 3 palavras) que ganha destaque visual
- subtitle: frase de apoio (até 2 frases curtas)
- badge: selo curto e verdadeiro
- primary / secondary: textos dos botões (verbo + objeto, até 4 palavras)
- note: destaque curto
- word: palavra gigante do bloco (1 ou 2 palavras)
- items: lista de { "title", "text", "price", "meta", "icon", "group", "list" } — só os campos que o bloco usa; price já formatado ("R$ 45" ou "a partir de R$ 45"); meta = detalhe curto (duração, tamanho, "/mês"); group = categoria; list = o que está incluso
- facts: lista de { "value", "label" } — value curto (até 12 caracteres) e label curto
- alts: descrição curta de cada foto, na ordem
Ícones (campo icon) — escolha o que combina com cada item: ${ICON_NAMES.join(', ')}.`

export const PART_SYSTEM = `Você é o Code Maker, redator publicitário sênior de sites. O design é montado pelo código a partir de blocos premium já prontos (layout, cores, fotos, efeitos): você escreve SÓ o conteúdo de UMA seção, para o bloco indicado, seguindo o plano do diretor de arte. As outras seções são escritas em paralelo com o mesmo plano, então siga o plano à risca para o site ficar coeso.

FORMATO DA RESPOSTA: somente um bloco \`\`\`json com UM objeto, sem nada antes ou depois. Nada de HTML, classes, URLs, emojis ou markdown dentro dos textos.

${CONTENT_FIELDS}

${TEXT_RULES}
- Tamanho conta (o bloco tem espaço certo): título de seção até 8 palavras, título do topo até 7; texto de item até 22 palavras; resposta de FAQ até 45 palavras; facts e badge curtíssimos.`

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

// Botão principal do site: destino e texto. WhatsApp do negócio; no protótipo,
// só o canal real (telefone sem WhatsApp confirmado leva para #contato).
interface MainAction {
  href: string
  label: string
}

function mainAction(plan: SitePlan, brief: SiteBrief): MainAction {
  if (brief.mode === 'lead_prototype') {
    const routes = brief.contactRoutes
    if (routes?.primary) return { href: routes.primary, label: routes.actionLabel || plan.cta || 'Entrar em contato' }
    if (routes?.goal === 'institutional') {
      const target = plan.sections.find((section) => section.id === 'servicos') ?? plan.sections.find((section) => section.id !== 'hero')
      return { href: `#${target?.id ?? 'hero'}`, label: routes.actionLabel || 'Conhecer a empresa' }
    }
    return { href: '#contato', label: 'Ver contato' }
  }
  const phone = phoneDigits(brief.phone)
  const portuguese = (plan.lang ?? 'pt-BR').startsWith('pt')
  const message = portuguese ? `?text=${encodeURIComponent('Olá! Vim pelo site e gostaria de mais informações.')}` : ''
  return {
    href: phone ? `https://wa.me/${phone}${message}` : '#contato',
    label: plan.cta || (portuguese ? (phone ? 'Chamar no WhatsApp' : 'Fale conosco') : 'Contact us'),
  }
}

// Links do menu: as seções (sem o topo e sem as faixas decorativas).
function navItems(plan: SitePlan): { id: string; label: string }[] {
  return plan.sections
    .filter((section) => section.id !== 'hero' && !['letreiro', 'faixa-destaque'].includes(sectionBlock(section)))
    .slice(0, 6)
    .map(({ id, label }) => ({ id, label }))
}

// Painel de contraste (planos em destaque, rodapé): escuro nos dois temas.
const darkPanel = (plan: SitePlan): 'ink' | 'surface' => (plan.theme === 'dark' ? 'surface' : 'ink')

/** Cores, cantos, links, fotos e efeitos deste site para um bloco. */
export function blockTokens(partId: string, plan: SitePlan, brief: SiteBrief, photos: string[]): BlockTokens {
  const index = plan.sections.findIndex((section) => section.id === partId)
  const bg = plan.sections[index]?.bg ?? 'paper'
  const dk = darkPanel(plan)
  const after = plan.sections.slice(index + 1).find((section) => sectionBlock(section) !== 'letreiro')
  return {
    id: partId,
    bg,
    tx: textOn(plan, bg),
    ptx: textOn(plan, 'paper'),
    btx: textOn(plan, 'brand'),
    dk,
    dtx: textOn(plan, dk),
    radius: plan.radius ?? 'round',
    wa: mainAction(plan, brief).href,
    next: index >= 0 && after ? `#${after.id}` : '#contato',
    photos,
    fx: plan.effects ?? [],
  }
}

// Frases com fatos que ninguém informou (nota, anos, clientes) saem do conteúdo.
function checkContent(content: BlockContent, brief: SiteBrief): BlockContent {
  const clean = (value: string | undefined) => (value ? stripInventedClaims(value, brief) : value)
  return {
    ...content,
    title: clean(content.title),
    subtitle: clean(content.subtitle),
    badge: clean(content.badge),
    note: clean(content.note),
    items: content.items?.map((item) => ({ ...item, text: clean(item.text) })),
    facts: content.facts?.filter((fact) => stripInventedClaims(`${fact.value} ${fact.label}`, brief)),
  }
}

/** HTML de uma seção: o bloco do plano montado com o conteúdo escrito pela IA. */
export function renderPart(partId: string, plan: SitePlan, brief: SiteBrief, content: BlockContent, options: { block?: string; photos?: string[] } = {}): string {
  const section = plan.sections.find((item) => item.id === partId)
  if (!section) return ''
  const block = options.block ?? sectionBlock(section)
  const photos = options.photos ?? (photoPlan(plan, brief)[partId] ?? []).map((photo) => photo.url)
  const html = renderBlock(block, checkContent(content, brief), blockTokens(partId, plan, brief, photos))
  return normalizePart(partId, brief.mode === 'lead_prototype' ? html : stripMissingInfo(html))
}

export function headerHtml(plan: SitePlan, brief: SiteBrief): string {
  const action = mainAction(plan, brief)
  const hero = plan.sections[0]
  const photoTop = hero && ['hero-retrato', 'hero-cinema'].includes(sectionBlock(hero))
  return normalizePart(
    'header',
    renderHeader(blockFor(plan.header, ['header']) ?? 'menu-pilula', {
      name: brief.businessName || plan.title,
      logo: logoOf(brief),
      nav: navItems(plan),
      cta: action.label,
      href: action.href,
      topText: photoTop ? 'white' : textOn(plan, hero?.bg ?? 'paper'),
      ptx: textOn(plan, 'paper'),
      btx: textOn(plan, 'brand'),
      radius: plan.radius ?? 'round',
      fx: plan.effects ?? [],
    }),
  )
}

function formatPhone(digits: string): string {
  const local = digits.startsWith('55') ? digits.slice(2) : ''
  if (local.length === 11) return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`
  if (local.length === 10) return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`
  return `+${digits}`
}

export function footerHtml(plan: SitePlan, brief: SiteBrief): string {
  const action = mainAction(plan, brief)
  const prototype = brief.mode === 'lead_prototype'
  const phone = phoneDigits(brief.phone)
  const city = brief.city ? [{ label: brief.city }] : []
  const contacts = prototype
    ? [...(brief.contactRoutes?.contacts ?? []).map((label) => ({ label })), ...city]
    : [...(phone ? [{ label: `WhatsApp ${formatPhone(phone)}`, href: `https://wa.me/${phone}` }] : []), ...city]
  const dk = darkPanel(plan)
  return normalizePart(
    'footer',
    renderFooter({
      name: brief.businessName || plan.title,
      tagline: plan.tagline ?? '',
      nav: navItems(plan),
      contacts,
      cta: action.label,
      href: action.href,
      whatsapp: prototype ? (brief.contactRoutes?.confirmedWhatsapp ?? null) : phone ? `https://wa.me/${phone}` : null,
      dk,
      dtx: textOn(plan, dk),
      btx: textOn(plan, 'brand'),
      radius: plan.radius ?? 'round',
    }),
  )
}

/** Cabeçalho e rodapé não passam pela IA: saem prontos do plano. */
export function fixedPart(partId: string, plan: SitePlan, brief: SiteBrief): string | null {
  if (partId === 'header') return headerHtml(plan, brief)
  if (partId === 'footer') return footerHtml(plan, brief)
  return null
}

/** Bloco de cada parte: o do plano, ou o padrão do tipo de parte. */
export function partBlock(partId: string, plan: SitePlan): string | null {
  if (partId === 'header') return blockFor(plan.header, ['header']) ?? 'menu-pilula'
  const section = plan.sections.find((item) => item.id === partId)
  return section ? sectionBlock(section) : null
}

// Conteúdo que a IA escreveu (bloco ```json, ou o primeiro {…} da resposta).
export function parseContent(text: string): BlockContent | null {
  const fenced = text.match(/```json\s*([\s\S]*?)(?:```|$)/i)?.[1]
  if (fenced === undefined && /```html/i.test(text)) return null
  const source = fenced ?? text
  const start = source.indexOf('{')
  const end = source.lastIndexOf('}')
  if (start < 0 || end <= start) return null
  try {
    const content = cleanContent(JSON.parse(source.slice(start, end + 1)))
    return content.title || content.items?.length || content.facts?.length ? content : null
  } catch {
    return null
  }
}

export function buildPartMessage(partId: string, plan: SitePlan, brief: SiteBrief): string {
  const specification = brief.specification ?? plan.specification
  const section = plan.sections.find((item) => item.id === partId)
  const ids = new Set([...(plan.globalRequirementIds ?? []), ...(section?.requirementIds ?? [])])
  const scoped = specification
    ? {
        constraints: specification.constraints,
        forbiddenChanges: specification.forbiddenChanges,
        requirements: specification.requirements.filter((requirement) => ids.has(requirement.id) && requirement.status !== 'limited'),
        limitations: specification.limitations,
      }
    : null
  const blockId = section ? sectionBlock(section) : 'lista-icones'
  const block = BLOCKS[blockId]
  const photos = photoPlan(plan, brief)[partId] ?? []
  const action = mainAction(plan, brief)
  const prototype = brief.mode === 'lead_prototype'
  const routes = prototype ? brief.contactRoutes : null
  const others = plan.sections.filter((item) => item.id !== partId && item.headline).map((item) => `"${item.headline}"`)
  const signature = !plan.signature
    ? null
    : (plan.signatureSection ?? 'hero') === partId
      ? `MARCA REGISTRADA DO SITE (esta seção é dona dela — o texto deve servir a ela com força): ${plan.signature}`
      : 'A marca registrada do site fica em outra seção: aqui o texto é calmo e direto.'
  const hero =
    partId === 'hero'
      ? prototype
        ? 'Esta é a primeira seção: título curto e específico, subtítulo e o botão principal. Destaques (badge, note, facts) só com fatos fornecidos; não crie números, horários ou preços para preencher o bloco.'
        : 'Esta é a primeira seção e a tese do site: o title é o headline do plano (curto e marcante); subtítulo de até 2 linhas; primary é o texto do botão principal e secondary leva para a próxima seção. Selos e destaques (badge, note, facts) só com fatos verdadeiros (a reputação real, se informada) ou vantagens concretas do serviço (ex.: "Orçamento em 1 dia"); sem números inventados — sem fato, deixe o campo de fora.'
      : null
  const leadRules = prototype
    ? `Regras deste protótipo: não inventar horários, preços, contatos, agendamento confirmado ou outros fatos. Telefone não confirma WhatsApp. ${routes?.openingHours.length ? `Horários reais fornecidos: ${JSON.stringify(routes.openingHours)}.` : 'Nenhum horário real foi fornecido: omita horários.'} ${routes?.contacts.length ? `Canais reais: ${JSON.stringify(routes.contacts)}.` : 'Contato ainda pendente: não crie canal fictício.'}`
    : null
  return [
    `Negócio: ${brief.businessName}${brief.niche ? ` · ${brief.niche}` : ''}${brief.city ? ` · ${brief.city}` : ''}`,
    brief.reviews && brief.rating ? `Reputação real: nota ${brief.rating.toLocaleString('pt-BR')} com ${brief.reviews} avaliações` : null,
    scoped ? `Requisitos desta parte:\n${JSON.stringify(scoped)}` : brief.details?.trim() ? `Pedido do cliente: ${brief.details.trim()}` : null,
    realFacts(brief),
    `Site: ${JSON.stringify({ direcao: plan.direction, idioma: plan.lang ?? 'pt-BR', tema: plan.theme })}`,
    `Seções do site, na ordem: ${plan.sections.map((item) => `${item.label} (#${item.id})`).join(', ')}`,
    `SEÇÃO QUE VOCÊ ESCREVE: "${section?.label ?? partId}" — bloco "${block.name}": ${block.when}`,
    section?.headline ? `Título (title): use exatamente "${section.headline}".` : null,
    `Conteúdo planejado: ${section?.brief || 'escreva o conteúdo certo para esta seção neste negócio.'}`,
    `Campos deste bloco: ${block.fields}. Outros campos ficam de fora.`,
    photos.length
      ? `Fotos que o bloco mostra, na ordem (um alt curto e descritivo para cada, em "alts"): ${photos.map((photo, i) => `${i + 1}) ${photo.about}`).join('; ')}. Nos blocos com foto por item, o item N fica com a foto N${blockId === 'hero-vitrine' ? ' (aqui a foto 1 é o destaque e os itens ficam com as fotos 2, 3 e 4)' : ''}: escreva os itens combinando com elas.`
      : 'Este bloco não usa foto.',
    `Botão principal do site: "${action.label}" (leva para ${action.href.startsWith('#') ? 'a seção de contato' : 'o contato do negócio'}). A mesma ação mantém esse nome; numa seção, o primary pode ser uma variação curta com o mesmo sentido.`,
    hero,
    signature,
    others.length ? `Títulos das outras seções (não repita nem parafraseie): ${others.join(', ')}.` : null,
    leadRules,
    `Exemplo da FORMA do conteúdo deste bloco (troque todo o texto pelo conteúdo real): ${JSON.stringify(block.sample)}`,
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
  return `FATOS REAIS DO NEGÓCIO: ${reputation}. Não existe nenhum outro número sobre o negócio: não escreva ano de fundação, anos de experiência nem quantidade de clientes/atendimentos que não estejam no pedido do cliente. Preços e horários informados podem ser usados; sem preços, use "a partir de" plausível para serviços e itens típicos do nicho; sem horário, não mostre horário. Nunca escreva que um dado não foi informado.`
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

${CONTENT_FIELDS}

FORMATO DA RESPOSTA (sem nada antes ou depois):
<acoes>
- (2 a 6 itens curtos, 1ª pessoa, em linguagem simples, sem termos técnicos, contando exatamente o que você mudou)
</acoes>
Depois, só o que muda:
- Ajuste localizado em parte existente (preferido para texto, imagem, link ou classe): <substituir id="id">{"antes":"trecho EXATO do código atual, único nesta parte","depois":"novo trecho"}</substituir>. Use JSON válido; preserve todos os outros caracteres. Pode repetir para trechos diferentes.
- Redesenhar uma seção ou o topo, ou criar uma seção nova (preferido — o código monta o design premium pronto): <bloco id="id" modelo="id-do-bloco">{JSON do conteúdo}</bloco>. Seção nova também leva depois="id-da-parte-anterior" rotulo="Nome no menu" e pode levar fundo="paper|surface|ink|brand". O JSON segue os campos do bloco escolhido (lista BLOCOS PRONTOS no pedido); num redesenho, reaproveite o conteúdo e os fatos que a parte já tem.
- Só quando nenhum bloco serve (algo fora do comum que o usuário pediu): <parte id="id">HTML completo da parte</parte> (seção nova: <parte id="novo-id" depois="id-da-parte-anterior" rotulo="Nome no menu">)
- Remover uma seção: <remover id="id"/>
- Mudar cores, fontes ou idioma do site inteiro: <tema>{"palette": {...só as cores que mudam...}, "fonts": {...}, "lang": "pt-PT"}</tema> (só os campos que mudam).
- Pedido que muda os textos do site todo (idioma, tom, tratamento): troque cada texto com <substituir>, usando como "antes" só o texto visível (sem tags nem atributos), copiado exatamente como está no código; o mesmo texto repetido muda em todos os lugares. Não esqueça menu, botões, rodapé, alt das imagens e a mensagem dos links de WhatsApp. Em idioma novo, mande também o <tema> com o "lang".
O cabeçalho e o rodapé não são blocos: mude-os com <substituir> (ou <parte> em último caso).
Ajuste preserva, redesenho substitui: num ajuste, mantenha a identidade do site (cores, fontes, cantos, marca registrada), os textos com fatos e tudo o que não foi pedido exatamente igual. Quando o pedido for redesenhar uma parte, troque o visual dela por completo — sem meio-termo —, mantendo o conteúdo, os fatos e a função. Nunca troque preços, contatos, endereço ou outros fatos, nem acrescente afirmações novas sobre o negócio, sem o usuário pedir. Se o pedido afetar o menu (seção nova/removida), devolva também o cabeçalho e o rodapé atualizados.`

// Pedido que fala de movimento/visual recebe a biblioteca inteira; os outros
// recebem só os efeitos que o site já usa (para mantê-los funcionando).
const EFFECT_WORDS =
  /anima|efeito|movimento|mexer|parallax|carross|carousel|faixa|letreiro|contagem|contador|regressiva|antes e depois|brilho|3d|inclin|rolagem|scroll|desliz|textura|granul|aurora|padr[aã]o de fundo|polaroid|recibo|comanda|ingresso|cupom|moldura|celular|navegador|chamativ|din[aâ]mic|interativ|sofisticad|premium|impacto|vida|wow|mensal|anual|sublinh|marca-texto|desenh/i

function editEffects(parts: SiteParts, instruction: string): string | null {
  const inUse = usedEffects(Object.values(parts).join('\n'))
  if (EFFECT_WORDS.test(instruction)) {
    return `EFEITOS ESPECIAIS DISPONÍVEIS (use só se o pedido pedir algo assim; no máximo ${MAX_EFFECTS} diferentes no site${inUse.length ? `; o site já usa: ${inUse.join(', ')}` : ''}):\n${effectsGuide()}`
  }
  return inUse.length ? `Efeitos especiais que o site já usa (mantenha os atributos data-fx ao mexer nessas partes):\n${effectsGuide(inUse)}` : null
}

// Blocos prontos que a alteração pode usar (redesenho e seção nova), com os
// campos de conteúdo de cada um.
function editBlocks(plan: SitePlan): string {
  const list = (kind: Block['kind']) =>
    Object.entries(BLOCKS)
      .filter(([, block]) => block.kind === kind)
      .map(([id, block]) => `- ${id}: ${block.name}. ${block.when} Campos: ${block.fields}`)
      .join('\n')
  const current = plan.sections.map((section) => `${section.id}: ${sectionBlock(section)}`).join(', ')
  return `BLOCOS PRONTOS (para <bloco>; o código monta o design com as cores, fotos e efeitos do site). Blocos atuais: ${current}.\nTOPO (só para a parte hero):\n${list('hero')}\nSEÇÃO:\n${list('section')}`
}

export function buildEditMessage(plan: SitePlan, parts: SiteParts, instruction: string, brief: SiteBrief, fresh: SiteAsset[] = [], recent: RecentEditContext[] = []): string {
  const current = partOrder(plan)
    .filter((id) => parts[id])
    .map((id) => `<parte id="${id}">\n${parts[id]}\n</parte>`)
    .join('\n')
  return [
    `Negócio: ${brief.businessName}${brief.niche ? ` · ${brief.niche}` : ''}${brief.city ? ` · ${brief.city}` : ''}`,
    `Tema atual: ${JSON.stringify({ palette: plan.palette, fonts: plan.fonts, theme: plan.theme, radius: plan.radius, signature: plan.signature })}`,
    `Estrutura existente: ${JSON.stringify(plan.sections.map(({id,label})=>({id,label})))}`,
    brief.specification ? `Requisitos e restrições existentes:\n${JSON.stringify(brief.specification)}` : brief.details ? `Pedido original:\n${brief.details}` : null,
    recent.length ? `Alterações anteriores, da mais recente para a mais antiga:\n${JSON.stringify(recent)}` : null,
    contrastGuide(plan),
    `Partes atuais do site:\n${current}`,
    editEffects(parts, instruction),
    editBlocks(plan),
    imagesMessage(brief, fresh, usedPhotos(parts)),
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
    .replace(/[\u0300-\u036f]/g, '')
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

// Idioma do site: pt-BR por padrão; outro só quando o pedido pede.
function cleanLang(value: unknown): string {
  return typeof value === 'string' && /^[a-z]{2}(?:-[A-Z]{2})?$/.test(value.trim()) ? value.trim() : 'pt-BR'
}

// Só os efeitos que os blocos sabem aplicar.
function planEffects(value: unknown): string[] {
  return cleanEffects(Array.isArray(value) ? value.filter((id) => AUTO_EFFECTS.includes(id)) : [])
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
    const layout = sectionBlock({ id, layout: item?.layout } as PlanSection)
    sections.push({
      id,
      label: String(item?.label ?? id).slice(0, 30),
      brief: stripInventedClaims(String(item?.brief ?? ''), brief).slice(0, 1400),
      bg,
      requirementIds: requirementIds(item.requirementIds),
      layout,
      ...(typeof item?.headline === 'string' && item.headline.trim()
        ? { headline: stripInventedClaims(item.headline.trim(), brief).slice(0, 120) }
        : {}),
      ...(Number.isFinite(Number(item?.photos)) && item?.photos !== null && item?.photos !== ''
        ? { photos: Math.max(0, Math.min(4, Math.round(Number(item.photos)))) }
        : {}),
    })
  }
  if (sections.length === 0) return null
  if (sections[0].id !== 'hero') {
    const heroIndex = sections.findIndex((section) => section.id === 'hero')
    if (heroIndex > 0) sections.unshift(...sections.splice(heroIndex, 1))
    else sections.unshift({ id: 'hero', label: 'Início', brief: 'Topo de impacto do site.', bg: 'paper', layout: 'hero-dividido' })
  }
  return {
    title: String(input.title ?? brief.businessName).slice(0, 80),
    description: stripInventedClaims(String(input.description ?? ''), brief).slice(0, 200),
    direction: stripInventedClaims(String(input.direction ?? ''), brief).slice(0, 400),
    theme: input.theme === 'dark' ? 'dark' : 'light',
    lang: cleanLang(input.lang),
    palette,
    fonts: {
      display: cleanFont(input.fonts?.display, 'Inter'),
      body: cleanFont(input.fonts?.body, 'Inter'),
    },
    ...(['round', 'soft', 'sharp'].includes(input.radius) ? { radius: input.radius } : {}),
    ...(planEffects(input.effects).length ? { effects: planEffects(input.effects) } : {}),
    ...(blockFor(input.header, ['header']) ? { header: blockFor(input.header, ['header'])! } : {}),
    ...(typeof input.cta === 'string' && input.cta.trim() ? { cta: input.cta.replace(/\s+/g, ' ').trim().slice(0, 40) } : {}),
    ...(typeof input.tagline === 'string' && input.tagline.trim() ? { tagline: stripInventedClaims(input.tagline.replace(/\s+/g, ' ').trim(), brief).slice(0, 140) } : {}),
    ...(typeof input.signature === 'string' && input.signature.trim()
      ? {
          signature: stripInventedClaims(input.signature.trim(), brief).slice(0, 400),
          signatureSection: sections.some((section) => section.id === cleanId(input.signatureSection)) ? cleanId(input.signatureSection) : 'hero',
        }
      : {}),
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

// Frases sobre dado que falta ("Número não informado", "Imagem ilustrativa",
// "…quando essas informações forem fornecidas") deixam o site com cara de
// rascunho. A regra está no prompt; isto tira as que escaparem.
const MISSING_INFO =
  /n[ãa]o\s+informad[oa]s?|imagem\s+ilustrativa|quando\s+(?:essas|estas|as|esses|estes|os)?\s*(?:informa[çc][õo]es|dados)\s+(?:forem|estiverem)|ainda\s+n[ãa]o\s+(?:foi|foram)\s+(?:informad|fornecid)|poder[ãa]o?\s+ser\s+(?:apresentad|inclu[íi]d|adicionad)[oa]s?\s+aqui|ser[ãa]o?\s+(?:informad|divulgad)[oa]s?\s+em\s+breve/i

export function stripMissingInfo(html: string): string {
  return html.replace(/<(p|span|li|dd|dt|small|figcaption|div)\b[^>]*>([^<]*)<\/\1>/gi, (element, _tag, text) =>
    MISSING_INFO.test(text) ? '' : element,
  )
}

// Rodapé de reserva, montado aqui: usado quando a IA não entrega um rodapé
// aproveitável — o site nunca fica travado por causa dele.
export function simpleFooter(plan: SitePlan, brief: SiteBrief): string {
  const phone = phoneDigits(brief.phone)
  const whatsappUrl = brief.mode === 'lead_prototype' ? brief.contactRoutes?.confirmedWhatsapp : phone ? `https://wa.me/${phone}` : null
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
  /** Partes montadas com um bloco pronto (redesenho ou seção nova). */
  blocks?: { id: string; block: string; content: BlockContent; after?: string; label?: string; bg?: SectionBackground }[]
  removals: string[]
  theme: { palette?: Partial<SitePlan['palette']>; fonts?: Partial<SitePlan['fonts']>; lang?: string } | null
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
  const blocks: NonNullable<EditResult['blocks']> = []
  for (const match of text.matchAll(/<bloco\s+([^>]*)>([\s\S]*?)<\/bloco>/gi)) {
    const attrs = match[1]
    const id = cleanId(attrs.match(/id="([^"]+)"/i)?.[1])
    const block = attrs.match(/modelo="([^"]+)"/i)?.[1]?.trim() ?? ''
    const content = parseContent(match[2])
    if (!id || !content) throw new Error('A edição veio incompleta. Tente novamente.')
    const after = attrs.match(/depois="([^"]+)"/i)?.[1]
    const label = attrs.match(/rotulo="([^"]+)"/i)?.[1]
    const bg = attrs.match(/fundo="([^"]+)"/i)?.[1]
    blocks.push({
      id,
      block,
      content,
      ...(after ? { after: cleanId(after) } : {}),
      ...(label ? { label } : {}),
      ...(bg && ['paper', 'surface', 'ink', 'brand'].includes(bg) ? { bg: bg as SectionBackground } : {}),
    })
  }
  if ((text.match(/<bloco\b/gi) ?? []).length !== blocks.length) throw new Error('A edição veio incompleta. Tente novamente.')
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
  return { actions: parseActions(text), parts, replacements, ...(blocks.length ? { blocks } : {}), removals, theme }
}

// Onde está o trecho que a IA quer trocar. A IA às vezes copia o trecho com
// espaços, quebras de linha ou aspas um pouco diferentes do código: primeiro
// procura exato, depois ignorando essas diferenças.
function patchPattern(before: string): RegExp | null {
  const trimmed = before.trim()
  if (!trimmed) return null
  const escaped = trimmed
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\s+/g, '\\s+')
    .replace(/["']/g, `["']`)
  return new RegExp(escaped, 'g')
}

// Troca o trecho (todas as vezes que ele aparece: num pedido como "mude o
// idioma", o mesmo "Saiba mais" repetido deve mudar em todos os lugares).
// Devolve null se o trecho não está nesta parte.
export function replaceInPart(source: string, before: string, after: string): string | null {
  if (before && source.includes(before)) return source.split(before).join(after)
  const pattern = patchPattern(before)
  if (!pattern || !pattern.test(source)) return null
  pattern.lastIndex = 0
  return source.replace(pattern, () => after)
}

// Aplica uma alteração ao plano e às partes (sem mexer no original). Um trecho
// que não for encontrado é pulado (antes, um único trecho fora do lugar fazia
// a alteração inteira ser recusada — "mude o idioma" mexe em dezenas deles).
export function applyEdit(
  plan: SitePlan,
  parts: SiteParts,
  edit: EditResult,
  context?: { brief: SiteBrief; fresh?: SiteAsset[] },
): { plan: SitePlan; parts: SiteParts; skipped: number } {
  const nextPlan: SitePlan = { ...plan, palette: { ...plan.palette }, fonts: { ...plan.fonts }, sections: [...plan.sections] }
  const nextParts: SiteParts = { ...parts }
  let skipped = 0

  for (const patch of edit.replacements ?? []) {
    // A parte inteira reescrita ou removida na mesma alteração prevalece.
    if (edit.parts.some((part) => part.id === patch.id) || edit.removals.includes(patch.id)) {
      skipped += 1
      continue
    }
    // Primeiro na parte indicada; se a IA errou a parte, procura nas outras.
    const candidates = [patch.id, ...Object.keys(nextParts).filter((id) => id !== patch.id && !edit.parts.some((part) => part.id === id))]
    let applied = false
    for (const id of candidates) {
      const source = nextParts[id]
      if (!source) continue
      const updated = replaceInPart(source, patch.before, patch.after)
      if (updated === null) continue
      if (!updated.trim() || /<(?:script|style)\b/i.test(updated)) break
      nextParts[id] = updated
      applied = true
      if (id === patch.id) break
    }
    if (!applied) skipped += 1
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
  if (typeof edit.theme?.lang === 'string') nextPlan.lang = cleanLang(edit.theme.lang)

  // Partes com bloco pronto: primeiro acerta o plano (seção nova, bloco e
  // fundo), depois monta — assim os links "próxima seção" já saem certos.
  const blocks = context ? (edit.blocks ?? []).filter((item) => item.id !== 'header' && item.id !== 'footer' && !edit.removals.includes(item.id)) : []
  for (const item of blocks) {
    let section = nextPlan.sections.find((entry) => entry.id === item.id)
    if (!section) {
      section = { id: item.id, label: (item.label ?? item.id).slice(0, 30), brief: '', bg: item.bg ?? 'paper' }
      const index = item.after ? nextPlan.sections.findIndex((entry) => entry.id === item.after) : -1
      if (index >= 0) nextPlan.sections.splice(index + 1, 0, section)
      else nextPlan.sections.push(section)
    }
    const layout = blockFor(item.block, [item.id === 'hero' ? 'hero' : 'section']) ?? sectionBlock(section)
    const updated: PlanSection = { ...section, layout, ...(item.bg ? { bg: item.bg } : {}) }
    nextPlan.sections = nextPlan.sections.map((entry) => (entry.id === item.id ? updated : entry))
  }
  for (const item of blocks) {
    const section = nextPlan.sections.find((entry) => entry.id === item.id)!
    const photos = editPhotos(BLOCKS[sectionBlock(section)]?.photos ?? 0, item.id, nextParts, context!.brief, context!.fresh ?? [])
    const html = renderPart(item.id, nextPlan, context!.brief, item.content, { photos })
    if (!html) throw new Error('A IA devolveu uma parte vazia. Tente novamente.')
    nextParts[item.id] = html
  }
  return { plan: nextPlan, parts: nextParts, skipped }
}

// Fotos de uma parte montada na alteração: as anexadas agora, as que a parte
// já tinha, e depois as do negócio e do banco que o site ainda não usa.
function editPhotos(count: number, partId: string, parts: SiteParts, brief: SiteBrief, fresh: SiteAsset[]): string[] {
  if (count <= 0) return []
  const own = [...(parts[partId] ?? '').matchAll(/<img\b[^>]*\ssrc="(https:[^"]+)"/gi)].map((match) => match[1])
  const elsewhere = usedPhotos(Object.fromEntries(Object.entries(parts).filter(([id]) => id !== partId)))
  const pool = [
    ...new Set([
      ...fresh.filter((asset) => asset.kind === 'photo').map((asset) => asset.url),
      ...own.filter((url) => url !== logoOf(brief)),
      ...(brief.assets ?? []).filter((asset) => asset.kind === 'photo').map((asset) => asset.url),
      ...photosFor(brief.niche).map((photo) => stockUrl(photo.id)),
    ]),
  ]
  const free = pool.filter((url) => !elsewhere.has(photoKey(url)))
  const chosen = free.slice(0, count)
  for (let i = 0; chosen.length < count && pool.length; i++) chosen.push(pool[i % pool.length])
  return chosen
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
  if(toggle&&menu){
    function setMenu(open){ menu.classList.toggle('hidden',!open); toggle.setAttribute('aria-expanded',String(open)); }
    if(!menu.id){ menu.id='menu-celular'; }
    toggle.setAttribute('aria-controls',menu.id); toggle.setAttribute('aria-expanded','false');
    toggle.addEventListener('click',function(){ setMenu(menu.classList.contains('hidden')); });
    menu.querySelectorAll('a').forEach(function(a){ a.addEventListener('click',function(){ setMenu(false); }); });
    document.addEventListener('keydown',function(e){ if(e.key==='Escape'&&!menu.classList.contains('hidden')){ setMenu(false); toggle.focus(); } }); }
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
    // Efeito de hover só em aparelho com mouse (no celular ele "grudava" depois do toque).
    future: { hoverOnlyWhenSupported: true },
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
    `<style>:root{--fx-brand:${plan.palette.brand};--fx-accent:${plan.palette.accent}}html{scroll-behavior:smooth}body{font-family:'${plan.fonts.body}',ui-sans-serif,system-ui,sans-serif}.reveal{opacity:0;transform:translateY(16px);transition:opacity .6s cubic-bezier(.16,1,.3,1),transform .6s cubic-bezier(.16,1,.3,1)}.reveal.is-visible{opacity:1;transform:none}:where(a,button,summary,input,select,textarea):focus-visible{outline:2px solid currentColor;outline-offset:3px}.skip-link{position:fixed;left:1rem;top:1rem;z-index:100;transform:translateY(-200%);padding:.75rem 1rem;border-radius:.5rem;background:#fff;color:#111;font-weight:600}.skip-link:focus{transform:none}@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}.reveal{opacity:1;transform:none;transition:none}*,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}details>summary{list-style:none;cursor:pointer}details>summary::-webkit-details-marker{display:none}</style>`,
  ].join('\n')
}

const SKIP_LINK: Record<string, string> = {
  pt: 'Pular para o conteúdo',
  en: 'Skip to content',
  es: 'Saltar al contenido',
  fr: 'Aller au contenu',
  it: 'Vai al contenuto',
  de: 'Zum Inhalt springen',
}

// `pending` = partes ainda sendo escritas: aparecem como um bloco "carregando".
export function assembleSite(plan: SitePlan, parts: SiteParts, options: { pending?: boolean } = {}): string {
  const render = (ids: string[]) =>
    ids
      .map((id) => {
        if (parts[id]) return normalizePart(id, parts[id])
        if (!options.pending) return ''
        return id === 'header' || id === 'footer'
          ? ''
          : `<section id="${id}" class="bg-surface py-24"><div class="mx-auto max-w-6xl px-5 md:px-8 animate-pulse"><div class="h-4 w-32 rounded-full bg-ink/10"></div><div class="mt-5 h-10 w-2/3 rounded-2xl bg-ink/10"></div><div class="mt-8 grid gap-4 md:grid-cols-3"><div class="h-40 rounded-3xl bg-ink/5"></div><div class="h-40 rounded-3xl bg-ink/5"></div><div class="h-40 rounded-3xl bg-ink/5"></div></div></div></section>`
      })
      .filter(Boolean)
      .join('\n\n')
  const lang = plan.lang ?? 'pt-BR'
  const skip = SKIP_LINK[lang.slice(0, 2)] ?? SKIP_LINK.pt
  // As seções ficam dentro de <main>: leitores de tela pulam direto para o
  // conteúdo, e o primeiro Tab da página oferece esse atalho.
  const body = [
    `<a href="#conteudo" class="skip-link">${skip}</a>`,
    render(['header']),
    `<main id="conteudo">\n${render(plan.sections.map((section) => section.id))}\n</main>`,
    render(['footer']),
  ]
    .filter(Boolean)
    .join('\n\n')
  // Só o código dos efeitos que aparecem no HTML entra na página.
  const fx = effectsRuntime(body)
  return `<!doctype html>
<html lang="${lang}">
<head>
${buildHead(plan)}${fx.css ? `\n<style>${fx.css}</style>` : ''}
</head>
<body class="bg-paper text-ink font-body antialiased">
${body}
${BASE_SCRIPT}${fx.js ? `\n<script>${fx.js}</script>` : ''}
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

// Número do WhatsApp só com dígitos e já com o código do país (ex.: 5511…,
// 351…). Número com "+" ou "00" na frente é internacional e fica como veio;
// número só com DDD (10–11 dígitos) é do Brasil.
export function phoneDigits(phone: string | null | undefined): string | null {
  const raw = phone?.trim() ?? ''
  let digits = raw.replace(/\D/g, '')
  const international = raw.startsWith('+') || raw.startsWith('00')
  if (raw.startsWith('00')) digits = digits.slice(2)
  if (international) return digits.length >= 8 && digits.length <= 15 ? digits : null
  if (digits.length === 10 || digits.length === 11) return `55${digits}`
  if (digits.length >= 12 && digits.length <= 13 && digits.startsWith('55')) return digits
  return null
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
