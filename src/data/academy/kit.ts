import type { KitPrompt, KitProposal, KitScript } from './types'

// Kit de execução. Nada aqui tem campos para preencher: os prompts pedem que a
// IA faça as perguntas sobre o cliente, e as mensagens e propostas já saem
// prontas para enviar (basta ajustar o que for diferente no seu caso).

const ASK_FIRST = 'Antes de começar, me faça as perguntas que precisar sobre o negócio do cliente (uma lista curta e numerada) e espere minhas respostas.'

export const KIT_PROMPTS: KitPrompt[] = [
  // Site
  {
    id: 'briefing-estrutura',
    title: 'Estrutura do site a partir do briefing',
    category: 'site',
    description: 'Primeiro passo: define as seções antes de qualquer texto.',
    text: `Você é um especialista em sites para pequenos negócios locais no Brasil.

${ASK_FIRST} Quero saber: o que a empresa faz, onde atende, principais serviços, diferenciais, quem são os clientes e qual o objetivo do site.

Depois, proponha a estrutura de um site de uma página, com as seções em ordem. Para cada seção, diga o objetivo e o que deve conter. Priorize conversão pelo WhatsApp e uso no celular. Não escreva os textos ainda.`,
  },
  {
    id: 'textos-home',
    title: 'Textos da página inicial',
    category: 'site',
    description: 'Títulos e textos curtos, com chamadas para o WhatsApp.',
    text: `Agora escreva os textos da página inicial seguindo a estrutura que aprovamos nesta conversa. Se ainda não tivermos uma estrutura, me faça antes as perguntas que precisar sobre o negócio do cliente.

Regras:
- Título principal dizendo o que a empresa faz e onde (máximo 10 palavras).
- Subtítulo com o benefício para o cliente (máximo 25 palavras).
- Textos curtos, linguagem simples, sem exageros e sem prometer resultados.
- Um botão de chamada por seção, levando ao WhatsApp.
- Português do Brasil.`,
  },
  {
    id: 'secao-servicos',
    title: 'Seção de serviços que vende',
    category: 'site',
    description: 'Transforma uma lista de serviços em cartões com benefício.',
    text: `Vou te passar a lista de serviços de um cliente. Transforme cada serviço em um cartão para o site com: nome do serviço, uma frase de benefício para o cliente final (máximo 20 palavras) e um texto curto de botão.

Linguagem simples, sem termos técnicos, em português do Brasil. Se algum serviço estiver confuso, me pergunte antes de escrever.

Me peça a lista de serviços para começarmos.`,
  },
  {
    id: 'faq-negocio',
    title: 'Perguntas frequentes do negócio',
    category: 'site',
    description: 'FAQ que responde as dúvidas que chegam no WhatsApp.',
    text: `Quero criar a seção de perguntas frequentes do site de um cliente.

${ASK_FIRST} Pergunte principalmente quais dúvidas os clientes mais mandam no WhatsApp, horários, formas de pagamento e como funciona o atendimento.

Depois escreva 6 perguntas com respostas de no máximo 3 frases. Quando fizer sentido, termine convidando para chamar no WhatsApp. Nunca invente preços, horários ou políticas que eu não informei.`,
  },
  {
    id: 'sobre-empresa',
    title: 'Texto "Sobre a empresa"',
    category: 'site',
    description: 'História curta que gera confiança, sem clichês.',
    text: `Escreva a seção "Sobre" do site de um cliente, com no máximo 90 palavras, em tom humano e próximo.

${ASK_FIRST} Quero saber: há quanto tempo a empresa existe, como começou, quem está à frente e o que os clientes mais elogiam.

Evite clichês como "excelência", "qualidade" e "compromisso". Mostre com fatos por que dá para confiar. Português do Brasil.`,
  },
  {
    id: 'seo-local',
    title: 'Título e descrição para o Google',
    category: 'site',
    description: 'Ajuda o site a aparecer em buscas da cidade.',
    text: `Crie o título (até 60 caracteres) e a descrição (até 155 caracteres) que aparecem no Google para as páginas de um site de negócio local.

${ASK_FIRST} Preciso saber o ramo, a cidade e os bairros atendidos, os serviços principais e quais páginas o site tem.

Para cada página, entregue: título, descrição e 5 buscas que um cliente real faria no Google. Nada de repetir palavras só para "enganar" o buscador.`,
  },
  {
    id: 'paleta-visual',
    title: 'Identidade visual rápida',
    category: 'site',
    description: 'Cores, fontes e estilo coerentes com o negócio.',
    text: `Sugira uma identidade visual simples para o site de um cliente que ainda não tem marca definida.

${ASK_FIRST} Quero saber o ramo, o público, a sensação que a marca deve passar e se já existe logo ou alguma cor usada no Instagram.

Entregue: paleta com 5 cores (código hex e onde usar cada uma), 2 combinações de fontes do Google Fonts, estilo de fotos recomendado e 3 referências de estilo para eu buscar. Priorize contraste e leitura no celular.`,
  },
  // Landing page
  {
    id: 'landing-campanha',
    title: 'Landing page para anúncio',
    category: 'landing',
    description: 'Página única focada em uma oferta ou campanha.',
    text: `Quero criar uma landing page para uma campanha de um cliente.

${ASK_FIRST} Pergunte qual é a oferta, para quem, onde o anúncio vai rodar e quais provas reais existem (avaliações, números, fotos).

Depois escreva a página com: título forte, 3 benefícios, como funciona em 3 passos, prova social, 4 perguntas frequentes e chamada final para o WhatsApp. A página será aberta no celular, vinda de um anúncio. Textos curtos, sem inventar números ou depoimentos.`,
  },
  {
    id: 'landing-lancamento',
    title: 'Landing de lançamento ou lista de espera',
    category: 'landing',
    description: 'Para quem vai abrir algo novo e quer juntar interessados.',
    text: `Escreva uma landing page de lista de espera para o lançamento de um produto ou serviço de um cliente.

${ASK_FIRST} Quero saber o que será lançado, quando, para quem e qual vantagem terá quem entrar na lista.

Estrutura: título com a novidade, 3 motivos para entrar na lista, o que a pessoa ganha por entrar antes, formulário curto (nome e WhatsApp) e uma linha de urgência honesta. Nada de contagem regressiva falsa.`,
  },
  {
    id: 'landing-variacoes',
    title: 'Variações de título para testar',
    category: 'landing',
    description: 'Cinco ângulos diferentes para a mesma oferta.',
    text: `Tenho uma landing page pronta e quero testar outros títulos.

Me peça o título e o subtítulo atuais e a oferta. Depois crie 5 variações, cada uma com um ângulo diferente: dor, resultado, rapidez, prova social e curiosidade. Para cada uma, explique em uma linha para qual tipo de visitante ela funciona melhor.`,
  },
  // Sistema
  {
    id: 'sistema-simples',
    title: 'Especificação de um sistema simples',
    category: 'sistema',
    description: 'Organiza o pedido do cliente antes de construir.',
    text: `Quero construir um sistema simples para um cliente e preciso organizar o pedido antes.

${ASK_FIRST} Pergunte qual é o problema atual, o que o sistema precisa fazer, quem vai usar e em qual aparelho.

Depois organize em: (1) funcionalidades essenciais da primeira versão, (2) o que pode ficar para depois, (3) telas necessárias, (4) dados que o sistema guarda, (5) dúvidas para confirmar com o cliente. Seja objetivo.`,
  },
  {
    id: 'sistema-telas',
    title: 'Telas e fluxo do usuário',
    category: 'sistema',
    description: 'Do login à tarefa principal, tela por tela.',
    text: `Com base na especificação que fizemos nesta conversa, descreva as telas do sistema na ordem em que o usuário passa por elas. Se ainda não tivermos a especificação, me pergunte sobre o sistema antes.

Para cada tela: objetivo, elementos (campos, botões, listas), o que acontece em cada ação e mensagens de erro. Pense primeiro no celular. No fim, liste o caminho mais curto para a tarefa mais importante do dia a dia.`,
  },
  {
    id: 'sistema-dados',
    title: 'Estrutura de dados do sistema',
    category: 'sistema',
    description: 'Tabelas e campos antes de começar a construir.',
    text: `Monte a estrutura de dados do sistema que especificamos nesta conversa. Se ainda não tivermos a especificação, me pergunte sobre o sistema antes.

Liste as tabelas com: nome, campos (com tipo), campos obrigatórios e como as tabelas se ligam. Inclua datas de criação e quem criou cada registro. Aponte o que precisa de cuidado com privacidade (dados pessoais de clientes) e o que deve ser apenas leitura para funcionários.`,
  },
  // Revisão
  {
    id: 'revisao-site',
    title: 'Revisão crítica antes de entregar',
    category: 'revisao',
    description: 'A IA revisa como se fosse um cliente exigente.',
    text: `Aja como um cliente exigente e como um especialista em conversão. Vou colar os textos do site (ou descrever as seções) na próxima mensagem.

Aponte: (1) o que está confuso, (2) o que falta para o visitante confiar, (3) onde o caminho até o WhatsApp está difícil, (4) erros de português, (5) as três melhorias com maior impacto. Seja direto e específico.`,
  },
  {
    id: 'revisao-celular',
    title: 'Checklist de celular e velocidade',
    category: 'revisao',
    description: 'Tudo o que conferir antes de mostrar ao cliente.',
    text: `Me dê um checklist prático para revisar um site no celular antes de entregar ao cliente.

Inclua: leitura (tamanho de fonte e contraste), botões fáceis de tocar, WhatsApp funcionando com mensagem pronta, imagens leves, velocidade de carregamento, formulários, mapa, links quebrados e o que conferir no iPhone e no Android. Para cada item, diga como testar em menos de 1 minuto.`,
  },
  {
    id: 'bio-portfolio',
    title: 'Sua apresentação no portfólio',
    category: 'revisao',
    description: 'Frase e "sobre você" para o Sellers Portfolio.',
    text: `Quero escrever minha apresentação para o meu portfólio de sites.

Me faça perguntas sobre o que eu faço, para quais tipos de negócio, onde atendo, meu diferencial e os clientes que já atendi. Espere minhas respostas.

Depois escreva: (1) uma frase de apresentação com no máximo 15 palavras, dizendo o que eu faço e para quem, e (2) um parágrafo "sobre mim" com no máximo 60 palavras, em primeira pessoa, humano e sem exageros.`,
  },
  // Vendas
  {
    id: 'analise-lead',
    title: 'Análise de um lead antes de abordar',
    category: 'vendas',
    description: 'Encontra o melhor argumento para a primeira mensagem.',
    text: `Vou te passar o que sei de uma empresa que quero abordar: ramo, algumas avaliações do Google, como está o Instagram e se tem site.

Com isso, me diga: (1) o problema mais provável que a presença online dela causa hoje, (2) o melhor argumento para a primeira mensagem, (3) o que eu deveria oferecer primeiro (site, landing page ou sistema) e por quê, (4) uma primeira mensagem curta, de até 4 linhas, terminando com uma pergunta fácil de responder.

Me peça as informações da empresa para começarmos.`,
  },
  {
    id: 'responder-objecao',
    title: 'Responder uma objeção',
    category: 'vendas',
    description: 'Para "tá caro", "vou pensar", "já tenho Instagram"…',
    text: `Um cliente em negociação me respondeu com uma objeção. Vou colar a conversa na próxima mensagem.

Me ajude a responder: entenda a dúvida real por trás da objeção e sugira 2 respostas curtas (uma mais direta e outra mais leve), sem pressionar e sem dar desconto no mesmo pacote. Se fizer sentido, sugira oferecer uma opção menor.`,
  },
  {
    id: 'precificar',
    title: 'Montar os 3 pacotes de preço',
    category: 'vendas',
    description: 'Essencial, Profissional e Completo, com lógica clara.',
    text: `Quero montar três pacotes para o serviço que eu vendo: Essencial, Profissional e Completo.

Me pergunte o que eu entrego hoje, quanto tempo levo em cada projeto, quanto quero ganhar por hora e quanto já cobrei antes. Depois monte os três pacotes com: o que inclui cada um, prazo, preço sugerido e para qual tipo de cliente cada pacote serve. O pacote do meio deve ser o mais atrativo.`,
  },
]

