// Direção de arte por nicho: como os melhores sites de cada ramo se comportam (energia, cor, imagem, texto).
// O planejamento recebe a direção do nicho do pedido e parte dela, em vez de cair sempre no mesmo visual
// "bonito e genérico". A marca do negócio ainda decide os detalhes.

export type NicheMood = 'modern' | 'elegant' | 'strong' | 'friendly' | 'craft'

export interface NicheArt {
  id: string
  label: string
  /** Palavras (sem acento, minúsculas) que identificam o nicho no pedido. */
  match: string[]
  /** Tema que costuma funcionar melhor neste ramo. */
  theme?: 'light' | 'dark'
  moods: NicheMood[]
  feel: string
  color: string
  visual: string
  copy: string
  avoid: string
}

export const NICHES: NicheArt[] = [
  {
    id: 'pizzaria',
    label: 'Pizzaria',
    match: ['pizzar', 'pizza'],
    theme: 'light',
    moods: ['craft', 'friendly', 'strong'],
    feel: 'Fome à primeira vista: calor, queijo derretendo, forno a lenha, energia de sexta à noite. Divertido, gostoso, impossível rolar a página sem querer pedir.',
    color: 'Cores quentes e saturadas: vermelho-tomate #d62828, amarelo-queijo #fcbf49, creme #fff3dc, verde-manjericão como toque. Fundo creme ou vermelho cheio em faixas, texto escuro quente. Nada de cinza nem azul.',
    visual: 'Foto GRANDE e apetitosa no topo (pizza saindo do forno, fatia esticando o queijo), título enorme e gordo, selos e etiquetas arredondadas inclinadas, faixa em movimento com sabores, cardápio em cartões com foto, preços em destaque e botão "Pedir agora" sempre à vista.',
    copy: 'Voz gulosa e bem-humorada, sensorial: borda, massa, queijo, forno. Frases curtas que dão água na boca. Cardápio com nome e ingredientes de cada sabor.',
    avoid: 'visual corporativo, fundo escuro frio, texto genérico de "qualidade e tradição", ícones de linha sem comida.',
  },
  {
    id: 'hamburgueria',
    label: 'Hamburgueria',
    match: ['hamburg', 'burger', 'lanchonete', 'lanche'],
    theme: 'dark',
    moods: ['strong', 'craft'],
    feel: 'Street food com atitude: ousado, barulhento, suculento. Parece cartaz de lanchonete cool, dá vontade de morder a tela.',
    color: 'Preto-carvão ou marrom-grelha de fundo com amarelo-mostarda #ffb703, vermelho-ketchup #e63946 e off-white. Contraste alto.',
    visual: 'Foto do burger em close ocupando a tela, tipografia condensada em caixa alta, cortes diagonais, etiquetas de preço tipo carimbo, combos em cartões grandes, faixa rolando com os nomes dos burgers.',
    copy: 'Direto e provocador: "Bem passado no seu apetite". Nome criativo para cada lanche, descrição com ingredientes, combo com preço.',
    avoid: 'clima de restaurante fino, serifas delicadas, cores pastel.',
  },
  {
    id: 'confeitaria',
    label: 'Confeitaria e doceria',
    match: ['confeitar', 'doceria', 'doce', 'bolo', 'brigadeir', 'chocolat', 'cupcake', 'sorveter', 'gelat', 'acai', 'sobremesa'],
    theme: 'light',
    moods: ['friendly', 'craft', 'elegant'],
    feel: 'Doce, delicado e irresistível: parece vitrine de confeitaria, dá vontade de encomendar na hora.',
    color: 'Rosa-algodão #ffd6e0, creme #fff8f0, chocolate #4a2c2a e um toque vibrante (morango #e5383b ou pistache #b5e48c). Fundos suaves, texto marrom-chocolate.',
    visual: 'Fotos de bolos e doces bem próximas, formas arredondadas e orgânicas, tipografia gordinha ou serifada charmosa, selos "feito sob encomenda", galeria em mosaico, passo a passo de como encomendar.',
    copy: 'Carinhosa e gulosa: ocasião (aniversário, casamento), sabores, tamanhos e prazo de encomenda.',
    avoid: 'preto e cinza, visual tecnológico, blocos retos e duros.',
  },
  {
    id: 'padaria',
    label: 'Padaria e cafeteria',
    match: ['padaria', 'cafeteria', 'cafe ', 'cafe', 'confeitaria artesanal', 'brunch'],
    theme: 'light',
    moods: ['craft', 'elegant', 'friendly'],
    feel: 'Aconchego de manhã cedo: pão quentinho, cheiro de café. Artesanal e acolhedor.',
    color: 'Creme #fbf3e4, trigo #e0a458, café #5b3a29 e um acento terracota #c8553d. Papel texturizado, tons de forno.',
    visual: 'Fotos de pães e café, tipografia serifada com personalidade, etiquetas estilo embalagem de papel, horário de funcionamento bem à vista, vitrine de produtos do dia.',
    copy: 'Calorosa e simples: o que sai do forno e a que horas, produtos do dia, encomendas de festa.',
    avoid: 'frieza corporativa, neon, cores geladas.',
  },
  {
    id: 'restaurante',
    label: 'Restaurante, bar e culinária',
    match: ['restaurante', 'churrasc', 'sushi', 'japones', 'cantina', 'bistro', 'pub', 'bar ', 'boteco', 'marmit', 'comida', 'culinar', 'gastron', 'rodizio'],
    moods: ['craft', 'elegant', 'strong'],
    feel: 'Apetite e ambiente: o visitante já imagina a mesa posta. A energia muda com o tipo (cantina acolhedora, sushi sofisticado, boteco animado).',
    color: 'Siga a culinária: cantina em vinho e creme; japonês em preto, vermelho-laca e off-white; churrasco em carvão e brasa laranja; boteco em amarelo e verde vivos. Sempre apetitoso, nunca frio.',
    visual: 'Foto de prato em close e do ambiente, cardápio com categorias e preços, botão de reserva/pedido evidente, mapa e horários, selo de avaliações reais se existirem.',
    copy: 'Fale do prato como quem descreve com a boca cheia d\'água; destaque os campeões do cardápio e como reservar ou pedir.',
    avoid: 'texto corporativo, ícones genéricos no lugar de comida, cores acinzentadas.',
  },
  {
    id: 'barbearia',
    label: 'Barbearia',
    match: ['barbear', 'barber'],
    theme: 'dark',
    moods: ['strong', 'elegant'],
    feel: 'Masculino, autoral e com atitude: couro, navalha, madeira. Clube exclusivo com hora marcada.',
    color: 'Grafite/preto #121212 com dourado-latão #c9a24b ou cobre, off-white. Poucas cores, muito contraste.',
    visual: 'Fotos em preto e branco ou quentes de corte e barba, título condensado enorme, selo/brasão, tabela de serviços estilo lousa, galeria de cortes, agendamento em destaque.',
    copy: 'Seco e confiante, sem exagero: "Corte, barba e cerveja gelada". Serviços com tempo e preço.',
    avoid: 'pastel, curvas fofas, clima de salão feminino.',
  },
  {
    id: 'estetica',
    label: 'Estética, salão e beleza',
    match: ['estetic', 'salao', 'cabel', 'manicure', 'unha', 'sobrancelha', 'beleza', 'spa', 'maquiag', 'depila', 'lash', 'studio'],
    moods: ['elegant', 'friendly', 'modern'],
    feel: 'Cuidado, autoestima e sofisticação leve: o visitante se imagina saindo renovada. Luminoso e feminino sem ser infantil.',
    color: 'Nude #f4e4dc, rosé #d98e9b, champagne #e8d5b7 e um tom profundo (ameixa #5b2a4a ou verde-oliva) para contraste. Muito respiro.',
    visual: 'Fotos de antes e depois, rostos e mãos em luz suave, tipografia serifada elegante com títulos grandes, serviços em cartões limpos com preço a partir de, agendamento pelo WhatsApp.',
    copy: 'Acolhedora e confiante; benefícios (resultado, conforto, duração) e os cuidados com biossegurança.',
    avoid: 'rosa-chiclete saturado, preto pesado, tom clínico frio.',
  },
  {
    id: 'saude',
    label: 'Clínica, dentista e saúde',
    match: ['clinic', 'dentist', 'odonto', 'fisio', 'psicolog', 'nutri', 'medic', 'saude', 'consultorio', 'fono', 'laborat', 'ortodon'],
    moods: ['modern', 'elegant'],
    feel: 'Confiança, limpeza e acolhimento: transmite cuidado e competência. Claro, arejado, humano.',
    color: 'Branco e azul-água #0ea5b7 ou verde-saúde #2a9d8f, azul-marinho #12355b no texto, toque de coral para o botão. Nada de vermelho forte.',
    visual: 'Foto de sorriso/equipe acolhedora, números de confiança reais, tratamentos em cartões com ícones simples, perguntas frequentes, botão "Agendar consulta" evidente, depoimentos só se reais.',
    copy: 'Clara e tranquilizadora, sem jargão: o que trata, como é a consulta, convênios, como agendar.',
    avoid: 'preto agressivo, promessas de cura, visual de hospital frio.',
  },
  {
    id: 'juridico',
    label: 'Advocacia e contabilidade',
    match: ['advoca', 'advogad', 'juridic', 'contab', 'contador'],
    moods: ['elegant', 'modern'],
    feel: 'Autoridade e sobriedade: sério, sofisticado, de confiança. Quem está em apuros sente que encontrou o lugar certo.',
    color: 'Azul-marinho #0b1f3a ou verde-garrafa #0f2e2a, dourado fosco #b08d57, off-white. Contraste elegante.',
    visual: 'Tipografia serifada grande, linhas finas, retrato profissional do advogado, áreas de atuação em lista clara, passo a passo do atendimento, botão de consulta discreto mas firme.',
    copy: 'Segura e humana: reconheça o problema do cliente, explique como ajuda, sem prometer resultado.',
    avoid: 'cores vibrantes, balança e martelo clichê em excesso, informalidade.',
  },
  {
    id: 'fitness',
    label: 'Academia e esportes',
    match: ['academia', 'crossfit', 'pilates', 'personal', 'fitness', 'luta', 'danca', 'yoga', 'muscula', 'treino'],
    theme: 'dark',
    moods: ['strong', 'modern'],
    feel: 'Energia e movimento: adrenalina, suor, superação. Dá vontade de começar hoje.',
    color: 'Preto #0a0a0a com um neon forte (verde-limão #c6ff00, laranja #ff5400 ou magenta) e branco. Alto contraste.',
    visual: 'Fotos de treino em ação, títulos gigantes em caixa alta condensada, números grandes (alunos, modalidades), planos em cartões com destaque, grade de horários, botão de aula experimental.',
    copy: 'Curta e motivadora, verbos de ação, foco no resultado e na aula experimental.',
    avoid: 'tons pastel, serifas finas, clima de spa.',
  },
  {
    id: 'pet',
    label: 'Pet shop e veterinária',
    match: ['pet', 'veterin', 'tosa', 'canil', 'banho e tosa'],
    theme: 'light',
    moods: ['friendly', 'modern'],
    feel: 'Alegre, carinhoso e confiável: patinhas, brilho no olhar dos bichos. Leve e colorido.',
    color: 'Amarelo-sol #ffc83d, azul-céu #4cc9f0, verde-folha #80ed99 e off-white, com texto azul-petróleo. Cores amigáveis, cantos bem arredondados.',
    visual: 'Fotos de cães e gatos felizes, formas arredondadas, selos de serviço (banho, tosa, consulta), cartões simpáticos, botão de agendar banho pelo WhatsApp.',
    copy: 'Afetuosa, trate o pet pelo nome e fale de bem-estar e segurança.',
    avoid: 'visual sombrio, clínico demais, preto pesado.',
  },
  {
    id: 'auto',
    label: 'Oficina, estética automotiva e carros',
    match: ['oficina', 'mecanic', 'automotiv', 'lava jato', 'lava-jato', 'lavagem', 'polimento', 'vitrific', 'detail', 'martelinho', 'concessionar', 'seminovo', 'carros', 'funilar', 'borrachar', 'pneu', 'moto', 'guincho', 'auto'],
    moods: ['strong', 'modern'],
    feel: 'Potência e precisão: máquina bem cuidada, reflexo na lataria. Robusto e premium.',
    color: 'Grafite #16181d, laranja-óleo #ff6b00 ou azul-elétrico, prata e branco. Brilhos metálicos.',
    visual: 'Foto do carro em close, tipografia forte condensada, serviços numerados, antes e depois, selo de garantia, orçamento pelo WhatsApp em destaque.',
    copy: 'Técnica e transparente: o que faz, quanto tempo leva, garantia, como pedir orçamento.',
    avoid: 'tons suaves, clima de salão, excesso de gradiente roxo.',
  },
  {
    id: 'casa',
    label: 'Imobiliária, arquitetura e construção',
    match: ['imobil', 'imove', 'corretor', 'constru', 'reforma', 'arquitet', 'engenh', 'marcenar', 'decorac', 'interiores'],
    moods: ['elegant', 'modern'],
    feel: 'Aspiracional e sólido: o lar dos sonhos, projeto bem resolvido. Espaçoso, com fotos amplas.',
    color: 'Branco-gelo, areia #e9e1d4, verde-musgo #3d5a49 ou azul-petróleo, preto suave. Tons naturais e calmos.',
    visual: 'Fotos grandes de ambientes, grade de imóveis ou projetos com preço/metragem, tipografia elegante, filtro simples, botão para visitar.',
    copy: 'Concreta: metragem, bairro, diferenciais, etapas da obra ou da compra.',
    avoid: 'neon, visual tecnológico, poluição visual.',
  },
  {
    id: 'loja',
    label: 'Loja e moda',
    match: ['loja', 'roupa', 'moda', 'calcad', 'boutique', 'otica', 'joalher', 'bijuter', 'acessor'],
    moods: ['modern', 'elegant', 'strong'],
    feel: 'Desejo e estilo: editorial, como vitrine de revista. Produtos em primeiro plano.',
    color: 'Neutros fortes (preto, off-white, bege) com UMA cor de assinatura marcante da marca. Fotografia faz o trabalho.',
    visual: 'Fotos grandes em grade, tipografia de moda (serifa alta ou grotesca fina), categorias em destaque, selo de frete/novidades, botão de comprar pelo WhatsApp.',
    copy: 'Curta e estilosa, fale de coleção, tamanhos e como comprar.',
    avoid: 'cores aleatórias, excesso de texto, estilo de panfleto.',
  },
  {
    id: 'escola',
    label: 'Escola, cursos e idiomas',
    match: ['escola', 'curso', 'idioma', 'educa', 'colegio', 'creche', 'ingles', 'reforco'],
    theme: 'light',
    moods: ['friendly', 'modern'],
    feel: 'Inspirador e acessível: aprender com leveza, evolução visível. Colorido sem bagunça.',
    color: 'Azul-royal #3a5ccc, amarelo #ffc233, verde #2ec4b6, fundo claro. Formas amigáveis.',
    visual: 'Fotos de alunos reais, trilha de aprendizado em passos, planos e turmas em cartões, números de resultado reais, botão de aula experimental/matrícula.',
    copy: 'Positiva e objetiva: metodologia, turmas, horários e primeiro passo.',
    avoid: 'tom burocrático, preto e dourado sisudo.',
  },
  {
    id: 'hospedagem',
    label: 'Pousada, hotel e turismo',
    match: ['pousada', 'hotel', 'hostel', 'resort', 'chale', 'hosped', 'turism', 'viage'],
    moods: ['elegant', 'craft'],
    feel: 'Desejo de viajar: fotos imersivas, calma e descoberta. O visitante já se vê lá.',
    color: 'Tons da paisagem do lugar (azul-mar e areia, verde-mata e madeira, terracota). Luz natural, fundos claros ou profundos.',
    visual: 'Fotos enormes de quartos e paisagem, galeria, tipografia elegante, comodidades em ícones, botão de reservar sempre presente.',
    copy: 'Sensorial e acolhedora: a vista, o café da manhã, o que fazer por perto.',
    avoid: 'visual corporativo, cores frias sem relação com o lugar.',
  },
  {
    id: 'eventos',
    label: 'Eventos, buffet e festas',
    match: ['evento', 'casament', 'buffet', 'festa', 'cerimon', 'cerimonial'],
    moods: ['elegant', 'craft'],
    feel: 'Celebração e emoção: sonho de festa perfeita. Romântico ou festivo, conforme o evento.',
    color: 'Champagne, blush e dourado para casamento; cores vivas e confete para festa infantil; sempre com muita luz.',
    visual: 'Galeria ampla de festas reais, tipografia com personalidade, pacotes em cartões, etapas de contratação, depoimentos reais e botão de orçamento.',
    copy: 'Emocional e organizada: como funciona, o que está incluído, como pedir orçamento.',
    avoid: 'frieza, tipografia técnica, preto pesado.',
  },
  {
    id: 'fotografia',
    label: 'Fotografia e vídeo',
    match: ['fotograf', 'filmag', 'video'],
    moods: ['elegant', 'modern'],
    feel: 'Galeria de arte: o trabalho é a estrela. Minimalista e imersivo.',
    color: 'Preto ou off-white neutro, quase sem cor de interface; as fotos trazem a cor.',
    visual: 'Portfólio em tela cheia, grade assimétrica, tipografia discreta, categorias, contato simples.',
    copy: 'Poucas palavras, bem escolhidas; destaque o estilo e como contratar.',
    avoid: 'decoração concorrendo com as fotos, cores berrantes.',
  },
  {
    id: 'tecnologia',
    label: 'Tecnologia, agência e marketing',
    match: ['tecnolog', 'software', 'marketing', 'startup', 'desenvolv', 'programa', 'informatic', 'agencia', 'design', 'sites'],
    moods: ['modern', 'strong'],
    feel: 'Moderno e confiante: precisão, velocidade, resultado. Premium e atual.',
    color: 'Escuro profundo com gradiente de uma cor viva (violeta, ciano ou lima) e branco. Brilhos sutis.',
    visual: 'Tipografia geométrica grande, cartões em vidro, números de resultado reais, casos e serviços em grade, botão de falar com especialista.',
    copy: 'Objetiva e orientada a resultado, sem jargão vazio.',
    avoid: 'clichês de "inovação e excelência", clima artesanal.',
  },
  {
    id: 'pessoal',
    label: 'Marca pessoal, consultoria e mentoria',
    match: ['consultor', 'coach', 'mentor', 'palestr', 'marca pessoal', 'influenc', 'terapeut'],
    moods: ['modern', 'elegant'],
    feel: 'Personalidade e proximidade: a pessoa é a marca. Retrato forte, voz própria.',
    color: 'Uma cor de assinatura marcante e neutros; contraste alto entre a cor e o retrato.',
    visual: 'Retrato grande, citação de impacto, método em etapas, resultados e depoimentos reais, botão para conversar.',
    copy: 'Em primeira pessoa, humana e direta.',
    avoid: 'tom institucional, banco de imagens genérico.',
  },
]

function normalizeText(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

/** Nicho do pedido: olha primeiro o campo nicho e, na falta dele, o nome e o texto do pedido (as mais específicas vêm antes). */
export function nicheFor(brief: { niche?: string | null; businessName?: string | null; details?: string | null }): NicheArt | undefined {
  const sources = [brief.niche ?? '', `${brief.businessName ?? ''} ${(brief.details ?? '').slice(0, 400)}`].map((text) => ` ${normalizeText(text)} `)
  for (const source of sources) {
    if (!source.trim()) continue
    const found = NICHES.find((niche) => niche.match.some((word) => source.includes(word.length <= 3 ? ` ${word} ` : word)))
    if (found) return found
  }
  return undefined
}

export function nicheMessage(niche: NicheArt): string {
  return [
    `DIREÇÃO DO NICHO — ${niche.label} (é assim que os melhores sites deste ramo se comportam; parta disto e deixe a marca e o pedido do usuário decidirem os detalhes. Se o pedido disser outra coisa, o pedido vence):`,
    `- Sensação: ${niche.feel}`,
    `- Cor: ${niche.color}`,
    `- Visual: ${niche.visual}`,
    `- Texto: ${niche.copy}`,
    `- Evite: ${niche.avoid}`,
  ].join('\n')
}
