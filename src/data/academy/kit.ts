import type { KitPrompt, KitProposal, KitScript } from './types'

// Prompts para usar em qualquer IA (ChatGPT, Claude, construtores de site com IA).
// Os trechos entre colchetes são para trocar pelos dados do cliente.
export const KIT_PROMPTS: KitPrompt[] = [
  {
    id: 'briefing-estrutura',
    title: 'Estrutura do site a partir do briefing',
    category: 'site',
    description: 'Primeiro passo: define as seções antes de qualquer texto.',
    text: `Você é um especialista em sites para pequenos negócios locais no Brasil.

Negócio: [nome da empresa], [ramo], em [cidade/UF].
Serviços principais: [lista de serviços].
Diferenciais: [diferenciais].
Público: [quem são os clientes].
Objetivo do site: [ex.: gerar agendamentos pelo WhatsApp].

Proponha a estrutura de um site de uma página, com as seções em ordem. Para cada seção, diga o objetivo e o que deve conter. Priorize conversão pelo WhatsApp e uso no celular. Não escreva os textos ainda.`,
  },
  {
    id: 'textos-home',
    title: 'Textos da página inicial',
    category: 'site',
    description: 'Gera títulos e textos curtos, com chamadas para o WhatsApp.',
    text: `Com base nesta estrutura de seções: [cole a estrutura aprovada]

Escreva os textos da página inicial de [nome da empresa], [ramo] em [cidade].
Regras:
- Título principal com o que a empresa faz e onde (máximo 10 palavras).
- Subtítulo com o benefício para o cliente (máximo 25 palavras).
- Textos curtos, linguagem simples, sem exageros e sem prometer resultados.
- Um botão de chamada por seção, levando ao WhatsApp.
- Português do Brasil.`,
  },
  {
    id: 'landing-campanha',
    title: 'Landing page para anúncio',
    category: 'landing',
    description: 'Página única focada em uma oferta ou campanha.',
    text: `Crie uma landing page para [nome da empresa], [ramo] em [cidade], para a campanha: [oferta, ex.: avaliação gratuita].

Inclua: título forte, 3 benefícios, como funciona em 3 passos, prova social ([avaliações ou números reais]), perguntas frequentes (4) e chamada final para o WhatsApp.
A página será acessada principalmente pelo celular, vinda de um anúncio. Textos curtos, em português do Brasil, sem inventar números ou depoimentos.`,
  },
  {
    id: 'secao-servicos',
    title: 'Seção de serviços',
    category: 'site',
    description: 'Transforma uma lista de serviços em cartões que vendem.',
    text: `Transforme esta lista de serviços de [nome da empresa] em cartões para um site: [lista de serviços].

Para cada serviço: nome, uma frase de benefício para o cliente (máximo 20 palavras) e um texto de botão. Linguagem simples, sem termos técnicos, português do Brasil.`,
  },
  {
    id: 'faq-negocio',
    title: 'Perguntas frequentes do negócio',
    category: 'site',
    description: 'FAQ que responde as dúvidas que chegam no WhatsApp.',
    text: `Escreva 6 perguntas frequentes com respostas curtas para o site de [nome da empresa], [ramo] em [cidade].
Baseie-se nas dúvidas mais comuns que os clientes mandam no WhatsApp: [cole exemplos de perguntas reais, se tiver].
As respostas devem ter no máximo 3 frases e terminar, quando fizer sentido, convidando para chamar no WhatsApp. Não invente preços, horários ou políticas que não foram informados.`,
  },
  {
    id: 'sistema-simples',
    title: 'Especificação de um sistema simples',
    category: 'sistema',
    description: 'Organiza o pedido do cliente antes de construir um sistema.',
    text: `Quero construir um sistema simples para [nome da empresa], [ramo].
Problema atual: [ex.: controla as ordens de serviço em papel].
O que precisa fazer: [lista do que o cliente pediu].
Quem vai usar: [ex.: dono e 2 funcionários, pelo celular].

Organize isso em: (1) funcionalidades essenciais da primeira versão, (2) o que pode ficar para depois, (3) telas necessárias, (4) dados que o sistema guarda, (5) riscos e dúvidas para confirmar com o cliente. Seja objetivo.`,
  },
  {
    id: 'revisao-site',
    title: 'Revisão crítica antes de entregar',
    category: 'revisao',
    description: 'Peça para a IA revisar como se fosse um cliente exigente.',
    text: `Aja como um cliente exigente e como um especialista em conversão. Revise o site abaixo: [cole os textos ou descreva as seções].

Aponte: (1) o que está confuso, (2) o que falta para o visitante confiar, (3) onde o caminho até o WhatsApp está difícil, (4) erros de português, (5) três melhorias com maior impacto. Seja direto e específico.`,
  },
  {
    id: 'bio-portfolio',
    title: 'Sua apresentação no portfólio',
    category: 'revisao',
    description: 'Frase e "sobre você" para o Sellers Portfolio.',
    text: `Escreva para mim, em português do Brasil:
1. Uma frase de apresentação (máximo 15 palavras) dizendo o que eu faço e para quem.
2. Um parágrafo "sobre mim" (máximo 60 palavras), em primeira pessoa, humano e sem exageros.

Sobre mim: faço [sites/landing pages/sistemas] para [nicho] em [cidade/região]. Meu diferencial: [diferencial]. Já atendi [tipo de clientes, se já tiver].`,
  },
]