// Scripts de mensagem: prontos para enviar e podem virar Modelos de mensagem.
export const KIT_SCRIPTS: KitScript[] = [
  // Primeira abordagem
  {
    id: 'abordagem-sem-site',
    title: 'Empresa sem site',
    category: 'abordagem',
    whenToUse: 'Empresa com boas avaliações e sem site.',
    text: 'Oi, tudo bem? Vi que vocês têm ótimas avaliações no Google, mas ainda não têm um site para quem procura pelo serviço na cidade. Eu crio sites para negócios assim, com botão direto para o WhatsApp. Posso te mandar um exemplo?',
  },
  {
    id: 'abordagem-so-instagram',
    title: 'Só tem Instagram',
    category: 'abordagem',
    whenToUse: 'Perfil ativo no Instagram, sem site.',
    text: 'Oi! Acompanhei o Instagram de vocês e dá para ver o cuidado com o trabalho. Para quem ainda não segue vocês e procura no Google, um site simples com botão de WhatsApp ajuda muito a chegar cliente novo. Posso te mostrar um exemplo?',
  },
  {
    id: 'abordagem-site-antigo',
    title: 'Site antigo ou fora do ar',
    category: 'abordagem',
    whenToUse: 'O site existe, mas está desatualizado, lento ou não abre.',
    text: 'Oi, tudo bem? Tentei abrir o site de vocês pelo celular e ele está com dificuldade para carregar. Muita gente desiste quando isso acontece. Posso te mostrar como ficaria uma versão nova, rápida e com WhatsApp?',
  },
  {
    id: 'abordagem-agendamento',
    title: 'Atende com horário marcado',
    category: 'abordagem',
    whenToUse: 'Clínicas, salões, estúdios e consultórios.',
    text: 'Oi! Vi que vocês trabalham com horário marcado. Tenho ajudado negócios parecidos a receber agendamentos pelo site, sem depender só de ligação e mensagem. Faz sentido eu te mostrar como funciona?',
  },
  {
    id: 'abordagem-reclamacao',
    title: 'Clientes reclamam do contato',
    category: 'abordagem',
    whenToUse: 'As avaliações citam dificuldade para falar com a empresa ou marcar horário.',
    text: 'Oi, tudo bem? Li as avaliações de vocês no Google e o atendimento é muito elogiado. Alguns clientes comentam que é difícil conseguir contato, e isso tem uma solução simples: uma página com as informações principais e um botão direto para o WhatsApp. Posso te mostrar?',
  },
  {
    id: 'abordagem-indicacao',
    title: 'Veio por indicação',
    category: 'abordagem',
    whenToUse: 'Alguém indicou você para essa empresa.',
    text: 'Oi! Recebi seu contato por indicação de um cliente para quem fiz o site recentemente. Ele comentou que vocês estão pensando em melhorar a presença online. Posso te mostrar o que fizemos e entender o que vocês precisam?',
  },
  {
    id: 'abordagem-audio',
    title: 'Pedir para mandar um áudio',
    category: 'abordagem',
    whenToUse: 'Quando você prefere explicar a ideia em um áudio curto.',
    text: 'Oi, tudo bem? Tive uma ideia para aumentar os contatos de vocês pelo Google. Posso te mandar um áudio de 1 minuto explicando?',
  },
  // Follow-up
  {
    id: 'follow-up-leve',
    title: 'Lembrete leve',
    category: 'follow_up',
    whenToUse: 'Dois dias depois da primeira mensagem, sem resposta.',
    text: 'Oi! Passando só para saber se você conseguiu ver minha mensagem. Se fizer sentido, te mando um exemplo rápido para você olhar quando puder.',
  },
  {
    id: 'follow-up-exemplo',
    title: 'Follow-up com exemplo',
    category: 'follow_up',
    whenToUse: 'Segundo contato: traga algo novo.',
    text: 'Oi! Separei um exemplo de site parecido com o que imagino para vocês, com os serviços, as avaliações e o botão de WhatsApp. Te mando o link?',
  },
  {
    id: 'follow-up-pos-proposta',
    title: 'Depois de enviar a proposta',
    category: 'follow_up',
    whenToUse: 'A proposta foi enviada e o cliente não retornou na data combinada.',
    text: 'Oi, tudo bem? Conseguiu olhar a proposta com calma? Se ficou alguma dúvida, posso te explicar em 5 minutos por ligação ou áudio, como for melhor para você.',
  },
  {
    id: 'follow-up-ultimo',
    title: 'Última tentativa',
    category: 'follow_up',
    whenToUse: 'Terceiro contato sem resposta.',
    text: 'Oi! Não quero ser insistente, então essa é minha última mensagem por aqui. Se em algum momento vocês quiserem um site para receber mais clientes pelo Google, é só me chamar. Sucesso!',
  },
  {
    id: 'follow-up-reativar',
    title: 'Reativar um lead antigo',
    category: 'follow_up',
    whenToUse: 'Conversa parada há alguns meses.',
    text: 'Oi, tudo bem? Conversamos há um tempo sobre o site de vocês. Estou com agenda aberta para novos projetos este mês e lembrei de vocês. Ainda faz sentido conversarmos?',
  },
  // Proposta e fechamento
  {
    id: 'convite-diagnostico',
    title: 'Convite para a conversa de diagnóstico',
    category: 'proposta',
    whenToUse: 'O lead respondeu com interesse.',
    text: 'Que bom! Para eu montar algo que faça sentido para vocês, podemos conversar 15 minutos? Quero entender como os clientes chegam hoje e o que vocês precisam. Qual horário fica melhor amanhã?',
  },
  {
    id: 'envio-proposta',
    title: 'Envio da proposta',
    category: 'proposta',
    whenToUse: 'Depois da conversa de diagnóstico.',
    text: 'Oi! Como combinamos, segue a proposta. Coloquei três opções para você escolher a que faz mais sentido agora. Consegue me dar um retorno até o fim da semana? Qualquer dúvida, é só me chamar.',
  },
  {
    id: 'fechamento',
    title: 'Pedido de fechamento',
    category: 'proposta',
    whenToUse: 'As dúvidas foram respondidas e o cliente está decidido.',
    text: 'Perfeito! Então podemos começar? Te mando o contrato para assinar e os dados para o pagamento da entrada. Assim que confirmar, já marco a data de início.',
  },
  {
    id: 'boas-vindas',
    title: 'Boas-vindas ao novo cliente',
    category: 'proposta',
    whenToUse: 'Logo depois do pagamento da entrada.',
    text: 'Pagamento recebido, obrigado pela confiança! Para começar, preciso do logo, de fotos do espaço e dos serviços, e da lista de serviços com uma breve descrição. Pode me mandar por aqui mesmo. Em seguida te passo o cronograma.',
  },
  // Cobrança
  {
    id: 'lembrete-pagamento',
    title: 'Lembrete de pagamento',
    category: 'cobranca',
    whenToUse: 'Parcela vencendo ou vencida há poucos dias.',
    text: 'Oi, tudo certo? Passando para lembrar da parcela do projeto que vence nesta semana. Se já pagou, pode desconsiderar e me desculpe pelo lembrete. Obrigado!',
  },
  {
    id: 'cobranca-atrasada',
    title: 'Pagamento atrasado',
    category: 'cobranca',
    whenToUse: 'Parcela atrasada há mais de uma semana.',
    text: 'Oi, tudo bem? Não identifiquei o pagamento da parcela do projeto, que venceu na semana passada. Aconteceu alguma coisa? Se precisar, podemos combinar uma nova data.',
  },
  // Pós-venda
  {
    id: 'entrega',
    title: 'Entrega do projeto',
    category: 'outro',
    whenToUse: 'O site está no ar.',
    text: 'O site de vocês está no ar! Dá uma olhada com calma, principalmente pelo celular, e me diz o que achou. Qualquer ajuste dentro do combinado, é só me mandar por aqui.',
  },
  {
    id: 'pedir-depoimento',
    title: 'Pedir depoimento',
    category: 'outro',
    whenToUse: 'Uma ou duas semanas depois da entrega.',
    text: 'Oi! Espero que o site esteja ajudando. Se você gostou do trabalho, poderia me mandar duas ou três frases sobre como foi? Vou colocar no meu portfólio, e isso me ajuda muito.',
  },
  {
    id: 'pedir-indicacao',
    title: 'Pedir indicação',
    category: 'outro',
    whenToUse: 'Cliente satisfeito, depois da entrega.',
    text: 'Fico muito feliz que você gostou! Você conhece outro dono de negócio que também precise de um site ou esteja perdendo clientes por não aparecer no Google? Se puder me indicar, eu cuido dele com o mesmo carinho.',
  },
  {
    id: 'oferta-manutencao',
    title: 'Oferecer manutenção mensal',
    category: 'outro',
    whenToUse: 'Um mês depois da entrega.',
    text: 'Oi, tudo bem? Faz um mês que o site entrou no ar. Tenho um plano de manutenção mensal com atualizações de texto e fotos, backup e suporte sempre que precisar, para vocês não se preocuparem com nada. Quer que eu te explique como funciona?',
  },
]