// Scripts de mensagem: podem virar Modelos de mensagem com um clique.
// Usam as mesmas variáveis dos modelos: {nome}, {cidade}, {negocio}, {valor},
// {assinatura}, {portfolio}.
export const KIT_SCRIPTS: KitScript[] = [
  {
    id: 'abordagem-sem-site',
    title: 'Abordagem — empresa sem site',
    category: 'abordagem',
    whenToUse: 'Empresa com boas avaliações e sem site.',
    text: 'Oi, tudo bem? Aqui é {assinatura}. Vi que a {nome} tem ótimas avaliações, mas ainda não tem um site para quem procura no Google aqui em {cidade}. Fiz alguns para negócios parecidos: {portfolio}. Posso te mostrar uma ideia para vocês?',
  },
  {
    id: 'abordagem-so-instagram',
    title: 'Abordagem — só Instagram',
    category: 'abordagem',
    whenToUse: 'Perfil ativo no Instagram, sem site.',
    text: 'Oi! Aqui é {assinatura}. Acompanhei o Instagram da {nome} e dá para ver o cuidado com o trabalho. Para quem ainda não segue vocês e procura no Google, um site simples com botão de WhatsApp ajuda muito. Posso te mandar um exemplo?',
  },
  {
    id: 'abordagem-site-antigo',
    title: 'Abordagem — site antigo ou fora do ar',
    category: 'abordagem',
    whenToUse: 'O site existe, mas está desatualizado, lento ou não abre.',
    text: 'Oi, tudo bem? Aqui é {assinatura}. Tentei abrir o site da {nome} pelo celular e ele está com dificuldade para carregar. Muita gente desiste quando isso acontece. Posso te mostrar como ficaria uma versão nova, rápida e com WhatsApp?',
  },
  {
    id: 'abordagem-indicacao',
    title: 'Abordagem — indicação',
    category: 'abordagem',
    whenToUse: 'Alguém indicou você para essa empresa.',
    text: 'Oi! Aqui é {assinatura}. Quem me passou seu contato foi [nome de quem indicou] — fiz o site dele(a) recentemente. Ele(a) comentou que vocês estão pensando em melhorar a presença online da {nome}. Posso te mostrar o que fizemos?',
  },
  {
    id: 'follow-up-exemplo',
    title: 'Follow-up — com exemplo',
    category: 'follow_up',
    whenToUse: 'Segundo contato, quando a primeira mensagem não teve resposta.',
    text: 'Oi! Passando para te mostrar um exemplo parecido com o que imagino para a {nome}: {portfolio}. Se fizer sentido, a gente conversa 10 minutinhos essa semana?',
  },
  {
    id: 'follow-up-ultimo',
    title: 'Follow-up — última tentativa',
    category: 'follow_up',
    whenToUse: 'Terceiro contato sem resposta.',
    text: 'Oi! Não quero ser insistente, então essa é minha última mensagem. Se em algum momento a {nome} quiser um site para receber mais clientes pelo Google, é só me chamar. Sucesso por aí!',
  },
  {
    id: 'envio-proposta',
    title: 'Envio da proposta',
    category: 'proposta',
    whenToUse: 'Depois da conversa de diagnóstico.',
    text: 'Oi! Como combinamos, segue a proposta de {negocio}. Coloquei três opções para você escolher a que faz mais sentido agora. Consegue me dar um retorno até [dia]? Qualquer dúvida, me chama.',
  },
  {
    id: 'lembrete-pagamento',
    title: 'Lembrete de pagamento',
    category: 'cobranca',
    whenToUse: 'Parcela vencendo ou vencida.',
    text: 'Oi, tudo certo? Passando para lembrar da parcela referente a {negocio} ({valor}). Se já pagou, pode desconsiderar e me desculpe pelo lembrete. Obrigado!',
  },
]

export const KIT_PROPOSALS: KitProposal[] = [
  {
    id: 'proposta-site',
    title: 'Proposta — site institucional',
    description: 'Para negócios locais que precisam aparecer no Google e receber contatos.',
    body: `# Proposta — Site da [nome da empresa]

**Para:** [nome do cliente] · **De:** [seu nome / sua empresa] · **Data:** [data]

## O que entendi
Hoje os clientes chegam principalmente por [indicação / Instagram]. Quem procura [serviço] em [cidade] no Google não encontra a [nome da empresa], e parte dos contatos se perde no telefone.

## A solução
Um site rápido, pensado para o celular, que apresenta os serviços com clareza e leva o visitante direto para o WhatsApp.

## Escopo
- Página inicial com apresentação, serviços, diferenciais, avaliações e mapa
- Botão de WhatsApp em todas as seções
- Até [5] páginas de serviço
- Ajustes de texto e imagem em até [2] rodadas
- Publicação no domínio do cliente

**Não incluso:** domínio e hospedagem, produção de fotos, anúncios pagos.

## Prazo
[15] dias úteis após o recebimento de fotos, logo e informações.

## Investimento
- **Essencial** — página única com WhatsApp e mapa: R$ [valor]
- **Profissional** — site completo do escopo acima: R$ [valor]
- **Completo** — Profissional + [extras, ex.: 3 meses de manutenção]: R$ [valor]

Pagamento: [50% na aprovação e 50% na entrega, via Pix].

## Próximos passos
1. Escolha da opção
2. Assinatura do contrato e pagamento da entrada
3. Envio dos materiais e início do projeto

Proposta válida por [7] dias.`,
  },
  {
    id: 'proposta-landing',
    title: 'Proposta — landing page',
    description: 'Para campanhas, anúncios ou uma oferta específica.',
    body: `# Proposta — Landing page [nome da campanha]

**Para:** [nome do cliente] · **De:** [seu nome / sua empresa] · **Data:** [data]

## Objetivo
Transformar quem vê [o anúncio / a divulgação] de [oferta] em conversas no WhatsApp.

## O que será entregue
- Página única otimizada para celular
- Título, benefícios, como funciona, prova social e perguntas frequentes
- Botão de WhatsApp com mensagem pronta
- Ajustes em até [2] rodadas

**Não incluso:** criação e gestão dos anúncios, domínio e hospedagem.

## Prazo
[7] dias úteis após o recebimento das informações.

## Investimento
R$ [valor] — pagamento: [50% na aprovação e 50% na entrega].

## Próximos passos
Aprovação da proposta → contrato → envio das informações → início.`,
  },
  {
    id: 'proposta-sistema',
    title: 'Proposta — sistema simples',
    description: 'Para automatizar um processo do cliente (agenda, pedidos, ordens de serviço).',
    body: `# Proposta — Sistema de [nome do processo]

**Para:** [nome do cliente] · **De:** [seu nome / sua empresa] · **Data:** [data]

## Situação atual
Hoje [o processo] é feito [em papel / em planilhas / pelo WhatsApp], o que causa [problemas relatados pelo cliente].

## A solução
Um sistema simples, acessado pelo celular e pelo computador, para [objetivo principal].

## Primeira versão (escopo)
- [Funcionalidade 1]
- [Funcionalidade 2]
- [Funcionalidade 3]
- Acesso para até [3] usuários
- Treinamento de [1] hora

**Fica para uma próxima fase:** [itens combinados para depois].

## Prazo
[30] dias, em [2] entregas: [entrega 1] e [entrega 2].

## Investimento
- Desenvolvimento: R$ [valor]
- Manutenção e suporte (opcional): R$ [valor]/mês

Pagamento: [40% na aprovação, 30% na primeira entrega, 30% na entrega final].

## Próximos passos
Aprovação → contrato → reunião de início → primeira entrega.`,
  },
]