export const KIT_PROPOSALS: KitProposal[] = [
  {
    id: 'proposta-site',
    title: 'Site institucional',
    description: 'Para negócios locais que precisam aparecer no Google e receber contatos.',
    body: `# Proposta — Site institucional

## O que entendi
Hoje a maior parte dos clientes chega por indicação e pelo Instagram. Quem procura pelo serviço no Google ainda não encontra vocês, e parte dos contatos se perde entre ligações e mensagens.

## A solução
Um site rápido, pensado para o celular, que apresenta os serviços com clareza, mostra as avaliações e leva o visitante direto para o WhatsApp.

## O que está incluído
- Página inicial com apresentação, serviços, diferenciais, avaliações e mapa
- Botão de WhatsApp em todas as seções, com mensagem pronta
- Até 5 páginas de serviço
- Configuração para aparecer no Google
- Duas rodadas de ajustes de texto e imagem
- Publicação no domínio da empresa

**Não incluso:** domínio e hospedagem, produção de fotos e anúncios pagos.

## Prazo
15 dias úteis a partir do recebimento do logo, das fotos e das informações.

## Investimento
- **Essencial** — página única com WhatsApp e mapa: R$ 1.200
- **Profissional** — site completo, como descrito acima: R$ 2.400
- **Completo** — Profissional + 3 meses de manutenção: R$ 3.200

Pagamento: 50% na aprovação e 50% na entrega, via Pix.

## Próximos passos
1. Escolha da opção
2. Assinatura do contrato e pagamento da entrada
3. Envio dos materiais e início do projeto

Proposta válida por 7 dias.`,
  },
  {
    id: 'proposta-landing',
    title: 'Landing page para campanha',
    description: 'Para anúncios, lançamentos ou uma oferta específica.',
    body: `# Proposta — Landing page

## Objetivo
Transformar quem vê o anúncio ou a divulgação em conversas no WhatsApp, com uma página feita para uma única oferta.

## O que está incluído
- Página única otimizada para celular
- Título, benefícios, como funciona, prova social e perguntas frequentes
- Botão de WhatsApp com mensagem pronta
- Configuração para medir os cliques
- Duas rodadas de ajustes

**Não incluso:** criação e gestão dos anúncios, domínio e hospedagem.

## Prazo
7 dias úteis a partir do recebimento das informações.

## Investimento
R$ 900, com pagamento de 50% na aprovação e 50% na entrega.

**Opcional:** nova versão do título e das chamadas depois de 15 dias de campanha, para testar o que converte melhor: R$ 250.

## Próximos passos
Aprovação da proposta, contrato, envio das informações e início.`,
  },
  {
    id: 'proposta-agendamento',
    title: 'Site com agendamento online',
    description: 'Para clínicas, salões, estúdios e consultórios.',
    body: `# Proposta — Site com agendamento online

## O que entendi
A agenda é organizada por mensagens e ligações, o que toma tempo da equipe e faz alguns clientes desistirem de marcar.

## A solução
Um site com os serviços, a equipe e as avaliações, e agendamento online: o cliente escolhe o serviço, o dia e o horário, e a equipe recebe o aviso na hora.

## O que está incluído
- Site completo com serviços, equipe, avaliações e localização
- Agendamento online com horários de funcionamento e intervalos
- Confirmação automática para o cliente
- Painel simples para a equipe ver e gerenciar a agenda
- Treinamento de 1 hora e duas rodadas de ajustes

**Não incluso:** mensalidade da ferramenta de agendamento (se houver), domínio e hospedagem.

## Prazo
20 dias úteis a partir do recebimento das informações.

## Investimento
- **Site + agendamento:** R$ 3.500
- **Manutenção mensal (opcional):** R$ 250/mês

Pagamento: 50% na aprovação e 50% na entrega.

## Próximos passos
1. Aprovação e contrato
2. Reunião de 30 minutos para definir serviços, horários e regras
3. Início do projeto`,
  },
  {
    id: 'proposta-cardapio',
    title: 'Cardápio digital com pedidos',
    description: 'Para restaurantes, lanchonetes, docerias e delivery.',
    body: `# Proposta — Cardápio digital com pedidos pelo WhatsApp

## O que entendi
O cardápio circula em fotos e PDFs, fica desatualizado e os pedidos chegam incompletos, o que gera idas e vindas no atendimento.

## A solução
Um cardápio digital com fotos e preços, em que o cliente monta o pedido e envia tudo organizado para o WhatsApp, pronto para confirmar.

## O que está incluído
- Cardápio por categorias, com fotos, descrição e preço
- Carrinho com observações e forma de pagamento
- Pedido enviado organizado para o WhatsApp da loja
- Horário de funcionamento e aviso de "fechado"
- Painel para atualizar preços e itens sem depender de ninguém
- QR Code para as mesas e para o balcão

## Prazo
10 dias úteis a partir do recebimento do cardápio e das fotos.

## Investimento
R$ 1.800, com pagamento de 50% na aprovação e 50% na entrega.

## Próximos passos
Aprovação, contrato, envio do cardápio e início.`,
  },
  {
    id: 'proposta-loja',
    title: 'Loja virtual simples',
    description: 'Para quem vende produtos e quer receber pedidos online.',
    body: `# Proposta — Loja virtual

## O que entendi
As vendas acontecem pelo Instagram e pelo WhatsApp, uma por uma, e não existe um lugar onde o cliente veja todos os produtos, preços e formas de entrega.

## A solução
Uma loja virtual simples, com catálogo, carrinho e pagamento online, que funciona bem no celular e pode ser divulgada no Instagram.

## O que está incluído
- Até 50 produtos cadastrados, com fotos e variações (tamanho, cor)
- Carrinho, cálculo de frete e pagamento por Pix e cartão
- Páginas de política de troca e de contato
- Treinamento para cadastrar produtos e acompanhar pedidos
- Duas rodadas de ajustes

**Não incluso:** mensalidade da plataforma de loja, taxas de pagamento e fotos dos produtos.

## Prazo
20 dias úteis a partir do recebimento dos produtos e das fotos.

## Investimento
R$ 3.000, com pagamento de 50% na aprovação e 50% na entrega.

## Próximos passos
Aprovação, contrato, envio do catálogo e início.`,
  },
  {
    id: 'proposta-sistema',
    title: 'Sistema sob medida',
    description: 'Para organizar um processo: pedidos, ordens de serviço, controle interno.',
    body: `# Proposta — Sistema sob medida

## Situação atual
Hoje o processo é feito em papel, planilhas e mensagens, o que causa retrabalho, informações perdidas e dificuldade para saber o que está pendente.

## A solução
Um sistema simples, acessado pelo celular e pelo computador, que organiza o processo do começo ao fim e mostra o que precisa de atenção.

## Primeira versão
- Cadastro de clientes e dos registros do dia a dia
- Status de cada registro (em andamento, pendente, concluído)
- Busca e filtros
- Acesso para até 3 usuários
- Relatório mensal simples
- Treinamento de 1 hora

Novas funções ficam para uma segunda fase, combinadas depois do uso real da primeira versão.

## Prazo
30 dias, em duas entregas: a primeira com o cadastro e os registros, a segunda com os relatórios e ajustes.

## Investimento
- **Desenvolvimento:** R$ 5.000
- **Manutenção e suporte (opcional):** R$ 350/mês

Pagamento: 40% na aprovação, 30% na primeira entrega e 30% na entrega final.

## Próximos passos
Aprovação, contrato, reunião de início e primeira entrega.`,
  },
  {
    id: 'proposta-redesign',
    title: 'Reformulação de site',
    description: 'Para empresas com site antigo, lento ou que não traz contatos.',
    body: `# Proposta — Reformulação do site

## O que encontrei
O site atual demora para abrir no celular, tem informações desatualizadas e o caminho até o contato não é claro. Com isso, parte das visitas vai embora sem falar com a empresa.

## A solução
Um site novo, rápido e atual, mantendo o endereço e o que já funciona, com foco em levar o visitante até o WhatsApp.

## O que está incluído
- Novo visual, alinhado à marca
- Textos revisados e organizados
- Carregamento rápido no celular
- WhatsApp e formulário de contato funcionando
- Redirecionamento das páginas antigas, para não perder posições no Google
- Duas rodadas de ajustes

## Prazo
15 dias úteis a partir da aprovação.

## Investimento
R$ 2.200, com pagamento de 50% na aprovação e 50% na entrega.

## Próximos passos
Aprovação, contrato, acesso ao site atual e início.`,
  },
  {
    id: 'proposta-manutencao',
    title: 'Plano de manutenção mensal',
    description: 'Receita recorrente depois da entrega.',
    body: `# Proposta — Manutenção mensal do site

## Para que serve
Manter o site sempre atualizado, seguro e funcionando, sem que a equipe precise se preocupar com isso.

## O que está incluído
- Até 4 atualizações por mês (textos, fotos, preços, promoções)
- Backup mensal
- Verificação de funcionamento: WhatsApp, formulários e velocidade
- Suporte por WhatsApp em horário comercial
- Relatório mensal simples de visitas e cliques no WhatsApp

**Não incluso:** novas páginas ou funções (orçadas à parte), domínio e hospedagem.

## Investimento
R$ 200 por mês, sem fidelidade. Pode cancelar com 30 dias de aviso.

## Como começar
Aprovação desta proposta e primeiro pagamento. A manutenção começa no mesmo dia.`,
  },
]
